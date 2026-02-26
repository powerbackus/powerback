// joi/paymentMethod.js

const Joi = require('joi');

const paymentMethodSchema = Joi.object({
  payment_method: Joi.string()
    .pattern(/^pm_[a-zA-Z0-9]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid payment method ID format',
      'any.required': 'Payment method ID is required',
    }),
  idempotencyKey: Joi.string().length(21).required(),
});

module.exports = paymentMethodSchema;
