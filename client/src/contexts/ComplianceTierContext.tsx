/**
 * Compliance tier context. Guest/compliant tier and form compliance state.
 * @module ComplianceTierContext
 */
import {
  useMemo,
  useState,
  useContext,
  useCallback,
  createContext,
  type ReactNode,
} from 'react';
import type { ServerConstants } from './types';
import {
  getFECTierInfo,
  logWarn,
  type FECCitation,
  type FECTierInfo,
} from '@Utils';

/**
 * User compliance tier types based on FEC regulations
 * Represents the two-tier compliance system: guest (anonymous) and compliant (full compliance)
 */
export type ComplianceTier = 'guest' | 'compliant';

/**
 * Comprehensive compliance information for a user tier
 * Provides all relevant information for a specific compliance tier
 * @interface FECTierInfo
 * @property {ComplianceTier} tier - The compliance tier level
 * @property {number} [perDonationLimit] - Maximum amount per donation (for guest tier)
 * @property {number} [annualCap] - Total annual cap across all candidates (for guest tier)
 * @property {number} [perElectionLimit] - Maximum amount per candidate per election (for compliant tier)
 * @property {string} scope - Human-readable description of the tier's limits
 * @property {string} description - Description of compliance requirements for this tier
 * @property {FECCitation[]} citations - FEC citations for this tier
 * @property {string} displayText - Formatted display text for UI
 */
export type ComplianceInfo = FECTierInfo;

/**
 * Compliance tier context values and actions
 * Provides comprehensive FEC compliance information and tier management
 *
 * @property {function} getHigherCompliance - Get the higher compliance level between form and user
 * @property {function} setFormCompliance - Set the form compliance state
 * @property {function} getMessageIndexExtremum - Get min/max compliance index for form vs user state
 * @property {ComplianceTier} effectiveCompliance - The effective compliance level (form or user, whichever is higher)
 * @property {ComplianceTier} userCompliance - User's current compliance tier
 * @property {FECTierInfo} complianceInfo - Complete FEC information for current effective tier
 * @property {FECTierInfo} nextTierInfo - Information for the next tier up from current
 * @property {FECCitation[]} citations - FEC citations for the current tier
 */
interface ComplianceTierValues {
  getHigherCompliance: (formCompliance: ComplianceTier) => ComplianceTier;
  setFormCompliance: (newFormCompliance: ComplianceTier) => void;
  getMessageIndexExtremum: (
    formComplianceState: ComplianceTier,
    extremum?: 'max' | 'min'
  ) => number;
  effectiveCompliance: ComplianceTier;
  userCompliance: ComplianceTier;
  complianceInfo: FECTierInfo;
  nextTierInfo: FECTierInfo;
  citations: FECCitation[];
}

/**
 * Compliance tier context actions interface
 * Provides methods for compliance tier operations
 */
interface ComplianceTierActions {
  /** Get higher compliance between form and user */
  getHigherCompliance: (formCompliance: ComplianceTier) => ComplianceTier;
  /** Update form compliance for calculations */
  setFormCompliance: (formCompliance: ComplianceTier) => void;
  /** Get message index extremum for compliance display */
  getMessageIndexExtremum: (
    formCompliance: ComplianceTier,
    extremum?: 'max' | 'min'
  ) => number;
}

/**
 * Props for ComplianceTierProvider component
 */
interface ComplianceTierProviderProps {
  /** Current user data */
  userCompliance: ComplianceTier;
  /** Server constants for compliance limits */
  serverConstants?: ServerConstants;
  /** Child components */
  children: ReactNode;
}

/**
 * Compliance Tier Context
 * Manages compliance tier state and information
 *
 * Responsibilities:
 * - Compliance tier state management
 * - Tier comparison and effective tier calculation
 * - FEC compliance information for tiers
 * - Tier transition logic
 */
const ComplianceTierContext = createContext<
  ComplianceTierValues & ComplianceTierActions
>({
  userCompliance: 'guest',
  effectiveCompliance: 'guest',
  complianceInfo: {
    scope: '',
    citations: [],
    tier: 'guest',
    description: '',
    displayText: '',
    resetType: 'annual',
    resetTime: 'midnight_est',
    annualCap: 200,
    perDonationLimit: 50,
    perElectionLimit: undefined,
  },
  nextTierInfo: {
    scope: '',
    citations: [],
    tier: 'compliant',
    description: '',
    displayText: '',
    resetType: 'election_cycle',
    resetTime: 'election_date',
    annualCap: undefined,
    perDonationLimit: 3500,
    perElectionLimit: 3500,
  },
  citations: [],
  setFormCompliance: () => logWarn('setFormCompliance called outside provider'),
  getHigherCompliance: () => 'guest',
  getMessageIndexExtremum: () => 0,
});

/**
 * Compliance Tier Provider Component
 * Manages compliance tier state and information
 *
 * Features:
 * - Automatic compliance tier calculations
 * - FEC compliance information for tiers
 * - Tier comparison and effective tier determination
 * - Next tier information for upgrades
 *
 * @param children - Child components needing compliance tier context
 * @param userCompliance - Current user compliance status
 * @param serverConstants - Server constants for compliance limits
 */
export const ComplianceTierProvider = ({
  children,
  userCompliance,
  serverConstants,
}: ComplianceTierProviderProps) => {
  // State for form compliance (what user is about to achieve)
  const [formCompliance, setFormComplianceState] =
    useState<ComplianceTier>('guest');

  /**
   * Compares formCompliance and userCompliance and returns the higher compliance level
   */
  const getHigherCompliance = useCallback(
    (formComplianceState: ComplianceTier): ComplianceTier => {
      const complianceHierarchy: ComplianceTier[] = ['guest', 'compliant'];

      const formIndex = complianceHierarchy.indexOf(formComplianceState);
      const userIndex = complianceHierarchy.indexOf(userCompliance);

      if (formIndex >= 0 && userIndex >= 0) {
        return formIndex >= userIndex ? formComplianceState : userCompliance;
      } else if (formIndex >= 0) {
        return formComplianceState;
      } else if (userIndex >= 0) {
        return userCompliance;
      } else {
        return 'guest';
      }
    },
    [userCompliance]
  );

  /** Effective compliance tier (higher of form vs user) */
  const effectiveCompliance = useMemo(
    () => getHigherCompliance(formCompliance),
    [getHigherCompliance, formCompliance]
  );

  /** Compliance info for current tier */
  const complianceInfo = useMemo(
    () => getFECTierInfo(effectiveCompliance, serverConstants),
    [effectiveCompliance, serverConstants]
  );

  /** Next tier up from current tier */
  const nextTier = useMemo(
    () => (userCompliance === 'guest' ? 'compliant' : userCompliance),
    [userCompliance]
  );

  /** Compliance info for next tier up */
  const nextTierInfo = useMemo(
    () => getFECTierInfo(nextTier, serverConstants),
    [nextTier, serverConstants]
  );

  /** FEC citations for current tier */
  const citations = useMemo(
    () => complianceInfo.citations || ([] as FECCitation[]),
    [complianceInfo.citations]
  );

  /**
   * Determines which compliance message to display based on current state
   */
  const getMessageIndexExtremum = useCallback(
    (
      formComplianceState: ComplianceTier,
      extremum: 'max' | 'min' = 'max'
    ): number => {
      const complianceHierarchy: ComplianceTier[] = ['guest', 'compliant'];

      const formIndex = formComplianceState
        ? complianceHierarchy.indexOf(formComplianceState)
        : 0;
      const userIndex = userCompliance
        ? complianceHierarchy.indexOf(userCompliance)
        : 0;

      return extremum === 'max'
        ? Math.max(formIndex, userIndex)
        : Math.min(formIndex, userIndex);
    },
    [userCompliance]
  );

  // Handler functions
  const setFormCompliance = useCallback((newFormCompliance: ComplianceTier) => {
    setFormComplianceState(newFormCompliance);
  }, []);

  return (
    <ComplianceTierContext.Provider
      value={useMemo(
        () => ({
          getMessageIndexExtremum,
          getHigherCompliance,
          effectiveCompliance,
          setFormCompliance,
          complianceInfo,
          userCompliance,
          nextTierInfo,
          citations,
        }),
        [
          getMessageIndexExtremum,
          getHigherCompliance,
          effectiveCompliance,
          setFormCompliance,
          complianceInfo,
          userCompliance,
          nextTierInfo,
          citations,
        ]
      )}
    >
      {children}
    </ComplianceTierContext.Provider>
  );
};

/**
 * Hook to access compliance tier context
 * Must be used within ComplianceTierProvider component tree
 *
 * Provides access to:
 * - Compliance tier information and calculations
 * - FEC compliance information and citations
 * - Tier comparison and transition functions
 *
 * @returns ComplianceTierValues & ComplianceTierActions - Complete compliance tier context
 */
export const useComplianceTier = () => useContext(ComplianceTierContext);
