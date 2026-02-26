const Joi = require('joi');

// Congress.gov and Bioguide IDs are typically one uppercase letter + 6 digits
const polSchema = Joi.object({
  pol: Joi.string()
    .pattern(/^[A-Z]\d{6}$/)
    .required(),
});

module.exports = polSchema;
