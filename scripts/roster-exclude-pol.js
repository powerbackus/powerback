/**
 * @fileoverview Interactive TUI to set or clear Pol roster_excluded policy by bioguide ID.
 *
 * Separate from has_stakes / watchers. Uses inquirer prompts (arrow keys + Enter).
 *
 * Usage:
 *   node scripts/roster-exclude-pol.js
 *   node scripts/roster-exclude-pol.js J000299
 *
 * Optional first argument prefills Bioguide ID; you still confirm action, category,
 * and reason via prompts. MongoDB connects only after you confirm (cancel skips DB).
 *
 * Environment: MONGODB_URI via .env.cli, .env.local, or .env (same as other scripts).
 *
 * @module scripts/roster-exclude-pol
 */

const path = require('path');
const fs = require('fs');

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

/** Readable labels for TUI choices (value stays canonical category string). */
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

function printHelp() {
  process.stdout.write(`Pol roster exclusion (interactive TUI via inquirer)

  node scripts/roster-exclude-pol.js [bioguideId]

  Omit bioguideId to type it when prompted; optional arg prefills that step only.

  Categories align with specs/pol-roster-exclusion.md.
`);
}

function validateBioguide(v) {
  const s = String(v || '').trim();
  if (!s) return 'Bioguide ID is required.';
  return true;
}

/**
 * Apply EXCLUDE update.
 * @param {string} bioguideId
 * @param {string} category
 * @param {string} reason
 * @returns {Promise<boolean>} false if Pol missing
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
 * Apply CLEAR update.
 * @param {string} bioguideId
 * @returns {Promise<boolean>} false if Pol missing
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
 * Runs prompts without touching Mongo. Returns null when the user cancels.
 * @param {string} prefillBioguide
 * @returns {Promise<{ kind: 'CLEAR'|'EXCLUDE'; bioguideId: string; category?: string; reason?: string }|null>}
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
 * @param {{ kind: 'CLEAR'|'EXCLUDE'; bioguideId: string; category?: string; reason?: string }} plan
 */
async function executePlan(plan) {
  if (plan.kind === 'CLEAR') {
    await applyClear(plan.bioguideId);
    return;
  }
  await applyExclude(plan.bioguideId, plan.category, plan.reason || '');
}

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
