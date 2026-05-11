/**
 * @fileoverview Sync House member headshots to local WebP files under pfp/.
 *
 * Queries live `pols` for House carousel roster (`has_stakes`, not
 * `roster_excluded`), downloads the official House Clerk JPG per bioguide ID,
 * resizes/covers to carousel dimensions, encodes WebP (target size cap with
 * quality sweep), and writes `{id}.webp` atomically. Invoked via
 * `npm run pfp-sync`, and from the server watcher chain (`jobs/runWatchers.js`)
 * after `challengersWatcher` so `has_stakes` is fresh.
 *
 * @module scripts/pfp-sync
 */

const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const axios = require('axios');
const sharp = require('sharp');
const mongoose = require('mongoose');

const { connect, disconnect } = require('../services/utils/db');
const { getResolvedPfpOutDir } = require('../services/utils/pfpOutDir');
const { Pol } = require('../models');
const { requireLogger } = require('../services/logger');

const logger = requireLogger(__filename);

const BIOGUIDE_RE = /^[A-Z]\d{6}$/;

/** Matches selectable House pols used for donation targeting (see GET /api/congress roster). */
const ROSTER_PFP_QUERY = {
  'roles.0.chamber': 'House',
  roster_excluded: { $ne: true },
  has_stakes: true,
};
const DEFAULT_CLERK_BASE = 'https://clerk.house.gov/images/members/';
const WIDTH = 227;
const HEIGHT = 277;
const MAX_WEBP_BYTES = 10 * 1024;
const DOWNLOAD_GAP_MS = 400;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Loads dotenv for CLI runs only (does not override server env when required in-process).
 *
 * @returns {void}
 */
function loadCliDotenv() {
  const envCliPath = path.resolve(__dirname, '../.env.cli');
  const envLocalPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envCliPath)) {
    require('dotenv').config({ path: envCliPath });
  } else if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
  } else {
    require('dotenv').config();
  }
}

/**
 * @param {string} base
 * @param {string} bioguideId
 * @returns {string}
 */
function clerkJpgUrl(base, bioguideId) {
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${bioguideId}.jpg`;
}

/**
 * @param {Buffer} inputBuffer
 * @returns {Promise<{ buffer: Buffer, quality: number, bytes: number }>}
 */
async function encodeWebpWithSizeCap(inputBuffer) {
  let best = { buffer: null, quality: 40, bytes: Infinity };
  for (let q = 82; q >= 40; q -= 3) {
    const buffer = await sharp(inputBuffer)
      .rotate()
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
      .webp({ quality: q, effort: 4 })
      .toBuffer();
    if (buffer.length <= MAX_WEBP_BYTES) {
      return { buffer, quality: q, bytes: buffer.length };
    }
    if (buffer.length < best.bytes) {
      best = { buffer, quality: q, bytes: buffer.length };
    }
  }
  if (!best.buffer) {
    throw new Error('WebP encode produced empty buffer');
  }
  return {
    buffer: best.buffer,
    quality: best.quality,
    bytes: best.bytes,
  };
}

/**
 * @param {string} url
 * @returns {Promise<Buffer|null>}
 */
async function downloadJpg(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 45000,
      maxContentLength: 15 * 1024 * 1024,
      validateStatus: (s) => s < 500,
    });
    if (res.status !== 200) {
      return null;
    }
    return Buffer.from(res.data);
  } catch (err) {
    logger.warn(`Download failed: ${err.message}`);
    return null;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.outDir
 * @param {string} opts.clerkBase
 * @param {boolean} opts.dryRun
 * @param {boolean} opts.force
 * @param {string} id
 * @returns {Promise<'written'|'skipped'|'dry_run'|'download_failed'|'encode_failed'>}
 */
async function syncOneBioguide({ outDir, clerkBase, dryRun, force }, id) {
  const dest = path.join(outDir, `${id}.webp`);
  let existing = null;
  try {
    existing = await fsp.stat(dest);
  } catch {
    existing = null;
  }
  if (existing && existing.size > 0 && !force) {
    if (dryRun) {
      logger.info(`[dry-run] skip (webp exists) ${id}`);
    }
    return 'skipped';
  }

  const jpgUrl = clerkJpgUrl(clerkBase, id);
  if (dryRun) {
    logger.info(`[dry-run] would fetch ${jpgUrl} -> ${dest}`);
    return 'dry_run';
  }

  const jpgBuf = await downloadJpg(jpgUrl);
  if (!jpgBuf || jpgBuf.length === 0) {
    return 'download_failed';
  }

  let webpBuf;
  try {
    const enc = await encodeWebpWithSizeCap(jpgBuf);
    webpBuf = enc.buffer;
    if (enc.bytes > MAX_WEBP_BYTES) {
      logger.warn(
        `WebP for ${id} is ${enc.bytes} bytes (target max ${MAX_WEBP_BYTES}) at Q=${enc.quality}`
      );
    }
  } catch (err) {
    logger.error(`Encode failed for ${id}: ${err.message}`);
    return 'encode_failed';
  }

  const tmp = path.join(outDir, `.${id}.webp.tmp`);
  await fsp.writeFile(tmp, webpBuf);
  await fsp.rename(tmp, dest);
  logger.info(`Wrote ${dest} (${webpBuf.length} bytes)`);
  return 'written';
}

function parseArgs(argv) {
  const flags = { dryRun: false, force: false, strict: false };
  const ids = [];
  for (const a of argv) {
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--force') flags.force = true;
    else if (a === '--strict') flags.strict = true;
    else if (a.startsWith('-')) {
      logger.warn(`Unknown flag ${a} (ignored)`);
    } else if (BIOGUIDE_RE.test(a)) {
      ids.push(a);
    } else {
      logger.warn(`Ignoring non-bioguide argument: ${a}`);
    }
  }
  return { flags, ids };
}

/**
 * Sync WebP headshots for eligible House pols (and optional CLI bioguide subset).
 *
 * @param {object} [options]
 * @param {string[]} [options.argv] - Args after script name (flags + optional bioguides)
 * @param {boolean} [options.manageConnection=true] - When false, skip connect/disconnect/dotenv (in-process / watchers).
 * @returns {Promise<{ counts: object, total: number, flags: object }>}
 */
async function runPfpSync(options = {}) {
  const { argv = [], manageConnection = true } = options;

  if (manageConnection) {
    loadCliDotenv();
  }

  const { flags, ids: cliIds } = parseArgs(argv);

  const clerkBase =
    process.env.POL_IMG_FALLBACK_URL ||
    process.env.REACT_APP_POL_IMG_FALLBACK_URL ||
    DEFAULT_CLERK_BASE;
  const outDir = getResolvedPfpOutDir();

  await fsp.mkdir(outDir, { recursive: true });

  const loggerMeta = {
    outDir,
    clerkBase,
    dryRun: flags.dryRun,
    force: flags.force,
  };
  logger.info('pfp-sync starting', loggerMeta);

  if (manageConnection) {
    await connect(logger);
  }

  try {
    const query =
      cliIds.length > 0
        ? { id: { $in: cliIds }, ...ROSTER_PFP_QUERY }
        : { ...ROSTER_PFP_QUERY };

    const docs = await Pol.find(query).select('id').lean().exec();
    const idList = [
      ...new Set(docs.map((d) => d.id).filter((id) => BIOGUIDE_RE.test(id))),
    ].sort();

    if (cliIds.length > 0) {
      const missing = cliIds.filter((id) => !idList.includes(id));
      for (const m of missing) {
        logger.warn(
          `Bioguide ${m} not found as House has_stakes pol with roster_excluded clear (skipped)`
        );
      }
    }

    const counts = {
      written: 0,
      skipped: 0,
      dry_run: 0,
      download_failed: 0,
      encode_failed: 0,
    };

    let first = true;
    for (const id of idList) {
      if (!first) {
        await sleep(DOWNLOAD_GAP_MS);
      }
      first = false;
      const result = await syncOneBioguide(
        {
          outDir,
          clerkBase,
          dryRun: flags.dryRun,
          force: flags.force,
        },
        id
      );
      counts[result] += 1;
    }

    logger.info('pfp-sync finished', { ...counts, total: idList.length });

    if (manageConnection && flags.strict) {
      const failures = counts.download_failed + counts.encode_failed;
      if (failures > 0) {
        process.exitCode = 1;
      }
    }

    return { counts, total: idList.length, flags };
  } finally {
    if (manageConnection) {
      await disconnect();
    }
  }
}

if (require.main === module) {
  const [, , ...argv] = process.argv;
  runPfpSync({ manageConnection: true, argv }).catch((err) => {
    logger.error(`pfp-sync fatal: ${err.message}`);
    process.exitCode = 1;
    mongoose.disconnect().catch(() => {});
  });
}

module.exports = { runPfpSync, getResolvedPfpOutDir };
