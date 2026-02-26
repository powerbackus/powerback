const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/; // MongoDB ObjectID

// Donor info is optional; each field can be empty to support lower tiers
const donorInfoSchema = Joi.object({
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  state: Joi.string().length(2).uppercase().allow('').optional(),
  zip: Joi.string().allow('').optional(),
  country: Joi.string().allow('').default('United States'),
  passport: Joi.string().allow('').optional(),
  isEmployed: Joi.boolean().optional(),
  occupation: Joi.string().allow('').optional(),
  employer: Joi.string().allow('').optional(),
  compliance: Joi.string().allow('').required(),
  email: Joi.string().email().allow('').optional(),
  username: Joi.string().allow('').required(),
  phoneNumber: Joi.string().allow('').optional(),
  ocd_id: Joi.string().allow('').optional(),
  locked: Joi.boolean().optional(),
  understands: Joi.boolean().required(),
  validationFlags: Joi.object({
    isFlagged: Joi.boolean().optional(),
    summary: Joi.object({
      totalFlags: Joi.number().optional(),
    }).optional(),
    flags: Joi.array()
      .items(
        Joi.object({
          field: Joi.string().optional(),
          reason: Joi.string().optional(),
          match: Joi.string().optional(),
          originalValue: Joi.string().optional(),
        })
      )
      .optional(),
    validatedAt: Joi.date().optional(),
    validationVersion: Joi.string().optional(),
  }).optional(),
}).optional();

// Inline receipt payload must include donation and at least one recipient identifier
const inlineReceiptPayload = Joi.object({
  donatedBy: Joi.string().pattern(objectIdPattern).required(),
  donation: Joi.number().positive().required(),
  tip: Joi.number().min(0).required(),
  fee: Joi.number().min(0).required(),
  // recipient identifiers (require at least one)
  pol_name: Joi.string().allow('').optional(),
  pol_id: Joi.string().allow('').required(),
  FEC_id: Joi.string().allow('').required(),
  // optional bill association
  bill_id: Joi.string().allow('').required(),
  // misc optional metadata
  payment_intent: Joi.string().allow('').optional(),
  idempotencyKey: Joi.string().allow('').required(),
  donorInfo: donorInfoSchema,
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().optional(),
})
  .or('pol_id', 'FEC_id', 'pol_name') // at least one recipient identifier required
  .unknown(true);

// Two paths: either reference an existing celebration, or provide minimal inline data
const receiptSchema = Joi.alternatives().try(
  Joi.object({
    celebrationId: Joi.string().pattern(objectIdPattern).required(),
  }).unknown(false),
  inlineReceiptPayload
);

module.exports = receiptSchema;
