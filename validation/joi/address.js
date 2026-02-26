const Joi = require('joi');

const addressSchema = Joi.object({
  address: Joi.string().min(5).max(200).required(), // freeform user input
});

module.exports = addressSchema;
