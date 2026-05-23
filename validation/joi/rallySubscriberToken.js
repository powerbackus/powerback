/**
 * @fileoverview Joi validation for rally subscriber confirm/unsubscribe tokens.
 * @module validation/joi/rallySubscriberToken
 */

const Joi = require('joi');

/** {mongoId}.{base64url secret} — id enables lookup; secret verified via bcrypt. */
const TOKEN_PATTERN = /^[a-f0-9]{24}\.[A-Za-z0-9_-]{32,64}$/;

/**
 * @type {import('joi').ObjectSchema}
 */
module.exports = Joi.object({
  token: Joi.string().pattern(TOKEN_PATTERN).required().messages({
    'string.pattern.base': 'Invalid link',
  }),
}).unknown(true);
