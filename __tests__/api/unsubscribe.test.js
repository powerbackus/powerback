const request = require('supertest');
const app = require('../../server');
const { User } = require('../../models');
const bcrypt = require('bcryptjs');

// API requires hash to be exactly 18 hex chars.
/** Returns an 18-char hex string valid for unsubscribe hash validation. */
function makeUnsubscribeHash() {
  return Array.from({ length: 18 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

describe('Unsubscribe API', () => {
  let testUser;
  let unsubscribeHash;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const expires = new Date(Date.now() + 3600000);
    unsubscribeHash = makeUnsubscribeHash();

    testUser = await User.create({
      username: 'test@example.com',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      unsubscribeHash,
      unsubscribeHashExpires: expires,
      unsubscribeHashIssueDate: new Date(),
      settings: {
        unsubscribedFrom: [],
      },
    });
  });

  describe('GET /api/users/unsubscribe/:hash', () => {
    it('should verify valid unsubscribe hash', async () => {
      const response = await request(app)
        .get(`/api/users/unsubscribe/${unsubscribeHash}`)
        .expect(200);

      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('isExpired', false);
    });

    it('should reject invalid unsubscribe hash', async () => {
      const response = await request(app)
        .get('/api/users/unsubscribe/invalid-hash')
        .expect(200);

      expect(response.body).toHaveProperty('isValid', false);
      expect(response.body).toHaveProperty('isExpired', false);
    });

    it('should reject expired unsubscribe hash', async () => {
      // Set hash to expired
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago
      await User.updateOne(
        { _id: testUser._id },
        {
          $set: {
            unsubscribeHashExpires: expiredDate,
          },
        }
      );

      const response = await request(app)
        .get(`/api/users/unsubscribe/${unsubscribeHash}`)
        .expect(200);

      expect(response.body).toHaveProperty('isValid', false);
      expect(response.body).toHaveProperty('isExpired', true);
    });
  });

  describe('POST /api/users/unsubscribe', () => {
    it('should unsubscribe from topic with valid hash', async () => {
      const response = await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: unsubscribeHash,
          topic: 'districtUpdates',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const updatedUser = await User.findOne({ username: 'test@example.com' });
      expect(updatedUser.settings.unsubscribedFrom).toContain(
        'districtUpdates'
      );

      expect(updatedUser.unsubscribeHash).toBeNull();
      expect(updatedUser.unsubscribeHashExpires).toBeNull();
      expect(updatedUser.unsubscribeHashIssueDate).toBeNull();
    });

    it('should not duplicate topic in unsubscribedFrom array', async () => {
      await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: unsubscribeHash,
          topic: 'electionUpdates',
        })
        .expect(200);

      const newExpires = new Date(Date.now() + 3600000);
      const newHash = makeUnsubscribeHash();
      await User.updateOne(
        { _id: testUser._id },
        {
          $set: {
            unsubscribeHash: newHash,
            unsubscribeHashExpires: newExpires,
            unsubscribeHashIssueDate: new Date(),
          },
        }
      );

      await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: newHash,
          topic: 'electionUpdates',
        })
        .expect(200);

      const updatedUser = await User.findOne({ username: 'test@example.com' });
      const count = updatedUser.settings.unsubscribedFrom.filter(
        (t) => t === 'electionUpdates'
      ).length;
      expect(count).toBe(1);
    });

    it('should reject invalid hash', async () => {
      // Invalid format fails Joi (403); valid format but not in DB returns 400 from controller
      const response = await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: 'invalid-hash',
          topic: 'districtUpdates',
        })
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject expired hash', async () => {
      const expiredDate = new Date(Date.now() - 3600000);
      await User.updateOne(
        { _id: testUser._id },
        { $set: { unsubscribeHashExpires: expiredDate } }
      );

      const response = await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: unsubscribeHash,
          topic: 'districtUpdates',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle multiple topics', async () => {
      await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: unsubscribeHash,
          topic: 'districtUpdates',
        })
        .expect(200);

      const newExpires = new Date(Date.now() + 3600000);
      const newHash = makeUnsubscribeHash();
      await User.updateOne(
        { _id: testUser._id },
        {
          $set: {
            unsubscribeHash: newHash,
            unsubscribeHashExpires: newExpires,
            unsubscribeHashIssueDate: new Date(),
          },
        }
      );

      await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: newHash,
          topic: 'electionUpdates',
        })
        .expect(200);

      const updatedUser = await User.findOne({ username: 'test@example.com' });
      expect(updatedUser.settings.unsubscribedFrom).toContain(
        'districtUpdates'
      );
      expect(updatedUser.settings.unsubscribedFrom).toContain(
        'electionUpdates'
      );
    });

    it('should require topic parameter', async () => {
      const response = await request(app)
        .post('/api/users/unsubscribe')
        .send({
          hash: unsubscribeHash,
        })
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });
});
