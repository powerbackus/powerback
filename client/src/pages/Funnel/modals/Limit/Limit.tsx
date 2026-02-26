/**
 * Limit modal. PAC/guest limit messaging and agree flow.
 * @module Limit
 */
import React, {
  useMemo,
  useReducer,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useAuth,
  useDialogue,
  useDonationState,
  useComplianceTier,
  useDonationLimits,
  type LimitInfo,
  type ShowModal,
} from '@Contexts';
import { getGlobalCitations, shouldShowCitation, handleKeyDown } from '@Utils';
import { FEC, CELEBRATE_COPY, type AccountTab } from '@CONSTANTS';
import { StyledModal } from '@Components/modals';
import { AgreeBtn } from '@Components/buttons';
import { ListGroup } from 'react-bootstrap';
import type { Celebration } from '@Types';
import accounting from 'accounting';
import './style.css';

/**
 * Props interface for the LimitModal component
 * @interface LimitProps
 * @property {string} message - Custom message to display in the modal
 * @property {boolean} [isPACLimit] - Whether this is a PAC limit violation (default: false)
 * @property {number} [attemptedAmount] - Amount user tried to donate (default: 0)
 * @property {number} [currentAnnualTotal] - Current annual total for guest tier (default: 0)
 * @property {number} [currentElectionTotal] - Current election total for specific candidate for compliant tier (default: 0)
 * @property {Function} [setActiveKey] - Function to set the active key (used by the profile link to open the Account modal on the Profile pane)
 */

type LimitProps = {
  message: string;
  isPACLimit?: boolean;
  attemptedAmount?: number;
  currentAnnualTotal?: number;
  currentElectionTotal?: number;
  setActiveKey?: Dispatch<SetStateAction<AccountTab>>;
};

/**
 * Modal component that displays FEC compliance limits and handles user acknowledgment.
 *
 * FEC compliance tier definitions and limits are documented in docs/DONATION_LIMITS.md
 *
 * This component provides users with information about their current compliance tier
 * and the specific limit that was exceeded. It also offers guidance on how to
 * increase their donation limits by completing their profile information.
 *
 * @component
 * @param {LimitProps} props - Component props
 * @param {string} props.message - Custom message to display in the modal
 * @param {boolean} [props.isPACLimit] - Whether this is a PAC limit violation
 * @param {Function} [props.setActiveKey] - Function to set the active key (used by the profile link to open the Account modal on the Profile pane)
 * @param {number} [props.attemptedAmount] - Amount user tried to donate
 * @param {number} [props.currentAnnualTotal] - Current annual total (for guest)
 * @param {number} [props.currentElectionTotal] - Current election total for specific candidate (for compliant)
 *
 * @example
 * ```tsx
 * <LimitModal
 *   isPACLimit={true}
 *   attemptedAmount={250}
 *   currentAnnualTotal={150}
 *   currentElectionTotal={3200}
 *   setActiveKey={setActiveKey}
 *   message="You've reached your donation limit for this candidate."
 * />
 *
 * A modal dialog displaying FEC compliance information
 */
const LimitModal = ({
  currentElectionTotal: propCurrentElectionTotal,
  currentAnnualTotal: propCurrentAnnualTotal,
  attemptedAmount = 0,
  isPACLimit = false,
  setActiveKey,
  message,
  ...props
}: LimitProps) => {
  const { setDonation, setTip, selectedPol } = useDonationState(),
    { setShowModal, modalData } = useDialogue(),
    {
      userCompliance,
      complianceInfo: { citations },
    } = useComplianceTier(),
    { pacLimitData: contextPacLimitData } = useDonationLimits(),
    {
      userData: { donations },
    } = useAuth();

  // Donation limit data from opener (modal is presentational); fallback to context when missing
  const { effectiveLimits } = useDonationLimits();
  const donationLimit =
    !modalData.pacLimit && modalData.donationLimit
      ? modalData.donationLimit
      : null;

  // Calculate current totals from donations (always calculate, props are rarely passed)
  const { currentElectionTotal, currentAnnualTotal } = useMemo(() => {
    // Calculate from donations
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    let calculatedAnnualTotal = 0;
    let calculatedElectionTotal = 0;

    if (userCompliance === 'guest') {
      // Calculate annual total from donations this year
      const donationsThisYear = (donations || []).filter((d: Celebration) => {
        if (d.defunct || d.paused) return false;
        const donationDate = new Date(d.createdAt as unknown as string);
        return donationDate >= startOfYear && donationDate <= endOfYear;
      });
      calculatedAnnualTotal = donationsThisYear.reduce(
        (sum: number, d: Celebration) => sum + (d.donation || 0),
        0
      );
    } else if (userCompliance === 'compliant' && selectedPol) {
      // Calculate election total for selected candidate
      // Check both pol_id (string) and pol (object with id property)
      const donationsToThisCandidate = (donations || []).filter(
        (d: Celebration) => {
          if (d.defunct || d.paused) return false;
          // Match by pol_id string or pol.id (legacy shape)
          const dWithPol = d as Celebration & { pol?: { id?: string } };
          const polIdMatch =
            d.pol_id === selectedPol ||
            dWithPol.pol?.id === selectedPol ||
            d.pol_id?.toString() === selectedPol?.toString();
          if (!polIdMatch) return false;
          return true;
        }
      );
      calculatedElectionTotal = donationsToThisCandidate.reduce(
        (sum: number, d: Celebration) => sum + (d.donation || 0),
        0
      );
    }

    // Use props if explicitly provided (not just defaulted), otherwise use calculated values
    return {
      currentElectionTotal:
        propCurrentElectionTotal !== undefined
          ? propCurrentElectionTotal
          : calculatedElectionTotal,
      currentAnnualTotal:
        propCurrentAnnualTotal !== undefined
          ? propCurrentAnnualTotal
          : calculatedAnnualTotal,
    };
  }, [
    propCurrentElectionTotal,
    propCurrentAnnualTotal,
    donations,
    userCompliance,
    selectedPol,
  ]);

  // Get PAC limit data from dialogue context (passed when modal is shown)
  // This replaces the previous pattern of fetching data via hook
  // Check modalData.pacLimit first - if it exists, this is a PAC limit modal regardless of isPACLimit prop
  const isActuallyPACLimit = isPACLimit || !!modalData.pacLimit;

  const pacLimitData = useMemo(() => {
    if (isActuallyPACLimit && modalData.pacLimit) {
      return {
        pacLimit: modalData.pacLimit.pacLimit,
        currentPACTotal: modalData.pacLimit.currentPACTotal,
        remainingPACLimit: modalData.pacLimit.remainingPACLimit,
        pacLimitExceeded:
          modalData.pacLimit.currentPACTotal >= modalData.pacLimit.pacLimit,
      };
    }
    // If this is a PAC limit modal but modalData.pacLimit is missing, use context data
    if (isActuallyPACLimit && contextPacLimitData) {
      return {
        pacLimit: contextPacLimitData.pacLimit,
        currentPACTotal: contextPacLimitData.currentPACTotal,
        pacLimitExceeded: contextPacLimitData.pacLimitExceeded,
        remainingPACLimit: contextPacLimitData.remainingPACLimit,
      };
    }
    // Fallback to default values if not a PAC limit modal or data not available
    return {
      currentPACTotal: 0,
      pacLimitExceeded: false,
      pacLimit: FEC.PAC_ANNUAL_LIMIT,
      remainingPACLimit: FEC.PAC_ANNUAL_LIMIT,
    };
  }, [isActuallyPACLimit, modalData.pacLimit, contextPacLimitData]);

  // Use attemptedAmount from context for PAC limit modals, otherwise use prop
  const effectiveAttemptedAmount = useMemo(() => {
    if (isActuallyPACLimit && modalData.pacLimit) {
      return modalData.pacLimit.attemptedAmount;
    }
    return attemptedAmount;
  }, [isActuallyPACLimit, modalData.pacLimit, attemptedAmount]);

  const globalCitations = useMemo(
    () =>
      getGlobalCitations({
        context: 'limit_modal',
        userCompliance,
        isPACLimit: isActuallyPACLimit,
      }),
    [userCompliance, isActuallyPACLimit]
  );

  // Get all citations for this context
  const allCitations = useMemo(() => {
    const context = {
      context: 'limit_modal',
      userCompliance,
      isPACLimit: isActuallyPACLimit,
    };

    // For PAC limits, only use global citations (PAC-specific)
    // For donation limits, use tier citations + global citations
    const tierCitations = isActuallyPACLimit ? [] : citations || [];

    return [...tierCitations, ...globalCitations]
      .filter((citation) => shouldShowCitation(citation, context))
      .sort((a, b) => parseInt(a.marker) - parseInt(b.marker));
  }, [citations, globalCitations, userCompliance, isActuallyPACLimit]);

  /**
   * Get limit validation functions for the user's tier
   */
  const { getLimitInfo } = useDonationLimits();

  /**
   * Determine what limit was hit (if applicable) based on attempted donation
   */
  const limitInfo = useMemo<LimitInfo>(
    () =>
      getLimitInfo(
        effectiveAttemptedAmount,
        currentAnnualTotal,
        currentElectionTotal
      ),
    [
      getLimitInfo,
      currentAnnualTotal,
      currentElectionTotal,
      effectiveAttemptedAmount,
    ]
  );

  /**
   * Check if user has any compliance (not guest)
   */
  const hasMinimalCompliance: boolean = useMemo(
    () => userCompliance !== 'guest',
    [userCompliance]
  );

  /**
   * Handle acknowledgment button click to close the modal
   * Reset donation amount to the remaining limit (not the full limit)
   * Set tip amount to remaining PAC limit for PAC limit violations
   * @function
   */
  const openAccountToProfile = useCallback(() => {
    setActiveKey?.('Profile');
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      limit: false,
      account: true,
    }));
  }, [setActiveKey, setShowModal]);

  const handleClickAgree = useCallback(() => {
    if (isActuallyPACLimit) {
      setTip(pacLimitData.remainingPACLimit);
    } else {
      // Use data from opener (presentational); fallback to context
      if (donationLimit) {
        const amount =
          donationLimit.limitType === 'per-donation'
            ? donationLimit.effectiveLimit
            : donationLimit.remainingLimit;
        setDonation(amount);
      } else {
        if (
          limitInfo.limitType === 'per-election' ||
          limitInfo.limitType === 'annual-cap'
        ) {
          setDonation(effectiveLimits.remainingLimit);
        } else {
          setDonation(effectiveLimits.effectiveLimit);
        }
      }
    }

    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      limit: false,
    }));
  }, [
    setTip,
    setDonation,
    setShowModal,
    donationLimit,
    isActuallyPACLimit,
    limitInfo.limitType,
    effectiveLimits.effectiveLimit,
    effectiveLimits.remainingLimit,
    pacLimitData.remainingPACLimit,
  ]);

  /**
   * Type definition for managing glowing footnote states
   *
   * This type represents the state object that tracks which footnotes
   * should have a glowing effect applied. The keys correspond to
   * footnote numbers and values indicate the CSS class to apply.
   */
  type GlowingFootnote = Record<string, string>;

  /**
   * Use the custom footnote glow hook
   */

  const glowingFootnotesReducer = useCallback(
    (
      state: GlowingFootnote,
      action: { type: 'mouseover' | 'mouseout'; marker: string }
    ) => {
      return {
        ...state,
        [action.marker]: action.type === 'mouseover' ? 'glow' : '',
      };
    },
    []
  );

  const [glowingFootnotes, setGlowingFootnotes] = useReducer(
    glowingFootnotesReducer,
    {} as Record<string, string>
  );

  // Helper function to handle mouse events with citation markers
  const handleMouseEvent = useCallback(
    ({ type, currentTarget }: React.MouseEvent<HTMLAnchorElement>) => {
      if (type !== 'mouseover' && type !== 'mouseout') return;

      const marker = currentTarget.textContent?.trim() || '';
      if (marker) {
        setGlowingFootnotes({
          type: type as 'mouseover' | 'mouseout',
          marker,
        });
      }
    },
    []
  );

  // For PAC limits, we need both the annual limit ($5000) and remaining amount (i.e. $49)

  /**
   * Generate the main body paragraph based on compliance info
   */
  const bodyParagraph = useMemo(
    () =>
      isActuallyPACLimit ? (
        <p>
          {(() => {
            const explanationText =
              CELEBRATE_COPY.LIMIT_MODAL.tip.explanation();
            // Split the explanation into sentences
            const sentences = explanationText.split(/(?<=[.!?])\s+/);

            return sentences.map((sentence, index) => {
              const isLastSentence = index === sentences.length - 1;
              const citationIndex = index < allCitations.length ? index : null;

              return (
                <React.Fragment key={index}>
                  {sentence}
                  {citationIndex !== null && allCitations[citationIndex] && (
                    <sup className='super'>
                      <a
                        href={allCitations[citationIndex].uri}
                        onMouseOver={handleMouseEvent}
                        onMouseOut={handleMouseEvent}
                        target={'__blank'}
                      >
                        {allCitations[citationIndex].marker}
                      </a>
                    </sup>
                  )}
                  {!isLastSentence && ' '}
                </React.Fragment>
              );
            });
          })()}
        </p>
      ) : (
        <p>
          Under the <span className='fst-italic'>{FEC.LAW_UNDER}</span>,
          contributions are subject to certain limits.{' '}
          {hasMinimalCompliance ? 'I' : 'Anonymous i'}
          ndividuals are limited to{' '}
          <span className='dollar-amount'>
            {accounting.formatMoney(
              donationLimit
                ? donationLimit.effectiveLimit
                : effectiveLimits.effectiveLimit,
              '$',
              0
            )}
          </span>{' '}
          <span className='fw-semibold'>
            {donationLimit ? donationLimit.scope : limitInfo.scope}
          </span>
          .
          {allCitations.length > 0 && (
            <sup className='super'>
              <a
                onMouseOver={handleMouseEvent}
                onMouseOut={handleMouseEvent}
                href={allCitations[0].uri}
                target={'__blank'}
              >
                {allCitations[0].marker}
              </a>
            </sup>
          )}
        </p>
      ),
    [
      limitInfo,
      allCitations,
      donationLimit,
      handleMouseEvent,
      isActuallyPACLimit,
      hasMinimalCompliance,
      effectiveLimits.effectiveLimit,
    ]
  );

  const remainingLimitAmount = useMemo(
    () =>
      donationLimit
        ? donationLimit.limitType === 'per-donation'
          ? donationLimit.effectiveLimit
          : donationLimit.remainingLimit
        : limitInfo.limitType === 'per-donation'
          ? effectiveLimits.effectiveLimit
          : effectiveLimits.remainingLimit,
    [donationLimit, limitInfo.limitType, effectiveLimits]
  );

  const RemainingLimitStyledSpan = useMemo(
    () => (
      <span className='inter dollar-limit'>
        {accounting.formatMoney(remainingLimitAmount, '$', 0)}
      </span>
    ),
    [remainingLimitAmount]
  );

  return (
    <StyledModal
      {...props}
      size={'sm'}
      type={'limit'}
      backdrop={'static'}
      closeButton={false}
      heading={
        <>
          <div className='align-content-center'>
            <i className='bi bi-bank2' />
            &nbsp;
            {FEC.NOTICE_HEADING + ' -'}
            <br />
            <span>
              {isActuallyPACLimit
                ? CELEBRATE_COPY.LIMIT_MODAL.tip.title
                : (hasMinimalCompliance ? 'Max ' : '') +
                  'Donation Limit Exceeded'}
            </span>
            {isActuallyPACLimit && (
              <div className='small mt-1'>
                {CELEBRATE_COPY.LIMIT_MODAL.tip.subtitle}
              </div>
            )}
            {!isActuallyPACLimit && (
              <div className='small mt-1'>
                {CELEBRATE_COPY.LIMIT_MODAL.donation.subtitle}
              </div>
            )}
          </div>
        </>
      }
      body={
        <div className='p-lg-2'>
          {bodyParagraph}
          <br />
          <p>
            {isActuallyPACLimit ? (
              <>
                This tip would exceed your remaining annual PAC contribution
                limit. You have{' '}
                <span className='dollar-limit'>
                  {accounting.formatMoney(
                    pacLimitData.remainingPACLimit,
                    '$',
                    0
                  )}
                </span>{' '}
                remaining.
              </>
            ) : (
              message
            )}
          </p>
          <br />
          <p className='px-xs-3'>
            {isActuallyPACLimit ? (
              CELEBRATE_COPY.LIMIT_MODAL.tip.disclaimer
            ) : (
              <>
                <span>
                  {CELEBRATE_COPY.LIMIT_MODAL.donation.bodyInsert}
                  {RemainingLimitStyledSpan}.
                </span>
                {allCitations.length > 1 && (
                  <>
                    <sup className='super'>
                      <a
                        onMouseOver={handleMouseEvent}
                        onMouseOut={handleMouseEvent}
                        href={allCitations[1].uri}
                        target={'__blank'}
                      >
                        {allCitations[1].marker}
                      </a>
                    </sup>
                  </>
                )}
              </>
            )}
          </p>
          <br />
          <span className='text-center'>
            <AgreeBtn handleClick={handleClickAgree} />
          </span>
          <br />
          <br />
          {isActuallyPACLimit ? (
            <p className='px-5 text-center small'>
              {CELEBRATE_COPY.LIMIT_MODAL.tip.ctaHelper}
            </p>
          ) : !hasMinimalCompliance ? (
            <p className='px-3 text-center small'>
              Complete your{' '}
              {/* "profile" is a link that opens the Account modal and switches
              to the Profile pane (`setActiveKey('Profile')`). tabIndex={-1} so
              Tab never focuses it (avoids focus-generated close); mouse click only. */}
              <span
                onKeyDown={(e) => handleKeyDown(e, openAccountToProfile)}
                onClick={openAccountToProfile}
                className={'natural-link'}
                role={'button'}
                tabIndex={0}
              >
                profile
              </span>{' '}
              to donate up to{' '}
              <span className='dollar-amount'>
                {accounting.formatMoney(
                  FEC.COMPLIANCE_TIERS.compliant.perDonationLimit(),
                  '$',
                  0
                )}
              </span>
              .
            </p>
          ) : null}
        </div>
      }
      footer={
        <ListGroup className='footnotes px-lg-5'>
          {allCitations.map((citation) => (
            <ListGroup.Item
              key={citation.marker}
              className={`text-muted citation ${
                glowingFootnotes[citation.marker]
              }`}
            >
              <sup>{citation.marker}&nbsp;</sup>
              <em>{citation.description}</em>&nbsp;
              <span className='citation-uri'>{citation.uri}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      }
    />
  );
};

export default React.memo(LimitModal);
