/**
 * Admin user configuration
 *
 * Add user IDs to this array to grant admin privileges.
 * These users can access dev routes and other admin functions.
 *
 * Security: Keep this list minimal and review regularly.
 */

const ADMIN_USER_IDS = [
  '68da4e43d3e2273ff6171cd4', // dev@powerback.us, prod
  '697ba78e86591fc07128836d', // dev@powerback.us, dev
  // Add your user ID here
  // Example: '507f1f77bcf86cd799439011',
];

/**
 * Check if a user ID has admin privileges
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is admin
 */
function isAdmin(userId) {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(String(userId));
}

/**
 * Get list of all admin user IDs
 * @returns {string[]} Array of admin user IDs
 */
function getAdminUserIds() {
  return [...ADMIN_USER_IDS];
}

module.exports = { isAdmin, getAdminUserIds };
