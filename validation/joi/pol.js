const Joi = require('joi');

// Congress.gov and Bioguide IDs are typically one uppercase letter + 6 digits
const polSchema = Joi.object({
  pol: Joi.string()
    .pattern(/^[A-Z]\d{6}$/)
    .required(),
  /** Headshot pipeline: missing bundled webp, or local + Congress JPG both failed */
  report: Joi.string()
    .valid('missing_local_webp', 'no_usable_image')
    .optional(),
});

module.exports = polSchema;
