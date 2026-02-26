const Joi = require('joi');
const { APP } = require('../../constants');

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(APP.MIN_PASSWORD_LENGTH).required(),
});

module.exports = changePasswordSchema;
