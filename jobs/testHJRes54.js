/**
 * @fileoverview H.J.Res.54 Bill Watcher Test Script
 *
 * This is a test/utility script for manually testing the H.J.Res.54 bill watcher.
 * It runs the watcher once, waits for completion, and then queries the database
 * to display the current bill state. Useful for debugging and verification.
 *
 * USAGE
 * Run this script directly to test the bill watcher:
 * ```bash
 * node jobs/testHJRes54.js
 * ```
 *
 * DEPENDENCIES
 * - mongoose: MongoDB connection
 * - models/Bill: Bill model
 * - services/db: Database connection
 * - services/utils/logger: Logging
 * - jobs/checkHJRes54: Bill watcher
 *
 * @module jobs/testHJRes54
 * @requires mongoose
 * @requires ../models/Bill
 * @requires ../services/db
 * @requires ../services/utils/logger
 * @requires ./checkHJRes54
 */

const mongoose = require('mongoose');
const { Bill } = require('../models');
const { connect } = require('../services/db');

const logger = require('../services/utils/logger')(__filename);

// Constants for the bill we're tracking
const HJRES54_CONGRESS_ID = 118;
const BILL_TYPE = 'hjres';
const BILL_NUMBER = 54;

// Import the checkBill function directly
const hjres54Watcher = require('./checkHJRes54');

async function testBillUpdate() {
  try {
    // Check if already connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      logger.info('Connecting to MongoDB...');
      await connect(logger);
      logger.info('Connected to MongoDB');
    }

    // Run the bill check once
    logger.info('Running bill check...');
    await hjres54Watcher('* * * * *'); // Pass any schedule, it will run immediately anyway

    // Wait a moment for the update to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Query the database for the bill
    const bill = await Bill.findOne({
      bill_id: `${BILL_TYPE}${BILL_NUMBER}-${HJRES54_CONGRESS_ID}`,
    });

    if (!bill) {
      logger.error('Bill not found in database');
      return;
    }

    // Log key information
    logger.info('Bill found in database:');
    logger.info('------------------------');
    logger.info(`Bill ID: ${bill.bill_id}`);
    logger.info(`Title: ${bill.title}`);
    logger.info(`Latest Action: ${bill.latest_major_action}`);
    logger.info(`Latest Action Date: ${bill.latest_major_action_date}`);
    logger.info(`Status: ${bill.active ? 'Active' : 'Inactive'}`);

    if (bill.committees) {
      logger.info('Committees:');
      bill.committees.forEach((committee) => {
        logger.info(`- ${committee.name || committee}`);
      });
    }

    if (bill.actions && bill.actions.length > 0) {
      logger.info('\nRecent Actions:');
      bill.actions.slice(-3).forEach((action) => {
        logger.info(`- ${action.datetime}: ${action.description}`);
      });
    }

    logger.info('\nFull document:');
    logger.info(JSON.stringify(bill.toObject(), null, 2));
  } catch (err) {
    logger.error('Test failed:', err);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBillUpdate();
