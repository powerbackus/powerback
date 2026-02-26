/**
 * User field increment utility module
 *
 * This module provides functionality to increment numeric fields in user
 * documents. Used for tracking attempt counts and other counter fields.
 *
 * @module controller/users/password/utils/increment
 * @exports {Object} Field increment functions
 */

module.exports = {
  /**
   * Increments a numeric field in a user document
   *
   * This function increments a specified numeric field in a user document
   * using MongoDB's $inc operator. Used for tracking password attempt counts
   * and other counter fields.
   *
   * @param {Object} userDocument - The user document to update
   * @param {string} field - The field name to increment (e.g., 'tryPasswordAttempts')
   * @param {Object} model - The database model for user operations
   * @returns {Promise<number>} - The field value after increment (if successful)
   *
   * @example
   * ```javascript
   * const { increment } = require('./controller/users/password/utils/increment');
   * const newValue = await increment(userDocument, 'tryPasswordAttempts', UserModel);
   * ```
   */
  increment: async (userDocument, field, model) => {
    const incremented = await model.updateOne(userDocument, {
      $inc: {
        [field]: 1,
      },
    });
    if (incremented) {
      return userDocument.tryPasswordAttempts;
    }
  },
};
