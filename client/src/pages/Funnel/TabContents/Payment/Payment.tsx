/**
 * Funnel payment tab. Payment method and checkout.
 * @module Payment
 */
import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  useAuth,
  useDialogue,
  useNavigation,
  useDonationState,
} from '@Contexts';
import { logError, retrieveLocal, transformPolData } from '@Utils';
import type { PaymentSubmission } from '../TabContents';
import type { AxiosResponse } from 'axios';
import { Col, Row } from 'react-bootstrap';
import { useDisplayName } from '@Hooks';
import Checkout from './Checkout';
import { APP } from '@CONSTANTS';
import API from '@API';
import type {
  CelebrationRejection,
  DonationStateProp,
  PaymentProps,
  ProfileProp,
} from '@Types';
import './style.css';

/**
 * Payment component for handling payment method setup and processing
 *
 * Structure-focused behavior:
 * - Stores only `ChoicePol`, `ChoiceAmt`, clears `TipAmount`, and writes `BillId` on arrival
 *   to the payment tab, intentionally NOT touching `DonorId` (set separately after Stripe
 *   customer creation). This prevents overwriting valid donor state between tabs.
 * - Restores `polData` and `donation` from localStorage on refresh using API `getPol`, then
 *   hydrates context. If restore fails, navigates back to `pol-donation`.
 *
 * @component
 * @param {PaymentProps & Props & { handlePaymentSubmit: Function, tipLimitReached: boolean }} props
 * @param {Function} props.handlePaymentSubmit - Payment processing callback from parent
 * @param {Stripe} props.stripe - Stripe instance for setup/confirmation
 * @param {Bill} props.bill - Bill for the current celebration
 */
const Payment = ({
  tipLimitReached,
  stripe,
  bill,
  paymentError = null,
  rejectedDonationReasons = null,
  ...props
}: PaymentProps &
  DonationStateProp &
  ProfileProp & {
    tipLimitReached: boolean;
    paymentError?: Error | null;
    rejectedDonationReasons?: CelebrationRejection;
    handlePaymentSubmit?: (submission: PaymentSubmission) => void;
  }) => {
  /* Contexts */
  const { polData, selectPol, donation, setDonation } = useDonationState(),
    { funnel: tabKey, navigateToFunnel } = useNavigation(),
    { setShowModal } = useDialogue(),
    {
      userData: { id: userId },
    } = useAuth();

  /* Hooks */
  const [displayName, { setDisplayName }] = useDisplayName({
    first: polData?.first_name as string,
    middle: polData?.middle_name ?? '',
    last: polData?.last_name as string,
  });

  /* Effects */
  useLayoutEffect(
    () => (polData && (setDisplayName as (maxLen: number) => void))(17),
    [polData, setDisplayName]
  );

  // Use useRef to track if pol data has been fetched
  const hasFetchedPol = useRef(false);
  const hasFetchedEligibility = useRef(false);

  /**
   * Determines if the payment flow is ready to proceed
   *
   * Checks that all required data is available: politician data, user ID, and donation amount
   * @returns {boolean} True if all required data is present
   */
  const readyForPayment = useMemo(
    () => !!polData?.id && !!userId && !!donation,
    [polData, userId, donation]
  );

  /**
   * Handles politician data restoration and persistence
   *
   * Manages politician data across page refreshes by storing data locally when
   * payment flow is ready, and restoring from localStorage when data is missing.
   * Automatically navigates back to pol-donation if data cannot be restored.
   */
  useEffect(() => {
    if (hasFetchedPol.current) return;

    // If we have valid data in the funnel context, store it locally
    if (tabKey === 'payment' && readyForPayment) {
      // Store only the first 4 values individually to avoid overwriting DonorId
      // DonorId should only be set by PaymentForm after Stripe customer creation
      const billId = bill?.bill_id || '';

      localStorage.setItem('pb:' + APP.STORE[0], polData.id); // ChoicePol
      localStorage.setItem('pb:' + APP.STORE[1], String(donation)); // ChoiceAmt
      localStorage.setItem('pb:' + APP.STORE[2], ''); // TipAmount (empty until TipAsk screen)
      localStorage.setItem('pb:' + APP.STORE[3], billId); // BillId
      // DonorId (APP.STORE[4]) is intentionally not set here to avoid overwriting
      hasFetchedPol.current = true;
      return;
    }

    // Only try to restore from localStorage if we don't have valid data in context
    if (userId && tabKey === 'payment' && (!!!polData?.id || !donation)) {
      const refreshPol = retrieveLocal('pb:' + APP.STORE[0]),
        refreshAmt = retrieveLocal('pb:' + APP.STORE[1]);

      if (refreshPol && !!refreshPol && refreshAmt) {
        const abortController = new AbortController();

        API.getPol(refreshPol)
          .then(({ data }: AxiosResponse) => {
            if (!abortController.signal.aborted && data) {
              const polData = transformPolData(data);
              selectPol(polData);
              setDonation(Number(refreshAmt));
              hasFetchedPol.current = true;
            }
          })
          .catch((error) => {
            if (!abortController.signal.aborted) {
              logError('Error fetching pol data', error);
              navigateToFunnel('pol-donation');
            }
          });

        return () => abortController.abort();
      } else {
        navigateToFunnel('pol-donation');
      }
    }
  }, [
    bill,
    tabKey,
    userId,
    donation,
    polData?.id,
    readyForPayment,
    selectPol,
    setDonation,
    navigateToFunnel,
  ]);

  /**
   * Checks user eligibility requirements and shows modal if needed
   *
   * Verifies that the user has completed eligibility requirements before
   * proceeding with payment. Shows the eligibility modal if requirements
   * are not met.
   */
  useEffect(() => {
    if (tabKey !== 'payment' || !userId || hasFetchedEligibility.current) {
      return;
    }

    const abortController = new AbortController();

    API.checkPrivilege(userId)
      .then(({ data }) => {
        if (!abortController.signal.aborted && !data) {
          // if not, it will show the eligibility modal.
          setShowModal((s) => ({
            ...s,
            eligibility: true,
          }));
          hasFetchedEligibility.current = true;
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          logError('Error checking privilege', error);
        }
      });

    return () => abortController.abort();
  }, [tabKey, userId, setShowModal]);

  return (
    <Row className={'payment'}>
      <Col className={'payment d-flex'}>
        <Checkout
          key={userId + 'checkout-card'}
          tipLimitReached={tipLimitReached}
          setDisplayName={setDisplayName}
          paymentError={paymentError}
          displayName={displayName}
          stripe={stripe}
          bill={bill}
          {...props}
        />
      </Col>
    </Row>
  );
};

export default React.memo(Payment);
