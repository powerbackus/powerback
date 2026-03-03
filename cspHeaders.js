/**
 * POWERBACK Content Security Policy
 *
 * Step 1: Lock down API responses only.
 * - Applied only on paths starting with /api
 * - Very strict: no scripts, no styles, no fonts, no frames
 * - Allows outgoing HTTP calls only to the APIs you actually use
 */

const helmet = require('helmet');

const IS_DEV = process.env.NODE_ENV !== 'production';

const localDevSrc = IS_DEV
  ? ['http://localhost:3000', 'ws://localhost:3000']
  : [];

const apiCSP = helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    // API responses are JSON only, so we can be strict
    "default-src": ["'none'"],
    "base-uri": ["'none'"],
    "frame-ancestors": ["'none'"],

    // Outgoing HTTP calls from the backend
    "connect-src": [
      "'self'",
      ...localDevSrc,
      "https://api.stripe.com",
      "https://api.congress.gov",
      "https://api.open.fec.gov",
      "https://civicinfo.googleapis.com",
      "https://api.open.fec.gov",
      "https://merchant-ui-api.stripe.com/"
    ],

    // No inline or external scripts/styles/fonts for API responses
    "script-src": ["'none'"],
    "style-src": ["'none'"],
    "font-src": ["'none'"],
    "img-src": ["'none'"],
    "object-src": ["'none'"],
    "form-action": ["'none'"],
  },
});

const cspMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return apiCSP(req, res, next);
  }
  // For now, do not set CSP for non-API routes here.
  // Nginx controls CSP for the main HTML if you choose to add it later.
  return next();
};

module.exports = cspMiddleware;

