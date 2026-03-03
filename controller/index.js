/**
 * @fileoverview Main Controller Module
 *
 * This module serves as the central export point for all controller modules
 * in the POWERBACK application. It consolidates controllers from all domains
 * (celebrations, congress, payments, civics, comms, users) into a single
 * importable interface.
 *
 * CONTROLLER MODULES
 *
 * celebrations
 * - Celebration creation, resolution, receipt generation
 * - Celebration queries and data access
 *
 * congress
 * - Politician data and queries
 * - Bill lookups
 * - Campaign cycle calculations
 *
 * payments
 * - Stripe payment intent creation
 * - Payment method management
 * - Setup intent creation
 *
 * civics
 * - Address validation
 * - Congressional district lookup
 *
 * comms
 * - Email sending
 * - Unsubscribe management
 *
 * users
 * - User account management
 * - Password operations
 * - FEC compliance validation
 * - User privileges
 *
 * USAGE
 * ```javascript
 * const Controller = require('./controller');
 * const user = await Controller.users.contact(userId, UserModel);
 * const celebration = await Controller.celebrations.create(req, res, Celebration);
 * ```
 *
 * @module controller
 * @requires ./celebrations
 * @requires ./congress
 * @requires ./payments
 * @requires ./civics
 * @requires ./comms
 * @requires ./users
 */

module.exports = {
  celebrations: require('./celebrations'),
  congress: require('./congress'),
  payments: require('./payments'),
  civics: require('./civics'),
  comms: require('./comms'),
  users: require('./users'),
};
