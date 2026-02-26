const Joi = require('joi');

const contactInfoSchema = Joi.object({
  isEmployed: Joi.boolean().optional(),
  phoneNumber: Joi.string()
    .allow('')
    .pattern(/^\+?[0-9\-()\s]+$/),
  occupation: Joi.string().allow('').min(1).optional(),
  firstName: Joi.string().allow('').optional(),
  employer: Joi.string().allow('').min(1).optional(),
  lastName: Joi.string().allow('').optional(),
  passport: Joi.string().allow('').alphanum().min(6).max(9).optional(),
  address: Joi.string().allow('').min(1).optional(),
  country: Joi.string().allow('').min(2).optional(),
  email: Joi.string().allow('').email(),
  state: Joi.string().allow('').length(2).uppercase().optional(),
  city: Joi.string()
    .allow('')
    .pattern(/^([A-Za-z\-'.\s]*)$/)
    .optional(),
  zip: Joi.string()
    .allow('')
    .min(2)
    .max(20)
    .pattern(/^[A-Za-z0-9\s\-.]+$/)
    .optional(),
  ocd_id: Joi.string()
    .allow('')
    .pattern(/^ocd-division\/country:[a-zA-Z]+\/state:[a-zA-Z]+\/cd:\d+$/)
    .optional(),
});

module.exports = contactInfoSchema;
