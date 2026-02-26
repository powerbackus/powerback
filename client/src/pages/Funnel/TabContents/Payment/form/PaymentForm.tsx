/**
 * Payment form. Card element, setup intent, submit.
 * @module PaymentForm
 */
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import {
  type StripeElements,
  type StripeCardElement,
  type StripeCardNumberElement,
  type StripeCardElementChangeEvent,
} from '@stripe/stripe-js/types/stripe-js';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth, useNavigation, useDonationState } from '@Contexts';
import { Button, Overlay, Spinner, Tooltip } from 'react-bootstrap';
import type { Stripe, SetupIntent } from '@stripe/stripe-js';
import type { PaymentSubmission } from '../../TabContents';
import { cardStyle } from './cardStyle';
import type { Bill } from '@Interfaces';
import { handleKeyDown, logError } from '@Utils';
import { APP } from '@CONSTANTS';
import { nanoid } from 'nanoid';
import API from '@API';
import './style.css';

/**
 * Interface for setting donor ID and payment submit
 * @interface PaymentFormProps
 */
type PaymentFormProps = {
  handlePaymentSubmit?: (submission: PaymentSubmission) => void;
  setDonorId: Dispatch<SetStateAction<string>>;
  paymentError?: Error | null;
  tipLimitReached?: boolean;
  bill?: Bill;
};

/**
 * PaymentForm component for handling Stripe payment method setup
 *
 * This component manages the Stripe payment method setup flow, including
 * card element validation, setup intent creation, and payment method storage.
 * It handles PAC limit checks to determine navigation flow and integrates
 * with the donation funnel context.
 *
 * @component
 * @param {PaymentFormProps} props - Component props
 * @param {Bill} props.bill - Bill object for the current celebration
 * @param {Function} props.setDonorId - Function to set Stripe donor ID
 * @param {Error | null} props.paymentError - Current payment error state
 * @param {Function} props.handlePaymentSubmit - Function to handle payment submission
 *
 * @example
 * ```tsx
 * <PaymentForm
 *  handlePaymentSubmit={handlePaymentSubmit}
 *  tipLimitReached={tipLimitReached}
 *  paymentError={paymentError}
 *  setDonorId={setDonorId}
 *  bill={bill}
 * />
 * ```
 */
const PaymentForm = ({
  handlePaymentSubmit,
  tipLimitReached,
  paymentError,
  setDonorId,
  bill,
}: PaymentFormProps) => {
  /* Stripe */
  const stripe = useStripe(),
    elements = useElements(),
    stripeOverlayTarget = useRef(null);

  /* State */
  const [disabled, setDisabled] = useState(true),
    [showTooltip, setShowTooltip] = useState(false),
    [error, setError] = useState<string | null>(null),
    [processing, setProcessing] = useState<boolean>(false);

  /* Contexts */
  const { navigateToFunnel, getFunnelSteps } = useNavigation(),
    {
      userData: {
        id: userId,
        payment: { customer_id },
      },
      refreshUserData,
    } = useAuth(),
    {
      donation,
      polData: { id: polId },
      setPaymentFormDisabled,
      setPaymentMethodId,
    } = useDonationState();

  /* Notify context of disabled state changes */
  useEffect(() => {
    setPaymentFormDisabled(disabled);
  }, [disabled, setPaymentFormDisabled]);

  /**
   * Validates payment method setup with Stripe
   *
   * Confirms the card setup intent with Stripe, stores the payment method ID,
   * and navigates to the next step in the funnel. Handles PAC limit checks
   * to determine whether to skip the tip step.
   *
   * @param data - Setup intent data containing clientSecret and optional customer ID
   * @throws {Error} When Stripe setup confirmation fails
   */
  const CARD_SETUP_TIMEOUT_MS = APP.CHECKOUT.CARD_SETUP_TIMEOUT_MS; // 15 seconds

  const validatePayment = useCallback(
      async (clientSecret: string, customerId?: string) => {
        const confirmPromise = (stripe as Stripe).confirmCardSetup(
          clientSecret,
          {
            payment_method: {
              card: (elements as StripeElements).getElement(CardElement) as
                | StripeCardElement
                | StripeCardNumberElement
                | { token: string },
            },
          }
        );

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Card setup timed out. Please try again.')),
            CARD_SETUP_TIMEOUT_MS
          )
        );

        return await Promise.race([confirmPromise, timeoutPromise])
          .then(({ setupIntent }) => {
            const paymentMethod = (setupIntent as SetupIntent)
              .payment_method as string;
            // Store payment method ID in funnel context for reuse
            setPaymentMethodId(paymentMethod);

            // Update donorId with the actual customer ID returned from setup intent
            if (customerId && customerId !== userId) {
              setDonorId(customerId);
              // Store DonorId in localStorage for persistence across page refreshes
              localStorage.setItem('pb:donorId', customerId);
            }

            // Backend validates payment method exists and is complete before setting
            if (customerId) {
              API.setPaymentMethod(customerId, {
                payment_method: paymentMethod as string,
                idempotencyKey: nanoid(),
              });
            }
            setProcessing(false);

            // Navigate to next step based on current funnel configuration
            const currentFunnelSteps = getFunnelSteps();
            const currentStepIndex = currentFunnelSteps.indexOf('payment');
            let nextStep = currentFunnelSteps[currentStepIndex + 1];

            // Skip TipAsk and go directly to Support if user has reached PAC limit
            if (tipLimitReached && nextStep === 'tips') {
              nextStep = 'confirmation';
            }

            navigateToFunnel(nextStep);
          })
          .catch((error) => {
            setProcessing(false);
            setError(error.message || 'Payment setup failed');
            setShowTooltip(true);
            logError('Payment setup error', error);
          });
      },
      [
        userId,
        stripe,
        elements,
        tipLimitReached,
        setPaymentMethodId,
        CARD_SETUP_TIMEOUT_MS,
        navigateToFunnel,
        getFunnelSteps,
        setDonorId,
      ]
    ),
    /**
     * Gets setup intent from Stripe for payment method setup
     *
     * Creates a setup intent with the provided customer ID and validates
     * the payment method setup.
     *
     * @param {string} customerId - Stripe customer ID
     */
    getIntent = useCallback(
      (customerId: string) => {
        API.setupIntent(customerId, {
          idempotencyKey: nanoid(),
        })
          .then(({ data: { clientSecret } }) => {
            // If we used userId (MongoDB ObjectId), refresh user data to get the new customer_id
            if (/^[0-9a-fA-F]{24}$/.test(customerId)) {
              refreshUserData(); // This should update the auth context with the new customer_id
            }

            validatePayment(clientSecret, customerId);
          })
          .catch((error) => {
            logError('SetupIntent error', error);
          });
      },
      [validatePayment, refreshUserData]
    );

  /**
   * Handles Stripe card element change events
   *
   * Updates form state based on card element validation status,
   * enabling/disabling the submit button and displaying error messages.
   * The button is only enabled when the card is complete and valid.
   *
   * @param {StripeCardElementChangeEvent} e - Stripe card element change event
   */
  const handleChange = useCallback((e: StripeCardElementChangeEvent) => {
    // Disable button if card is empty or incomplete
    // e.complete indicates all fields are filled and valid
    setDisabled(e.empty || !e.complete);
    setError(e.error ? e.error.message : '');
    // Context will be updated via useEffect when disabled state changes
  }, []);

  /**
   * Handles form submission for payment method setup
   *
   * Processes the payment method setup by getting donor ID, creating setup intent,
   * and handling validation. Shows error tooltips for validation failures.
   * Prevents submission if card is incomplete or has errors.
   *
   * @param {FormEvent} e - Form submission event (keyboard or click)
   */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      const handler = async () => {
        // Prevent submission if there's an error
        if (error) {
          setShowTooltip((s) => !s);
          return false;
        }

        // Safety check: verify card element exists and button should be enabled
        const cardElement = (elements as StripeElements)?.getElement(
          CardElement
        );
        if (!cardElement) {
          setError('Card element not found');
          setShowTooltip(true);
          return false;
        }

        // Additional safety check: if button should be disabled, prevent submission
        // This should not happen if the button is properly disabled, but acts as a safeguard
        if (disabled) {
          setError('Please complete all card fields');
          setShowTooltip(true);
          return false;
        }

        setProcessing(true);
        try {
          // Use customer_id if available, otherwise check localStorage for pb:donorId
          // If neither exists, use userId (backend will create Stripe customer from MongoDB user ID)
          const customerId =
            customer_id || localStorage.getItem('pb:donorId') || userId;
          if (!customerId || !!!customerId || customerId === 'undefined') {
            setProcessing(false);
            return;
          }
          getIntent(customerId as string);
          setDonorId(customerId as string);

          // Payment method setup complete - call handlePaymentSubmit if provided.
          // When tipLimitReached is true, we bypass the TipAsk screen and trigger
          // the same payment processing flow using the object-shaped submission.
          if (handlePaymentSubmit && tipLimitReached) {
            handlePaymentSubmit({
              e: e as unknown as PaymentSubmission['e'],
              paymentError: paymentError || null,
              donorId: customerId as string,
              bill: bill as Bill,
              userId,
            });
          }
        } catch (error) {
          setProcessing(false);
          setError('Failed to process payment setup');
          logError('Payment setup error', error);
        }
        return false;
      };
      if ('key' in e) {
        if (e.key !== 'Enter') {
          return;
        } else handler();
      } else handler();
    },
    [
      bill,
      error,
      userId,
      disabled,
      elements,
      customer_id,
      paymentError,
      tipLimitReached,
      getIntent,
      setDonorId,
      handlePaymentSubmit,
    ]
  );

  return (
    <>
      {/* Show any error that happens when processing the payment */}
      {error && (
        <Overlay
          show={showTooltip}
          placement={'bottom'}
          target={stripeOverlayTarget.current}
        >
          {(props) => (
            <Tooltip
              role={'alert'}
              className={'card-error'}
              {...props}
            >
              {error}
            </Tooltip>
          )}
        </Overlay>
      )}
      <div
        id={'stripe-checkout'}
        className={processing ? 'preserve-bg' : ''}
      >
        <div hidden={processing}>
          <CardElement
            onChange={
              handleChange as (event: StripeCardElementChangeEvent) => any
            }
            id={'card-element'}
            options={cardStyle}
          />
        </div>

        {processing ? (
          <Spinner
            role={'status'}
            animation={'border'}
            className={'checkout-spinner'}
          >
            <span className={'visually-hidden'}>Processing Payment...</span>
          </Spinner>
        ) : (
          /* Confirm payment button */
          <Button
            disabled={!polId || processing || !donation || disabled}
            onKeyDown={(e) => handleKeyDown(e, handleSubmit, e)}
            ref={stripeOverlayTarget}
            onClick={handleSubmit}
            type={'submit'}
          >
            Checkout
          </Button>
        )}
      </div>
    </>
  );
};

export default React.memo(PaymentForm);
