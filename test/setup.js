const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Connect to the in-memory database before running tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Disconnect any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, {
    dbName: 'test-db-' + Date.now(), // Ensure unique test database
  });

  // Verify we're connected to the test database
  console.log(
    'Connected to test database:',
    mongoose.connection.db.databaseName
  );
});

// Clear all data between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Disconnect and stop mongod after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SERVER_SESSION_SECRET = 'test-secret';
process.env.STRIPE_SK_TEST = 'sk_test_mock';
process.env.TWILIO_ACCOUNT_SID = 'test-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.PORT = '3002'; // Use different port for tests

// Disable background jobs during tests
process.env.DISABLE_JOBS = 'true';

// Disable token store cleanup during tests
process.env.DISABLE_TOKEN_CLEANUP = 'true';
