/**
 * Joi schema for contributing inquiry form submission
 * @module validation/joi/contributing
 */

const Joi = require('joi');

const contributingSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().required(),
  email: Joi.string().email().required(),
  githubUrl: Joi.string().uri().allow('').optional(),
  message: Joi.string().max(2000).allow('').optional(),
});

module.exports = contributingSchema;
