const { createProxyMiddleware } = require('http-proxy-middleware');

const POSITION_PAPER_PATH =
  process.env.REACT_APP_POSITION_PAPER_PATH || 'position-paper.pdf';

module.exports = function (app) {
  // Suppress HPM proxy logs in development with no-op logger
  const logProvider =
    process.env.NODE_ENV === 'development'
      ? () => ({
          debug: () => {},
          error: () => {},
          info: () => {},
          warn: () => {},
        })
      : undefined;

  const proxyOptions = {
    target: 'http://localhost:3001',
    changeOrigin: true,
  };

  if (logProvider) {
    proxyOptions.logProvider = logProvider;
  }

  // Proxy /position-paper.pdf to backend
  app.use(`/${POSITION_PAPER_PATH}`, createProxyMiddleware(proxyOptions));

  // Proxy all /api requests to backend
  app.use('/api', createProxyMiddleware(proxyOptions));
};
