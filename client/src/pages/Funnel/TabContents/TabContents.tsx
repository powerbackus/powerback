/**
 * TabContents: celebration flow (donation and payment).
 * @module TabContents
 */
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useAuth,
  useDialogue,
  useNavigation,
  useDonationState,
  useDonationLimits,
} from '@Contexts';
import type { PolComboboxProps } from '@Components/search/PolCombobox';
import { useSpinner, usePaymentProcessing } from '@Hooks';
import { Col, Row, Tab, TabPane } from 'react-bootstrap';
import { appendDemoDonation } from '../../../demoMode';
import { Elements } from '@stripe/react-stripe-js';
import { initializeStripe } from '@Utils/stripe';
import type { Stripe } from '@stripe/stripe-js';
import { TabFlow } from '@Components/page/navs';
import type { Bill } from '@Interfaces';
import type {
  CelebrationRejection,
  DonationStateProp,
  UserEvent,
} from '@Types';
import './style.css';

/**
 * Tab contents for the celebration flow
 *
 * Structure-focused behavior:
 * - Wraps Payment and TipAsk inside Stripe Elements via a `PaymentWrapper` to keep
 *   the tree stable and localized, reducing mount/unmount churn across tabs.
 * - Maintains a stable `TabFlow` header region; large sections (Lobby/Payment/TipAsk/Support)
 *   occupy predictable containers to prevent layout shifts between tab transitions.
 */
import Lobby from './Lobby';
import Payment from './Payment';
import TipAsk from './TipAsk';
import Confirmation from './Confirmation';

export type PaymentSubmission = {
  e: UserEvent;
  paymentError: Error | null;
  donorId: string;
  userId: string;
  bill: Bill;
};

type PaymentWrapperProps = Omit<TabContentsProps, 'bill'> & {
  setDonorId: Dispatch<SetStateAction<string>>;
  setTip: (amount: number) => void;
  stripe: Promise<Stripe | null>;
  shouldSkipTipAsk: boolean;
  tipLimitReached: boolean;
  isDemoMode: boolean;
  donorId: string;
  tip: number;
  bill: Bill;
};

/**
 * Payment wrapper component that provides payment processing inside Elements
 */
const PaymentWrapper = ({
  shouldSkipTipAsk,
  tipLimitReached,
  setDonorId,
  isDemoMode,
  donorId,
  setTip,
  stripe,
  bill,
  tip,
  ...props
}: PaymentWrapperProps) => {
  const [processingTip, spinnerHandlers] = useSpinner();
  const [paymentError, setPaymentError] = useState<Error | null>(null);
  const [rejectedDonationReasons, setRejectedDonationReasons] =
    useState<CelebrationRejection>(null);

  const { handlePaymentSubmit: rawHandlePaymentSubmit } = usePaymentProcessing({
    setPaymentError,
    setRejectedDonationReasons,
    startProcessingSpinner: spinnerHandlers.start,
    stopProcessingSpinner: spinnerHandlers.stop,
    setShowModal: () => {},
  });

  const handlePaymentSubmit = useCallback(
    ({ e, paymentError, donorId, bill, userId }: PaymentSubmission) =>
      rawHandlePaymentSubmit(e, paymentError, donorId, bill, userId),
    [rawHandlePaymentSubmit]
  );

  return (
    <>
      <TabPane
        eventKey={'payment'}
        aria-labelledby={'Payment'}
      >
        <Payment
          setRejectedDonationReasons={setRejectedDonationReasons}
          rejectedDonationReasons={rejectedDonationReasons}
          handlePaymentSubmit={handlePaymentSubmit}
          tipLimitReached={tipLimitReached}
          paymentError={paymentError}
          setDonorId={setDonorId}
          stripe={stripe}
          bill={bill}
          {...props}
        />
      </TabPane>
      {!shouldSkipTipAsk && (
        <TabPane
          eventKey={'tips'}
          aria-labelledby={'Confirm Transaction'}
        >
          <Row className={'payment'}>
            <Col className={'payment'}>
              <TipAsk
                {...props}
                setRejectedDonationReasons={setRejectedDonationReasons}
                setTip={setTip as Dispatch<SetStateAction<number>>}
                rejectedDonationReasons={rejectedDonationReasons}
                handlePaymentSubmit={handlePaymentSubmit}
                setPaymentError={setPaymentError}
                processingTip={processingTip}
                paymentError={paymentError}
                donorId={donorId}
                bill={bill}
                tip={tip}
              />
            </Col>
          </Row>
        </TabPane>
      )}
    </>
  );
};

/**
 * Initialize Stripe with runtime public key for payment processing (test/live)
 * This loads the appropriate key from the server based on environment
 */
const stripePromise = initializeStripe();

/**
 * TabContents component that manages the celebration flow including donations, payments, and support.
 *
 * This component orchestrates the entire celebration funnel, managing navigation between
 * different tabs (pol-donation, payment, tips, confirmation) and handling donation validation,
 * payment processing, and user authentication checks. It integrates with Stripe for
 * payment processing and enforces FEC compliance limits.
 *
 * @component
 * @param {TabContentsProps} props - Component props
 * @param {Function} props.restorePolsOnParade - Function to restore politician parade state
 * @param {Function} props.setLimitMessage - Function to set limit modal message content
 * @param {Bill} props.bill - Bill object for the current celebration
 *
 * @example
 * ```tsx
 * <TabContents
 *   restorePolsOnParade={restorePolsOnParade}
 *   setLimitMessage={setLimitMessage}
 *   bill={billData}
 * />
 * ```
 */
type TabContentsProps = {
  setLimitMessage?: Dispatch<SetStateAction<string>>;
  restorePolsOnParade?: () => void;
  isDemoMode: boolean;
} & DonationStateProp &
  PolComboboxProps;

const TabContents = ({
  restorePolsOnParade,
  setLimitMessage,
  bill,
  isDemoMode,
  ...props
}: TabContentsProps) => {
  /* Contexts */
  const { tip, setTip, donation, setCredentialsPath, selectedPol, polData } =
      useDonationState(),
    { wouldExceedLimits, shouldSkipTipAsk, openDonationLimitModal } =
      useDonationLimits(),
    { funnel: tabKey, navigateToFunnel } = useNavigation(),
    { setShowModal } = useDialogue(),
    {
      userData: {
        payment: { customer_id },
        tipLimitReached,
        id: userId,
      },
    } = useAuth();

  /* Payment processing will be handled inside Elements provider */

  /* Hooks */
  // Removed paymentProcessed state and useTransition - simplified flow

  /**
   * Handles continue button click for donation validation and navigation
   *
   * Validates the donation amount against FEC compliance limits and either
   * navigates to the payment tab or shows the appropriate limit modal.
   * Also handles authentication checks for unauthenticated users.
   */
  const handleContinue = useCallback(() => {
    if (isDemoMode) {
      if (selectedPol && donation) {
        appendDemoDonation({
          pol_id: selectedPol,
          amount: donation as number,
          polName: polData?.name ?? '',
          date: Date.now(),
        });
      }
      navigateToFunnel('confirmation');
      return;
    }
    if (userId) {
      // User is authenticated, check donation limits
      if (
        !wouldExceedLimits(
          donation as number,
          0, // currentAnnualTotal - handled by context
          0 // currentElectionTotal - handled by context
        )
      ) {
        // Amount is valid, proceed to payment
        navigateToFunnel('payment');
      } else {
        openDonationLimitModal();
      }
    } else {
      // User not authenticated, show credentials modal
      setCredentialsPath('Join Now');
      setShowModal((s) => ({
        ...s,
        credentials: true,
      }));
    }
  }, [
    userId,
    donation,
    isDemoMode,
    selectedPol,
    polData?.name,
    setShowModal,
    navigateToFunnel,
    wouldExceedLimits,
    setCredentialsPath,
    openDonationLimitModal,
  ]);

  // Removed reactive payment flow - simplified to direct navigation in TipAsk

  const prevDonationRef = useRef(donation);

  /**
   * Handles donation amount changes and resets navigation
   *
   * Monitors donation amount changes and automatically navigates back to the
   * pol-donation tab when the donation is cleared (set to 0). This ensures
   * users can't proceed with empty donations.
   */
  useEffect(() => {
    const prevDonation = prevDonationRef.current;
    if (
      tabKey !== 'pol-donation' &&
      prevDonation !== donation &&
      donation === 0
    ) {
      navigateToFunnel('pol-donation');
    }
    // Update the ref for next comparison
    prevDonationRef.current = donation;
  }, [tabKey, donation, navigateToFunnel]);

  const [donorId, setDonorId] = useState<string>(customer_id || '');

  /**
   * Restores donorId from localStorage on component mount
   *
   * Checks localStorage for a previously stored donorId and sets it if found.
   * This ensures that the donorId persists across page refreshes.
   */
  useEffect(() => {
    const storedDonorId = localStorage.getItem('pb:donorId');
    if (storedDonorId && !donorId) {
      setDonorId(storedDonorId);
    }
  }, [donorId]);

  return (
    <Row className={'flex-column'}>
      <Col hidden={tabKey !== 'payment' && tabKey !== 'tips'}>
        <TabFlow donation={donation} />
      </Col>
      <Col>
        <Tab.Content id='donate-pg-tab-content'>
          <TabPane
            eventKey={'pol-donation'}
            aria-labelledby={'Lobby'}
          >
            <Lobby
              restorePolsOnParade={restorePolsOnParade}
              handleContinue={handleContinue}
              showRefreshAppSpinner={false}
              isDemoMode={isDemoMode}
              {...props}
            />
          </TabPane>
          <Elements stripe={stripePromise}>
            {bill ? (
              <PaymentWrapper
                {...props}
                shouldSkipTipAsk={shouldSkipTipAsk || isDemoMode}
                tipLimitReached={tipLimitReached}
                setDonorId={setDonorId}
                stripe={stripePromise}
                donorId={donorId}
                setTip={setTip}
                bill={bill}
                tip={tip}
                isDemoMode={isDemoMode}
              />
            ) : null}
          </Elements>
          <TabPane
            mountOnEnter
            unmountOnExit
            eventKey={'confirmation'}
            aria-labelledby={'Confirmation Page'}
          >
            <Row className={'confirmation'}>
              <Col className={'confirmation'}>
                <Confirmation
                  donation={donation}
                  bill={bill}
                  tip={tip}
                  isDemoMode={isDemoMode}
                />
              </Col>
            </Row>
          </TabPane>
        </Tab.Content>
      </Col>
    </Row>
  );
};

export default React.memo(TabContents);
