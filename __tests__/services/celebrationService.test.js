const {
  getDistrictForCandidate,
  getUsersInDistrict,
  getUsersWithActiveCelebration,
  cancelCelebrationsForCandidate,
} = require('../../services/celebration/dataService');
const { User, Celebration, Pol } = require('../../models');

// Mock external dependencies
jest.mock('../../controller/comms/sendEmail');

describe('CelebrationService', () => {
  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Celebration.deleteMany({});
    await Pol.deleteMany({});
  });

  describe('getDistrictForCandidate', () => {
    it('should return district info for a valid candidate', async () => {
      // Create a test politician with required fields
      const testPol = await Pol.create({
        id: 'T123456',
        bioguideId: 'T123456',
        state: 'CA',
        district: '12',
        roles: [
          {
            fec_candidate_id: 'T123456',
            state: 'CA',
            district: '12',
          },
        ],
      });

      const result = await getDistrictForCandidate('T123456');

      expect(result).toEqual({
        state: 'CA',
        district: '12',
      });
    });

    it('should throw error for non-existent candidate', async () => {
      await expect(getDistrictForCandidate('NONEXISTENT')).rejects.toThrow(
        'Pol record not found for ID NONEXISTENT'
      );
    });
  });

  describe('getUsersInDistrict', () => {
    it('should return users in a specific district', async () => {
      // Create test users with required fields
      await User.create([
        {
          username: 'user1',
          password: 'password123',
          email: 'user1@test.com',
          ocd_id: 'ocd-division/country:us/state:ca/cd:12',
        },
        {
          username: 'user2',
          password: 'password123',
          email: 'user2@test.com',
          ocd_id: 'ocd-division/country:us/state:ca/cd:12',
        },
        {
          username: 'user3',
          password: 'password123',
          email: 'user3@test.com',
          ocd_id: 'ocd-division/country:us/state:ny/cd:01',
        },
      ]);

      const users = await getUsersInDistrict({
        state: 'CA',
        district: '12',
      });

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.email)).toContain('user1@test.com');
      expect(users.map((u) => u.email)).toContain('user2@test.com');
    });
  });

  describe('getUsersWithActiveCelebration', () => {
    it('should return users with active celebrations for a candidate', async () => {
      // Create test users and celebrations
      const user1 = await User.create({
        username: 'user1',
        password: 'password123',
        email: 'user1@test.com',
      });
      const user2 = await User.create({
        username: 'user2',
        password: 'password123',
        email: 'user2@test.com',
      });

      await Celebration.create([
        {
          donatedBy: user1._id,
          FEC_id: 'T123456',
          current_status: 'active',
          resolved: false,
          defunct: false,
          paused: false,
          fee: 1.0,
          tip: 0.5,
          pol_id: 'T123456',
          bill_id: 'HR123',
          donation: 10.0,
          pol_name: 'Test Politician',
          idempotencyKey: 'test-key-1',
          donorInfo: { compliance: 'compliant' },
        },
        {
          donatedBy: user2._id,
          FEC_id: 'T123456',
          current_status: 'defunct',
          resolved: false,
          defunct: true,
          paused: false,
          fee: 1.0,
          tip: 0.5,
          pol_id: 'T123456',
          bill_id: 'HR123',
          donation: 10.0,
          pol_name: 'Test Politician',
          idempotencyKey: 'test-key-2',
          donorInfo: { compliance: 'guest' },
        },
      ]);

      const users = await getUsersWithActiveCelebration('T123456');

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('user1@test.com');
    });
  });

  describe('cancelCelebrationsForCandidate', () => {
    it('should cancel all active celebrations for a candidate', async () => {
      // Create test users and celebrations
      const user1 = await User.create({
        username: 'user1',
        password: 'password123',
        email: 'user1@test.com',
      });
      const user2 = await User.create({
        username: 'user2',
        password: 'password123',
        email: 'user2@test.com',
      });

      await Celebration.create([
        {
          donatedBy: user1._id,
          FEC_id: 'T123456',
          current_status: 'active',
          resolved: false,
          defunct: false,
          paused: false,
          fee: 1.0,
          tip: 0.5,
          pol_id: 'T123456',
          bill_id: 'HR123',
          donation: 10.0,
          pol_name: 'Test Politician',
          idempotencyKey: 'test-key-3',
          donorInfo: { compliance: 'compliant' },
        },
        {
          donatedBy: user2._id,
          FEC_id: 'T123456',
          current_status: 'active',
          resolved: false,
          defunct: false,
          paused: false,
          fee: 1.0,
          tip: 0.5,
          pol_id: 'T123456',
          bill_id: 'HR123',
          donation: 10.0,
          pol_name: 'Test Politician',
          idempotencyKey: 'test-key-4',
          donorInfo: { compliance: 'guest' },
        },
      ]);

      await cancelCelebrationsForCandidate('T123456');

      const activeCelebrations = await Celebration.find({
        FEC_id: 'T123456',
        defunct: false,
        resolved: false,
        current_status: 'active',
      });

      expect(activeCelebrations).toHaveLength(0);
    });
  });
});
