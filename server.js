/**
 * POWERBACK Express Application Server
 *
 * Modernized Express.js application with comprehensive security, authentication,
 * and production-ready configuration. Features JWT-only authentication system,
 * proper middleware ordering, CORS protection, and structured startup logging.
 *
 * Key Features:
 * - JWT-only authentication (Passport.js removed)
 * - Comprehensive security headers (Helmet, CSP, HSTS)
 * - Proper CORS configuration with origin whitelisting
 * - Database connection with startup validation
 * - Background job management
 * - Static file serving with CORS support
 * - Rate limiting and API protection
 *
 * @version 1.0.0
 * @author fc
 */

// Core Node.js modules
const fs = require('fs');
const path = require('path');

// Third-party libraries
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Application internal modules
const { requireLogger } = require('./services/logger');
const { connect } = require('./services/utils/db');
const { csrfTokenGenerator } = require('./services/utils');
const { SERVER } = require('./constants');
const {
  getTrustProxy,
  setPdfHeaders,
  createCorsOptions,
  createHelmetConfig,
  createStaticCorsOptions,
} = require('./config/server.config');
const cspHeaders = require('./cspHeaders');
const routes = require('./routes');
const errorHandler = require('./routes/api/middleware/errorHandler.js');

// Logger initialization (after requireLogger)
const logger = requireLogger(__filename);

// Environment variable loading
// Development: Load from .env.local file using dotenv
// Production: Load from SECRETS_PATH environment variable
if (process.env.NODE_ENV !== 'production') {
  // Development environment - load from .env.local file
  require('dotenv').config({ path: path.join(__dirname, '.env.local') });
} else {
  // Production environment - load from SECRETS_PATH
  const secretsPath = process.env.SECRETS_PATH;

  if (!secretsPath) {
    logger.error(
      'SECRETS_PATH environment variable is not set. Configure SECRETS_PATH in your systemd service file.'
    );
  } else if (!fs.existsSync(secretsPath)) {
    logger.error(`SECRETS_PATH file not found: ${secretsPath}`);
  } else {
    try {
      const envContent = fs.readFileSync(secretsPath, 'utf8');
      envContent.split('\n').forEach((line) => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            process.env[key] = valueParts.join('=');
          }
        }
      });
      logger.debug(
        `Environment variables loaded from SECRETS_PATH (${secretsPath}) at ${new Date().toISOString()}`
      );
    } catch (err) {
      logger.error(`Failed to load environment from SECRETS_PATH:`, err);
    }
  }
}

const isProductionEnv = process.env.NODE_ENV === 'production';
const runEmailLogging = Boolean(process.env.START_EMAIL_VAR_LOGGING);
const POSITION_PAPER_PATH = process.env.REACT_APP_POSITION_PAPER_PATH; // this comes from the server and is its literal name
const STATIC_PUBLIC_DIR = process.env.STATIC_PUBLIC_DIR;

const corsOptions = createCorsOptions(isProductionEnv);
const staticCorsOptions = createStaticCorsOptions();

const app = express();

// Security: Disable X-Powered-By header to reduce fingerprinting
app.disable('x-powered-by');

app.set('trust proxy', getTrustProxy(isProductionEnv));

// Apply permissive CORS to static files FIRST (before main CORS)
app.use('/static', cors(staticCorsOptions));

// Apply restrictive CORS to API routes
app.use(cors(corsOptions));

// Security headers
app.use(helmet(createHelmetConfig()));
app.use(cspHeaders);

// Safe static directory for Node-only assets
// Environment-aware path: production uses public_html, development uses client/public
const staticDir = isProductionEnv
  ? STATIC_PUBLIC_DIR
  : path.resolve(__dirname, 'client/public');
app.use('/static', express.static(staticDir));

// Serve position paper PDF from clean URL
app.get(`/${POSITION_PAPER_PATH}`, cors(staticCorsOptions), (req, res) => {
  const filename = process.env.POSITION_PAPER_FILENAME;

  if (!filename) {
    logger.error('POSITION_PAPER_FILENAME environment variable is not set');
    return res.status(500).json({
      error: {
        message: 'Position paper PDF configuration error',
        status: 500,
      },
    });
  }

  const pdfPath = isProductionEnv
    ? `${STATIC_PUBLIC_DIR}/${filename}`
    : path.resolve(__dirname, `client/public/${filename}`);

  if (!fs.existsSync(pdfPath)) {
    logger.error(`Position paper PDF file not found: ${pdfPath}`);
    return res.status(404).json({
      error: {
        message: 'Position paper PDF not found',
        status: 404,
      },
    });
  }

  // Disable caching to ensure fresh file is served
  setPdfHeaders(res, filename);

  res.sendFile(
    pdfPath,
    {
      etag: false,
      lastModified: false,
    },
    (err) => {
      if (err) {
        logger.error('Error sending position paper PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              message: 'Error serving position paper PDF',
              status: 500,
            },
          });
        }
      }
    }
  );
});

// Webhook routes come before any body parsing middleware
app.use('/api/webhooks', require('./routes/api/webhooks'));

app.use(cookieParser());

// CSRF token generation for all routes
app.use(csrfTokenGenerator());

// Now add body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use('/api/snapshots', require('./routes/snapshots'));

app.use(express.json());

// Log all incoming requests to /api to verify nginx is proxying correctly
app.use('/api', (req, res, next) => {
  // Use INFO level so it shows in production logs
  logger.info('API request received', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    headers: {
      host: req.headers.host,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'user-agent': req.headers['user-agent'],
    },
  });
  next();
});

app.use('/api', routes);

// 404 handler for API routes - must come before error handler
// This ensures API routes return JSON, not HTML
app.use('/api', (req, res, next) => {
  logger.warn('API route not found', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
  });
  res.status(404).json({
    error: {
      message: 'API route not found',
      status: 404,
    },
  });
});

// Add error handling middleware last, after all other middleware and routes
app.use(errorHandler);

// Start the API server only if not in test mode
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  const PORT = process.env.PORT ?? SERVER.DEFAULT_PORT;

  // Log effective configuration at startup
  const {
    logStartupConfig,
    runApiRouteTests,
    startBackgroundJobs,
    startServer,
  } = require('./lifecycle.js');
  logStartupConfig(
    runEmailLogging,
    isProductionEnv,
    corsOptions,
    cspHeaders,
    helmet,
    logger,
    app
  );

  // If MONGODB_TEST_URI is set, connect to test DB first, run tests, then switch to real DB
  // Otherwise, connect directly to the real database
  const testDbUri = process.env.MONGODB_TEST_URI;
  const shouldRunTests = Boolean(process.env.START_API_TESTS);

  if (testDbUri && shouldRunTests) {
    // Two-step process: test DB first, then real DB
    logger.info(
      'MONGODB_TEST_URI detected - connecting to test database first for API route tests'
    );
    const { connectToUri, disconnect } = require('./services/utils/db');

    connectToUri(testDbUri, logger)
      .then(async () => {
        logger.info('Test database connected - running API route tests...');

        // Start server on test DB (needed for route tests)
        startServer(app, PORT, logger, async () => {
          logger.info(
            `API Server now listening on PORT ${PORT} (test database)!`
          );

          if (shouldRunTests) {
            await runApiRouteTests(logger);
          }

          // Disconnect from test database
          logger.info('Disconnecting from test database...');
          await disconnect();

          // Connect to real database
          logger.info('Connecting to production/development database...');
          connect(logger)
            .then(() => {
              startBackgroundJobs(logger);
            })
            .catch((err) => {
              logger.error(
                'Failed to connect to production/development database:',
                err.message
              );
              process.exit(1);
            });
        });
      })
      .catch((err) => {
        logger.error('Failed to connect to test database:', err.message);
        process.exit(1);
      });
  } else {
    // Normal flow: connect directly to real database
    connect(logger)
      .then(() => {
        // Start the server
        startServer(app, PORT, logger, async () => {
          logger.info(`API Server now listening on PORT ${PORT}!`);

          // Only start jobs after successful DB connection and server start
          startBackgroundJobs(logger);

          // Run API route tests if enabled (but no test DB specified)
          if (shouldRunTests && !testDbUri) {
            await runApiRouteTests(logger);
          }
        });
      })
      .catch((err) => {
        logger.error('Failed to connect to database:', err.message);
        process.exit(1);
      });
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down, disconnecting from MongoDB…');
  await mongoose.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown); // Ctrl+C
process.on('SIGTERM', shutdown); // `kill` or container stop

// Export app for testing
module.exports = app;
