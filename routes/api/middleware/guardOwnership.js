/**
 * @fileoverview Ownership guard middleware for API route protection
 *
 * This middleware enforces self-only access to user resources by ensuring
 * that users can only access their own data. It compares the authenticated
 * user's ID with the target resource ID and blocks access if they don't match.
 *
 * Features:
 * - Flexible target ID extraction via custom function
 * - Automatic user authentication validation
 * - Configurable ID comparison logic
 * - Standardized 403 Forbidden responses
 *
 * @module routes/api/middleware/guardOwnership
 */

/**
 * Creates an ownership guard middleware function
 *
 * This factory function returns a middleware that enforces resource ownership
 * by ensuring the authenticated user can only access their own resources.
 *
 * The middleware extracts the target resource ID using the provided function
 * (or a default that looks for req.params.userId) and compares it with the
 * authenticated user's ID from req.jwt.payload.sub.
 *
 * @param {Function} [getTargetId=(req) => req.params.userId] - Function to extract target ID from request
 * @returns {Function} Express middleware function
 *
 * @example
 * ```javascript
 * // Default usage - protects routes with :userId parameter
 * const guardOwnership = require('./middleware/guardOwnership');
 *
 * router.get('/users/:userId/profile',
 *   guardOwnership(),
 *   (req, res) => { /* handle request *\/ }
 * );
 *
 * // Custom target ID extraction
 * router.get('/celebrations/:celebrationId',
 *   guardOwnership((req) => req.params.celebrationId),
 *   (req, res) => { /* handle request *\/ }
 * );
 *
 * // With custom ID extraction logic
 * router.get('/posts/:postId',
 *   guardOwnership((req) => {
 *     // Extract user ID from post ID or other logic
 *     return extractUserIdFromPostId(req.params.postId);
 *   }),
 *   (req, res) => { /* handle request *\/ }
 * );
 * ```
 */

module.exports =
  (getTargetId = (req) => req.params.userId) =>
  (req, res, next) => {
    // Get user ID from JWT token
    const userId = req.jwt?.payload?.sub;
    const targetId = getTargetId(req);

    if (!userId || String(userId) !== String(targetId)) {
      return res.sendStatus(403); // Forbidden
    }
    next();
  };
