/**
 * @fileoverview Joi validation for share link publicCode route param.
 * @module validation/joi/shareLinkPublicCode
 */

const Joi = require('joi');

/** Matches generated base64url codes (~12 chars from 9 bytes). */
const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;

/**
 * Validates GET /api/share-links/:publicCode body-shaped params object.
 * @type {import('joi').ObjectSchema}
 */
module.exports = Joi.object({
  publicCode: Joi.string()
    .pattern(PUBLIC_CODE_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'Invalid share link code',
    }),
}).unknown(true);
