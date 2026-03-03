const Joi = require('joi');

/**
 * Validation schema for updating user fields
 * Specifically designed to allow updating tipLimitReached when PAC limit is reached
 */
const userUpdateSchema = Joi.object({
  tipLimitReached: Joi.boolean().valid(true).required(),
  // Add other fields that might be updated in the future
  // isEmployed: Joi.boolean().optional(),
  // phoneNumber: Joi.string().allow('').pattern(/^\+?[0-9\-()\s]+$/).optional(),
  // occupation: Joi.string().allow('').min(1).optional(),
  // firstName: Joi.string().allow('').optional(),
  // employer: Joi.string().allow('').min(1).optional(),
  // lastName: Joi.string().allow('').optional(),
  // passport: Joi.string().allow('').alphanum().min(6).max(9).optional(),
  // address: Joi.string().allow('').min(1).optional(),
  // country: Joi.string().allow('').min(2).optional(),
  // email: Joi.string().allow('').email().optional(),
  // state: Joi.string().allow('').length(2).uppercase().optional(),
  // city: Joi.string().allow('').pattern(/^([A-Za-z\-'\.\s]*)$/).optional(),
  // zip: Joi.string().allow('').pattern(/^[0-9]{5}(-[0-9]{4})?$/).optional(),
  // ocd_id: Joi.string().allow('').pattern(/^ocd-division\/country:[a-zA-Z]+\/state:[a-zA-Z]+\/cd:\d+$/).optional(),
});

module.exports = userUpdateSchema;
