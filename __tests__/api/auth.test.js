const request = require('supertest');
const app = require('../../server');
const { User, Applicant } = require('../../models');
const bcrypt = require('bcryptjs');

jest.mock('../../controller/comms/sendEmail', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../controller/users/account/utils/hash/generate', () => ({
  generate: jest.fn().mockResolvedValue({
    hash: 'abcdef0123456789ab',
    expires: Date.now() + 3600000,
    issueDate: Date.now(),
  }),
}));

describe('Auth API', () => {
  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123',
        err: 0,
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(
        response.body.isSignupHashConfirmed !== false ||
          response.body.username === userData.username
      ).toBe(true);
    });

    it('should return 403 for invalid email (validation)', async () => {
      const userData = {
        username: 'invalid-email',
        password: 'password123',
        err: 0,
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(403);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await Applicant.deleteMany({});
      await User.deleteMany({});
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'test@example.com',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        settings: { unsubscribedFrom: [] },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('username', 'test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/users/login')
        .send({
          username: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
