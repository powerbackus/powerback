/**
 * User privileges controller module
 *
 * This module consolidates all user privilege management functions including
 * compliance tier management, user certification, empowerment, and promotion.
 * It serves as the main entry point for all privilege-related operations.
 *
 * Privilege management includes:
 * - Compliance tier determination and updates
 * - User certification and empowerment
 * - Account promotion based on form completion
 * - FEC compliance validation
 *
 * @module controller/users/account/privileges
 * @exports {Object} User privilege management functions
 */

const { promote } = require('./promote'),
  { certify } = require('./certify'),
  { empower } = require('./empower'),
  { deem } = require('./deem');

/**
 * User privileges controller exports
 *
 * @exports {Object} User privilege management functions
 * @property {Function} deem - Deem user compliance tier
 * @property {Function} certify - Certify user understanding of terms
 * @property {Function} empower - Empower user with full account access
 * @property {Function} promote - Promote user to higher compliance tier
 */
module.exports = { deem, certify, empower, promote };
