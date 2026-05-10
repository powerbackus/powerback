/**
 * @fileoverview Interactive TUI to set or clear Pol roster_excluded policy by bioguide ID.
 *
 * Policy is separate from `has_stakes` / watchers. Uses `inquirer` (arrow keys + Enter).
 * MongoDB connects only after the user confirms a plan so cancel/help never requires URI.
 *
 * @module scripts/roster-exclude-pol
 * @requires inquirer
 * @requires dotenv
 * @see {@link ./USAGE-roster-exclude-pol.md} Step-by-step TUI walkthrough
 * @see {@link ../specs/pol-roster-exclusion.md} Policy, API gates, schema fields
 *
 * @example
 * ```bash
 * node scripts/roster-exclude-pol.js
 * node scripts/roster-exclude-pol.js J000299
 * node scripts/roster-exclude-pol.js --help
 * ```
 */

const path = require('path');
const fs = require('fs');

// Match other root scripts: prefer operator-specific .env.cli, then local, then default.
const envCliPath = path.resolve(__dirname, '../.env.cli');
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envCliPath)) require('dotenv').config({ path: envCliPath });
else if (fs.existsSync(envLocalPath))
  require('dotenv').config({ path: envLocalPath });
else require('dotenv').config();

const inquirer = require('inquirer');
const { connect, disconnect } = require('../services/utils/db');
const { Pol } = require('../models');
const { requireLogger } = require('../services/logger');
const {
  ROSTER_EXCLUSION_CATEGORIES,
} = require('../services/congress/polRosterEligibility');

const logger = requireLogger(__filename);

/**
 * List choices for the exclusion category prompt (`value` is stored on `Pol`).
 * Filtered at runtime by {@link ROSTER_EXCLUSION_CATEGORIES} so the TUI cannot pick a
 * category the server does not treat as valid.
 * @type {ReadonlyArray<{ value: string; name: string }>}
 */
const CATEGORY_CHOICES = [
  {
    value: 'speaker_of_house',
    name: 'Speaker of the House',
  },
  {
    value: 'left_office',
    name: 'Left office',
  },
  { value: 'deceased', name: 'Deceased' },
  { value: 'resigned', name: 'Resigned' },
  {
    value: 'delegate_or_non_voting',
    name: 'Delegate or non-voting',
  },
  {
    value: 'manual_admin_exclusion',
    name: 'Manual admin exclusion',
  },
  {
    value: 'data_integrity_hold',
    name: 'Data integrity hold',
  },
];

/**
 * Prints CLI usage to stdout and exits the help path without DB or prompts.
 * @returns {void}
 */
function printHelp() {
  process.stdout.write(`Pol roster exclusion (interactive TUI via inquirer)

  node scripts/roster-exclude-pol.js [bioguideId]

  Omit bioguideId to type it when prompted; optional arg prefills that step only.

  Full walkthrough: scripts/USAGE-roster-exclude-pol.md
  Categories / policy: specs/pol-roster-exclusion.md
`);
}

/**
 * @param {string} [v] Raw input from inquirer
 * @returns {true|string} `true` if valid; error string for inquirer to display
 */
function validateBioguide(v) {
  const s = String(v || '').trim();
  if (!s) return 'Bioguide ID is required.';
  return true;
}

/**
 * Persists roster exclusion for an existing Pol.
 * @param {string} bioguideId - `Pol.id` (bioguide)
 * @param {string} category - Canonical value from `ROSTER_EXCLUSION_CATEGORIES`
 * @param {string} reason - Optional note; empty string falls back to category label
 * @returns {Promise<boolean>} `true` if updated; `false` if no Pol document
 */
async function applyExclude(bioguideId, category, reason) {
  const existing = await Pol.findOne({ id: bioguideId })
    .select('id first_name last_name')
    .lean();

  if (!existing) {
    logger.error(`No Pol found with id=${bioguideId}`);
    process.stdout.write(`No Pol document found for id ${bioguideId}.\n`);
    return false;
  }

  const resolvedReason =
    reason.trim() ||
    CATEGORY_CHOICES.find((c) => c.value === category)?.name ||
    category.replace(/_/g, ' ');

  await Pol.updateOne(
    { id: bioguideId },
    {
      $set: {
        roster_excluded: true,
        roster_exclusion_category: category,
        roster_exclusion_reason: resolvedReason,
        roster_exclusion_updated_at: new Date(),
      },
    }
  );

  logger.info('Roster exclusion applied', {
    id: bioguideId,
    name: `${existing.first_name || ''} ${existing.last_name || ''}`.trim(),
    category,
  });
  process.stdout.write(
    `\nDone: ${bioguideId} is roster excluded (${category}).\n` +
      `Reason stored: ${resolvedReason}\n`
  );
  return true;
}

/**
 * Clears roster exclusion flags on an existing Pol.
 * @param {string} bioguideId - `Pol.id` (bioguide)
 * @returns {Promise<boolean>} `true` if updated; `false` if no Pol document
 */
async function applyClear(bioguideId) {
  const existing = await Pol.findOne({ id: bioguideId }).select('id').lean();

  if (!existing) {
    logger.error(`No Pol found with id=${bioguideId}`);
    process.stdout.write(`No Pol document found for id ${bioguideId}.\n`);
    return false;
  }

  await Pol.updateOne(
    { id: bioguideId },
    {
      $set: {
        roster_excluded: false,
        roster_exclusion_updated_at: new Date(),
      },
      $unset: {
        roster_exclusion_category: '',
        roster_exclusion_reason: '',
      },
    }
  );

  logger.info('Roster exclusion cleared', { id: bioguideId });
  process.stdout.write(`\nDone: ${bioguideId} exclusion cleared.\n`);
  return true;
}

/**
 * @typedef {Object} RosterExcludePlanClear
 * @property {'CLEAR'} kind
 * @property {string} bioguideId
 */

/**
 * @typedef {Object} RosterExcludePlanExclude
 * @property {'EXCLUDE'} kind
 * @property {string} bioguideId
 * @property {string} category
 * @property {string} reason
 */

/**
 * @typedef {RosterExcludePlanClear|RosterExcludePlanExclude} RosterExcludePlan
 */

/**
 * Runs all inquirer steps without touching MongoDB.
 * @param {string} prefillBioguide - Optional CLI positional; default for first prompt only
 * @returns {Promise<RosterExcludePlan|null>} Plan to execute, or `null` if user cancelled
 */
async function collectPlan(prefillBioguide) {
  const answersStart = await inquirer.prompt([
    {
      type: 'input',
      name: 'bioguideId',
      message: 'Bioguide ID (e.g. J000299):',
      default: prefillBioguide || undefined,
      validate: validateBioguide,
      filter: (v) => String(v).trim(),
    },
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Exclude from selectable roster / new celebrations',
          value: 'EXCLUDE',
        },
        { name: 'Clear exclusion (make selectable again)', value: 'CLEAR' },
      ],
    },
  ]);

  const { bioguideId, action } = answersStart;

  if (action === 'CLEAR') {
    const { confirmClear } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmClear',
        message: `Clear roster exclusion for ${bioguideId}?`,
        default: false,
      },
    ]);
    if (!confirmClear) {
      process.stdout.write('Cancelled.\n');
      return null;
    }
    return { kind: 'CLEAR', bioguideId };
  }

  const answersExclude = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'Exclusion category:',
      choices: CATEGORY_CHOICES.filter((c) =>
        ROSTER_EXCLUSION_CATEGORIES.includes(c.value)
      ),
      default:
        CATEGORY_CHOICES.find((c) => c.value === 'manual_admin_exclusion')
          ?.value ?? 'manual_admin_exclusion',
    },
    {
      type: 'input',
      name: 'reason',
      message:
        'Reason / note (optional; press Enter for a default from category):',
    },
    {
      type: 'confirm',
      name: 'confirmExclude',
      message: (a) =>
        `Exclude ${bioguideId} from roster with category "${a.category}"?`,
      default: false,
    },
  ]);

  if (!answersExclude.confirmExclude) {
    process.stdout.write('Cancelled.\n');
    return null;
  }

  return {
    kind: 'EXCLUDE',
    bioguideId,
    category: answersExclude.category,
    reason: String(answersExclude.reason || ''),
  };
}

/**
 * Applies a confirmed plan (caller must have connected Mongoose already).
 * @param {RosterExcludePlan} plan - From {@link collectPlan}
 * @returns {Promise<void>}
 */
async function executePlan(plan) {
  if (plan.kind === 'CLEAR') {
    await applyClear(plan.bioguideId);
    return;
  }
  await applyExclude(plan.bioguideId, plan.category, plan.reason || '');
}

/**
 * Parses argv, runs prompts then DB, or prints help.
 * @returns {Promise<void>}
 */
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }

  const positional = argv.filter((a) => !a.startsWith('-'));
  const prefill =
    positional.length > 0 && positional[0] !== '--help'
      ? String(positional[0]).trim()
      : '';

  const plan = await collectPlan(prefill);
  if (!plan) return;

  await connect(logger);
  try {
    await executePlan(plan);
  } finally {
    await disconnect();
  }
}

main().catch((err) => {
  logger.error(err.message, { stack: err.stack });
  process.exit(1);
});
