const Joi = require('joi');

const patchPromoteSchema = Joi.object({
  // Form fields for donor tier promotion validation
  isEmployed: Joi.boolean().allow(false),
  phoneNumber: Joi.string().allow(''),
  occupation: Joi.string().allow(''),
  firstName: Joi.string().allow(''),
  lastName: Joi.string().allow(''),
  employer: Joi.string().allow(''),
  passport: Joi.string().allow(''),
  address: Joi.string().allow(''),
  country: Joi.string().allow(''),
  email: Joi.string().allow(''),
  state: Joi.string().allow(''),
  city: Joi.string().allow(''),
  zip: Joi.string().allow(''),
}).unknown(true);

module.exports = patchPromoteSchema;
