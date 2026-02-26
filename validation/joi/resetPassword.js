const Joi = require('joi');
const { APP } = require('../../constants/app');

const resetPasswordSchema = Joi.object({
  hash: Joi.string().pattern(/^[0-9a-f]{18}$/i),
  newPassword: Joi.string().min(APP.MIN_PASSWORD_LENGTH).required(),
  givenUsername: Joi.string().email().required(),
});

module.exports = resetPasswordSchema;
