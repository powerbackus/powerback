/**
 * Server Configuration Builders
 *
 * Helper functions to build server configuration objects from constants.
 * Part of the server startup workflow - builds CORS, security headers, and other
 * Express configuration from centralized constants.
 */

const urlJoin = require('url-join').default;
const { SERVER } = require('../constants');

/**
 * Create CORS options for API routes
 * @param {boolean} isProductionEnv - Whether running in production
 * @returns {Object} CORS configuration object
 */
function createCorsOptions(isProductionEnv) {
  const normalizeOrigin = (url) => url.replace(/\/$/, '');

  const ORIGIN = process.env.ORIGIN;
  const PORT = process.env.PORT ?? SERVER.DEFAULT_PORT;

  const allowedOrigins = [
    ...SERVER.CORS.allowedOrigins,
    ...new Set([
      urlJoin(ORIGIN, '/'),
      urlJoin(
        isProductionEnv
          ? ORIGIN.replace('https://', 'https://www.')
          : process.env.DEV_URL,
        '/'
      ),
      urlJoin(`http://localhost:${PORT}`, '/'),
      urlJoin(`http://127.0.0.1:${PORT}`, '/'),
    ]),
  ].map(normalizeOrigin);

  return {
    credentials: SERVER.CORS.credentials,
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      // Allow demo subdomain (e.g. demo.powerback.us, demo.localhost)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.startsWith('demo.')) {
          return callback(null, true);
        }
      } catch {
        // ignore invalid origin URL
      }
      // Fallback: allow if origin string contains known demo hostnames
      if (
        typeof origin === 'string' &&
        (origin.includes('demo.localhost') || origin.includes('demo.powerback'))
      ) {
        return callback(null, true);
      }
      callback(new Error(`${origin} not allowed by CORS`));
    },
    methods: SERVER.CORS.methods,
    allowedHeaders: SERVER.CORS.allowedHeaders,
    preflightContinue: false, // Let CORS handle preflight, don't pass to next middleware
    optionsSuccessStatus: 204, // Return 204 for successful OPTIONS requests
  };
}

/**
 * Create CORS options for static files (more permissive)
 * @returns {Object} Static file CORS configuration
 */
function createStaticCorsOptions() {
  return {
    origin: true,
    methods: SERVER.CORS.staticMethods,
    allowedHeaders: SERVER.CORS.staticAllowedHeaders,
  };
}

/**
 * Create Helmet configuration
 * @returns {Object} Helmet configuration object
 */
function createHelmetConfig() {
  return SERVER.HELMET;
}

/**
 * Set PDF response headers (no-cache, content-type, etc.)
 * @param {Object} res - Express response object
 * @param {string} filename - PDF filename for Content-Disposition header
 */
function setPdfHeaders(res, filename) {
  res.setHeader('Pragma', SERVER.PDF_HEADERS.pragma);
  res.setHeader('Expires', SERVER.PDF_HEADERS.expires);
  res.setHeader('Content-Type', SERVER.PDF_HEADERS.contentType);
  res.setHeader('Cache-Control', SERVER.PDF_HEADERS.cacheControl);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  // Disable ETag and Last-Modified to prevent 304 responses
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
}

/**
 * Get trust proxy setting based on environment
 * @param {boolean} isProductionEnv - Whether running in production
 * @returns {string} Trust proxy value
 */
function getTrustProxy(isProductionEnv) {
  return isProductionEnv
    ? SERVER.TRUST_PROXY.production
    : SERVER.TRUST_PROXY.development;
}

module.exports = {
  createStaticCorsOptions,
  createHelmetConfig,
  createCorsOptions,
  getTrustProxy,
  setPdfHeaders,
};
