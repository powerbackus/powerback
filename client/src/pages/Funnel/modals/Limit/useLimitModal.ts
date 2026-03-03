import { useMemo } from 'react';
import {
  type LimitInfo,
  type ComplianceInfo,
  type ComplianceTier,
  useDonationLimits,
  useComplianceTier,
} from '@Contexts';

/**
 * Props for the useLimitModal hook
 */
interface UseLimitModalProps {
  /** Amount user tried to donate */
  attemptedAmount: number;
  /** Current election total for specific candidate (for compliant tier) */
  currentElectionTotal?: number;
  /** Current annual total for guest tier */
  currentAnnualTotal?: number;
}

/**
 * Return values from the useLimitModal hook
 */
interface UseLimitModalReturn {
  /** Detailed information about which limit was hit */
  limitInfo: LimitInfo;
  /** Compliance info for current tier */
  complianceInfo: ComplianceInfo;
  /** Current user compliance tier */
  userCompliance: ComplianceTier;
  /** Whether user has minimal compliance (not guest) */
  hasMinimalCompliance: boolean;
}

/**
 * Custom hook for limit modal business logic
 *
 * Extracts the complex limit calculation and compliance logic from the LimitModal component.
 * Provides pure data that the component can use for rendering.
 *
 * @param props - Hook configuration including amounts and limit types
 * @returns Object containing limit info, compliance data, and calculated values
 */
export const useLimitModal = ({
  attemptedAmount,
  currentElectionTotal = 0,
  currentAnnualTotal = 0,
}: UseLimitModalProps): UseLimitModalReturn => {
  const { getLimitInfo } = useDonationLimits();
  const { complianceInfo, userCompliance } = useComplianceTier();

  /**
   * Calculate detailed limit information based on attempted donation
   */
  const limitInfo = useMemo(
    () =>
      getLimitInfo(
        attemptedAmount,
        currentAnnualTotal,
        currentElectionTotal
      ),
    [
      getLimitInfo,
      attemptedAmount,
      currentAnnualTotal,
      currentElectionTotal,
    ]
  );

  /**
   * Determine if user has minimal compliance (not guest tier)
   */
  const hasMinimalCompliance = useMemo(
    () => userCompliance !== 'guest',
    [userCompliance]
  );

  return {
    limitInfo,
    complianceInfo,
    userCompliance,
    hasMinimalCompliance,
  };
};
