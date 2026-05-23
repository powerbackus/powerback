const logger = require('../services/utils/logger')(__filename);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    // Suppress validation error logs for API route tester requests
    // The tester intentionally sends empty bodies to verify routes exist
    // Use req.get() which is case-insensitive and handles Express header normalization
    const isRouteTester = req.get('x-route-tester') === 'true';
    
    if (!isRouteTester) {
      logger.warn('Validation error:', error);
    }
    return res.status(403).json({
      message: 'Validation error',
      details: error.details
        .map((d) => d.message)
        .reduce((a, b) => a + ' ' + b),
    });
  }

  req.body = value;
  next();
};

/**
 * Validate an arbitrary payload (params object, etc.) and return coerced value.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema
 * @param {unknown} data - Data to validate
 * @returns {unknown} Validated value
 * @throws {Error} With status 403 when validation fails
 */
function validatePayload(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    const err = new Error(
      error.details.map((d) => d.message).join(' ')
    );
    err.status = 403;
    throw err;
  }

  return value;
}

validate.validatePayload = validatePayload;

module.exports = validate;
