const Joi = require('joi');

const patchResolveSchema = Joi.object({
  resolved: Joi.boolean().valid(true).required(),
}).unknown(false);

module.exports = patchResolveSchema;
