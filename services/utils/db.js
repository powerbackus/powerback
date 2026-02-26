/**
 * @fileoverview Database Connection Utility Module
 *
 * This module provides MongoDB connection utilities with connection pooling,
 * timeout handling, and database name extraction. It ensures reliable database
 * connectivity for the application.
 *
 * KEY FUNCTIONS
 *
 * connect(logger)
 * - Connects to MongoDB using MONGODB_URI environment variable
 * - Configures connection pool (max 10 connections)
 * - Sets server selection timeout (10 seconds)
 * - Extracts and logs database name
 *
 * connectToUri(uri, logger)
 * - Connects to specific MongoDB URI
 * - Useful for test databases or multiple environments
 * - Same configuration as connect()
 *
 * disconnect()
 * - Disconnects from MongoDB
 * - Used for cleanup and testing
 *
 * BUSINESS LOGIC
 *
 * CONNECTION POOLING
 * - Max pool size: 10 connections
 * - Reuses connections for efficiency
 * - Prevents connection exhaustion
 *
 * TIMEOUT HANDLING
 * - Server selection timeout: 10 seconds
 * - Prevents hanging on connection failures
 * - Fails fast if database unavailable
 *
 * DATABASE NAME EXTRACTION
 * - Extracts database name from URI
 * - Format: mongodb://host:port/databaseName?options
 * - Used for logging and debugging
 *
 * DEPENDENCIES
 * - mongoose: MongoDB ODM
 *
 * @module services/utils/db
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Extract database name from MongoDB URI
 * @param {string} uri - MongoDB connection URI
 * @returns {string} Database name or 'unknown'
 */
function extractDbName(uri) {
  if (!uri) return 'unknown';
  return uri.split('/').pop()?.split('?')[0] || 'unknown';
}

module.exports = {
  /**
   * Connect to MongoDB using the URI from MONGODB_URI environment variable
   * @param {Object} logger - Logger instance
   * @returns {Promise} Connection promise
   */
  connect: (logger) => {
    const uri = process.env.MONGODB_URI;
    const dbName = extractDbName(uri);

    return mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then(() => {
        logger.info(`Database connected successfully (${dbName})`);
      })
      .catch((err) => {
        logger.error('MongoDB: (services/utils/db.js) error: ' + err);
        throw err;
      });
  },

  /**
   * Connect to a specific MongoDB URI (useful for test database)
   * @param {string} uri - MongoDB connection URI
   * @param {Object} logger - Logger instance
   * @returns {Promise} Connection promise
   */
  connectToUri: (uri, logger) => {
    const dbName = extractDbName(uri);
    return mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then(() => {
        logger.info(`Database connected successfully (${dbName})`);
      })
      .catch((err) => {
        logger.error('MongoDB connection error: ' + err);
        throw err;
      });
  },

  disconnect: () => mongoose.disconnect(),
};
