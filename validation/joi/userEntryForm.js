const Joi = require('joi');
const { APP } = require('../../constants/app');

const userEntryFormSchema = Joi.object({
  username: Joi.string().email().required(),
  password: Joi.string().min(APP.MIN_PASSWORD_LENGTH).required(),
  err: Joi.number().integer().required(),
});

module.exports = userEntryFormSchema;
