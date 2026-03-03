const Joi = require('joi');

const electionDatesSchema = Joi.object({
  // Optional query parameters for filtering election dates
  state: Joi.string().length(2).uppercase().optional(),
  year: Joi.number().integer().min(2026).max(2100).optional(),
}).unknown(false);

module.exports = electionDatesSchema;
