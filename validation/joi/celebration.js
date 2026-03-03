const Joi = require('joi');
const objectIdPattern = /^[0-9a-fA-F]{24}$/; // MongoDB ObjectID

const celebrationSchema = Joi.object({
  donatedBy: Joi.string().pattern(objectIdPattern).required(),
  donation: Joi.number().positive().required(),
  fee: Joi.number().positive().optional(),
  idempotencyKey: Joi.string().required(),
  payment_intent: Joi.string().optional(),
  tip: Joi.number().min(0).optional(),
  pol_name: Joi.string().optional(),
  bill_id: Joi.string().required(),
  FEC_id: Joi.string().optional(),
  pol_id: Joi.string().optional(),

  // Donor information with validation flags
  donorInfo: Joi.object({
    firstName: Joi.string().default(''),
    lastName: Joi.string().default(''),
    address: Joi.string().default(''),
    city: Joi.string().default(''),
    state: Joi.string().default(''),
    zip: Joi.string().default(''),
    country: Joi.string().default('United States'),
    passport: Joi.string().default(''),
    isEmployed: Joi.boolean().default(false),
    occupation: Joi.string().default(''),
    employer: Joi.string().default(''),
    compliance: Joi.string().required(),
    email: Joi.string().default(''),
    username: Joi.string().default(''),
    phoneNumber: Joi.string().default(''),
    ocd_id: Joi.string().default(''),
    locked: Joi.boolean().default(false),
    understands: Joi.boolean().default(false),

    // Validation flags
    validationFlags: Joi.object({
      isFlagged: Joi.boolean().default(false),
      summary: Joi.object({
        totalFlags: Joi.number().default(0),
      }),
      flags: Joi.array()
        .items(
          Joi.object({
            field: Joi.string().required(),
            reason: Joi.string().required(),
            match: Joi.string().required(),
            originalValue: Joi.string().required(),
          })
        )
        .default([]),
      validatedAt: Joi.date().default(Date.now),
      validationVersion: Joi.string().default('1.0'),
    }).optional(),
  }).optional(),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

module.exports = celebrationSchema;
