/**
 * @fileoverview Optional inbound share referral publicCode for signup body validation.
 * @module validation/joi/refShareCode
 */

const Joi = require('joi');

/**
 * Optional refShareCode on POST /api/users (from client pb:refShareCode).
 * Not used on activate URLs.
 * @type {import('joi').StringSchema}
 */
const refShareCodeField = Joi.string()
  .pattern(/^[A-Za-z0-9_-]{10,24}$/)
  .messages({
    'string.pattern.base': 'Invalid share link code',
  });

module.exports = {
  refShareCodeField,
};
