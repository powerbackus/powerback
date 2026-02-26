/**
 * Funnel tip-ask tab. Tip amount and PAC limit messaging.
 * @module TipAsk
 */
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useAuth,
  useDevice,
  useProfile,
  useNavigation,
  useDonationState,
} from '@Contexts';
import { APP, BRAND_DISPLAY, CELEBRATE_COPY, RECOMMENDED } from '@CONSTANTS';
import {
  logError,
  retrieveLocal,
  storeMapLocally,
  transformPolData,
} from '@Utils';
import type { PaymentSubmission } from '../TabContents';
import { Alert, Card, Spinner } from 'react-bootstrap';
import { BtnGrid } from '@Components/interactive';
import { ContinueBtn } from '@Components/buttons';
import { InfoTooltip } from '@Components/modals';
import type { AxiosResponse } from 'axios';
import type { Bill } from '@Interfaces';
import API from '@API';
import {
  type CelebrationRejection,
  type DonationStateProp,
  type UserEvent,
} from '@Types';
import './style.css';

/**
 * TipAsk component for handling tip selection and payment processing
 *
 * Structure-focused behavior:
 * - Uses an internal restoring flag to temporarily render a card-level skeleton layout
 *   that preserves overall card height and button grid footprint without animating
 *   placeholders. This prevents jarring content shifts while localStorage data is
 *   restored and `polData`/`donation`/`tip` are rehydrated.
 * - Triggers `BtnGrid`'s internal skeleton mode by passing an empty `value` array and
 *   a no-op `setAmount` during restore, ensuring the grid area remains sized.
 *
 * Data flow:
 * - Persists `polData.id` and `donation` when arriving on the tips tab.
 * - Restores missing state from localStorage on refresh; if restoration fails, navigates back.
 *
 * @component
 * @param {TipAskProps} props - Component props
 * @param {Dispatch<SetStateAction<CelebrationRejection>>} props.setRejectedDonationReasons - Set rejected donation reasons
 * @param {CelebrationRejection} props.rejectedDonationReasons - Current rejected donation reasons *
 * @param {(submission: PaymentSubmission) => void} props.handlePaymentSubmit - Handle payment submission
 * @param {Dispatch<SetStateAction<Error | null>>} props.setPaymentError - Set payment error
 * @param {boolean} props.processingTip - Whether the tip is being processed
 * @param {Error | null} props.paymentError - Current payment error state
 * @param {string} props.donorId - Stripe donor ID for payment processing
 * @param {(amount: number) => void} props.setTip - Update tip amount (also persisted by context)
 * @param {Bill} props.bill - Bill for the current celebration
 * @param {number} props.tip - Current tip amount
 *
 * @example
 * ```tsx
 * <TipAsk
 *   setRejectedDonationReasons={setRejectedDonationReasons}
 *   rejectedDonationReasons={rejectedDonationReasons}
 *   handlePaymentSubmit={handlePaymentSubmit}
 *   setPaymentError={setPaymentError}
 *   processingTip={processingTip}
 *   paymentError={paymentError}
 *   donorId={donorId}
 *   setTip={setTip}
 *   bill={bill}
 *   tip={tip}
 * />
 * ```
 */

type TipAskProps = DonationStateProp & {
  setRejectedDonationReasons: Dispatch<SetStateAction<CelebrationRejection>>;
  handlePaymentSubmit: (submission: PaymentSubmission) => void;
  setPaymentError: Dispatch<SetStateAction<Error | null>>;
  rejectedDonationReasons: CelebrationRejection;
  paymentError: Error | null;
  processingTip: boolean;
  donorId: string;
  bill: Bill;
};

const TipAsk = ({
  setRejectedDonationReasons,
  rejectedDonationReasons,
  processingTip = false,
  handlePaymentSubmit,
  setPaymentError,
  paymentError,
  donorId,
  setTip,
  bill,
  tip,

  ...props
}: TipAskProps) => {
  /* Contexts */
  const {
      userData: { id: userId },
    } = useAuth(),
    { donation, polData, selectPol, setDonation } = useDonationState(),
    { funnel: tabKey, navigateToFunnel } = useNavigation(),
    { isDesktop } = useDevice(),
    { settings } = useProfile();

  /* Refs for persistence */
  const hasFetchedPol = useRef(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Check PAC limits for tips
  const tipAsk = useMemo(
    () =>
      (donation as number) >= RECOMMENDED.TIPS.THRESHOLD
        ? RECOMMENDED.TIPS.HIGH
        : RECOMMENDED.TIPS.LOW,
    [donation]
  );

  const btnLabel = useMemo(() => (tip !== 0 ? 'Add tip' : 'Confirm'), [tip]);

  /**
   * Handles politician data restoration and persistence
   *
   * Manages politician data across page refreshes by storing data locally when
   * tip flow is ready, and restoring from localStorage when data is missing.
   * Automatically navigates back to pol-donation if data cannot be restored.
   */
  useEffect(() => {
    if (hasFetchedPol.current) return;

    // If we have valid data in the funnel context, store it locally
    if (tabKey === 'tips' && donation && polData?.id) {
      storeMapLocally([polData.id, String(donation)]);
      hasFetchedPol.current = true;
      return;
    }

    // Only try to restore when pol or donation is missing; tip=0 is valid (not yet selected)
    if (userId && tabKey === 'tips' && (!polData?.id || !donation)) {
      setIsRestoring(true);
      const refreshPol = retrieveLocal('pb:' + APP.STORE[0]),
        refreshAmt = retrieveLocal('pb:' + APP.STORE[1]),
        refreshTip = retrieveLocal('pb:' + APP.STORE[2]); // TipAmount

      if (refreshPol && !!refreshPol && refreshAmt) {
        const abortController = new AbortController();

        API.getPol(refreshPol)
          .then(({ data }: AxiosResponse) => {
            if (!abortController.signal.aborted && data) {
              const polData = transformPolData(data);
              selectPol(polData);
              setDonation(Number(refreshAmt));
              // Restore tip if it exists
              if (refreshTip && setTip) {
                setTip(Number(refreshTip));
              }
              hasFetchedPol.current = true;
              setIsRestoring(false);
            }
          })
          .catch((error: Error) => {
            if (!abortController.signal.aborted) {
              logError('Error fetching pol data', error);
              navigateToFunnel('pol-donation');
            }
            setIsRestoring(false);
          });

        return () => abortController.abort();
      } else {
        // Defensive: if we actually have valid data in this render, do not navigate (avoids race/remount)
        if (donation && polData?.id) {
          storeMapLocally([polData.id, String(donation)]);
          hasFetchedPol.current = true;
          setIsRestoring(false);
          return;
        }
        setIsRestoring(false);
        navigateToFunnel('pol-donation');
      }
    }
  }, [
    setTip,
    selectPol,
    setDonation,
    navigateToFunnel,
    polData?.id,
    donation,
    tabKey,
    userId,
  ]);

  /**
   * Handles form submission for tip processing
   *
   * Prevents default form behavior and delegates to the payment processing hook.
   * Only processes payments when TipAsk is not skipped (normal flow).
   * PAC limit validation is handled by the backend.
   *
   * @param {UserEvent} e - Form submission event
   */
  const handleSubmit: (e: UserEvent) => void = useCallback(
    (e) => {
      handlePaymentSubmit({
        e,
        paymentError: paymentError || null,
        donorId: donorId as string,
        bill: bill as Bill,
        userId,
      });
    },
    [bill, userId, donorId, paymentError, handlePaymentSubmit]
  );

  // Show skeleton loader while restoring data from localStorage
  if (isRestoring) {
    return (
      <Card
        id={'tip-ask'}
        className={'checkout-card'}
      >
        <Card.Header>Please add a tip</Card.Header>
        <Card.Body>
          <div className='placeholder-glow'>
            {/* Skeleton for tip statement text */}
            <div className='placeholder col-10 mb-2 tipask-skel-line'></div>
            <div className='placeholder col-8 mb-4 tipask-skel-line'></div>

            {/* Skeleton for BtnGrid component */}
            <div className='mb-3'>
              <BtnGrid
                size={isDesktop ? 'lg' : 'sm'}
                setAmount={() => {}} // Empty function for skeleton
                donation={0}
                isTip={true}
                amount={0}
                value={[]} // Empty array triggers skeleton
              />
            </div>

            {/* Skeleton for form info text */}
            <div className='placeholder col-11 mb-3 tipask-skel-footnote'></div>
          </div>
        </Card.Body>
        <Card.Footer>
          {/* Skeleton for continue button */}
          <div className='placeholder col-12 tipask-skel-cta'></div>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card
      id={'tip-ask'}
      className={'checkout-card'}
    >
      <Card.Header>Please add a tip</Card.Header>
      <Card.Body>
        {paymentError && (
          <Alert
            onClose={() => setPaymentError(null)}
            className={'mb-3'}
            variant={'danger'}
            dismissible
          >
            {paymentError.message}
          </Alert>
        )}
        {rejectedDonationReasons && (
          <Alert
            variant={rejectedDonationReasons.variant}
            onClose={() => setRejectedDonationReasons(null)}
            className={'mb-3'}
            dismissible
          >
            {rejectedDonationReasons.message}
          </Alert>
        )}
        <p className={'tip-ask px-3'}>
          <span className={'powerback'}>{BRAND_DISPLAY}</span>
          {CELEBRATE_COPY.CHECKOUT.statement}
        </p>
        <p className={'tip-ask py-3 d-inline-flex align-items-center gap-1'}>
          {`Can you throw in $${tipAsk}? `}
          {/* Floating info icon next to tip question - absolutely positioned */}
          <InfoTooltip
            icon={'info-circle'}
            infoPlacement={'top'}
            toolTipId={'tip-pac-limit-tooltip'}
            message={CELEBRATE_COPY.TIP_ASK.helper()}
            showToolTips={settings?.showToolTips ?? true}
          />
        </p>

        <BtnGrid
          value={[RECOMMENDED.TIPS.HIGH / 10, RECOMMENDED.TIPS.HIGH / 20, 0]}
          setAmount={setTip as (amount: number) => void}
          size={isDesktop ? 'lg' : 'sm'}
          amount={tip as number}
          donation={donation}
          polData={polData}
          isTip={true}
          {...props}
        />

        <p className={'tip-ask form-info px-lg-2 small'}>
          {CELEBRATE_COPY.TIP_ASK.formInfo[0]}{' '}
          <span className='powerback'>{BRAND_DISPLAY}</span>{' '}
          {CELEBRATE_COPY.TIP_ASK.formInfo[1]}
        </p>
      </Card.Body>
      <Card.Footer>
        <div className={'tip-submit--btn-spinner'}>
          {processingTip ? (
            <Spinner
              role={'status'}
              animation={'border'}
              className={'tip-ask-spinner'}
            >
              <span className={'visually-hidden'}>Processing Tip...</span>
            </Spinner>
          ) : (
            <ContinueBtn
              handleClick={handleSubmit as (e?: UserEvent) => void}
              hidden={typeof tip !== 'number'}
              variant={'outline-dark'}
              label={btnLabel}
              type={'submit'}
            />
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};

export default React.memo(TipAsk);
