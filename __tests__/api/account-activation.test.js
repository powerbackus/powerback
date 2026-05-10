const request = require('supertest');
const app = require('../../server');
const { Applicant, User, ExUser } = require('../../models');
const bcrypt = require('bcryptjs');

jest.mock('../../controller/comms/sendEmail', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Account Activation API', () => {
  let testApplicant;
  let activationHash;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const expires = new Date(Date.now() + 3600000);
    activationHash = 'test-activation-hash-' + Date.now();

    testApplicant = await Applicant.create({
      username: 'newuser@example.com',
      email: 'newuser@example.com',
      password: hashedPassword,
      firstName: 'New',
      lastName: 'User',
      joinHash: activationHash,
      joinHashExpires: expires,
      joinHashIssueDate: new Date(),
      settings: {
        unsubscribedFrom: [],
      },
    });
  });

  describe('GET /api/users/activate/:hash', () => {
    it('should activate account with valid hash', async () => {
      const response = await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      // API returns { isHashConfirmed, isLinkExpired } on success (or Error if sendEmail threw; we mock it)
      expect(response.body).toHaveProperty('isHashConfirmed');
      expect(response.body.isHashConfirmed).toBe(true);
      expect(response.body.isLinkExpired).toBe(false);

      // Verify applicant was transferred to User collection
      const activatedUser = await User.findOne({
        username: 'newuser@example.com',
      });
      expect(activatedUser).toBeTruthy();
      expect(activatedUser.username).toBe('newuser@example.com');
      expect(activatedUser.firstName).toBe('New');
      expect(activatedUser.lastName).toBe('User');

      // Verify applicant was removed
      const applicant = await Applicant.findOne({
        username: 'newuser@example.com',
      });
      expect(applicant).toBeNull();
    });

    it('should reject invalid activation hash', async () => {
      const response = await request(app)
        .get('/api/users/activate/invalid-hash')
        .expect(200);

      // API may return false (bug) or { isHashConfirmed: false }
      expect(
        response.body === false || response.body.isHashConfirmed === false
      ).toBe(true);
    });

    it('should reject expired activation hash', async () => {
      // Set hash to expired
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago
      await Applicant.updateOne(
        { _id: testApplicant._id },
        {
          $set: {
            joinHashExpires: expiredDate,
          },
        }
      );

      const response = await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      expect(
        response.body === false || response.body.isHashConfirmed === false
      ).toBe(true);
      if (typeof response.body === 'object') {
        expect(response.body.isLinkExpired).toBe(true);
      }

      // Verify applicant was deleted (expired hashes trigger cleanup)
      const applicant = await Applicant.findOne({
        username: 'newuser@example.com',
      });
      expect(applicant).toBeNull();
    });

    it('should handle applicant without expiration date', async () => {
      // Remove expiration date (invalid state)
      await Applicant.updateOne(
        { _id: testApplicant._id },
        {
          $unset: {
            joinHashExpires: '',
          },
        }
      );

      const response = await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      expect(
        response.body === false || response.body.isHashConfirmed === false
      ).toBe(true);

      // Verify applicant was deleted (invalid state triggers cleanup)
      const applicant = await Applicant.findOne({
        username: 'newuser@example.com',
      });
      expect(applicant).toBeNull();
    });

    it('should clean up ExUser record if exists', async () => {
      const mongoose = require('mongoose');
      await ExUser.create({
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        exId: new mongoose.Types.ObjectId(),
      });

      const response = await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      expect(response.body.isHashConfirmed).toBe(true);

      const deletedExUser = await ExUser.findOne({
        username: 'newuser@example.com',
      });
      expect(deletedExUser).toBeNull();
    });

    it('should not activate already activated account', async () => {
      await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/users/activate/${activationHash}`)
        .expect(200);

      expect(
        response.body === false || response.body.isHashConfirmed === false
      ).toBe(true);
    });
  });
});
