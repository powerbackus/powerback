module.exports = {
  SERVER: {
    JWT: {
      AUDIENCE: process.env.JWT_AUDIENCE || 'us.powerback.authenticated-users',
    },
    CRON_SCHEDULES: {
      WEEKDAY_3PM: '0 15 * * 1-5',
    },
    SALT_WORK_FACTOR: parseInt(process.env.SALT_WORK_FACTOR) ?? 10,
    REFRESH_EXPY: 1555200,
    ACCESS_EXPY: 704,
    DEFAULT_PORT: 3001,
    TRUST_PROXY: {
      production: '127.0.0.1',
      development: 'loopback',
    },
    CORS: {
      allowedOrigins: [
        process.env.PROD_URL,
        process.env.DEV_URL,
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://demo.localhost:3000',
        'http://demo.localhost:3001',
        'https://demo.powerback.us',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Device-Id',
        'X-CSRF-Token',
      ],
      credentials: true,
      staticMethods: ['GET'],
      staticAllowedHeaders: ['Content-Type'],
    },
    HELMET: {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        includeSubDomains: true,
        maxAge: 63072000,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: ['self'],
      },
    },
    PDF_HEADERS: {
      cacheControl: 'no-cache, no-store, must-revalidate',
      pragma: 'no-cache',
      expires: '0',
      contentType: 'application/pdf',
    },
  },
};
