/**
 * @fileoverview API Route Tester - Tests all API routes on server startup
 *
 * This script discovers all API routes registered in the Express app and tests
 * each one to ensure they're responding correctly. It handles authentication
 * by logging in with test credentials and uses those credentials for protected routes.
 *
 * The script runs automatically when the server starts and reports:
 * - Total number of API routes discovered
 * - Number of routes that passed tests
 * - Number of routes that failed tests
 * - Detailed results for each route
 *
 * @module scripts/api-route-tester
 * @requires express
 * @requires axios
 * @requires ../server
 */

const axios = require('axios');
const app = require('../server');
const { FEC } = require('../constants');
const { session } = require('../shared/session');

const logger = require('../services/utils/logger')(__filename);

/**
 * Test credentials for API route testing
 * These should be provided via environment variables or constants
 */
const TEST_CREDENTIALS = {
  username: process.env.API_TEST_USERNAME || 'test@example.com',
  password: process.env.API_TEST_PASSWORD || 'testpassword',
};

/**
 * Position paper path
 */
const POSITION_PAPER_PATH =
  process.env.REACT_APP_POSITION_PAPER_PATH || 'position-paper.pdf';

/**
 * Base URL for API requests
 */
const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;

/**
 * Discover routes by directly accessing route modules
 * This is a fallback when app router discovery fails
 * @returns {Array} Array of route objects
 */
function discoverRoutesFromModules() {
  const routes = [];

  try {
    // Access routes directly from the route modules
    const apiRoutes = require('../routes/api');

    // Try to extract routes from the router
    if (apiRoutes && apiRoutes.stack) {
      extractRoutesFromStack(apiRoutes.stack, '/api');
    }
  } catch (error) {
    logger.warn('Failed to discover routes from modules:', error.message);
  }

  return routes;

  function extractRoutesFromStack(stack, basePath = '') {
    if (!stack || !Array.isArray(stack)) return;

    stack.forEach((layer) => {
      if (!layer) return;

      try {
        if (layer.route && layer.route.path) {
          // Handle both absolute and relative paths
          let routePath = layer.route.path;
          if (!routePath.startsWith('/')) {
            routePath = basePath + (routePath === '/' ? '' : routePath);
          } else {
            routePath = basePath + routePath;
          }

          if (layer.route.stack) {
            layer.route.stack.forEach((handler) => {
              if (!handler || !handler.methods) return;
              const methods = Object.keys(handler.methods).filter(
                (method) => handler.methods[method]
              );
              methods.forEach((method) => {
                routes.push({
                  method: method.toUpperCase(),
                  path: routePath.replace(/^\/api/, '') || '/',
                  fullPath: routePath,
                });
              });
            });
          }
        } else if (
          layer.name === 'router' &&
          layer.handle &&
          Array.isArray(layer.handle.stack)
        ) {
          // Try to get mount path - check common mount points first
          let mountPath = '';
          if (layer.regexp) {
            const str = layer.regexp.toString();
            // Check for common mount paths in the regex
            const commonPaths = [
              'celebrations',
              'users',
              'payments',
              'congress',
              'civics',
              'config',
              'btc',
              'dev',
              'sys',
              'webhooks',
              'security',
            ];
            for (const commonPath of commonPaths) {
              if (str.includes(commonPath)) {
                mountPath = '/' + commonPath;
                break;
              }
            }
          }
          extractRoutesFromStack(layer.handle.stack, basePath + mountPath);
        }
      } catch (error) {
        // Skip problematic layers
      }
    });
  }
}

/**
 * Discover all routes from Express app
 * @param {Object} app - Express application instance
 * @returns {Array} Array of route objects with method, path, and handlers
 */
function discoverRoutes(app) {
  const routes = [];

  /**
   * Extract path from regexp pattern or layer
   * @param {RegExp} regexp - Express route regexp
   * @param {Object} layer - Express layer (optional, for checking path property)
   * @returns {string} Extracted path
   */
  function getPathFromRegexp(regexp, layer = null) {
    // First check if layer has a direct path property
    if (layer && layer.path) {
      return layer.path;
    }

    if (!regexp) return '';

    const str = regexp.toString();
    const isDebugMode = process.env.DEBUG_ROUTE_DISCOVERY === 'true';

    // Pattern 1: Express mount point pattern: /^\/api\/?$/i or /^\/api(?:\/|$)/i
    // Extract the literal path part before optional patterns
    let match = str.match(/^\/\^\\\?\/([^\\?]*?)(?:\\\/|\?|\(|$)/);
    if (match && match[1]) {
      let path = match[1]
        .replace(/\\\//g, '/')
        .replace(/\$\/\?/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\\/g, '');
      // Only return if it looks like a real path (not just regex patterns)
      if (path && !path.match(/^[\^$?*+()[\]{}|]/)) {
        if (isDebugMode && path) {
          logger.debug(
            `Extracted path from regexp: "${path}" (from: ${str.substring(
              0,
              80
            )})`
          );
        }
        return '/' + path;
      }
    }

    // Pattern 2: Try to extract from fast_slash or other patterns
    if (regexp.fast_slash) {
      return '/';
    }

    // Pattern 3: Look for literal path segments in the regex
    // Match patterns like /^\/api/ or /^\/users/
    match = str.match(/\/\^\\\?\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const path = '/' + match[1];
      if (isDebugMode) {
        logger.debug(`Extracted path from literal match: "${path}"`);
      }
      return path;
    }

    // Pattern 4: Try simpler extraction for common mount points
    const commonPaths = [
      '/api',
      '/users',
      '/celebrations',
      '/payments',
      '/congress',
      '/civics',
      '/config',
      '/btc',
      '/dev',
      '/sys',
      '/webhooks',
      '/security',
    ];
    for (const commonPath of commonPaths) {
      if (str.includes(commonPath.replace('/', '\\/'))) {
        if (isDebugMode) {
          logger.debug(`Matched common path: "${commonPath}"`);
        }
        return commonPath;
      }
    }

    if (isDebugMode) {
      logger.debug(
        `Could not extract path from regexp: ${str.substring(0, 100)}`
      );
    }

    return '';
  }

  /**
   * Recursively extract routes from Express router stack
   * @param {Array} stack - Express router stack
   * @param {string} basePath - Base path prefix
   */
  function extractRoutes(stack, basePath = '', depth = 0) {
    if (!stack || !Array.isArray(stack)) {
      if (depth === 0) {
        logger.warn('Router stack is not an array');
      }
      return;
    }

    const isDebugMode = process.env.DEBUG_ROUTE_DISCOVERY === 'true';
    if (isDebugMode && depth === 0) {
      logger.debug(
        `Extracting routes from stack, basePath: "${basePath}", stack length: ${stack.length}`
      );
    }

    stack.forEach((layer, index) => {
      if (!layer) return;

      try {
        // Handle route layer (actual route definition)
        // In Express, route definitions can be:
        // 1. Direct route layers (layer.route exists)
        // 2. Bound dispatch layers with route property (layer.name === 'bound dispatch' && layer.route exists)
        const hasRoute = layer.route && layer.route.path !== undefined;

        if (hasRoute) {
          // Route paths in Express are always relative to their mount point
          // Even if they start with '/', they're relative to the router's basePath
          let routePath = layer.route.path;

          // If we have a basePath (we're inside a mounted router), combine them
          if (basePath) {
            // Normalize: remove trailing slash from basePath, add leading slash to routePath if needed
            const normalizedBase = basePath.endsWith('/')
              ? basePath.slice(0, -1)
              : basePath;
            const normalizedRoute = routePath.startsWith('/')
              ? routePath
              : '/' + routePath;
            routePath = normalizedBase + normalizedRoute;
          } else {
            // No basePath - route is at app root level
            // Ensure it starts with /api
            if (!routePath.startsWith('/api')) {
              routePath = routePath.startsWith('/')
                ? `/api${routePath}`
                : `/api/${routePath}`;
            }
          }

          // Normalize double slashes (except after protocol)
          routePath = routePath.replace(/([^:]\/)\/+/g, '$1');

          // Extract methods from the route object itself, not from handlers
          // In Express, route.methods is an object like {get: true, post: false, ...}
          if (layer.route.methods) {
            const methods = Object.keys(layer.route.methods).filter(
              (method) => layer.route.methods[method]
            );

            if (methods.length > 0) {
              methods.forEach((method) => {
                routes.push({
                  method: method.toUpperCase(),
                  path: routePath.replace(/^\/api/, '') || '/', // Store without /api prefix for path matching
                  fullPath: routePath,
                });
                if (isDebugMode) {
                  logger.debug(
                    `  Added route: ${method.toUpperCase()} ${routePath}`
                  );
                }
              });
            } else if (isDebugMode) {
              logger.debug(`  Route found but no methods: ${routePath}`);
            }
          } else if (isDebugMode) {
            logger.debug(`  Route found but no methods property: ${routePath}`);
          }
        }
        // Handle router layer (mounted sub-router)
        else if (
          layer.name === 'router' &&
          layer.handle &&
          Array.isArray(layer.handle.stack)
        ) {
          // Try to get mount path from regexp
          let mountPath = getPathFromRegexp(layer.regexp, layer);

          // If we couldn't extract from regexp, try to infer from the router's routes
          // Check if any routes in the stack have full paths that start with common prefixes
          if (!mountPath && layer.handle.stack.length > 0) {
            // Look at first few routes to infer mount path
            for (const subLayer of layer.handle.stack.slice(0, 10)) {
              if (subLayer.route && subLayer.route.path) {
                const routePath = subLayer.route.path;
                // If route starts with /api or a known prefix, use that
                if (routePath.startsWith('/api/')) {
                  const parts = routePath.split('/');
                  if (parts.length >= 3) {
                    mountPath = '/' + parts[2]; // e.g., /users, /celebrations
                    break;
                  }
                }
              }
            }
          }

          // Normalize basePath to avoid double slashes
          const normalizedBase =
            basePath.endsWith('/') && mountPath.startsWith('/')
              ? basePath.slice(0, -1)
              : basePath;
          const newBasePath = mountPath
            ? normalizedBase + mountPath
            : normalizedBase;

          if (isDebugMode) {
            logger.debug(
              `Found router layer, mounting at: "${
                mountPath || '(unknown)'
              }", newBasePath: "${newBasePath}"`
            );
            if (!mountPath && layer.regexp) {
              logger.debug(
                `  Layer regexp: ${layer.regexp.toString().substring(0, 150)}`
              );
            }
          }

          // Always recurse into router stack - routes inside may have full paths or relative paths
          if (isDebugMode) {
            logger.debug(
              `  Router stack has ${layer.handle.stack.length} layers`
            );
            // Log first few layer types and check for actual route layers
            layer.handle.stack.slice(0, 5).forEach((subLayer, idx) => {
              const routeInfo = subLayer?.route
                ? `route.path="${subLayer.route.path}", route.stack.length=${
                    subLayer.route.stack?.length || 0
                  }`
                : 'no route';
              logger.debug(
                `    Sub-layer ${idx}: name=${subLayer?.name}, ${routeInfo}`
              );
              // If it has a route, log the methods
              if (subLayer?.route?.stack) {
                subLayer.route.stack.forEach((handler, hIdx) => {
                  if (handler?.methods) {
                    const methods = Object.keys(handler.methods).filter(
                      (m) => handler.methods[m]
                    );
                    logger.debug(
                      `      Handler ${hIdx}: methods=[${methods.join(', ')}]`
                    );
                  }
                });
              }
            });
          }
          extractRoutes(layer.handle.stack, newBasePath, depth + 1);
        }
        // Handle middleware with path (could be a mounted router)
        else if (
          layer.regexp &&
          layer.regexp.fast_slash !== true &&
          layer.handle &&
          Array.isArray(layer.handle.stack)
        ) {
          const pathMatch = getPathFromRegexp(layer.regexp, layer);
          if (
            pathMatch &&
            pathMatch !== '.*' &&
            pathMatch !== '(?:\\/(?=$))' &&
            pathMatch !== '/'
          ) {
            if (isDebugMode) {
              logger.debug(`Found middleware/router, path: ${pathMatch}`);
            }
            extractRoutes(layer.handle.stack, basePath + pathMatch, depth + 1);
          }
        }
      } catch (error) {
        // Skip layers that cause errors during extraction
        if (isDebugMode) {
          logger.debug(
            `Skipping layer at index ${index} due to error: ${error.message}`
          );
        }
      }
    });
  }

  // Extract routes from app router stack
  // Try multiple ways to access the router
  let routerStack = null;
  const isDebugMode = process.env.DEBUG_ROUTE_DISCOVERY === 'true';

  // Try to find router in various locations
  if (app._router && app._router.stack) {
    routerStack = app._router.stack;
    if (isDebugMode) logger.debug('Using app._router.stack');
  } else if (app.router && app.router.stack) {
    routerStack = app.router.stack;
    if (isDebugMode) logger.debug('Using app.router.stack');
  } else if (app.stack) {
    routerStack = app.stack;
    if (isDebugMode) logger.debug('Using app.stack');
  } else if (app._router) {
    // Try to find stack in _router properties
    const routerProps = Object.keys(app._router);
    if (isDebugMode) logger.debug('app._router properties:', routerProps);
    if (app._router.stack) {
      routerStack = app._router.stack;
    }
  }

  // If still not found, try to inspect the app more deeply
  if (!routerStack && isDebugMode) {
    logger.debug('Inspecting app structure...');
    logger.debug('app keys:', Object.keys(app).slice(0, 20));
    if (app._router) {
      logger.debug('app._router type:', typeof app._router);
      logger.debug('app._router keys:', Object.keys(app._router).slice(0, 20));
    }
  }

  if (routerStack) {
    if (isDebugMode) {
      logger.debug(`Found router stack with ${routerStack.length} layers`);
      if (routerStack.length > 0) {
        logger.debug('Sample layer structure:', {
          firstLayerName: routerStack[0]?.name,
          firstLayerRoute: !!routerStack[0]?.route,
          firstLayerRegexp: routerStack[0]?.regexp
            ?.toString()
            ?.substring(0, 50),
        });
      }
    }

    extractRoutes(routerStack);

    if (isDebugMode) {
      logger.debug(`Extracted ${routes.length} routes from app router`);
    }
  } else {
    logger.warn(
      'Could not find router stack in app. Trying alternative method...'
    );
    if (isDebugMode) {
      logger.warn(
        'Available app properties:',
        Object.keys(app).filter((k) => !k.startsWith('_'))
      );
    }
  }

  // If no routes found, try fallback method
  if (routes.length === 0) {
    logger.info('No routes found with primary method, trying fallback...');
    const fallbackRoutes = discoverRoutesFromModules();
    if (fallbackRoutes.length > 0) {
      logger.info(
        `Found ${fallbackRoutes.length} routes using fallback method`
      );
      routes.push(...fallbackRoutes);
    }
  }

  return routes;
}

/**
 * Get authentication token and user ID by logging in
 * @returns {Promise<Object|null>} Object with accessToken and userId, or null if login fails
 */
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/login`, {
      username: TEST_CREDENTIALS.username,
      password: TEST_CREDENTIALS.password,
    });

    if (response.data && response.data.accessToken) {
      return {
        accessToken: response.data.accessToken,
        userId: response.data.id || null,
      };
    }

    logger.warn('Login successful but no access token in response');
    return null;
  } catch (error) {
    logger.error('Failed to login with test credentials:', error.message);
    return null;
  }
}

/**
 * Test pol value for congress members route
 * This should be a valid politician identifier (FEC ID or similar)
 * Can be overridden via environment variable API_TEST_POL
 *
 * Example: Set API_TEST_POL=H8CA05245 in your environment to use a specific politician
 */
const TEST_POL = process.env.API_TEST_POL || 'H8NY15148'; // Default test FEC ID

/**
 * Replace route parameters with test values
 * @param {string} path - Route path with parameters
 * @param {string|null} userId - Actual user ID from authentication (optional)
 * @returns {string} Path with parameters replaced
 */
function replaceParams(path, userId = null) {
  return path
    .replace(/:userId/g, userId || 'test-user-id')
    .replace(/:celebrationId/g, 'test-celebration-id')
    .replace(/:hash/g, 'test-hash')
    .replace(/:pol/g, TEST_POL)
    .replace(/:id/g, 'test-id')
    .replace(/:customer_id/g, 'test-customer-id')
    .replace(/:state/g, 'CA')
    .replace(/:zip/g, '90210');
}

/**
 * Determine if route requires authentication based on path patterns
 * @param {string} path - Route path
 * @returns {boolean} True if route likely requires authentication
 */
function requiresAuth(path) {
  // Routes that require authentication (check these FIRST before public routes)
  // More specific patterns must be checked before general ones
  const authRequiredPatterns = [
    '/users/logout',
    '/users/data/',
    '/users/update/',
    '/users/delete/',
    '/users/change/',
    '/users/privilege/',
    '/users/compliance/',
    '/users/promote/',
    '/users/:userId/tipLimitReached',
    '/celebrations/',
    '/payments/',
  ];

  // Check if it matches auth-required patterns first
  if (authRequiredPatterns.some((pattern) => path.startsWith(pattern))) {
    return true;
  }

  // Public routes that don't require auth
  // These are checked after auth-required patterns to avoid false matches
  const publicRoutes = [
    '/users/login',
    '/users/refresh',
    '/users/activate/',
    '/users/forgot',
    '/users/reset',
    '/users/unsubscribe',
    '/users/', // General /users/ route (account creation) - public
    '/health',
    '/config/',
    '/congress/', // General congress route is public, but /members/ and /election-dates require auth
    '/civics/',
    '/sys/',
    '/security/',
    '/btc/',
    '/webhooks/',
  ];

  // Check if it's a public route
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return false;
  }

  // Default: assume route requires auth if not explicitly public
  return true;
}

/**
 * Test a single API route
 * @param {Object} route - Route object with method and path
 * @param {string} authToken - Authentication token (optional)
 * @param {string} userId - User ID from authentication (optional)
 * @returns {Promise<Object>} Test result with status and details
 */
async function testRoute(route, authToken = null, userId = null) {
  const testPath = replaceParams(route.fullPath, userId);
  const needsAuth = requiresAuth(route.path);

  try {
    const config = {
      method: route.method.toLowerCase(),
      url: `${BASE_URL}${testPath}`,
      validateStatus: () => true, // Don't throw on any status code
      timeout: 10000, // 10 second timeout (some routes with auth may take longer)
    };

    // Handle binary responses (PDFs, images, etc.)
    // Whitepaper route returns PDF binary data
    if (route.path.includes('.pdf') || route.path.includes('position-paper')) {
      config.responseType = 'arraybuffer';
    }

    // Add custom header to identify route tester requests (for suppressing validation logs)
    // Use lowercase header name to match Express normalization
    config.headers = config.headers || {};
    config.headers['x-route-tester'] = 'true';

    // Add auth token if route requires auth and we have a token
    if (needsAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add minimal body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      config.data = {};
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    // Consider routes "working" if they:
    // - Return 2xx (success)
    // - Return 3xx (redirect - route exists)
    // - Return 400/401/403/422 (validation/auth errors - route exists and responds)
    // - Return 404 only if it's a GET request to a resource that might not exist
    // - Return 5xx (server error - route exists but has issues)
    const isSuccess =
      response.status >= 200 &&
      response.status < 500 &&
      (response.status !== 404 || route.method !== 'GET');

    return {
      success: isSuccess,
      method: route.method,
      path: route.path,
      fullPath: testPath,
      status: response.status,
      duration,
      needsAuth,
      error: isSuccess ? null : `Status ${response.status}`,
      // Store response data for validation analysis
      responseData: response.data,
    };
  } catch (error) {
    // Handle timeout and network errors
    const isTimeout =
      error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const isNetworkError =
      error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';

    return {
      success: false,
      method: route.method,
      path: route.path,
      fullPath: testPath,
      status: null,
      duration: null,
      needsAuth,
      error: isTimeout
        ? 'Timeout'
        : isNetworkError
          ? 'Connection refused'
          : error.message,
    };
  }
}

/**
 * Wait for server to be ready by checking health endpoint
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delay - Delay between attempts in ms
 * @returns {Promise<boolean>} True if server is ready
 */
async function waitForServer(maxAttempts = 10, delay = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, {
        timeout: 1000,
        validateStatus: () => true,
      });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
}

/**
 * Validate that we're using a test database, not production
 * Checks both the environment variable and the actual connected database
 * @returns {boolean} True if using a safe test database
 */
function validateTestDatabase() {
  const mongoose = require('mongoose');

  // Get the actual connected database name
  const connectedDbName = mongoose.connection?.db?.databaseName || '';
  const mongodbUri = process.env.MONGODB_URI || '';

  // Extract database name from URI as fallback
  const uriDbName = mongodbUri.match(/\/([^/?]+)(\?|$)/)?.[1] || '';
  const dbName = connectedDbName || uriDbName;

  // Production database indicators - if found, abort immediately
  const productionIndicators = ['prod', 'production', 'live'];
  const isProductionDb = productionIndicators.some((indicator) =>
    dbName.toLowerCase().includes(indicator)
  );

  if (isProductionDb) {
    logger.error('⚠️  PRODUCTION DATABASE DETECTED! ⚠️');
    logger.error(`Connected database: ${connectedDbName || '(unknown)'}`);
    logger.error(`URI database: ${uriDbName || '(unknown)'}`);
    logger.error('API route tester cannot run against production database.');
    logger.error('');
    logger.error('Solutions:');
    logger.error(
      '  1. Update MONGODB_URI in your .env file to use a test database'
    );
    logger.error(
      '     (Recommended: Use test database for development, production for production)'
    );
    logger.error(
      '  2. Use a database name that does not contain: prod, production, or live'
    );
    logger.error('');
    logger.error('Example test database setup:');
    logger.error('  # Local test database');
    logger.error('  MONGODB_URI=mongodb://127.0.0.1:27017/powerback_test');
    logger.error('');
    logger.error('  # VPS test database');
    logger.error(
      '  MONGODB_URI=mongodb://user:pass@vps-ip:27017/powerback_test?authSource=powerback_test'
    );
    logger.error('');
    logger.error(
      'Note: The API route tester runs automatically on server start.'
    );
    logger.error(
      '      Make sure MONGODB_URI points to a test database for development.'
    );
    return false;
  }

  // Test database indicators - if found, we're good
  const testIndicators = ['test', 'dev', 'development'];
  const isTestDb = testIndicators.some((indicator) =>
    dbName.toLowerCase().includes(indicator)
  );

  if (isTestDb) {
    logger.info(`✓ Using test database: ${dbName}`);
    return true;
  }

  // If database name doesn't clearly indicate test or prod, warn but allow in development
  if (dbName) {
    logger.warn(
      `⚠️  Database name "${dbName}" does not clearly indicate test or production`
    );
    logger.warn('Please ensure this is a test database before proceeding.');
    logger.warn(
      'To be explicit, use a database name containing: test, dev, or development'
    );
  } else {
    logger.warn('⚠️  Could not determine database name from connection');
    logger.warn('Please ensure you are connected to a test database.');
  }

  // In production environment, be strict - require explicit test indicators
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      'Cannot run API route tester in production environment without explicit test database'
    );
    logger.error('Database name must contain: test, dev, or development');
    return false;
  }

  // In development, allow but warn
  logger.warn('Proceeding with caution - ensure this is a test database!');
  return true;
}

/**
 * Test external API health (Congress.gov, OpenFEC, Google Civics)
 * Verifies that external APIs are up and responding to API keys
 * @returns {Promise<Object>} Health check results for each external API
 */
async function testExternalAPIs() {
  logger.info('--- External API Health Checks ---');

  const results = {
    congressGov: { success: false, status: null, error: null, duration: null },
    openFEC: { success: false, status: null, error: null, duration: null },
    googleCivics: { success: false, status: null, error: null, duration: null },
  };

  // Test Congress.gov API
  const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY;
  const CONGRESS_API_BASE_URL =
    process.env.CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3';

  if (CONGRESS_GOV_API_KEY) {
    try {
      const currentSession = session();
      const startTime = Date.now();
      const response = await axios.get(
        `${CONGRESS_API_BASE_URL}/daily-congressional-record/${currentSession}`,
        {
          params: { api_key: CONGRESS_GOV_API_KEY },
          timeout: 10000,
          validateStatus: () => true,
        }
      );
      const duration = Date.now() - startTime;

      results.congressGov = {
        success: response.status >= 200 && response.status < 500,
        status: response.status,
        error: response.status >= 400 ? `HTTP ${response.status}` : null,
        duration,
      };

      if (results.congressGov.success) {
        logger.info(`✓ Congress.gov API: ${response.status} (${duration}ms)`);
      } else {
        logger.warn(`✗ Congress.gov API: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const isTimeout =
        error.code === 'ECONNABORTED' || error.message.includes('timeout');
      results.congressGov = {
        success: false,
        status: null,
        error: isTimeout ? 'Timeout' : error.message,
        duration: null,
      };
      logger.warn(`✗ Congress.gov API: ${results.congressGov.error}`);
    }
  } else {
    logger.warn('⚠ Congress.gov API key not configured (CONGRESS_GOV_API_KEY)');
    results.congressGov.error = 'API key not configured';
  }

  // Test OpenFEC API
  const FEC_API_BASE_URL =
    process.env.FEC_API_CANDIDATES_ENDPOINT.split('/candidates/')[0] ||
    'https://api.open.fec.gov/v1';
  const FEC_API_KEY = process.env.FEC_API_KEY;

  if (FEC_API_KEY) {
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${FEC_API_BASE_URL}/committee/${FEC.COMMITTEE_ID}/filings/`,
        {
          params: {
            page: 1,
            per_page: 20,
            sort: '-receipt_date',
            sort_hide_null: false,
            sort_null_only: false,
            sort_nulls_last: false,
            api_key: FEC_API_KEY,
          },
          timeout: 20000, // Increased timeout for FEC API (may be slow)
          validateStatus: () => true,
        }
      );
      const duration = Date.now() - startTime;

      results.openFEC = {
        success: response.status >= 200 && response.status < 500,
        status: response.status,
        error: response.status >= 400 ? `HTTP ${response.status}` : null,
        duration,
      };

      if (results.openFEC.success) {
        logger.info(`✓ OpenFEC API: ${response.status} (${duration}ms)`);
      } else {
        logger.warn(`✗ OpenFEC API: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const isTimeout =
        error.code === 'ECONNABORTED' || error.message.includes('timeout');
      results.openFEC = {
        success: false,
        status: null,
        error: isTimeout ? 'Timeout' : error.message,
        duration: null,
      };
      logger.warn(`✗ OpenFEC API: ${results.openFEC.error}`);
    }
  } else {
    logger.warn('OpenFEC API key not configured (FEC_API_KEY)');
    results.openFEC.error = 'API key not configured';
  }

  // Test Google Civics API
  const GOOGLE_CIVICS_BASE_URL =
    process.env.GOOGLE_CIVICS_API_ENDPOINT.split('/divisionsByAddress')[0] ||
    'https://civicinfo.googleapis.com/civicinfo/v2';
  const GOOGLE_CIVICS_API_KEY = process.env.GOOGLE_CIVICS_API_KEY;
  if (GOOGLE_CIVICS_API_KEY) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${GOOGLE_CIVICS_BASE_URL}/elections`, {
        params: { key: GOOGLE_CIVICS_API_KEY },
        timeout: 10000,
        validateStatus: () => true,
      });
      const duration = Date.now() - startTime;

      results.googleCivics = {
        success: response.status >= 200 && response.status < 500,
        status: response.status,
        error: response.status >= 400 ? `HTTP ${response.status}` : null,
        duration,
      };

      if (results.googleCivics.success) {
        logger.info(`✓ Google Civics API: ${response.status} (${duration}ms)`);
      } else {
        logger.warn(`✗ Google Civics API: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const isTimeout =
        error.code === 'ECONNABORTED' || error.message.includes('timeout');
      results.googleCivics = {
        success: false,
        status: null,
        error: isTimeout ? 'Timeout' : error.message,
        duration: null,
      };
      logger.warn(`✗ Google Civics API: ${results.googleCivics.error}`);
    }
  } else {
    logger.warn('Google Civics API key not configured (GOOGLE_CIVICS_API_KEY)');
    results.googleCivics.error = 'API key not configured';
  }

  // Summary
  const anyConfigured =
    CONGRESS_GOV_API_KEY || FEC_API_KEY || GOOGLE_CIVICS_API_KEY;

  if (anyConfigured) {
    const successCount = [
      results.congressGov,
      results.openFEC,
      results.googleCivics,
    ].filter((r) => r.success).length;
    const totalCount = [
      CONGRESS_GOV_API_KEY,
      FEC_API_KEY,
      GOOGLE_CIVICS_API_KEY,
    ].filter(Boolean).length;
    logger.info(
      `External API Health: ${successCount}/${totalCount} APIs responding`
    );
  } else {
    logger.warn(
      'No external API keys configured - skipping external API health checks'
    );
  }

  logger.info('✓ External API health checks completed');

  return results;
}

/**
 * Test all internal API routes
 * @returns {Promise<Object>} Test results summary
 */
async function testInternalRoutes() {
  logger.info('=== INTERNAL API ROUTE TESTS STARTING ===');

  // Validate we're using a test database
  if (!validateTestDatabase()) {
    logger.error('API route tester aborted due to database safety check.');
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
      error: 'Production database detected - test aborted for safety',
    };
  }

  // Wait for server to be ready
  logger.info('Waiting for server to be ready...');
  const serverReady = await waitForServer();
  if (!serverReady) {
    logger.error('Server did not become ready in time. Skipping route tests.');
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
      error: 'Server not ready',
    };
  }
  logger.info('Server is ready');

  // Give routes a moment to fully register
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Discover all routes
  logger.info('Discovering API routes...');
  const routes = discoverRoutes(app);

  // Remove duplicates (same method + path)
  const uniqueRoutes = Array.from(
    new Map(routes.map((r) => [`${r.method}:${r.path}`, r])).values()
  );

  if (uniqueRoutes.length === 0) {
    logger.warn('No routes discovered! This might indicate:');
    logger.warn('  1. Routes are not yet registered in the router stack');
    logger.warn('  2. Router structure is different than expected');
    logger.warn(
      '  3. Set DEBUG_ROUTE_DISCOVERY=true to see detailed discovery logs'
    );
    logger.warn('Route discovery will be skipped.');
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
      error: 'No routes discovered',
    };
  }

  logger.info(`Found ${uniqueRoutes.length} unique API routes`);

  // Get auth token and user ID for protected routes
  logger.info('Authenticating with test credentials...');
  const authData = await getAuthToken();
  const authToken = authData?.accessToken || null;
  const userId = authData?.userId || null;

  if (authToken) {
    logger.info('Authentication successful');
    if (userId) {
      logger.info(`Using authenticated user ID: ${userId}`);
    }
  } else {
    logger.warn('Authentication failed - some protected routes may fail tests');
  }

  // Filter out deprecated/admin/external API routes
  // Admin routes are secured with: requireLocalhost + tokenizer.guard() + requireAdmin
  // External API routes make calls to Congress.gov/OpenFEC and may timeout during testing
  const routesToTest = uniqueRoutes.filter((route) => {
    // Remove admin-only routes (require admin privileges + localhost)
    if (route.method === 'POST' && route.path === '/dev/celebrations/seed') {
      return false; // Admin route - requires admin auth
    }
    if (route.method === 'POST' && route.path === '/dev/celebrations/clear') {
      return false; // Admin route - requires admin auth
    }
    // Remove routes that make external API calls (Congress.gov, OpenFEC)
    // These routes may timeout during testing and are not suitable for automated route testing
    if (route.method === 'GET' && route.path === '/congress/members/:pol') {
      return false; // External API: Makes calls to Congress.gov/OpenFEC
    }
    if (route.method === 'GET' && route.path === '/congress/election-dates') {
      return false; // External API: May make external calls for election data
    }
    // Remove position paper route - binary PDF response, better tested manually
    if (
      route.method === 'GET' &&
      (route.path === `${POSITION_PAPER_PATH}` ||
        route.path.includes('position-paper'))
    ) {
      return false; // Binary PDF route - test manually
    }
    return true;
  });

  logger.info(
    `Testing ${routesToTest.length} routes (${
      uniqueRoutes.length - routesToTest.length
    } filtered out)`
  );

  // Test each route
  logger.info('Testing routes...');
  const results = [];

  // Only show per-route logs if verbose or debug mode is enabled
  const showPerRouteLogs =
    process.env.VERBOSE_ROUTE_TESTER === 'true' ||
    process.env.DEBUG_ROUTE_DISCOVERY === 'true';

  for (const route of routesToTest) {
    const result = await testRoute(route, authToken, userId);
    results.push(result);

    // Only log individual route results if verbose/debug mode is enabled
    if (showPerRouteLogs) {
      const statusIcon = result.success ? '✓' : '✗';
      const authIcon = result.needsAuth ? '[AUTH]' : '[PUBLIC]';
      logger.info(
        `${statusIcon} ${authIcon} ${result.method.padEnd(
          6
        )} ${result.path.padEnd(40)} - ${result.status || 'ERROR'} (${
          result.duration || 'N/A'
        }ms)`
      );
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Calculate summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  // Log basic summary (always shown)
  logger.info('=== API ROUTE TEST RESULTS ===');
  logger.info(`Total Routes: ${total}`);
  logger.info(`Passed: ${passed}`);
  logger.info(`Failed: ${failed}`);
  logger.info(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  // Enhanced logging only if VERBOSE_ROUTE_TESTER is set
  const verboseLogging = process.env.VERBOSE_ROUTE_TESTER === 'true';
  if (verboseLogging) {
    // Analyze status code distribution to verify validation responses
    const statusCodes = {};
    results.forEach((r) => {
      if (r.status) {
        statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
      }
    });

    // Categorize responses by expected behavior
    const validationErrors = results.filter((r) =>
      [400, 422].includes(r.status)
    ).length;
    const authErrors = results.filter((r) =>
      [401, 403].includes(r.status)
    ).length;
    const successCodes = results.filter(
      (r) => r.status >= 200 && r.status < 300
    ).length;
    const serverErrors = results.filter((r) => r.status >= 500).length;
    const unexpectedCodes = results.filter(
      (r) =>
        r.status &&
        ![200, 201, 204, 400, 401, 403, 404, 422, 500].includes(r.status)
    ).length;

    logger.info('');
    logger.info('Status Code Distribution:');
    Object.keys(statusCodes)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((code) => {
        logger.info(`  ${code}: ${statusCodes[code]} route(s)`);
      });
    logger.info('');
    logger.info('Response Categories:');
    logger.info(`  ✓ Success (2xx): ${successCodes}`);
    logger.info(
      `  ✓ Validation Errors (400/422): ${validationErrors} (expected for empty body requests)`
    );
    logger.info(
      `  ✓ Auth Errors (401/403): ${authErrors} (expected for protected routes without proper auth)`
    );
    if (serverErrors > 0) {
      logger.warn(
        `  ⚠ Server Errors (5xx): ${serverErrors} (may indicate route issues)`
      );
    }
    if (unexpectedCodes > 0) {
      logger.warn(
        `  ⚠ Unexpected Status Codes: ${unexpectedCodes} (may need investigation)`
      );
      results
        .filter(
          (r) =>
            r.status &&
            ![200, 201, 204, 400, 401, 403, 404, 422, 500].includes(r.status)
        )
        .forEach((r) => {
          logger.warn(`    ${r.method} ${r.path} - Status ${r.status}`);
        });
    }
  }

  // Log failed routes
  if (failed > 0) {
    logger.warn('');
    logger.warn('Failed Routes:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        logger.warn(`  ${r.method} ${r.path} - ${r.error || 'Unknown error'}`);
      });
  }

  logger.info('✓ Internal API route tests completed');

  return {
    total,
    passed,
    failed,
    results,
  };
}

// Export for use in server.js
module.exports = { testInternalRoutes, discoverRoutes, testExternalAPIs };

// If run directly, execute tests
if (require.main === module) {
  testInternalRoutes()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('Test execution failed:', error);
      process.exit(1);
    });
}
