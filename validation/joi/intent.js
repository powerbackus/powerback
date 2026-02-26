// joi/intent.js

const Joi = require('joi');

const intentSchema = Joi.object({
  idempotencyKey: Joi.string().length(21).required(),
  payment_method: Joi.string()
    .pattern(/^pm_[a-zA-Z0-9]+$/)
    .optional(),
});

module.exports = intentSchema;
