/**
 * Donation amount and limit message in lobby.
 * @module DonationSection
 */
import React, { useMemo } from 'react';
import type { UserEvent, DialogueProp, DonationStateProp } from '@Types';
import { LimitMessage } from '@Components/displays';
import { ContinueBtn } from '@Components/buttons';
import { BtnGrid } from '@Components/interactive';
import { CELEBRATE_COPY } from '@CONSTANTS';
import { Col, Row } from 'react-bootstrap';
import {
  useAuth,
  useDevice,
  useDialogue,
  useDonationState,
  useDonationLimits,
  useComplianceTier,
} from '@Contexts';
import './style.css';

/**
 * DonationSection Component
 *
 * Handles the main donation amount selection interface including:
 * - Donation amount selection via button grid
 * - Continue button with validation
 * - Responsive layout for mobile and desktop
 * - Showing appropriate modals for limit violations
 *
 * @param {DonationStateProp & { isDemoMode: boolean }} props
 * @param {number} props.donation - The donation amount
 * @param {Bill} props.bill - The bill
 * @param {number} props.tip - The tip amount
 * @param {boolean} isDemoMode - Whether the app is in demo mode
 */
type DonationSectionProps = DonationStateProp &
  DialogueProp & {
    handleContinue: (e: UserEvent) => void;
    isDemoMode: boolean;
  };

const DonationSection = ({
  handleContinue,
  isDemoMode,
  ...props
}: DonationSectionProps) => {
  // Get current user authentication data
  const { userData } = useAuth();

  // Get funnel state including selected politician, donation amount, and navigation
  const { donation, setDonation, selectedPol } = useDonationState();

  // Get donation limits context for proper validation
  const { suggestedAmounts, effectiveLimits, openDonationLimitModal } =
    useDonationLimits();

  // Get compliance tier to determine if limits are reached
  const { userCompliance } = useComplianceTier();

  const { setShowModal } = useDialogue();

  /**
   * Determines if the continue button should be enabled
   * Requires both a donation amount and a selected politician
   */
  const canContinue = useMemo(
    () => donation > 0 && selectedPol !== null,
    [donation, selectedPol]
  );

  /**
   * Determines if the user has reached their donation limits for the selected politician
   */
  const hasReachedLimits = useMemo(() => {
    if (!selectedPol) return false;
    return effectiveLimits.remainingLimit <= 0;
  }, [selectedPol, effectiveLimits.remainingLimit]);

  // Get device type for responsive rendering
  const { isMobile } = useDevice();

  return (
    <Row id='donation-section'>
      {/* Conditional rendering based on politician selection and limits */}
      {!selectedPol ? (
        // Starting state when no politician is selected
        <div
          className={`starting mt-lg-2 mb-2 px-2 ${!isMobile ? 'w-75' : 'w-100'}`}
        >
          {CELEBRATE_COPY.CELEBRATION_SCREEN_LOAD_HEADER}
        </div>
      ) : hasReachedLimits ? (
        // Show limit message when user has reached their donation limits
        <div className='limit-message-container d-flex p-3 m-2 p-lg-0 m-lg-0 justify-content-center'>
          <LimitMessage
            effectiveLimits={effectiveLimits}
            userCompliance={userCompliance}
            isDemoMode={isDemoMode}
            userData={userData}
          />
        </div>
      ) : (
        // Main donation interface when limits not reached
        <>
          <Row className='choose-amount'>
            {/* Donation amount selection grid */}
            <Col
              lg={6}
              className='d-flex justify-content-center'
            >
              <BtnGrid
                key={`${userData?.id ?? ''}-donation-btn-grid`}
                remainingDonationLimit={effectiveLimits.remainingLimit}
                setAmount={setDonation as (amount: number) => void}
                onOpenLimitModal={openDonationLimitModal}
                value={suggestedAmounts as number[]}
                size={isMobile ? 'sm' : 'lg'}
                amount={donation as number}
                setShowModal={setShowModal}
                selectedPol={selectedPol}
                donation={donation}
                isMobile={isMobile}
                userData={userData}
                isTip={false}
                {...props}
              />
            </Col>

            {/* Continue button with conditional visibility */}
            <Col className={canContinue ? 'show-cont--btn' : 'hide-cont--btn'}>
              <ContinueBtn
                handleClick={handleContinue as (e?: UserEvent) => void}
                variant={'outline-dark'}
                label={'Celebrate!'}
                isMobile={isMobile}
                size={'lg'}
                {...props}
              />
            </Col>
          </Row>
        </>
      )}
    </Row>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(DonationSection);
