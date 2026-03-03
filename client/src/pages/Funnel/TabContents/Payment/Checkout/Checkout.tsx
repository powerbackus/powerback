/**
 * Checkout. Donation summary and payment form.
 * @module Checkout
 */
import React, { useMemo, useCallback } from 'react';
import { Col, Row, Card, Image, ListGroup, Placeholder } from 'react-bootstrap';
import { useProfile, useDonationState, type PolData } from '@Contexts';
import { APP, CELEBRATE_COPY, ACCOUNT_COPY } from '@CONSTANTS';
import type { PaymentProps, ProfileProp } from '@Types';
import { InfoTooltip } from '@Components/modals';
import type { DisplayName } from '@Interfaces';
import accounting from 'accounting';
import PaymentForm from '../form';
import { titleize } from '@Utils';
import './style.css';

/**
 * Checkout component for displaying donation summary and payment form
 *
 * This component displays the pending celebration details including politician
 * information, bill details, donation amount, surcharge calculation, and total.
 * It also renders the payment form for completing the transaction.
 *
 * @component
 * @param {CheckoutProps} props - Component props
 * @param {boolean} props.tipLimitReached - Whether the tip limit has been reached
 * @param {DisplayName} props.displayName - Current politician display name
 * @param {Function} props.setDonorId - Function to set Stripe donor ID
 * @param {Bill} props.bill - Bill object for the current celebration
 *
 * @example
 * ```tsx
 * <Checkout
 *   tipLimitReached={tipLimitReached}
 *   displayName={displayName}
 *   setDonorId={setDonorId}
 *   bill={billData}
 * />
 * ```
 */
type CheckoutProps = PaymentProps &
  ProfileProp & {
    tipLimitReached: boolean;
  };

const Checkout = ({
  tipLimitReached,
  displayName,
  setDonorId,
  bill,
  ...props
}: CheckoutProps) => {
  const { polData, donation, condition } = useDonationState(),
    { serverConstants, settings } = useProfile();

  /**
   * Calculates the surcharge fee for the donation
   *
   * Applies the configured percentage and fixed addend to calculate
   * the total surcharge amount for the donation. Uses server constants
   * for surcharge values to ensure consistency with backend.
   *
   * @returns {number} The calculated surcharge amount
   */
  const fee = useCallback(() => {
    let d = donation as number;
    if (donation === void 0) {
      d = 0;
    }
    const surchargePercentage =
      serverConstants?.STRIPE?.FEES?.PERCENTAGE || 0.03;
    const surchargeAddend = serverConstants?.STRIPE?.FEES?.ADDEND || 0.3;
    return d * surchargePercentage + surchargeAddend;
  }, [donation, serverConstants]);

  /**
   * Generates the surcharge explanation message
   *
   * Creates a user-friendly explanation of how the surcharge is calculated
   * using the configured percentage and fixed addend values from server constants.
   *
   * @returns {string} The surcharge explanation message
   */
  const surchargeMessage = useMemo(() => {
    const surchargePercentage =
      serverConstants?.STRIPE?.FEES?.PERCENTAGE || 0.03;
    const surchargeAddend = serverConstants?.STRIPE?.FEES?.ADDEND || 0.3;
    return (
      'A transaction costs ' +
      surchargePercentage * 100 +
      '% of the donation, plus ' +
      surchargeAddend * 100 +
      ' cents.'
    );
  }, [serverConstants]);

  /**
   * Handles Patreon link click
   *
   * Opens the Patreon URL in a new tab with configured settings
   * for external link handling.
   */
  const handleClick = useCallback(() => {
    const patreonUrl =
      serverConstants?.APP?.PATREON_URL || 'https://www.patreon.com/powerback';
    const settings =
      'toolbar=yes,location=yes,status=no,menubar=yes,scrollbars=yes,resizable=yes,width=420,height=420';
    window.open(patreonUrl, '_blank', settings);
  }, [serverConstants]);

  return (
    <Card className='checkout-card pending-card'>
      <Card.Header as='h5'>{ACCOUNT_COPY.CHECKOUT.pendingHeading}</Card.Header>
      <Card.Body>
        <Card.Title>
          <Row className='pt-lg-2'>
            <Col>
              <Row className='pending-choices'>
                {!(polData as PolData).name ? (
                  <Placeholder
                    animation={'wave'}
                    className={'placeholder checkout-pol-heading w-50'}
                  />
                ) : (
                  <>
                    {((polData as PolData).chamber === 'House'
                      ? 'Rep. '
                      : 'Sen. ') +
                      (displayName as unknown as DisplayName).value}

                    <span className='subtitle pt-lg-1'>{`${
                      (polData as PolData).district !== 'At-Large'
                        ? 'District'
                        : ''
                    } ${(polData as PolData).district} of ${
                      (polData as PolData).state
                    }`}</span>
                  </>
                )}
              </Row>
            </Col>

            <Col>
              {bill ? (
                <Row className='pending-choices bill-of-sale'>
                  {bill.bill}
                  <span className='subtitle pt-lg-1'>
                    {bill.short_title &&
                      titleize(
                        bill.short_title,
                        APP.CHECKOUT.BILL_DESCRIPTION_CHAR_LIMIT.LG
                      )}
                  </span>
                </Row>
              ) : (
                <>{ACCOUNT_COPY.CHECKOUT.loadingBill}</>
              )}
            </Col>
          </Row>
        </Card.Title>

        <Row className='body-top'>
          <Col>
            {!polData?.id ? (
              <Placeholder
                as={Image}
                variant={'top'}
                animation={'wave'}
                className={'checkout-headshot'}
              />
            ) : (
              <Card.Img
                title={`pending celebration - politician selection ${polData.name}`}
                alt={`The official Congressional headshot of ${polData.name}.`}
                aria-label={'Pending celebration - politician profile picture'}
                className={'checkout-headshot pol-headshot-selected'}
                src={`../pfp/${(polData as PolData).id}.webp`}
                loading={'lazy'}
                variant={'top'}
                as={Image}
              />
            )}
          </Col>

          <Col>
            <Row
              id={'checkout-details'}
              className={'mt-lg-2 pt-lg-3'}
            >
              <Col>
                <Card.Text className='mb-2'>
                  {ACCOUNT_COPY.CHECKOUT.checkoutLabel}
                </Card.Text>
                <ListGroup
                  variant={'flush'}
                  className={'list-group-flush'}
                >
                  <ListGroup.Item>
                    <span className='celebration-condition'>
                      Condition: {condition}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    {ACCOUNT_COPY.CHECKOUT.donationLabel}
                    <span>
                      {donation ? accounting.formatMoney(donation) : null}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <span
                      className={
                        'surcharge-list-group-item d-inline-flex align-items-center'
                      }
                    >
                      {ACCOUNT_COPY.CHECKOUT.surchargeLabel}&nbsp;
                      <InfoTooltip
                        icon={'question-circle'}
                        infoPlacement={'auto-end'}
                        message={surchargeMessage}
                        toolTipId={'tooltip-right-surcharge-info'}
                        showToolTips={settings?.showToolTips ?? true}
                      />
                    </span>

                    {fee() ? accounting.formatMoney(fee()) : '$0.00'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <p id='surcharge-info'>
                      {APP.CHECKOUT.SURCHARGE.INFO[0]}
                      <span
                        onClick={handleClick}
                        className={'natural-link'}
                      >
                        {APP.CHECKOUT.SURCHARGE.INFO[1]}
                      </span>
                    </p>
                  </ListGroup.Item>
                  <ListGroup.Item
                    id={'checkout-total'}
                    aria-label={'Checkout total'}
                  >
                    {ACCOUNT_COPY.CHECKOUT.totalLabel}
                    <span
                      id={'checkout-total-amount'}
                      aria-label={'Checkout total amount'}
                    >
                      {(donation as number) + fee()
                        ? accounting.formatMoney((donation as number) + fee())
                        : '$0.00'}
                    </span>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card.Body>

      <Card.Footer>
        {(settings?.showToolTips ?? true) && (
          <div className='what-happens-next-tip d-flex align-items-center justify-content-end gap-1 pt-2 mb-1 pt-lg-0 m-lg-2 '>
            <span className='small inconsolata'>
              {CELEBRATE_COPY.PAYMENT.title}
            </span>
            <InfoTooltip
              showToolTips={settings?.showToolTips ?? true}
              toolTipId={'payment-stockpiling-tooltip'}
              message={CELEBRATE_COPY.PAYMENT.helper}
              icon={'question-circle'}
              infoPlacement={'top'}
            />
          </div>
        )}

        <PaymentForm
          tipLimitReached={tipLimitReached}
          setDonorId={setDonorId}
          bill={bill}
          {...props}
        />
      </Card.Footer>
    </Card>
  );
};

export default React.memo(Checkout);
