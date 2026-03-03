/**
 * Server Lifecycle Management
 *
 * Functions for managing server startup, lifecycle events, and initialization.
 * Handles database connections, background jobs, API testing, and startup logging.
 * In non-production, logStartupConfig logs a summary of email-related env vars once at boot;
 * set START_EMAIL_VAR_LOGGING=1 to enable that output; leave unset to skip.
 */

const { execSync } = require('child_process');
const { SERVER } = require('./constants');

/**
 * Run API route tests (internal and external)
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} True if all tests passed
 */
async function runApiRouteTests(logger) {
  logger.info('Running API route tests...');
  const {
    testInternalRoutes,
    testExternalAPIs,
  } = require('./scripts/api-route-tester');

  // Run internal route tests first (faster, less latency)
  let internalTestsPassed = false;
  try {
    const internalResults = await testInternalRoutes();
    internalTestsPassed = internalResults && internalResults.failed === 0;
  } catch (err) {
    logger.error('Internal API route tests failed:', err);
  }

  // Wait a moment for webpack compilation to complete before external API checks
  // This prevents log overlap between webpack and external API test output
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Run external API health checks after internal tests (slower, more latency)
  let externalTestsPassed = false;
  try {
    const externalResults = await testExternalAPIs();
    externalTestsPassed =
      externalResults &&
      externalResults.congressGov?.success &&
      externalResults.openFEC?.success &&
      externalResults.googleCivics?.success;
  } catch (err) {
    logger.error('External API health checks failed:', err);
  }

  // Log final status if all tests passed
  if (internalTestsPassed && externalTestsPassed) {
    logger.info(
      '✓ All systems operational - API routes and external services verified'
    );
  }

  return internalTestsPassed && externalTestsPassed;
}

/**
 * Start background jobs with proper logging
 * @param {Object} logger - Logger instance
 */
function startBackgroundJobs(logger) {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Background jobs disabled (NODE_ENV=test)');
    return;
  }

  const runWatchers = Boolean(process.env.START_WATCHERS);
  if (!runWatchers) {
    logger.info('Background jobs disabled (START_WATCHERS not set)');
    return;
  }
  logger.info('Starting background jobs...');
  require('./jobs');
}

/**
 * Start Express server with error handling
 * @param {Object} app - Express application
 * @param {number} port - Server port
 * @param {Object} logger - Logger instance
 * @param {Function} onListen - Callback when server starts listening
 * @returns {Object} HTTP server instance
 */
function startServer(app, port, logger, onListen) {
  const server = app.listen(port, onListen);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} already in use`);
      process.exit(1);
    }
  });

  return server;
}
/**
 * Email/env debug logging: runs once at server boot (non-production only).
 * START_EMAIL_VAR_LOGGING=1 enables it; unset or blank disables.
 * @param {boolean} runEmailLogging - True when START_EMAIL_VAR_LOGGING is set (e.g. to 1)
 * @param {boolean} isProductionEnv - True in production
 * @param {Object} logger - Logger instance
 */
function emailVarLogging(runEmailLogging, isProductionEnv, logger) {
  if (!runEmailLogging) {
    logger.info(
      'Email/env debug logging skipped (START_EMAIL_VAR_LOGGING not set)'
    );
    return;
  }

  if (!isProductionEnv) {
    const path = require('path');
    const envPath = path.resolve(__dirname, './.env.local');
    const dotenv = require('dotenv');
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      logger.warn(
        `Failed to load .env.local from ${envPath}: ${result.error.message}`
      );
    } else
      logger.debug(
        `Loaded .env.local from ${envPath}, parsed ${
          Object.keys(result.parsed || {}).length
        } variables`
      );
  }

  const emailVars = Object.keys(process.env).filter((key) =>
    key.startsWith('EMAIL_')
  );

  logger.debug(
    `Email-related env vars found: ${emailVars.length} - ${emailVars
      .map((k) => {
        const val = process.env[k];
        if (k.includes('PASS')) {
          return `${k}=${
            val
              ? val.length > 0
                ? '(set, length: ' + val.length + ')'
                : '(empty string)'
              : '(undefined)'
          }`;
        } else if (k.includes('USER')) {
          return `${k}=${
            val
              ? val.length > 0
                ? '(set: ' + val + ')'
                : '(empty string)'
              : '(undefined)'
          }`;
        } else {
          return `${k}=${
            val ? (val.length > 0 ? '(set)' : '(empty string)') : '(undefined)'
          }`;
        }
      })
      .join(', ')}`
  );
}

module.exports = {
  startServer,
  emailVarLogging,
  runApiRouteTests,
  startBackgroundJobs,
  logStartupConfig: (
    runEmailLogging,
    isProductionEnv,
    corsOptions,
    cspHeaders,
    helmet,
    logger,
    app
  ) => {
    logger.info('=== POWERBACK STARTUP CONFIGURATION ===');

    // Environment
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Server Name: ${process.env.SERVER_NAME || 'unknown'}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Platform: ${process.platform} ${process.arch}`);

    // Server Configuration
    const PORT = process.env.PORT ?? SERVER.DEFAULT_PORT;
    logger.info(`Server Port: ${PORT}`);
    logger.info(`Trust Proxy: ${app.get('trust proxy')}`);

    // Database Configuration
    const mongoUri = process.env.MONGODB_URI;
    const mongoHost = mongoUri
      ? mongoUri.includes('mongodb+srv://')
        ? 'MongoDB Atlas'
        : mongoUri.split('@')[1]?.split('/')[0] || 'localhost'
      : 'Not configured';
    logger.info(`Database: ${mongoHost}`);

    // Security Configuration
    logger.info(`CORS Origins: ${corsOptions.origin ? 'Restricted' : 'Open'}`);
    logger.info(`Helmet CSP: ${cspHeaders ? 'Enabled' : 'Disabled'}`);
    logger.info(`HSTS: ${helmet.hsts ? 'Enabled' : 'Disabled'}`);

    // Authentication Configuration
    logger.info(`JWT System: Enabled (Passport removed)`);
    logger.info(`Session Store: In-memory (JWT-only)`);

    // Feature Flags
    logger.info(
      `Background Jobs: ${
        process.env.NODE_ENV !== 'test' ? 'Enabled' : 'Disabled'
      }`
    );
    logger.info(`Static Files: Served from ${process.env.STATIC_PUBLIC_DIR}`);
    logger.info(`API Routes: Protected with rate limiting`);

    // Stripe Configuration
    const stripeEnv = process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST';
    logger.info(`Stripe Environment: ${stripeEnv}`);

    // Email/env debug logging
    emailVarLogging(runEmailLogging, isProductionEnv, logger);

    // Systemd Security Score
    if (isProductionEnv) {
      try {
        const securityScore = execSync(
          '/usr/local/bin/powerback-security-score powerback.service',
          { encoding: 'utf8', timeout: 5000 }
        ).trim();
        logger.info(securityScore);
      } catch (error) {
        // Silently fail if script isn't available or times out
        logger.debug('Security score not available');
      }
    }

    logger.info('=== STARTUP CONFIGURATION COMPLETE ===');

    // ASCII Art Banner
    if (isProductionEnv) console.log(require('./artBanner'));
  },
};
