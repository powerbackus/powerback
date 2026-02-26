/**
 * @fileoverview Main API router that combines all route modules
 *
 * This module serves as the central hub for all API routes in the POWERBACK.us application.
 * It imports and mounts individual route modules under their respective path prefixes,
 * providing a clean separation of concerns while maintaining a unified API structure.
 *
 * Route Structure:
 * - /api/btc - address generation
 * - /api/dev - Dev-only routes
 * - /api/sys - System utilities and constants
 * - /api/users - User authentication, account management, and profile operations
 * - /api/civics - Civic data and address validation
 * - /api/congress - Congressional data and election information
 * - /api/payments - Payment processing and Stripe integration
 * - /api/webhooks - External service webhooks (Stripe, etc.)
 * - /api/celebrations - Donation celebration management
 *
 * @module routes/api/index
 * @requires express
 * @requires ./celebrations
 * @requires ./webhooks
 * @requires ./payments
 * @requires ./congress
 * @requires ./config
 * @requires ./civics
 * @requires ./users
 * @requires ./btc
 * @requires ./dev
 * @requires ./sys
 
 */

const router = require('express').Router();

const celebrationRoutes = require('./celebrations'),
  congressRoutes = require('./congress'),
  securityRoutes = require('./security'),
  webhooksRoutes = require('./webhooks'),
  paymentRoutes = require('./payments'),
  contactRoutes = require('./contact'),
  civicsRoutes = require('./civics'),
  configRoutes = require('./config'),
  userRoutes = require('./users'),
  btcRoutes = require('./btc'),
  devRoutes = require('./dev'),
  sysRoutes = require('./sys');

// Health check endpoint
router.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const health = {
    status: dbStatus === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    security: {
      xContentTypeOptions: 'enabled',
      referrerPolicy: 'enabled',
      xFrameOptions: 'enabled',
      hsts: 'enabled',
      csp: 'enabled',
    },
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Mount all route modules under their respective prefixes
router
  .use('/celebrations', celebrationRoutes)
  .use('/congress', congressRoutes)
  .use('/security', securityRoutes)
  .use('/webhooks', webhooksRoutes)
  .use('/payments', paymentRoutes)
  .use('/contact', contactRoutes)
  .use('/civics', civicsRoutes)
  .use('/config', configRoutes)
  .use('/users', userRoutes)
  .use('/btc', btcRoutes)
  .use('/dev', devRoutes)
  .use('/sys', sysRoutes);

module.exports = router;
