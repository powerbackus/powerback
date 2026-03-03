import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  Col,
  Row,
  Card,
  Alert,
  Stack,
  Button,
  Figure,
  Spinner,
} from 'react-bootstrap';
import {
  useAuth,
  useDevice,
  useNavigation,
  useDonationState,
  type UserData,
  type ShowAlert,
} from '@Contexts';
import { ALERT_TIMEOUT, CONFIRMATION_COPY, INITIAL_ALERTS } from '@CONSTANTS';
import { Socials, ShareButton } from '@Components/interactive';
import { getDemoDonationsByPol } from '../../../../demoMode';
import type { Celebration, DonationStateProp } from '@Types';
import StyledAlert from '@Components/alerts/StyledAlert';
import { BtcQrPlaceholder } from './content';
import type { PolDonations } from '@API';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { tweetDonation } from '@Utils';
import accounting from 'accounting';
import { useSpinner } from '@Hooks';
import useFireworks from './hooks';
import { Bill } from '@Interfaces';
import API from '@API';
import {
  CelebrationAnnouncement,
  CongratulationsMessage,
  WhatHappensNext,
  EscrowTotal,
  ContactUs,
  TipTitle,
  DemoCta,
  HelpAsk,
} from './content';
import './style.css';

/**
 * Confirmation component for displaying celebration completion.
 * Final step of the celebration flow; congratulations, sharing, restart.
 *
 * Structure-focused behavior:
 * - Displays congratulations message, sharing options, Bitcoin donation information, tip message, help ask, and contact us information
 * - Displays restart funnel button
 * - Displays confetti animation on completion
 * - Displays copy notification on address copy
 * - Displays social media sharing options
 * - Displays restart funnel button
 *
 * @module Confirmation/Confirmation
 * @component
 * @param {DonationStateProp & { isDemoMode: boolean }} props
 * @param {boolean} props.isDemoMode - Whether the app is in demo mode
 * @param {number} props.donation - The donation amount
 * @param {Bill} props.bill - The bill
 * @param {number} props.tip - The tip amount
 */

const Confirmation = ({
  isDemoMode,
  donation,
  bill,
  tip,
}: DonationStateProp & { isDemoMode: boolean }) => {
  /* Contexts */
  const { polData, resetDonationState } = useDonationState(),
    { navigateToFunnel } = useNavigation(),
    { userData } = useAuth();

  /* custom hook */
  const [showRefreshAppSpinner, { start: startSpinner, stop: stopSpinner }] =
    useSpinner();

  const [escrowForPol, setEscrowForPol] = useState<{
    donation: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!polData?.id) return;
    if (isDemoMode) {
      const byPol = getDemoDonationsByPol();
      const entry = byPol.find((c) => c.pol_id === polData.id);
      setEscrowForPol(
        entry && entry.donation > 0
          ? { donation: entry.donation, count: entry.count }
          : null
      );
      return;
    }
    API.getWhatPolsHaveInEscrow()
      .then(({ data }) => {
        const list = data as PolDonations[];
        const entry = list.find((c) => c.pol_id === polData.id);
        setEscrowForPol(
          entry && entry.donation > 0
            ? { donation: entry.donation, count: entry.count }
            : null
        );
      })
      .catch(() => setEscrowForPol(null));
  }, [polData?.id, isDemoMode]);

  const newDonation = useMemo(
    () =>
      userData &&
      (!userData.donations
        ? []
        : userData.donations[userData.donations.length - 1]),
    [userData]
  );

  const makeTweet = useCallback(
    () => tweetDonation(bill as Bill, newDonation as Celebration),
    [bill, newDonation]
  );

  const prevNewDonationRef = useRef(newDonation);

  useEffect(() => {
    if (
      !newDonation ||
      !Object.keys(newDonation).length ||
      !(newDonation as Celebration).twitter ||
      (newDonation as Celebration).twitter === '' ||
      prevNewDonationRef.current === newDonation
    ) {
      return;
    }
    prevNewDonationRef.current = newDonation;
    if ((userData as UserData).settings?.autoTweet) makeTweet();
  }, [newDonation, userData, makeTweet]);

  const displayName = useMemo(() => userData?.firstName || '', [userData]);

  const restartFunnel = useCallback(() => {
    startSpinner();
    try {
      resetDonationState();
      navigateToFunnel('pol-donation');
    } catch (error) {
      console.error('Error restarting funnel:', error);
    } finally {
      stopSpinner();
    }
  }, [startSpinner, stopSpinner, resetDonationState, navigateToFunnel]);

  const { isMobile } = useDevice();

  const [btcAddress, setBtcAddress] = useState<string>('');
  const [btcError, setBtcError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] =
    useState<ShowAlert>(INITIAL_ALERTS);

  // Fireworks animation
  useFireworks();

  // Fetch BTC address from API
  useEffect(() => {
    const storageKey = 'pb:btcAddress';
    const cachedAddress = sessionStorage.getItem(storageKey);

    // If cached address is found, parse and set it
    if (cachedAddress) {
      try {
        const parsed = JSON.parse(cachedAddress);
        setBtcAddress(parsed);
        setBtcError(null);
        return;
      } catch {
        // If parsing fails, remove the cached address
        sessionStorage.removeItem(storageKey);
      }
    }

    API.getBTCAddress()
      .then((response) => {
        const address = response.data.address;
        setBtcAddress(address);
        setBtcError(null);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(address));
        } catch {
          // ignore
        }
      })
      .catch((error) => {
        console.error('Failed to fetch BTC address:', error);
        const errorMessage =
          error.response?.data?.error?.message ||
          error.message ||
          'Failed to generate Bitcoin address';
        setBtcError(errorMessage);
        setBtcAddress('');
      });
  }, []);

  const handleCopyAddress = useCallback(async () => {
    if (!btcAddress) return;
    try {
      await navigator.clipboard.writeText(btcAddress);
      setShowCopyNotification((s) => ({ ...s, update: true }));
    } catch (error) {
      console.error('Failed to copy address to clipboard:', error);
    }
  }, [btcAddress]);

  const shareAccounts = useMemo(
    () => ({
      truthSocial: polData?.truth_social || '',
      facebook: polData?.facebook || '',
      mastodon: polData?.mastodon || '',
      bluesky: polData?.bluesky || '',
      twitter: polData?.twitter || '',
      youtube: polData?.youtube || '',
    }),
    [polData]
  );

  const shareExtras = useMemo(
    () =>
      escrowForPol?.donation
        ? CONFIRMATION_COPY.ESCROW_TOTAL_SHARE(
            accounting.formatMoney(escrowForPol.donation)
          )
        : undefined,
    [escrowForPol]
  );

  const SocialsElement = useMemo(
    () => (
      <Socials
        bill={bill as Bill}
        accounts={shareAccounts}
        shareExtras={shareExtras}
      />
    ),
    [bill, shareAccounts, shareExtras]
  );

  const ShareDropdownElement = useMemo(
    () => (
      <ShareButton
        bill={bill as Bill}
        accounts={shareAccounts}
        shareExtras={shareExtras}
      />
    ),
    [bill, shareAccounts, shareExtras]
  );

  return (
    <>
      {/* Bitcoin address clipboard copy notification */}
      {showCopyNotification.update &&
        createPortal(
          <StyledAlert
            message={' Bitcoin address has been copied to clipboard!'}
            alertClass={'copy-notification'}
            setShow={setShowCopyNotification}
            show={showCopyNotification}
            time={ALERT_TIMEOUT.copy}
            icon={'clipboard-check'}
            iconClass={'text-info'}
            dismissible={true}
            type={'update'}
          />,
          document.body
        )}
      {!isDemoMode && !isMobile && (
        <Alert
          className={'success-message'}
          variant={'success'}
        >
          <div>
            <CongratulationsMessage displayName={displayName} />
          </div>
        </Alert>
      )}

      <Card className='success-message checkout-card'>
        {(showRefreshAppSpinner && (
          <Spinner
            className={'reset-spinner pb-2'}
            animation={'border'}
            role={'status'}
          >
            <span className={'visually-hidden'}>Processing Celebration...</span>
          </Spinner>
        )) || (
          <>
            <Card.Header className={'px-4 py-lg-3'}>
              <Row>
                {/* Celebration announcement */}
                {isDemoMode ? (
                  <DemoCta />
                ) : (
                  <Col
                    className='pb-lg-2 pb-2 d-flex flex-column align-items-start'
                    xs={7}
                  >
                    <CelebrationAnnouncement
                      donation={donation as number}
                      pol={polData}
                    />
                    <EscrowTotal escrowForPol={escrowForPol} />
                  </Col>
                )}
                {/* Share buttons */}
                <Col className='d-flex justify-content-end align-items-center'>
                  {!isDemoMode &&
                    (isMobile ? ShareDropdownElement : SocialsElement)}
                </Col>
              </Row>
            </Card.Header>

            <Card.Body>
              <WhatHappensNext
                isDemoMode={isDemoMode}
                bill={bill as Bill}
              />
            </Card.Body>

            <Card.Footer className={'py-1 px-2 mb-2'}>
              <Stack
                className={'direct-support p-lg-2 pb-lg-0'}
                direction={'horizontal'}
                gap={3}
              >
                <Stack
                  direction={'vertical'}
                  gap={0}
                >
                  <TipTitle tip={isDemoMode ? 0 : tip} />
                  <HelpAsk isMobile={isMobile} />
                  {isMobile && !isDemoMode && (
                    <>
                      <br />
                      <ContactUs />
                      <hr />
                    </>
                  )}
                </Stack>

                <div className={'btc'}>
                  <i className={'bi bi-currency-bitcoin'} />
                  <Figure>
                    {btcAddress ? (
                      <QRCodeSVG
                        size={80}
                        level='M'
                        value={btcAddress}
                        className={'btc-qr mt-1'}
                      />
                    ) : btcError ? (
                      <BtcQrPlaceholder
                        variant='error'
                        title={btcError}
                      />
                    ) : (
                      <BtcQrPlaceholder variant='loading' />
                    )}

                    <Figure.Caption
                      className={'btc-address to-clipboard mt-lg-1'}
                      onClick={handleCopyAddress}
                      style={{
                        cursor: btcAddress ? 'pointer' : 'default',
                        color: btcError ? 'var(--bs-danger)' : undefined,
                      }}
                      title={btcError || undefined}
                    >
                      {btcAddress || btcError || 'Loading...'}
                    </Figure.Caption>
                  </Figure>
                </div>
              </Stack>

              {!isMobile && !isDemoMode && <ContactUs />}

              <Button
                variant={'outline-secondary'}
                id={'restart-funnel-button'}
                onClick={restartFunnel}
                type={'button'}
              >
                Return to Lobby
              </Button>
            </Card.Footer>
          </>
        )}
      </Card>
    </>
  );
};

export default React.memo(Confirmation);
