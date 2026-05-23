const validateMiddleware = require('./validate');

module.exports = {
  validate: validateMiddleware,
  validatePayload: validateMiddleware.validatePayload,
  ...require('./joi'),
};
