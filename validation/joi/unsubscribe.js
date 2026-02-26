const Joi = require('joi');
const { emailTopics } = require('../../shared');
const { EMAIL_TOPICS } = emailTopics;

const unsubscribeSchema = Joi.object({
  hash: Joi.string()
    .pattern(/^[0-9a-f]{18}$/i)
    .required(),
  topic: Joi.string()
    .valid(...Object.values(EMAIL_TOPICS))
    .required(),
});

module.exports = unsubscribeSchema;
