import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  DonationLimitsProvider,
  useDonationLimits,
} from '../../contexts/DonationLimitsContext';
import {
  ComplianceTierProvider,
  type ComplianceTier,
} from '../../contexts/ComplianceTierContext';

/**
 * Narrow mock: avoids jest.requireActual on the contexts barrel (circular deps
 * via DonationLimitsContext importing from '.').
 */
jest.mock('../../contexts/ElectionCycleContext', () => {
  const actual = jest.requireActual(
    '../../contexts/ElectionCycleContext'
  ) as typeof import('../../contexts/ElectionCycleContext');
  return {
    ...actual,
    useElectionCycle: () => ({
      currentCycle: {
        currentElectionType: null,
        isInElectionCycle: false,
        nextElectionDate: null,
        cycleStartDate: new Date('2026-01-01'),
        cycleEndDate: new Date('2026-12-31'),
      },
      isLoading: false,
      currentState: null,
      currentPolId: 'test-pol-id',
      setElectionCyclePolitician: jest.fn(),
      recalculateCycle: jest.fn(),
    }),
  };
});

/**
 * Barrel imports load AuthContext, which expects INIT from @CONSTANTS — keep actual
 * exports and override FEC tiers only for these assertions.
 */
jest.mock('../../constants', () => {
  const actual = jest.requireActual('../../constants');
  return {
    ...actual,
    FEC: {
      ...actual.FEC,
      COMPLIANCE_TIERS: {
        ...actual.FEC.COMPLIANCE_TIERS,
        guest: {
          ...(actual.FEC.COMPLIANCE_TIERS?.guest ?? {}),
          perDonationLimit: () => 50,
          annualCap: () => 200,
        },
        compliant: {
          ...(actual.FEC.COMPLIANCE_TIERS?.compliant ?? {}),
          perDonationLimit: () => 3500,
          perElectionLimit: () => 3500,
        },
      },
    },
  };
});

// Map test tier names (bronze/silver/gold) to context ComplianceTier (guest/compliant)
const toComplianceTier = (tier: string): ComplianceTier =>
  tier === 'gold' ? 'compliant' : 'guest';

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  complianceTier?: string;
}> = ({ children, complianceTier = 'bronze' }) => (
  <ComplianceTierProvider userCompliance={toComplianceTier(complianceTier)}>
    <DonationLimitsProvider
      userDonations={[]}
      tipLimitReached={false}
    >
      {children}
    </DonationLimitsProvider>
  </ComplianceTierProvider>
);

// Helper function to create wrapper with proper typing
const createWrapper =
  (complianceTier: string) =>
  ({ children }: { children: React.ReactNode }) => (
    <TestWrapper complianceTier={complianceTier}>{children}</TestWrapper>
  );

describe('DonationLimitsContext', () => {
  describe('Bronze Tier', () => {
    it('should return per-donation limit when amount exceeds $50', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('bronze'),
      });

      const limitInfo = result.current.getLimitInfo(100, 0, 0);
      expect(limitInfo).toEqual({
        limitType: 'per-donation',
        amount: 50,
        scope: 'per donation',
        message: 'You cannot donate more than $50 in a single transaction.',
      });
    });

    it('should return annual cap limit when total exceeds $200', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('bronze'),
      });

      /* Guest branch checks per-donation before annual — keep amount ≤ $50 cap */
      const limitInfo = result.current.getLimitInfo(50, 151, 0);
      expect(limitInfo).toEqual({
        limitType: 'annual-cap',
        amount: 200,
        scope: 'total annual cap',
        message:
          'This donation would exceed your $200 annual cap across all candidates.',
      });
    });
  });

  describe('Silver Tier', () => {
    it('should return per-donation limit when amount exceeds guest cap', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('silver'),
      });

      const limitInfo = result.current.getLimitInfo(100, 0, 0);
      expect(limitInfo).toEqual({
        limitType: 'per-donation',
        amount: 50,
        scope: 'per donation',
        message: 'You cannot donate more than $50 in a single transaction.',
      });
    });

    it('should return annual cap limit when total exceeds $200', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('silver'),
      });

      /* Guest branch checks per-donation before annual — keep amount ≤ $50 cap */
      const limitInfo = result.current.getLimitInfo(50, 151, 0);
      expect(limitInfo).toEqual({
        limitType: 'annual-cap',
        amount: 200,
        scope: 'total annual cap',
        message:
          'This donation would exceed your $200 annual cap across all candidates.',
      });
    });
  });

  describe('Gold Tier', () => {
    it('should return per-election limit when amount exceeds $3500', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('gold'),
      });

      const limitInfo = result.current.getLimitInfo(4000, 0, 0);
      expect(limitInfo).toEqual({
        limitType: 'per-donation',
        amount: 3500,
        scope: 'per candidate per election',
        message: 'You cannot donate more than $3500 in a single transaction.',
      });
    });

    it('should return per-election limit when total exceeds $3500', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('gold'),
      });

      const limitInfo = result.current.getLimitInfo(1000, 0, 2501);
      expect(limitInfo).toEqual({
        limitType: 'per-election',
        amount: 3500,
        scope: 'per candidate per election',
        message:
          'This donation would exceed your $3500 limit for this candidate in this election.',
      });
    });

    it('should handle the specific case that was failing (gold user with $1000 already donated, trying $2501)', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('gold'),
      });

      const limitInfo = result.current.getLimitInfo(2501, 0, 1000);
      expect(limitInfo).toEqual({
        limitType: 'per-election',
        amount: 3500,
        scope: 'per candidate per election',
        message:
          'This donation would exceed your $3500 limit for this candidate in this election.',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle fallback case for gold tier', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('gold'),
      });

      // Mock a scenario where we don't have specific limit info
      const limitInfo = result.current.getLimitInfo(999999, 0, 0);
      expect(limitInfo.scope).toBe('per candidate per election');
    });

    it('should handle fallback case for bronze tier', () => {
      const { result } = renderHook(() => useDonationLimits(), {
        wrapper: createWrapper('bronze'),
      });

      // Mock a scenario where we don't have specific limit info
      const limitInfo = result.current.getLimitInfo(999999, 0, 0);
      expect(limitInfo.scope).toBe('per donation');
    });
  });
});
