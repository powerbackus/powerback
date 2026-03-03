import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { CELEBRATE_COPY, LIMIT_MESSAGE_COPY } from '@CONSTANTS';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { POLSTATES } from '@Tuples';
import accounting from 'accounting';
import { FEC } from '@CONSTANTS';
import dayjs from 'dayjs';
import API from '@API';
import {
  Heading,
  Porthole,
  LimitInfo,
  ResetInfo,
  CycleInfo,
  CycleDates,
} from '.';
import {
  useDevice,
  useDialogue,
  useDonationState,
  type UserData,
  type ComplianceTier,
  type EffectiveLimits,
} from '@Contexts';
import './style.css';

interface LimitMessageProps {
  effectiveLimits: EffectiveLimits;
  userCompliance: ComplianceTier;
  userData: UserData;
  isDemoMode?: boolean;
}

interface ElectionDates {
  primary: string | null;
  general: string | null;
  special: string | null;
  runoff: string | null;
}

/**
 * Component that displays detailed information when users have reached their donation limits
 * Provides context about their current situation and opportunities to increase limits
 */
const LimitMessage = ({
  userData: { zip, city, state, address, employer, isEmployed, occupation },
  userCompliance,
  effectiveLimits,
  isDemoMode = false,
}: LimitMessageProps) => {
  // Extend dayjs with advanced format plugin for ordinal dates
  dayjs.extend(advancedFormat);

  const { isDesktop } = useDevice();
  const { polData } = useDonationState();
  const [electionDates, setElectionDates] = useState<ElectionDates | null>(
    null
  );

  const handleElectionDates = useCallback(async () => {
    if (!polData?.state) return;

    try {
      const { data } = await API.getElectionDates();

      if (data.success && data.data) {
        // Extract data for the specific state
        const stateData = data.data[polData.state];

        if (stateData && (stateData.primary || stateData.general)) {
          // Convert API response format to component's expected format
          setElectionDates({
            primary: stateData.primary || null,
            general: stateData.general || null,
            special: null,
            runoff: null,
          });
        } else {
          // Fallback to statutory dates if API doesn't have this state
          const currentYear = new Date().getFullYear();
          const electionYear =
            currentYear % 2 === 0 ? currentYear : currentYear + 1;
          const fallbackDates = {
            primary: null, // Primary dates vary by state
            general: `${electionYear}-11-03`, // Statutory general election date
            runoff: null,
            special: null,
          };
          setElectionDates(fallbackDates);
        }
      }
    } catch (error) {
      // Fallback to statutory dates if API fails
      const currentYear = new Date().getFullYear();
      const electionYear =
        currentYear % 2 === 0 ? currentYear : currentYear + 1;
      const fallbackDates = {
        primary: null, // Primary dates vary by state
        general: `${electionYear}-11-03`, // Statutory general election date
        runoff: null,
        special: null,
      };
      setElectionDates(fallbackDates);
    }
  }, [polData.state]);

  // Get election dates from API for the candidate's state
  useEffect(() => {
    handleElectionDates();
  }, [polData?.state, handleElectionDates]);

  // Format election date for display with ordinal numbers using dayjs
  const formatElectionDate = useCallback((dateString: string | null) => {
    if (!dateString) return LIMIT_MESSAGE_COPY.FALLBACK.TBD;
    return dayjs(dateString).format('MMMM Do, YYYY');
  }, []);

  // Helper function to get state name from abbreviation using POLSTATES data
  const getStateName = useCallback((abbrev: string) => {
    const stateData = POLSTATES.find(
      (state: { abbrev: string; full: string }) => state.abbrev === abbrev
    );
    return stateData?.full || abbrev;
  }, []);

  // if profile info chunks of info are provided, return true
  const isAddressProvided = useMemo(
      () => address && city && state && zip && zip.length >= 5,
      [address, city, state, zip]
    ),
    isEmploymentProvided = useMemo(
      () => isEmployed && occupation && employer,
      [isEmployed, occupation, employer]
    );

  // Detect if guest user has exhausted annual cap
  const guestAtAnnualCap = useMemo(
    () =>
      userCompliance === FEC.COMPLIANCE_TIERS.NAMES[0] &&
      effectiveLimits.resetType === 'annual' &&
      effectiveLimits.remainingLimit === 0,
    [effectiveLimits.remainingLimit, effectiveLimits.resetType, userCompliance]
  );

  // Create a single memoized object with all tier-specific flags and values
  const tierContext = useMemo(
    () => ({
      flags: {
        isGuest: userCompliance === FEC.COMPLIANCE_TIERS.NAMES[0],
        isCompliant: userCompliance === FEC.COMPLIANCE_TIERS.NAMES[1],
        isGuestAtCap: guestAtAnnualCap,
      },
      // Pre-calculate common values to avoid repeated computation
      canPromote:
        userCompliance !== FEC.COMPLIANCE_TIERS.NAMES[1] &&
        userCompliance === FEC.COMPLIANCE_TIERS.NAMES[0] &&
        isAddressProvided &&
        isEmploymentProvided,
    }),
    [userCompliance, guestAtAnnualCap, isAddressProvided, isEmploymentProvided]
  );

  // Calculate how much more they could donate at the next tier
  const nextTierLimit = useCallback(() => {
    if (tierContext.flags.isGuest) {
      // Guest can promote to Compliant tier
      return FEC.COMPLIANCE_TIERS.compliant.perElectionLimit?.() || 0;
    }
    return 0;
  }, [tierContext.flags]);

  // Determine the reset information
  const resetInfo = useMemo(
    () => ({
      ...(tierContext.flags.isCompliant
        ? {
            type: LIMIT_MESSAGE_COPY.RESET_INFO_INTERNAL.ELECTION_CYCLE_TYPE,
            description:
              LIMIT_MESSAGE_COPY.RESET_INFO_INTERNAL.ELECTION_CYCLE_DESCRIPTION,
          }
        : {
            type: LIMIT_MESSAGE_COPY.RESET_INFO_INTERNAL.ANNUAL_TYPE,
            description:
              LIMIT_MESSAGE_COPY.RESET_INFO_INTERNAL.ANNUAL_DESCRIPTION,
          }),
      nextReset: effectiveLimits.nextResetDate,
    }),
    [tierContext.flags.isCompliant, effectiveLimits.nextResetDate]
  );

  const effectiveLimitAmount = useMemo(
      () => accounting.formatMoney(effectiveLimits.effectiveLimit, '$', 0),
      [effectiveLimits.effectiveLimit]
    ),
    // Generate the main message based on compliance tier and situation
    mainMessage = useMemo(
      () =>
        tierContext.flags.isCompliant
          ? LIMIT_MESSAGE_COPY.MESSAGES.COMPLIANT_TIER(effectiveLimitAmount)
          : LIMIT_MESSAGE_COPY.MESSAGES.LOWER_TIER(effectiveLimitAmount),
      [tierContext.flags.isCompliant, effectiveLimitAmount]
    );

  const nextTierLimitAmount = useMemo(
    () => accounting.formatMoney(nextTierLimit(), '$', 0),
    [nextTierLimit]
  );

  // Generate the promotion message if applicable
  const promotionMessage = useCallback(() => {
    const getRawComplianceMessage = () => {
      if (tierContext.flags.isGuest) {
        // Guest users need all info to go to Compliant
        return (
          LIMIT_MESSAGE_COPY.PROMOTION.GUEST_TO_COMPLIANT?.(
            nextTierLimitAmount
          ) ||
          `Complete your profile to unlock ${nextTierLimitAmount} per candidate per election.`
        );
      }
      return null;
    };
    const trimMessageToDevice = () => {
      if (isDesktop) {
        return getRawComplianceMessage();
      }
      return (
        'I' +
        getRawComplianceMessage()?.slice(38, getRawComplianceMessage()?.length)
      );
    };
    return trimMessageToDevice();
  }, [tierContext.flags, nextTierLimitAmount, isDesktop]);

  // Format the reset date
  const formattedResetDate = useCallback(() => {
      if (!resetInfo.nextReset) return '';

      // Use dayjs with advancedFormat to include ordinal day (e.g., 1st)
      return dayjs(resetInfo.nextReset).format('MMMM Do, YYYY');
    }, [resetInfo]),
    resetDateCopy = useMemo(
      () => LIMIT_MESSAGE_COPY.RESET_MESSAGES.ANNUAL(formattedResetDate()),
      [formattedResetDate]
    ),
    // Generate the reset message with better user-facing copy
    resetMessage = useMemo(
      () =>
        tierContext.flags.isCompliant
          ? LIMIT_MESSAGE_COPY.RESET_MESSAGES.ELECTION_CYCLE
          : resetDateCopy,
      [tierContext.flags.isCompliant, resetDateCopy]
    );

  const computedResetInfoValue = useMemo(
      () =>
        LIMIT_MESSAGE_COPY.RESET_INFO.ANNUAL.RESET_INFO(formattedResetDate()),
      [formattedResetDate]
    ),
    candidateState = useMemo(
      () =>
        LIMIT_MESSAGE_COPY.RESET_INFO.ELECTION_CYCLE.TITLE(
          getStateName(
            polData?.state || LIMIT_MESSAGE_COPY.FALLBACK.UNKNOWN_STATE
          ).toUpperCase()
        ),
      [getStateName, polData?.state]
    ),
    primaryDate = useMemo(
      () => formatElectionDate(electionDates?.primary || null),
      [electionDates?.primary, formatElectionDate]
    ),
    generalDate = useMemo(
      () => formatElectionDate(electionDates?.general || null),
      [electionDates?.general, formatElectionDate]
    );

  // Generate more user-friendly election cycle information with actual dates
  const electionCycleInfo = useCallback(() => {
    if (tierContext.flags.isCompliant) {
      return {
        title: candidateState,
        dates: {
          primary: primaryDate,
          general: generalDate,
        },
        details: LIMIT_MESSAGE_COPY.RESET_INFO.ELECTION_CYCLE.DETAILS,
        resetInfo: LIMIT_MESSAGE_COPY.RESET_INFO.ELECTION_CYCLE.RESET_INFO,
      };
    }
    return {
      dates: null,
      resetInfo: computedResetInfoValue,
      title: LIMIT_MESSAGE_COPY.RESET_INFO.ANNUAL.TITLE,
      details: LIMIT_MESSAGE_COPY.RESET_INFO.ANNUAL.DETAILS,
    };
  }, [
    primaryDate,
    generalDate,
    candidateState,
    computedResetInfoValue,
    tierContext.flags.isCompliant,
  ]);

  const { setShowModal } = useDialogue();

  // Handle upgrade button click
  const handleUpgradeClick = useCallback(() => {
    if (tierContext.flags.isCompliant) {
      // Compliant tier users go to Celebrations
      setShowModal((s) => ({
        ...s,
        account: true,
      }));
    } else {
      // Guest tier users go to Profile to complete information
      setShowModal((s) => ({
        ...s,
        account: true,
      }));
    }
  }, [setShowModal, tierContext.flags.isCompliant]);

  // Get button text based on compliance tier
  const buttonText = useMemo(
    () =>
      tierContext.flags.isCompliant
        ? LIMIT_MESSAGE_COPY.BUTTONS.COMPLIANT_TIER
        : LIMIT_MESSAGE_COPY.BUTTONS.LOWER_TIER,
    [tierContext.flags.isCompliant]
  );

  const headingMessage = useMemo(
    () =>
      tierContext.flags.isGuest
        ? CELEBRATE_COPY.AMOUNT.guest
        : CELEBRATE_COPY.AMOUNT.reached,
    [tierContext.flags.isGuest]
  );

  // Guard clause: only render when a politician is properly selected
  if (!polData?.state) {
    return null;
  }

  return (
    <div className='limit-message'>
      <Heading message={headingMessage} />

      <div className='limit-content'>
        {isDesktop && <LimitInfo message={mainMessage} />}

        <Porthole
          buttonText={buttonText}
          onButtonClick={handleUpgradeClick}
          promotionMessage={promotionMessage()}
          shouldShow={!tierContext.flags.isCompliant && !isDemoMode}
        />

        <div className='limit-reset-info'>
          <CycleInfo {...electionCycleInfo()} />

          <CycleDates
            shouldShow={!!(tierContext.flags.isCompliant && electionDates)}
            primaryDate={formatElectionDate(electionDates?.primary || null)}
            generalDate={formatElectionDate(electionDates?.general || null)}
          />

          <ResetInfo message={resetMessage} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LimitMessage);
