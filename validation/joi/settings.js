const Joi = require('joi');
const { emailTopics } = require('../../shared');
const { EMAIL_TOPICS } = emailTopics;

const settingsSchema = Joi.object({
  settings: Joi.object({
    emailReceipts: Joi.boolean().optional(),
    showToolTips: Joi.boolean().optional(),
    autoTweet: Joi.boolean().optional(),
    unsubscribedFrom: Joi.array()
      .items(Joi.string().valid(...Object.values(EMAIL_TOPICS)))
      .optional(),
  })
    .min(1) // Require at least one field to be present
    .required()
    .unknown(false), // Don't allow unknown fields for security
});

module.exports = settingsSchema;
