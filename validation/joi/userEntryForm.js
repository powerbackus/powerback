const Joi = require('joi');
const { APP } = require('../../constants/app');

const { refShareCodeField } = require('./refShareCode');

const userEntryFormSchema = Joi.object({
  username: Joi.string().email().required(),
  password: Joi.string().min(APP.MIN_PASSWORD_LENGTH).required(),
  err: Joi.number().integer().required(),
  refShareCode: refShareCodeField.optional(),
}).unknown(true);

module.exports = userEntryFormSchema;
