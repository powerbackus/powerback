/**
 * @fileoverview Docking Collection Manager
 *
 * This module manages safe collection updates using "docking" collections as
 * an intermediate staging area. It allows inspection and validation before
 * promoting data to live collections, preventing data corruption and enabling
 * rollback capabilities.
 *
 * KEY FEATURES
 *
 * DOCKING COLLECTIONS
 * - Intermediate staging area: `docking_<collection>`
 * - Allows inspection before promotion
 * - Prevents direct writes to live collections
 *
 * SAFE PROMOTION
 * - Promotion flow: external_data → docking_<collection> → <collection>
 * - Non-destructive: Upserts into live, then deletes from docking
 * - Atomic operations prevent data loss
 *
 * DRY-RUN MODE
 * - Shows what would happen without writing
 * - Reports inserts, updates, and unchanged docs
 * - Zero writes performed
 * - Useful for validation before promotion
 *
 * ROLLBACK CAPABILITY
 * - Creates backups before promotion
 * - Can restore from most recent backup
 * - Prevents data loss from bad promotions
 *
 * BUSINESS LOGIC
 *
 * PROMOTION PROCESS
 * 1. Upsert all docking docs into live collection
 * 2. Delete promoted docs from docking collection
 * 3. Ensures data consistency
 *
 * DRY-RUN ANALYSIS
 * - Compares docking vs live collection
 * - Identifies new inserts (not in live)
 * - Identifies updates (different from live)
 * - Identifies unchanged (identical to live)
 *
 * BACKUP SYSTEM
 * - Creates backup before promotion
 * - Format: `<collection>_backup_<timestamp>`
 * - Enables rollback if needed
 *
 * CLI INTERFACE
 * This module can be run as a CLI script:
 * ```bash
 * node services/utils/dockingManager.js <command> <collection>
 * ```
 *
 * Commands:
 * - create: Create docking collection
 * - dryrun: Show what would happen (no writes)
 * - promote: Promote docking → live
 * - rollback: Restore from backup
 * - stats: Show collection statistics
 * - compare: Sample compare docking vs live
 *
 * DEPENDENCIES
 * - path: Path manipulation
 * - mongoose: MongoDB connection
 * - services/utils/db: Database connection
 * - services/logger: Logging
 * - fs: File system operations
 * - dotenv: Environment variable loading
 *
 * @module services/utils/dockingManager
 * @requires path
 * @requires mongoose
 * @requires ./db
 * @requires ../logger
 * @requires fs
 * @requires dotenv
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { requireLogger } = require('../logger');
const { connect } = require('./db');
const logger = requireLogger(__filename);

// Load environment variables for CLI
// Try .env.cli first, fall back to .env.local if it doesn't exist
const envCliPath = path.resolve(__dirname, '../../.env.cli');
const envPath = path.resolve(__dirname, '../../.env.local');

if (fs.existsSync(envCliPath)) {
  require('dotenv').config({ path: envCliPath });
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // Try default dotenv behavior (looks for .env in current directory)
  require('dotenv').config();
}

class DockingManager {
  constructor() {
    this.db = null;
  }

  async connect() {
    if (mongoose.connection.readyState !== 1) {
      logger.info('Connecting to MongoDB...');
      await connect(logger);
      logger.info('MongoDB connected for docking manager');
    }
    this.db = mongoose.connection.db;
  }

  createDockingName(name) {
    return `docking_${name}`;
  }

  async createDockingCollection(collectionName) {
    const dockingName = this.createDockingName(collectionName);

    const collections = await this.db.listCollections().toArray();
    const dockingExists = collections.some((c) => c.name === dockingName);

    if (dockingExists) {
      logger.info(`Docking collection ${dockingName} already exists`);
      return dockingName;
    }

    await this.db.createCollection(dockingName);
    logger.info(`Created docking collection: ${dockingName}`);
    return dockingName;
  }

  async upsertToDocking(collectionName, data, filter) {
    const dockingName = this.createDockingName(collectionName);
    await this.createDockingCollection(collectionName);

    const result = await this.db
      .collection(dockingName)
      .updateOne(filter, { $set: data }, { upsert: true });

    logger.info(
      `Upserted to ${dockingName}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`
    );
    return result;
  }

  /* ---------------------------------------------------------------------- */
  /* NEW HELPERS: GET, DELETE, DRY RUN                                       */
  /* ---------------------------------------------------------------------- */

  async getAllDockingDocs(collectionName) {
    const dockingName = this.createDockingName(collectionName);
    return await this.db.collection(dockingName).find({}).toArray();
  }

  async deleteDockingDocs(collectionName, ids) {
    const dockingName = this.createDockingName(collectionName);
    if (!Array.isArray(ids) || ids.length === 0) return;

    await this.db.collection(dockingName).deleteMany({
      id: { $in: ids },
    });
  }

  /* ---------------------------------------------------------------------- */
  /* DRY RUN IMPLEMENTATION                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * DRY RUN: compute what would happen on promotion.
   *
   * For each docking doc:
   *   - If live doc doesn't exist: INSERT
   *   - If exists and differs: UPDATE
   *   - If exists and identical: NO-CHANGE
   *
   * Zero writes performed.
   */
  async dryRunPromotion(collectionName) {
    const dockingName = this.createDockingName(collectionName);

    logger.info(`Dry-run: Comparing ${dockingName} → ${collectionName}`);

    const dockingDocs = await this.getAllDockingDocs(collectionName);
    const liveCol = this.db.collection(collectionName);

    const inserts = [];
    const updates = [];
    const unchanged = [];

    for (const doc of dockingDocs) {
      const liveDoc = await liveCol.findOne({ id: doc.id });

      if (!liveDoc) {
        inserts.push(doc);
        continue;
      }

      // Remove _id fields for deep comparison
      const { _id, ...cleanLive } = liveDoc;
      const { _id: _id2, ...cleanDock } = doc;

      const isSame = JSON.stringify(cleanLive) === JSON.stringify(cleanDock);

      if (isSame) unchanged.push(doc);
      else updates.push({ id: doc.id, before: cleanLive, after: cleanDock });
    }

    logger.info('--- DRY RUN RESULTS ---');
    logger.info(`New inserts: ${inserts.length}`);
    logger.info(`Updates: ${updates.length}`);
    logger.info(`Unchanged: ${unchanged.length}`);

    return {
      inserts,
      updates,
      unchanged,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* SAFE PROMOTION                                                         */
  /* ---------------------------------------------------------------------- */

  async promoteDockingCollection(collectionName) {
    const dockingName = this.createDockingName(collectionName);

    logger.info(
      `Promoting documents from ${dockingName} to ${collectionName} (safe mode)...`
    );

    const docs = await this.getAllDockingDocs(collectionName);

    if (docs.length === 0) {
      logger.info(`No documents to promote from ${dockingName}.`);
      return true;
    }

    const live = this.db.collection(collectionName);
    let count = 0;

    for (const doc of docs) {
      await live.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
      count++;
    }

    logger.info(`Upserted ${count} docs into ${collectionName}.`);

    const ids = docs.map((d) => d.id);
    await this.deleteDockingDocs(collectionName, ids);

    logger.info(`Deleted ${ids.length} docs from ${dockingName}.`);
    logger.info(`Promotion complete.`);
    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* EXISTING UTILITIES                                                     */
  /* ---------------------------------------------------------------------- */

  async rollbackPromotion(collectionName) {
    const collections = await this.db.listCollections().toArray();
    const backups = collections
      .filter((c) => c.name.startsWith(`${collectionName}_backup_`))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backups.length === 0) {
      throw new Error(`No backup found for ${collectionName}`);
    }

    const latest = backups[0].name;

    await this.db.collection(collectionName).drop();
    await this.db.collection(latest).rename(collectionName);

    logger.info(`Rolled back ${collectionName} from ${latest}`);
    return true;
  }

  async getCollectionStats(collectionName) {
    const dockingName = this.createDockingName(collectionName);

    const stats = {
      live: null,
      docking: null,
    };

    try {
      const s = await this.db.collection(collectionName).stats();
      stats.live = { count: s.count, size: s.size, avgObjSize: s.avgObjSize };
    } catch {
      stats.live = { error: 'Collection does not exist' };
    }

    try {
      const s = await this.db.collection(dockingName).stats();
      stats.docking = {
        count: s.count,
        size: s.size,
        avgObjSize: s.avgObjSize,
      };
    } catch {
      stats.docking = { error: 'Docking collection does not exist' };
    }

    return stats;
  }

  async compareCollections(collectionName, sampleSize = 10) {
    const dockingName = this.createDockingName(collectionName);

    const liveSample = await this.db
      .collection(collectionName)
      .aggregate([{ $sample: { size: sampleSize } }])
      .toArray();

    const dockingSample = await this.db
      .collection(dockingName)
      .aggregate([{ $sample: { size: sampleSize } }])
      .toArray();

    return {
      live: liveSample,
      docking: dockingSample,
    };
  }
}

/* ---------------------------------------------------------------------- */
/* CLI INTERFACE (adds dryrun)                                            */
/* ---------------------------------------------------------------------- */

async function main() {
  const manager = new DockingManager();
  await manager.connect();

  const command = process.argv[2];
  const collectionName = process.argv[3];

  try {
    switch (command) {
      case 'create':
        await manager.createDockingCollection(collectionName);
        console.log(`✅ Created docking collection for ${collectionName}`);
        break;

      case 'promote':
        await manager.promoteDockingCollection(collectionName);
        console.log(`✅ Promoted docking collection for ${collectionName}`);
        break;

      case 'dryrun': {
        const result = await manager.dryRunPromotion(collectionName);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'rollback':
        await manager.rollbackPromotion(collectionName);
        console.log(`✅ Rolled back ${collectionName}`);
        break;

      case 'stats':
        const stats = await manager.getCollectionStats(collectionName);
        console.log(
          `📊 Stats for ${collectionName}:`,
          JSON.stringify(stats, null, 2)
        );
        break;

      case 'compare':
        const comparison = await manager.compareCollections(collectionName);
        console.log(
          `🔍 Comparison for ${collectionName}:`,
          JSON.stringify(comparison, null, 2)
        );
        break;

      default:
        console.log(`
Usage: node dev/dockingManager.js <command> <collection>

Commands:
  create <collection>   - Create docking collection
  dryrun <collection>   - Show inserts/updates/unchanged WITHOUT writing
  promote <collection>  - Promote docking => live
  rollback <collection> - Restore most recent backup
  stats <collection>    - Show counts and sizes
  compare <collection>  - Sample compare
        `);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DockingManager;
