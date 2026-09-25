jest.mock('../services/logger', () => ({
  requireLogger: jest.fn(),
}));

const { requireLogger } = require('../services/logger');

const logger = { error: jest.fn() };
requireLogger.mockReturnValue(logger);

const { notifyFrontendError } = require('../controller/sys/notifyFrontendError');

describe('notifyFrontendError', () => {
  beforeEach(() => {
    logger.error.mockClear();
  });

  test('logs safe frontend diagnostic metadata', () => {
    const req = {
      body: {
        message: 'Auth initialization error',
        context: 'AuthContext.initAuth',
        extra: {
          status: 500,
          accessToken: 'sensitive-token',
        },
      },
      get: jest.fn(() => undefined),
      ip: '127.0.0.1',
      method: 'POST',
      path: '/errors/frontend',
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    notifyFrontendError(req, res);

    const [, metadata] = logger.error.mock.calls[0];

    expect(metadata.context).toMatchObject({
      clientContext: 'AuthContext.initAuth',
      httpStatus: 500,
    });

    expect(JSON.stringify(metadata)).not.toContain('sensitive-token');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
