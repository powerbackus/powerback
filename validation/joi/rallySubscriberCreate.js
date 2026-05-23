/**
 * @fileoverview Joi validation for POST /api/rally-subscribers.
 * @module validation/joi/rallySubscriberCreate
 */

const Joi = require('joi');

const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;

/**
 * @type {import('joi').ObjectSchema}
 */
module.exports = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email address',
  }),
  source_public_code: Joi.string()
    .pattern(PUBLIC_CODE_PATTERN)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid source code',
    }),
}).unknown(false);
