/**
 * Donation limits context. PAC/guest limits, tip limit, limit modals.
 * @module DonationLimitsContext
 */
import {
  useMemo,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';
import {
  useAuth,
  useDialogue,
  useElectionCycle,
  useComplianceTier,
  useDonationState,
  type ComplianceTier,
} from '.';
import { FEC } from '@CONSTANTS';
import { logError, logWarn } from '@Utils';
import type { Celebration } from '@Types';

type ResetType = 'annual' | 'election_cycle';

/**
 * Type definition for FEC compliance tier information
 * Matches the structure defined in constants.js
 *
 * Type assertion prevents linter errors when accessing
 * optional properties like annualCap and perElectionLimit
 */
interface FECTierInfo {
  annualCap?: () => number;
  perDonationLimit: () => number;
  perElectionLimit?: () => number;
  resetTime: 'midnight_est' | 'election_date';
  resetType: ResetType;
  description: string;
  scope: string;
}

type LimitType = 'per-donation' | 'annual-cap' | 'per-election';

/**
 * Information about a specific limit that was exceeded
 * Used by limit validation functions to provide detailed error information
 * @interface LimitInfo
 * @property {LimitType} limitType - Type of limit that was hit
 * @property {string} message - User-friendly message explaining the limit
 * @property {number} amount - The limit amount that was exceeded
 * @property {string} scope - Human-readable description of the limit scope
 */
export interface LimitInfo {
  limitType: LimitType;
  message: string;
  amount: number;
  scope: string;
}

/**
 * Effective limits calculation result
 */
export interface EffectiveLimits {
  complianceTier: ComplianceTier;
  resetType: ResetType;
  resetDate: Date | null;
  effectiveLimit: number;
  remainingLimit: number;
  nextResetDate: Date | null;
  resetTime: 'midnight_est' | 'hourly';
}

/**
 * Donation limits context values interface
 * Provides access to donation limit calculations and validation
 */
interface DonationLimitsValues {
  /** Effective limits calculation */
  effectiveLimits: EffectiveLimits;
  /** Suggested donation amounts */
  suggestedAmounts: number[];
  /** PAC limit information for tip validation */
  pacLimitData: {
    pacLimit: number;
    currentPACTotal: number;
    pacLimitExceeded: boolean;
    remainingPACLimit: number;
  };
  /** Whether TipAsk should be skipped due to PAC limit reached */
  shouldSkipTipAsk: boolean;
}

/**
 * Donation limits context actions interface
 * Provides methods for donation limit operations
 */
interface DonationLimitsActions {
  /** Check if a donation would exceed any applicable limits */
  wouldExceedLimits: (
    attemptedAmount: number,
    currentAnnualTotal?: number,
    currentElectionTotal?: number
  ) => boolean;
  /** Get detailed information about which limit was hit */
  getLimitInfo: (
    attemptedAmount: number,
    currentAnnualTotal?: number,
    currentElectionTotal?: number
  ) => LimitInfo;
  /** Trigger donation limit recalculation (no-op for API compatibility) */
  setDonationLimit: () => void;
  /** Show PAC limit confirmation dialog with data */
  showPACLimitConfirm: (data: {
    attemptedAmount: number;
    currentPACTotal: number;
    pacLimit: number;
    remainingPACLimit: number;
    message: string;
  }) => void;
  /** Hide PAC limit confirmation dialog */
  hidePACLimitConfirm: () => void;
  /** Set tipLimitReached to true when user hits PAC limit */
  setTipLimitReached: () => Promise<void>;
  /** Open donation limit modal with current effective limits (donation cap, not PAC) */
  openDonationLimitModal: () => void;
  /** Remaining amount user can donate (min of per-donation and remaining cap) given current totals */
  getRemainingDonationLimit: (
    currentAnnualTotal: number,
    currentElectionTotal: number
  ) => number;
}

/**
 * Props for DonationLimitsProvider component
 */
interface DonationLimitsProviderProps {
  /** Current user data */
  userDonations: Celebration[];
  /** Whether user has hit PAC limit and cannot give more tips */
  tipLimitReached: boolean;
  /** Child components */
  children: ReactNode;
}

/**
 * Donation Limits Context
 * Manages donation limit calculations and validation
 *
 * Responsibilities:
 * - Donation limit calculations with annual and election cycle resets
 * - Limit validation and error messaging
 * - Suggested donation amounts
 * - Integration with compliance tier and election cycle contexts
 * - PAC limit confirmation dialogs and callbacks
 *
 * PACLimitContext functionality merged into this context to reduce
 * complexity and provide unified donation limit management
 */
const DonationLimitsContext = createContext<
  DonationLimitsValues & DonationLimitsActions
>({
  effectiveLimits: {
    complianceTier: 'guest',
    effectiveLimit: 0,
    remainingLimit: 0,
    resetDate: null,
    nextResetDate: null,
    resetTime: 'midnight_est',
    resetType: 'annual',
  },
  suggestedAmounts: [],
  pacLimitData: {
    pacLimit: 5000,
    currentPACTotal: 0,
    pacLimitExceeded: false,
    remainingPACLimit: 5000,
  },
  shouldSkipTipAsk: false,
  wouldExceedLimits: () => false,
  getLimitInfo: () => ({
    amount: 0,
    scope: 'per donation',
    limitType: 'per-donation',
    message: 'Donation limit exceeded.',
  }),
  setDonationLimit: () => logWarn('setDonationLimit called outside provider'),
  showPACLimitConfirm: () =>
    logWarn('showPACLimitConfirm called outside provider'),
  hidePACLimitConfirm: () =>
    logWarn('hidePACLimitConfirm called outside provider'),
  setTipLimitReached: async () => {
    logWarn('setTipLimitReached called outside provider');
    return Promise.resolve();
  },
  openDonationLimitModal: () =>
    logWarn('openDonationLimitModal called outside provider'),
  getRemainingDonationLimit: () => 0,
});

/**
 * Check if annual reset should occur (midnight EST on Dec 31st/Jan 1st)
 */
const shouldAnnualReset = (date: Date): boolean => {
  const estOffset = -5; // EST is UTC-5
  const utcDate = new Date(date);
  const estDate = new Date(utcDate.getTime() + estOffset * 60 * 60 * 1000);

  const month = estDate.getUTCMonth();
  const day = estDate.getUTCDate();
  const hour = estDate.getUTCHours();

  return (
    (month === 11 && day === 31 && hour >= 0) ||
    (month === 0 && day === 1 && hour < 24)
  );
};

/**
 * Donation Limits Provider Component
 * Manages donation limit calculations and validation
 *
 * Features:
 * - Donation limit management with annual and election cycle resets
 * - Compliant tier election cycle calculations
 * - Suggested donation amounts
 * - Limit validation and error messaging
 * - PAC limit confirmation dialogs and callbacks
 *
 * @param tipLimitReached - Whether user has hit PAC limit and cannot give * more tips
 * @param userDonations - Current user donation history
 * @param children - Child components needing donation limits context
 *
 * PAC limit data is passed to modals via DialogueContext when shown.
 */
export const DonationLimitsProvider = ({
  tipLimitReached,
  userDonations,
  children,
}: DonationLimitsProviderProps) => {
  // Get compliance tier data from ComplianceTierContext
  const { userCompliance } = useComplianceTier();

  // Get election cycle data from ElectionCycleContext
  const { currentCycle } = useElectionCycle();

  // Get current politician ID directly from DonationStateContext instead of ElectionCycleContext
  const { selectedPol } = useDonationState();

  // Get dialogue context for modal management
  const { setShowModal, setModalData } = useDialogue();

  // Get current user ID from auth context
  const { userData } = useAuth();

  /**
   * Calculate effective limits based on compliance tier and reset status
   */
  const effectiveLimits = useMemo((): EffectiveLimits => {
    // Use userCompliance for donation limits (actual stored tier from database)
    // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
    const safeCompliance: ComplianceTier =
      userCompliance === 'guest' || userCompliance === 'compliant'
        ? userCompliance
        : 'guest';
    const tierInfo = FEC.COMPLIANCE_TIERS[safeCompliance] as FECTierInfo;

    if (!tierInfo) {
      // Ultimate fallback - use guest tier info
      const fallbackTierInfo = FEC.COMPLIANCE_TIERS.guest as FECTierInfo;
      if (!fallbackTierInfo) {
        // If even guest doesn't exist, return minimal safe defaults
        return {
          complianceTier: 'guest',
          resetTime: 'midnight_est',
          resetType: 'annual',
          nextResetDate: null,
          resetDate: null,
          effectiveLimit: 0,
          remainingLimit: 0,
        };
      }
      return {
        complianceTier: 'guest',
        resetTime: fallbackTierInfo.resetTime as 'midnight_est' | 'hourly',
        resetType: fallbackTierInfo.resetType as ResetType,
        nextResetDate: null,
        resetDate: null,
        effectiveLimit: 0,
        remainingLimit: 0,
      };
    }

    const currentDate = new Date();

    const result: EffectiveLimits = {
      complianceTier: safeCompliance,
      resetTime: tierInfo.resetTime as 'midnight_est' | 'hourly',
      resetType: tierInfo.resetType as ResetType,
      nextResetDate: null,
      resetDate: null,
      effectiveLimit: 0,
      remainingLimit: 0,
    };

    if (tierInfo.resetType === 'annual') {
      // Guest: Annual reset at midnight EST on Dec 31st/Jan 1st
      const currentYear = currentDate.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const annualCap = tierInfo.annualCap?.() ?? 0;

      if (shouldAnnualReset(currentDate)) {
        result.effectiveLimit = annualCap;
        result.remainingLimit = annualCap;
        result.resetDate = startOfYear;
        result.nextResetDate = new Date(currentYear + 1, 0, 1);
      } else {
        const donationsThisYear = (
          Array.isArray(userDonations) ? userDonations : []
        ).filter((d: Celebration) => {
          if (d.defunct || d.paused) return false;
          // For FEC compliance, count all donations (including escrowed ones)
          // since the money is committed when the donation is made
          const donationDate = new Date(d.createdAt as unknown as string);
          return donationDate >= startOfYear && donationDate <= endOfYear;
        });

        const totalDonatedThisYear = donationsThisYear.reduce(
          (sum: number, d: Celebration) => sum + (d.donation || 0),
          0
        );

        result.effectiveLimit = annualCap;
        // Guest: cap by per-donation limit so DonationInput and Limit modal use $50, not annual cap
        const remainingAnnual = Math.max(0, annualCap - totalDonatedThisYear);
        result.remainingLimit = Math.min(
          tierInfo.perDonationLimit(),
          remainingAnnual
        );
        result.resetDate = startOfYear;
        result.nextResetDate = new Date(currentYear + 1, 0, 1);
      }
    } else if (tierInfo.resetType === 'election_cycle') {
      // Compliant: Per-election limit - use election cycle data from ElectionCycleProvider
      // Use constants directly for consistency with other tiers
      const perDonationLimit = tierInfo.perDonationLimit();
      const perElectionLimit = tierInfo.perElectionLimit?.() ?? 0;

      // Calculate remaining limit based on user's donation history
      // For Compliant tier, we need to consider donations to this specific candidate
      // Simplified approach: count all donations to this candidate (election cycle logic is complex)
      const donationsThisCycle = (
        Array.isArray(userDonations) ? userDonations : []
      ).filter((d: Celebration) => {
        if (d.defunct || d.paused) return false;
        // Compliant tier limit applies per candidate - filter by pol_id
        if (selectedPol && d.pol_id !== selectedPol) return false;
        // For FEC compliance, count all donations (including escrowed ones)
        // since the money is committed when the donation is made
        return true;
      });

      const totalDonatedThisCycle = donationsThisCycle.reduce(
        (sum: number, d: Celebration) => sum + (d.donation || 0),
        0
      );

      result.effectiveLimit = perDonationLimit;
      result.remainingLimit = Math.max(
        0,
        perElectionLimit - totalDonatedThisCycle
      );
      result.resetDate = currentCycle.cycleStartDate;
      result.nextResetDate = currentCycle.cycleEndDate;
    }

    return result;
  }, [userCompliance, userDonations, currentCycle, selectedPol]);

  // Suggested donation amounts for each compliance tier
  const TIER_SUGGESTIONS: Record<ComplianceTier, number[]> = useMemo(
    () => ({
      guest: [2, 5, 10, 25, 50],
      compliant: [100, 250, 500, 1000, 3500],
    }),
    []
  );

  // Derived suggestions based on effective limits and compliance
  const suggestedAmounts = useMemo<number[]>(() => {
    // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
    const safeCompliance: ComplianceTier = TIER_SUGGESTIONS[userCompliance]
      ? userCompliance
      : 'guest';
    const baseSuggestions = TIER_SUGGESTIONS[safeCompliance] || [
      2, 5, 10, 25, 50,
    ];

    // For Compliant tier, cap suggestions to remaining limit per candidate
    if (safeCompliance === 'compliant') {
      return baseSuggestions
        .map((suggestion) =>
          Math.min(suggestion, effectiveLimits.remainingLimit)
        )
        .filter((amount) => amount > 0); // Remove zero amounts
    }

    // For Guest tier, cap to remaining annual limit
    if (safeCompliance === 'guest') {
      return baseSuggestions
        .map((suggestion) =>
          Math.min(suggestion, effectiveLimits.remainingLimit)
        )
        .filter((amount) => amount > 0); // Remove zero amounts
    }

    return baseSuggestions;
  }, [TIER_SUGGESTIONS, userCompliance, effectiveLimits.remainingLimit]);

  // Calculate PAC limit information for tip validation
  const pacLimitData = useMemo(() => {
    if (!userDonations) {
      return {
        pacLimit: FEC.PAC_ANNUAL_LIMIT,
        currentPACTotal: 0,
        pacLimitExceeded: false,
        remainingPACLimit: FEC.PAC_ANNUAL_LIMIT,
      };
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Calculate current year PAC contributions (tips only)
    const tipsThisYear = (
      Array.isArray(userDonations) ? userDonations : []
    ).filter((d: Celebration) => {
      if (d.resolved || d.defunct || d.paused) return false;
      const donationDate = new Date(d.createdAt || new Date());
      return donationDate >= startOfYear && donationDate <= endOfYear;
    });

    const currentPACTotal = tipsThisYear
      .map((d) => d.tip || 0)
      .reduce((a, b) => a + b, 0);

    const pacLimit = FEC.PAC_ANNUAL_LIMIT;
    const pacLimitExceeded = currentPACTotal >= pacLimit;
    const remainingPACLimit = Math.max(0, pacLimit - currentPACTotal);

    return {
      pacLimit,
      currentPACTotal,
      pacLimitExceeded,
      remainingPACLimit,
    };
  }, [userDonations]);

  /**
   * Determine what type of limit was hit and generate appropriate message
   */
  const getLimitInfo = useCallback(
    (
      attemptedAmount: number,
      currentAnnualTotal: number = 0,
      currentElectionTotal: number = 0
    ): LimitInfo => {
      // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
      const safeCompliance: ComplianceTier = FEC.COMPLIANCE_TIERS[
        userCompliance
      ]
        ? userCompliance
        : 'guest';
      const tierInfo = FEC.COMPLIANCE_TIERS[safeCompliance] as FECTierInfo;

      if (!tierInfo) {
        // Ultimate fallback
        const fallbackTierInfo = FEC.COMPLIANCE_TIERS.guest as FECTierInfo;
        return {
          limitType: 'per-donation',
          amount: fallbackTierInfo.perDonationLimit(),
          scope: 'per donation',
          message: 'Donation limit exceeded.',
        };
      }

      if (safeCompliance === 'guest') {
        if (attemptedAmount > tierInfo.perDonationLimit()) {
          return {
            scope: 'per donation',
            limitType: 'per-donation',
            amount: tierInfo.perDonationLimit(),
            message: `You cannot donate more than $${tierInfo.perDonationLimit()} in a single transaction.`,
          };
        }

        const annualCap = tierInfo.annualCap?.() ?? 0;
        if (currentAnnualTotal + attemptedAmount > annualCap) {
          return {
            amount: annualCap,
            limitType: 'annual-cap',
            scope: 'total annual cap',
            message: `This donation would exceed your $${annualCap} annual cap across all candidates.`,
          };
        }
      }

      if (safeCompliance === 'compliant') {
        if (attemptedAmount > tierInfo.perDonationLimit()) {
          return {
            scope: 'per candidate per election',
            limitType: 'per-donation',
            amount: tierInfo.perDonationLimit(),
            message: `You cannot donate more than $${tierInfo.perDonationLimit()} in a single transaction.`,
          };
        }

        const perElectionLimit = tierInfo.perElectionLimit?.() ?? 0;
        if (currentElectionTotal + attemptedAmount > perElectionLimit) {
          return {
            scope: 'per candidate per election',
            limitType: 'per-election',
            amount: perElectionLimit,
            message: `This donation would exceed your $${perElectionLimit} limit for this candidate in this election.`,
          };
        }
      }

      return {
        limitType: 'per-donation',
        amount:
          tierInfo.perDonationLimit() || (tierInfo.perElectionLimit?.() ?? 0),
        scope:
          safeCompliance === 'compliant'
            ? 'per candidate per election'
            : 'per donation',
        message: 'Donation limit exceeded.',
      };
    },
    [userCompliance]
  );
  /**
   * Check if a donation would exceed any applicable limits
   */
  const wouldExceedLimits = useCallback(
    (
      attemptedAmount: number,
      currentAnnualTotal: number = 0,
      currentElectionTotal: number = 0
    ): boolean => {
      // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
      const safeCompliance: ComplianceTier = FEC.COMPLIANCE_TIERS[
        userCompliance
      ]
        ? userCompliance
        : 'guest';
      const tierInfo = FEC.COMPLIANCE_TIERS[safeCompliance] as FECTierInfo;

      if (!tierInfo) {
        // Ultimate fallback - use guest tier limits
        const fallbackTierInfo = FEC.COMPLIANCE_TIERS.guest as FECTierInfo;
        return (
          attemptedAmount > fallbackTierInfo.perDonationLimit() ||
          currentAnnualTotal + attemptedAmount >
            (fallbackTierInfo.annualCap?.() ?? 0)
        );
      }

      let wouldExceed = false;
      let limitType = '';

      if (safeCompliance === 'guest') {
        const annualCap = tierInfo.annualCap?.() ?? 0;
        wouldExceed =
          attemptedAmount > tierInfo.perDonationLimit() ||
          currentAnnualTotal + attemptedAmount > annualCap;
        limitType =
          attemptedAmount > tierInfo.perDonationLimit()
            ? 'per-donation'
            : 'annual-cap';
      }

      if (safeCompliance === 'compliant') {
        const perElectionLimit = tierInfo.perElectionLimit?.() ?? 0;
        wouldExceed =
          attemptedAmount > tierInfo.perDonationLimit() ||
          currentElectionTotal + attemptedAmount > perElectionLimit;
        limitType =
          attemptedAmount > tierInfo.perDonationLimit()
            ? 'per-donation'
            : 'per-election';
      }

      // Track limit validation failures for UX insights
      if (wouldExceed && typeof window !== 'undefined' && window.gtag) {
        // Only track in production to avoid polluting analytics with test data
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
          window.gtag('event', 'limit_validation_failed', {
            event_category: 'compliance',
            event_label: limitType,
            custom_parameters: {
              limit_type: limitType,
              compliance_tier: userCompliance,
              attempted_amount: attemptedAmount,
              current_annual_total: currentAnnualTotal,
              current_election_total: currentElectionTotal,
              environment: process.env.NODE_ENV || 'development',
            },
          });
        }
      }

      return wouldExceed;
    },
    [userCompliance]
  );

  const setDonationLimit = useCallback(
    () => {},
    // No-op for API compatibility
    []
  );

  /**
   * Remaining amount user can donate (min of per-donation and remaining cap).
   * Used when user has exceeded a limit and we need to cap or show modal (e.g. post-login in Funnel).
   */
  const getRemainingDonationLimit = useCallback(
    (currentAnnualTotal: number, currentElectionTotal: number): number => {
      const safeCompliance: ComplianceTier = FEC.COMPLIANCE_TIERS[
        userCompliance
      ]
        ? userCompliance
        : 'guest';
      const tierInfo = FEC.COMPLIANCE_TIERS[safeCompliance] as FECTierInfo;
      if (!tierInfo) return 0;

      if (safeCompliance === 'guest') {
        const annualCap = tierInfo.annualCap?.() ?? 0;
        const perDonationLimit = tierInfo.perDonationLimit();
        return Math.min(
          perDonationLimit,
          Math.max(0, annualCap - currentAnnualTotal)
        );
      }
      if (safeCompliance === 'compliant') {
        const perElectionLimit = tierInfo.perElectionLimit?.() ?? 0;
        const perDonationLimit = tierInfo.perDonationLimit();
        return Math.min(
          perDonationLimit,
          Math.max(0, perElectionLimit - currentElectionTotal)
        );
      }
      return 0;
    },
    [userCompliance]
  );

  /**
   * Show PAC limit confirmation dialog with data
   *
   * Stores PAC limit data in dialogue context and shows the modal.
   * The modal receives this data via context instead of fetching it.
   *
   * @param data - PAC limit information from validation response
   */
  const showPACLimitConfirm = useCallback(
    (data: {
      remainingPACLimit: number;
      attemptedAmount: number;
      currentPACTotal: number;
      pacLimit: number;
      message: string;
    }) => {
      // Store PAC limit data in dialogue context
      setModalData({
        pacLimit: data,
      });
      // Show the limit modal (LimitModal uses isPACLimit prop to distinguish behavior)
      setShowModal((s) => ({
        ...s,
        limit: true,
        pacLimit: true,
      }));
    },
    [setShowModal, setModalData]
  );

  /**
   * Hide PAC limit confirmation dialog
   *
   * Clears PAC limit data from dialogue context and hides the modal.
   */
  const hidePACLimitConfirm = useCallback(() => {
    setShowModal((s) => ({ ...s, limit: false, pacLimit: false }));
    // Clear PAC limit data when modal is closed
    setModalData((d) => ({ ...d, pacLimit: null }));
  }, [setShowModal, setModalData]);

  /**
   * Open donation limit modal with current effective limits.
   * Single place that owns "show the limit modal" for donation-cap (not PAC) so callers
   * (Continue, BtnGrid, post-login) just call this instead of building payload themselves.
   */
  const openDonationLimitModal = useCallback(() => {
    setModalData((d) => ({
      ...d,
      donationLimit: {
        effectiveLimit: effectiveLimits.effectiveLimit,
        remainingLimit: effectiveLimits.remainingLimit,
        limitType:
          userCompliance === 'compliant' ? 'per-election' : 'annual-cap',
        scope:
          userCompliance === 'compliant'
            ? 'per candidate, per election'
            : 'as a total annual cap, and $50 per donation',
      },
    }));
    setShowModal((s) => ({ ...s, limit: true }));
  }, [
    effectiveLimits.effectiveLimit,
    effectiveLimits.remainingLimit,
    userCompliance,
    setModalData,
    setShowModal,
  ]);

  /**
   * Set tipLimitReached to true when user hits PAC limit
   * This updates the user's database record to indicate they've hit their PAC limit
   */
  const setTipLimitReached = useCallback(async () => {
    try {
      if (!userData?.id) {
        throw new Error('User not authenticated');
      }

      // Call API to update tipLimitReached field
      const response = await fetch(
        `/api/users/${userData.id}/tipLimitReached`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tipLimitReached: true }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update tipLimitReached field');
      }

      // Note: The user data will be updated on next page refresh or auth refresh
      // For immediate UI updates, we could trigger a context refresh here
    } catch (error) {
      logError('Error setting tipLimitReached', error);
      throw error;
    }
  }, [userData?.id]);

  return (
    <DonationLimitsContext.Provider
      value={useMemo(
        (): DonationLimitsValues & DonationLimitsActions => ({
          getLimitInfo,
          setTipLimitReached,
          setDonationLimit,
          wouldExceedLimits,
          showPACLimitConfirm,
          hidePACLimitConfirm,
          openDonationLimitModal,
          getRemainingDonationLimit,
          shouldSkipTipAsk: tipLimitReached, // FLIPPED: true means limit reached, so skip TipAsk
          suggestedAmounts,
          effectiveLimits,
          pacLimitData,
        }),
        [
          getLimitInfo,
          setTipLimitReached,
          setDonationLimit,
          wouldExceedLimits,
          showPACLimitConfirm,
          hidePACLimitConfirm,
          openDonationLimitModal,
          getRemainingDonationLimit,
          tipLimitReached,
          suggestedAmounts,
          effectiveLimits,
          pacLimitData,
        ]
      )}
    >
      {children}
    </DonationLimitsContext.Provider>
  );
};

/**
 * Hook to access donation limits context
 * Must be used within DonationLimitsProvider component tree
 *
 * Provides access to:
 * - Real-time donation limit calculations with annual/election cycle resets
 * - Suggested donation amounts based on remaining limits
 * - Limit validation functions for compliance checking
 * - Detailed limit information for error messaging
 * - PAC limit confirmation dialogs and callbacks
 *
 * This hook integrates with ComplianceTierContext and ElectionCycleContext
 * to provide accurate limit calculations based on user compliance tier
 * and current election cycle status.
 *
 * @returns DonationLimitsValues & DonationLimitsActions - Complete donation limits context
 */
export const useDonationLimits = () => useContext(DonationLimitsContext);
