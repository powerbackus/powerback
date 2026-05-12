/**
 * @fileoverview Dry-run / apply cleanup for Pol documents where roles[1] is a
 * deep duplicate of roles[0] (no other fields changed; roles[2+] preserved).
 *
 * Default is dry-run only. Apply requires `--apply` and a DB backup is strongly
 * recommended before mutating production.
 *
 * @module scripts/cleanup-duplicate-adjacent-roles
 * @see {@link ./README.md} Scripts index
 */

const path = require('path');
const fs = require('fs');

const envCliPath = path.resolve(__dirname, '../.env.cli');
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envCliPath)) require('dotenv').config({ path: envCliPath });
else if (fs.existsSync(envLocalPath))
  require('dotenv').config({ path: envLocalPath });
else require('dotenv').config();

const isEqual = require('lodash/isEqual');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../services/utils/db');
const { Pol } = require('../models');
const { requireLogger } = require('../services/logger');

const logger = requireLogger(__filename);

const DEFAULT_EXPECTED_DUPLICATES = 148;
const DEFAULT_MAX_APPLY = 220;

/**
 * One-line role summary for operator review (no logging to Winston with PII).
 * @param {Object|null|undefined} r
 * @returns {string}
 */
function summarizeRole(r) {
  if (!r || typeof r !== 'object') return '(missing)';
  const fec = r.fec_candidate_id != null ? String(r.fec_candidate_id) : '';
  const bits = [
    r.chamber,
    r.state,
    r.district != null ? `d${r.district}` : '',
    r.congress != null ? `c${r.congress}` : '',
    fec ? `fec:${fec}` : '',
  ].filter(Boolean);
  return bits.length ? bits.join(' ') : '(empty role)';
}

/**
 * @param {string[]} argv
 * @returns {{
 *   apply: boolean,
 *   allowExcess: boolean,
 *   expectedDuplicates: number,
 *   maxApply: number,
 *   help: boolean,
 * }}
 */
function parseArgs(argv) {
  let apply = false;
  let allowExcess = false;
  let expectedDuplicates = DEFAULT_EXPECTED_DUPLICATES;
  let maxApply = DEFAULT_MAX_APPLY;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') help = true;
    else if (a === '--apply') apply = true;
    else if (a === '--allow-excess') allowExcess = true;
    else if (a === '--expected-duplicates' && argv[i + 1]) {
      expectedDuplicates = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a.startsWith('--expected-duplicates=')) {
      expectedDuplicates = Math.max(0, parseInt(a.split('=')[1], 10) || 0);
    } else if (a === '--max-apply' && argv[i + 1]) {
      maxApply = Math.max(1, parseInt(argv[++i], 10) || DEFAULT_MAX_APPLY);
    } else if (a.startsWith('--max-apply=')) {
      maxApply = Math.max(
        1,
        parseInt(a.split('=')[1], 10) || DEFAULT_MAX_APPLY
      );
    } else if (a.startsWith('-')) {
      console.error(`Unknown flag: ${a} (use --help)`);
      process.exit(2);
    }
  }

  return { apply, allowExcess, expectedDuplicates, maxApply, help };
}

function printHelp() {
  process.stdout
    .write(`Pol roles[0]/roles[1] duplicate cleanup (dry-run by default)

Removes only roles[1] when it is deeply equal to roles[0] (lodash isEqual).
roles[0] and roles[2+] stay unchanged in order. No other Pol fields are updated.

Usage:
  node scripts/cleanup-duplicate-adjacent-roles.js [options]

Options:
  --apply                 Perform updates (otherwise dry-run only)
  --allow-excess          Allow --apply when duplicate count exceeds --max-apply
  --expected-duplicates N Expected duplicate-doc count for warnings (default ${DEFAULT_EXPECTED_DUPLICATES})
  --max-apply N           Abort --apply if duplicates > N unless --allow-excess (default ${DEFAULT_MAX_APPLY})
  --help, -h              This message

Before production --apply:
  - Take a MongoDB backup or export of pols
  - Run dry-run (no flags) and review listed bioguide IDs

Verification (after backup):
  1) node scripts/cleanup-duplicate-adjacent-roles.js
  2) node scripts/cleanup-duplicate-adjacent-roles.js --apply --allow-excess   # only if counts OK
  3) node scripts/cleanup-duplicate-adjacent-roles.js   # duplicate count should be 0

Optional watcher smoke (with explicit approval to run jobs):
  node jobs/challengersWatcher.js   # or your usual watcher harness

Environment: .env.cli then .env.local then .env (same as other root scripts).
`);
}

/**
 * @param {Object} doc - lean Pol
 * @returns {boolean}
 */
function hasDuplicateAdjacentRoles(doc) {
  const roles = doc && Array.isArray(doc.roles) ? doc.roles : [];
  if (roles.length < 2) return false;
  return isEqual(roles[0], roles[1]);
}

/**
 * @returns {Promise<{ totalPol: number, withSecondRole: number, duplicateAdjacent: number, samples: Object[] }>}
 */
async function scanDuplicates() {
  const totalPol = await Pol.countDocuments({});
  const withSecondRole = await Pol.countDocuments({
    'roles.1': { $exists: true },
  });

  const cursor = Pol.find({
    'roles.1': { $exists: true },
  })
    .select({ id: 1, first_name: 1, last_name: 1, roles: 1 })
    .lean()
    .cursor();

  const samples = [];
  for await (const doc of cursor) {
    if (!hasDuplicateAdjacentRoles(doc)) continue;
    samples.push(doc);
  }

  return {
    totalPol,
    withSecondRole,
    duplicateAdjacent: samples.length,
    samples,
  };
}

/**
 * @returns {Promise<number>}
 */
async function countDuplicateAdjacent() {
  const { duplicateAdjacent } = await scanDuplicates();
  return duplicateAdjacent;
}

/**
 * @param {Object} doc
 * @returns {void}
 */
function printAffectedLine(doc) {
  const roles = doc.roles || [];
  const name =
    [doc.first_name, doc.last_name].filter(Boolean).join(' ') || '(no name)';
  process.stdout.write(
    [
      `  id=${doc.id}`,
      `name=${name}`,
      `roles_len=${roles.length}`,
      `roles[0]=${summarizeRole(roles[0])}`,
      `roles[1]=${summarizeRole(roles[1])}`,
      'remove=roles[1] only',
    ].join(' | ') + '\n'
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  await connect(logger);

  process.stdout.write('\n=== Pol duplicate adjacent roles scan ===\n\n');

  const before = await scanDuplicates();

  process.stdout.write(`Total Pol documents scanned: ${before.totalPol}\n`);
  process.stdout.write(
    `Pol documents with roles[0] and roles[1] present: ${before.withSecondRole}\n`
  );
  process.stdout.write(
    `Pol documents with roles[1] deeply identical to roles[0]: ${before.duplicateAdjacent}\n\n`
  );

  if (before.duplicateAdjacent !== opts.expectedDuplicates) {
    process.stdout.write(
      `Note: duplicate count (${before.duplicateAdjacent}) differs from ` +
        `--expected-duplicates default (${opts.expectedDuplicates}). ` +
        'Investigate before applying if this is unexpected.\n\n'
    );
  }

  if (before.samples.length === 0) {
    process.stdout.write(
      'No duplicate adjacent roles found. Nothing to do.\n\n'
    );
    await disconnect();
    return;
  }

  process.stdout.write('Affected documents:\n');
  for (const doc of before.samples) {
    printAffectedLine(doc);
  }
  process.stdout.write('\n');

  if (!opts.apply) {
    process.stdout.write(
      'Dry-run only (no writes). To apply after backup and review:\n' +
        '  node scripts/cleanup-duplicate-adjacent-roles.js --apply\n' +
        (before.duplicateAdjacent > opts.maxApply
          ? `\nApply would be blocked: count ${before.duplicateAdjacent} > --max-apply ${opts.maxApply}. ` +
            'Raise --max-apply or pass --allow-excess after intentional review.\n'
          : '') +
        '\n'
    );
    await disconnect();
    return;
  }

  if (before.duplicateAdjacent > opts.maxApply && !opts.allowExcess) {
    process.stdout.write(
      `Abort: ${before.duplicateAdjacent} duplicates exceeds --max-apply (${opts.maxApply}). ` +
        'Re-run with --allow-excess after confirming the count is acceptable.\n\n'
    );
    await disconnect();
    process.exit(1);
  }

  process.stdout.write(
    'BACKUP CHECK: Ensure you have a recent MongoDB backup or pols export before continuing.\n\n'
  );

  let applied = 0;
  let skippedVerify = 0;
  let writeErrors = 0;

  for (const snapshot of before.samples) {
    try {
      const fresh = await Pol.findOne({ id: snapshot.id })
        .select({ roles: 1 })
        .lean()
        .exec();

      if (!fresh || !Array.isArray(fresh.roles) || fresh.roles.length < 2) {
        skippedVerify++;
        logger.warn(
          'cleanup-duplicate-roles: skip apply (doc or roles changed)',
          {
            pol_id: snapshot.id,
          }
        );
        continue;
      }

      if (!isEqual(fresh.roles[0], fresh.roles[1])) {
        skippedVerify++;
        logger.warn(
          'cleanup-duplicate-roles: skip apply (roles[0]/roles[1] no longer deeply equal)',
          { pol_id: snapshot.id }
        );
        continue;
      }

      const nextRoles = [fresh.roles[0], ...fresh.roles.slice(2)];

      const res = await Pol.updateOne(
        { id: snapshot.id },
        { $set: { roles: nextRoles } }
      ).exec();

      const modified = res.modifiedCount ?? res.nModified ?? 0;
      if (modified === 1) applied++;
      else {
        skippedVerify++;
        logger.warn(
          'cleanup-duplicate-roles: update matched but not modified',
          {
            pol_id: snapshot.id,
            matched: res.matchedCount ?? res.n,
          }
        );
      }
    } catch (err) {
      writeErrors++;
      logger.error('cleanup-duplicate-roles: apply failed', {
        pol_id: snapshot.id,
        error: err.message,
      });
    }
  }

  const afterCount = await countDuplicateAdjacent();

  process.stdout.write('\n=== Apply summary ===\n');
  process.stdout.write(
    `Duplicate adjacent count before: ${before.duplicateAdjacent}\n`
  );
  process.stdout.write(`Documents updated (roles-only $set): ${applied}\n`);
  process.stdout.write(
    `Skipped (failed re-verify or no-op): ${skippedVerify}\n`
  );
  process.stdout.write(`Write errors: ${writeErrors}\n`);
  process.stdout.write(`Duplicate adjacent count after: ${afterCount}\n\n`);

  if (afterCount !== 0) {
    process.stdout.write(
      'Warning: duplicate count is not zero after apply. Re-run dry-run or inspect remaining docs.\n\n'
    );
  }

  await disconnect();
}

main().catch((err) => {
  logger.error('cleanup-duplicate-adjacent-roles fatal', {
    error: err.message,
  });
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
