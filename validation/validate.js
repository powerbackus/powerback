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

module.exports = validate;
