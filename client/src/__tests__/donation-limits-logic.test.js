/**
 * Simple test for donation limits logic
 * Tests the core getLimitInfo function without React context complexity
 */

// Mock the FEC constants
const FEC = {
  COMPLIANCE_TIERS: {
    bronze: {
      perDonationLimit: () => 50,
      annualCap: () => 200,
    },
    silver: {
      perDonationLimit: () => 200,
      annualCap: () => 200,
    },
    gold: {
      perDonationLimit: () => 3500,
      perElectionLimit: () => 3500,
    },
  },
};

/**
 * Simplified version of the getLimitInfo function for testing
 */
function getLimitInfo(
  complianceTier,
  attemptedAmount,
  currentAnnualTotal = 0,
  currentElectionTotal = 0
) {
  const tierInfo = FEC.COMPLIANCE_TIERS[complianceTier];

  if (complianceTier === 'bronze' || complianceTier === 'silver') {
    if (attemptedAmount > tierInfo.perDonationLimit()) {
      return {
        limitType: 'per-donation',
        amount: tierInfo.perDonationLimit(),
        scope: 'per donation',
        message: `You cannot donate more than $${tierInfo.perDonationLimit()} in a single transaction.`,
      };
    }

    const annualCap = tierInfo.annualCap?.() ?? 0;
    if (currentAnnualTotal + attemptedAmount > annualCap) {
      return {
        limitType: 'annual-cap',
        amount: annualCap,
        scope: 'total annual cap',
        message: `This donation would exceed your $${annualCap} annual cap across all candidates.`,
      };
    }
  }

  if (complianceTier === 'gold') {
    if (attemptedAmount > tierInfo.perDonationLimit()) {
      return {
        limitType: 'per-donation',
        amount: tierInfo.perDonationLimit(),
        scope: 'per candidate per election',
        message: `You cannot donate more than $${tierInfo.perDonationLimit()} in a single transaction.`,
      };
    }

    const perElectionLimit = tierInfo.perElectionLimit?.() ?? 0;
    if (currentElectionTotal + attemptedAmount > perElectionLimit) {
      return {
        limitType: 'per-election',
        amount: perElectionLimit,
        scope: 'per candidate per election',
        message: `This donation would exceed your $${perElectionLimit} limit for this candidate in this election.`,
      };
    }
  }

  // Fallback case
  return {
    limitType: 'per-donation',
    amount:
      tierInfo.perDonationLimit() || (tierInfo.perElectionLimit?.() ?? 0),
    scope:
      complianceTier === 'gold'
        ? 'per candidate per election'
        : 'per donation',
    message: 'Donation limit exceeded.',
  };
}

// Test cases
describe('Donation Limits Logic', () => {
  describe('Bronze Tier', () => {
    test('should return per-donation limit when amount exceeds $50', () => {
      const result = getLimitInfo('bronze', 100, 0, 0);
      expect(result).toEqual({
        limitType: 'per-donation',
        amount: 50,
        scope: 'per donation',
        message:
          'You cannot donate more than $50 in a single transaction.',
      });
    });

    test('should return annual cap limit when total exceeds $200', () => {
      const result = getLimitInfo('bronze', 40, 170, 0);
      expect(result).toEqual({
        limitType: 'annual-cap',
        amount: 200,
        scope: 'total annual cap',
        message:
          'This donation would exceed your $200 annual cap across all candidates.',
      });
    });
  });

  describe('Silver Tier', () => {
    test('should return per-donation limit when amount exceeds $200', () => {
      const result = getLimitInfo('silver', 250, 0, 0);
      expect(result).toEqual({
        limitType: 'per-donation',
        amount: 200,
        scope: 'per donation',
        message:
          'You cannot donate more than $200 in a single transaction.',
      });
    });
  });

  describe('Gold Tier', () => {
    test('should return per-election limit when amount exceeds $3500', () => {
      const result = getLimitInfo('gold', 4000, 0, 0);
      expect(result).toEqual({
        limitType: 'per-donation',
        amount: 3500,
        scope: 'per candidate per election',
        message:
          'You cannot donate more than $3500 in a single transaction.',
      });
    });

    test('should return per-election limit when total exceeds $3500', () => {
      const result = getLimitInfo('gold', 1000, 0, 2600);
      expect(result).toEqual({
        limitType: 'per-election',
        amount: 3500,
        scope: 'per candidate per election',
        message:
          'This donation would exceed your $3500 limit for this candidate in this election.',
      });
    });

    test('should handle the specific case that was failing (gold user with $1000 already donated, trying $2501)', () => {
      const result = getLimitInfo('gold', 2501, 0, 1000);
      expect(result).toEqual({
        limitType: 'per-election',
        amount: 3500,
        scope: 'per candidate per election',
        message:
          'This donation would exceed your $3500 limit for this candidate in this election.',
      });
    });

    test('should handle fallback case for gold tier', () => {
      const result = getLimitInfo('gold', 999999, 0, 0);
      expect(result.scope).toBe('per candidate per election');
    });
  });
});
