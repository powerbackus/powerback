/**
 * @fileoverview Payment Processing Hook
 *
 * This hook handles the complete payment processing flow for celebration donations,
 * including Stripe payment confirmation, celebration saving, user data updates,
 * and navigation. It separates payment logic from UI components for better
 * reusability and testability.
 *
 * KEY FUNCTIONS
 *
 * processDonation(data, bill, userId)
 * - Confirms Stripe payment using client secret
 * - Saves celebration to database
 * - Updates user data with new donation
 * - Refreshes user data for tipLimitReached status
 * - Navigates to support page
 * - Clears local storage
 *
 * attemptPayment(donorId, bill, userId)
 * - Sends payment data to backend for validation
 * - Handles successful payment responses (with clientSecret)
 * - Handles validation failures (PAC limit violations, other errors)
 * - Shows PAC limit modal for limit violations
 * - Sets rejected donation reasons for other failures
 *
 * handlePaymentSubmit(e, paymentError, donorId, bill, userId)
 * - Handles form submission for payment processing
 * - Clears payment errors for retry
 * - Initiates payment attempt
 *
 * BUSINESS LOGIC
 *
 * PAYMENT FLOW
 * 1. User submits form → handlePaymentSubmit prevents default
 * 2. attemptPayment sends payment data to backend
 * 3. Backend validates donation (FEC compliance, PAC limits)
 * 4. If valid: Returns payment intent with clientSecret
 * 5. If invalid: Returns validation response with error details
 * 6. processDonation confirms payment with Stripe
 * 7. Celebration saved, user data updated, navigation to support
 *
 * PAC LIMIT HANDLING
 * - Backend validates PAC tip limits ($5,000 annual)
 * - If limit violated: Returns pacLimitInfo in validation response
 * - Frontend shows PAC limit modal with current/remaining amounts
 * - User can confirm to proceed or cancel
 *
 * CONTRACT: showPACLimitConfirm(data)
 * - Called when: attemptPayment receives a validation response with validationResponse.pacLimitInfo.
 * - Caller (useDonationLimits context) is responsible for setting modalData.pacLimit and showing
 *   the limit modal. Payload shape: { attemptedAmount, currentPACTotal, pacLimit, remainingPACLimit, message }.
 * - LimitModal renders from modalData.pacLimit only; it does not re-query the backend.
 *
 * ERROR HANDLING
 * - Payment errors set via setPaymentError
 * - Validation failures set via setRejectedDonationReasons
 * - Spinner management via startProcessingSpinner/stopProcessingSpinner
 *
 * DEPENDENCIES
 * - @Contexts: useAuth, useNavigation, useDonationState, useDonationLimits
 * - @Utils: clearLocalMap, donationFailure
 * - @API: API client for payment and celebration endpoints
 * - @stripe/react-stripe-js: Stripe React hooks
 *
 * @module hooks/usePaymentProcessing
 * @requires react
 * @requires @Contexts
 * @requires @Utils
 * @requires @Types
 * @requires @API
 * @requires @Tuples
 * @requires @Interfaces
 * @requires @stripe/stripe-js
 * @requires @stripe/react-stripe-js
 */

import {
  useMemo,
  useCallback,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import {
  useAuth,
  useNavigation,
  useDonationState,
  useDonationLimits,
  type UserData,
  type ShowModal,
} from '@Contexts';
import {
  clearLocalMap,
  donationFailure,
  reportClientError,
  type DonationFailureProps,
} from '@Utils';
import {
  type UserEvent,
  type Celebration,
  type CelebrationRejection,
} from '@Types';
import API from '@API';
import { ERRORS } from '@Tuples';
import { logError } from '@Utils';
import type { AxiosError } from 'axios';
import type { Bill } from '@Interfaces';
import { Stripe } from '@stripe/stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
import type { StripePaymentResponse, PaymentValidationResponse } from '@API';

/**
 * Interface for UI dependencies that the payment processing hook needs
 */
interface PaymentUIDependencies {
  setRejectedDonationReasons: Dispatch<SetStateAction<CelebrationRejection>>;
  setPaymentError: Dispatch<SetStateAction<Error | null>>;
  setShowModal: Dispatch<SetStateAction<ShowModal>>;
  startProcessingSpinner: () => void;
  stopProcessingSpinner: () => void;
}

/**
 * Interface for payment data from Stripe
 */
interface SentPayment {
  clientSecret: string;
  paymentIntent: string;
}

interface MaybeAxiosError {
  response?: {
    status?: number;
  };
}

/**
 * Custom hook for payment processing logic
 *
 * Handles the complete payment flow including Stripe confirmation, celebration
 * saving, user data updates, and navigation. Separates payment logic from UI
 * components for better reusability and testability.
 *
 * @param uiDependencies - UI-specific functions and state setters
 * @returns Object containing payment processing functions
 */
export const usePaymentProcessing = (uiDependencies: PaymentUIDependencies) => {
  const { createDonationPackage } = useDonationState(),
    { setUserData, refreshUserData } = useAuth(),
    { navigateToFunnel } = useNavigation(),
    { showPACLimitConfirm } = useDonationLimits(),
    stripe = useStripe();

  const {
    setPaymentError,
    stopProcessingSpinner,
    startProcessingSpinner,
    setRejectedDonationReasons,
  } = uiDependencies;

  /**
   * Processes the donation payment through Stripe and saves the celebration
   *
   * Handles the complete payment flow including Stripe confirmation, celebration
   * saving, user data updates, and navigation to the support page. Also clears
   * local storage after successful completion.
   *
   * @param data - Payment data containing clientSecret and paymentIntent
   * @param bill - Bill object for the celebration
   * @param userId - User ID for the donation
   * @throws {Error} When Stripe payment confirmation fails
   */
  const processDonation = useCallback(
    async (data: SentPayment, bill: Bill, userId: string) => {
      try {
        await (stripe as Stripe).confirmCardPayment(data.clientSecret);
        setPaymentError(null);

        // Save celebration
        const donationPackage = createDonationPackage(bill, userId);
        const { data: savedCelebration } = await API.saveCelebration({
          ...donationPackage,
          payment_intent: data.paymentIntent as string,
        });

        // Update user data
        setUserData((state: UserData) => ({
          ...state,
          donations: [
            ...state.donations,
            { ...savedCelebration } as Celebration,
          ],
        }));

        // Refresh user data to get updated tipLimitReached status
        await refreshUserData();

        stopProcessingSpinner();
        // Navigate directly to support
        navigateToFunnel('confirmation');

        // Clear local storage
        clearLocalMap();
      } catch (err) {
        const error = err as Error;
        const axiosError = err as AxiosError<{
          donation?: number;
          complies?: boolean;
          understands?: boolean;
        }>;
        const status = axiosError.response?.status;
        const data = axiosError.response?.data;

        stopProcessingSpinner();

        // Celebration creation rejected (e.g. FEC limit at save) returns 400 with donation/complies
        if (
          status === 400 &&
          data &&
          typeof data.donation === 'number' &&
          typeof data.complies === 'boolean'
        ) {
          setPaymentError(null);
          setRejectedDonationReasons(
            donationFailure({
              donation: data.donation,
              complies: data.complies,
              understands: data.understands,
            })
          );
        } else {
          logError('Payment processing error', error);
          setPaymentError(error);
          reportClientError({
            message: 'Payment processing error',
            context: 'usePaymentProcessing.processDonation',
            extra: {
              status: (err as MaybeAxiosError).response?.status,
            },
          });
        }
      }
    },
    [
      stripe,
      setUserData,
      refreshUserData,
      setPaymentError,
      navigateToFunnel,
      createDonationPackage,
      stopProcessingSpinner,
      setRejectedDonationReasons,
    ]
  );

  /**
   * Attempts to process the payment and handles validation responses
   *
   * Sends payment data to the backend for processing. Handles both successful
   * payment responses and validation failures, including PAC limit violations
   * which trigger the limit modal display.
   *
   * @param donorId - Stripe donor ID for payment processing
   * @param bill - Bill object for the celebration
   * @param userId - User ID for the donation
   */
  const attemptPayment = useCallback(
    (donorId: string, bill: Bill, userId: string) => {
      startProcessingSpinner();
      const donationPackage = createDonationPackage(bill, userId);

      API.sendPayment(donorId, donationPackage)
        .then(({ data: paymentResults }) => {
          // Check if this is a successful payment response (has clientSecret)
          if ('clientSecret' in paymentResults) {
            processDonation(
              paymentResults as StripePaymentResponse,
              bill,
              userId
            );
          } else {
            // This is a validation failure response
            const validationResponse =
              paymentResults as PaymentValidationResponse;

            // Check if this is a PAC limit violation
            if (
              validationResponse.tipComplies === false &&
              validationResponse.pacLimitInfo
            ) {
              // Handle PAC limit violation by showing the PAC limit modal with data
              showPACLimitConfirm({
                attemptedAmount: validationResponse.tip || 0,
                currentPACTotal:
                  validationResponse.pacLimitInfo.currentPACTotal,
                pacLimit: validationResponse.pacLimitInfo.pacLimit,
                remainingPACLimit:
                  validationResponse.pacLimitInfo.remainingPACLimit,
                message: validationResponse.pacLimitInfo.message,
              });
            } else {
              // Handle other donation validation failures
              stopProcessingSpinner();
              setRejectedDonationReasons(
                donationFailure(validationResponse as DonationFailureProps)
              );
            }
          }
        })
        .catch((err: Error) => {
          stopProcessingSpinner();
          const axiosErr = err as AxiosError;
          const status = axiosErr.response?.status;
          const stripeCode = (err as { code?: string }).code;
          const isRateLimit =
            status === 429 ||
            stripeCode === 'lock_timeout' ||
            (typeof (err as { message?: string }).message === 'string' &&
              (err as { message: string }).message.includes(
                'cannot be accessed right now'
              ));
          if (isRateLimit) {
            const rateLimitMsg =
              ERRORS.find((e) => e.status === 429)?.msg ??
              'You may have reached your donation limit or too many attempts were made. You have not been charged. Please try again in a moment.';
            setPaymentError(null);
            setRejectedDonationReasons({
              variant: 'warning',
              message: rateLimitMsg,
            });
          } else {
            setPaymentError(err);
            reportClientError({
              message: 'Payment attempt error',
              context: 'usePaymentProcessing.attemptPayment',
              extra: {
                status: (err as MaybeAxiosError).response?.status ?? status,
                stripeCode,
              },
            });
          }
        });
    },
    [
      processDonation,
      setPaymentError,
      showPACLimitConfirm,
      createDonationPackage,
      startProcessingSpinner,
      stopProcessingSpinner,
      setRejectedDonationReasons,
    ]
  );

  /**
   * Handles form submission for payment processing
   *
   * Prevents default form behavior and either clears payment errors for retry
   * or attempts payment processing. PAC limit validation is handled by the backend.
   *
   * @param e - Form submission event
   * @param paymentError - Current payment error state
   * @param donorId - Stripe donor ID for payment processing
   * @param bill - Bill object for the celebration
   * @param userId - User ID for the donation
   */
  const handlePaymentSubmit = useCallback(
    (
      e: UserEvent | FormEvent,
      paymentError: Error | null,
      donorId: string,
      bill: Bill,
      userId: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      // PAC limit validation is now handled by the backend
      // The backend will set tipLimitReached: true when a PAC limit violation occurs
      // and return an appropriate error response that the frontend will handle

      if (paymentError) {
        // Clear payment error and retry
        setPaymentError(null);
      } else {
        attemptPayment(donorId, bill, userId);
      }
    },
    [setPaymentError, attemptPayment]
  );

  return useMemo(
    () => ({
      attemptPayment,
      processDonation,
      handlePaymentSubmit,
    }),
    [attemptPayment, processDonation, handlePaymentSubmit]
  );
};
