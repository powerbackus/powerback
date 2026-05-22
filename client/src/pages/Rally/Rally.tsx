/**
 * Rally page: share-first funnel between Splash and Lobby.
 *
 * Does not POST share-links on mount; generate is explicit only.
 * Inbound attribution uses pb:refShareCode at signup, not on this page directly.
 *
 * @module Rally
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Stack,
} from 'react-bootstrap';
import { ContinueBtn } from '@Components/buttons';
import API from '@API';
import { APP, RALLY_COPY, SPLASH_COPY } from '@CONSTANTS';
import {
  useDialogue,
  useDonationState,
  useNavigation,
  type CredentialsFormView,
} from '@Contexts';
import {
  getStoredShareLink,
  setStoredShareLink,
  type StoredShareLink,
  trackGoogleAnalyticsEvent,
  hasShareInboundThisSession,
  handleKeyDown,
  storage,
} from '@Utils';
import { logError } from '@Utils/logging';
import './style.css';

/** Session dedupe for rally_page_seen (pb:rallySeen). */
const RALLY_SEEN_KEY = 'rallySeen';

type RallyClipboardLineProps = {
  value: string;
  className: string;
  copyLabel: string;
  onCopy: () => void;
};

/**
 * Copyable text with clipboard icon (Confirmation btc-address pattern).
 *
 * @param props - Line props
 * @param props.value - Text to display and copy
 * @param props.className - e.g. rally--share-url
 * @param props.copyLabel - aria-label for clipboard control
 * @param props.onCopy - Fires share_link_copied with target url
 */
const RallyClipboardLine = ({
  value,
  className,
  copyLabel,
  onCopy,
}: RallyClipboardLineProps) => (
  <div className='rally--clipboard-line'>
    <span
      className={`${className} to-clipboard`}
      role='button'
      tabIndex={0}
      onClick={() => void onCopy()}
      onKeyDown={(e) => handleKeyDown(e, onCopy)}
    >
      {value}
    </span>
    <button
      type='button'
      className='rally--clipboard-icon-btn'
      aria-label={copyLabel}
      onClick={() => void onCopy()}
    >
      <i
        className='bi bi-clipboard powerback'
        aria-hidden
      />
    </button>
  </div>
);

/**
 * Rally page component — share-first guest funnel step.
 *
 * @returns Rally layout with manual share, anonymous link, email, and continue CTA
 */
const Rally = () => {
  const { navigateToSplashView } = useNavigation();
  const { setShowModal } = useDialogue();
  const { setCredentialsPath } = useDonationState();

  const [storedLink, setStoredLink] = useState<StoredShareLink | null>(() =>
    getStoredShareLink()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showClaimCode, setShowClaimCode] = useState(false);
  const [justCreatedClaim, setJustCreatedClaim] = useState(false);
  const [email, setEmail] = useState('');
  const [emailNotice, setEmailNotice] = useState(false);
  const manualShareSeenRef = useRef(false);

  const siteUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? window.location.origin + '/'
        : `https://${APP.SHARED_DOMAIN}/`,
    []
  );

  const suggestedMessage = useMemo(
    () => `${RALLY_COPY.MANUAL_SHARE.messageTemplate} ${siteUrl}`,
    [siteUrl]
  );

  useEffect(() => {
    if (storage.session.getItem(RALLY_SEEN_KEY)) {
      return;
    }
    storage.session.setItem(RALLY_SEEN_KEY, '1');
    trackGoogleAnalyticsEvent('rally_page_seen', {
      entry: hasShareInboundThisSession() ? 'share' : 'splash',
    });
  }, []);

  const markManualShareSeen = useCallback(() => {
    if (manualShareSeenRef.current) {
      return;
    }
    manualShareSeenRef.current = true;
    trackGoogleAnalyticsEvent('rally_manual_share_seen');
  }, []);

  const copyText = useCallback(
    async (text: string, target: 'url' | 'claim') => {
      try {
        await navigator.clipboard.writeText(text);
        trackGoogleAnalyticsEvent('share_link_copied', { target });
      } catch (error) {
        logError('Rally copy failed', error);
      }
    },
    []
  );

  const handleGenerateLink = useCallback(async () => {
    if (isGenerating || storedLink) {
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const { data } = await API.createShareLink();
      const next: StoredShareLink = {
        publicCode: data.publicCode,
        claimCode: data.claimCode,
        shareUrl: data.shareUrl,
      };
      setStoredShareLink(next);
      setStoredLink(next);
      setJustCreatedClaim(true);
      setShowClaimCode(true);
      trackGoogleAnalyticsEvent('share_link_generated');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 429) {
        setGenerateError(RALLY_COPY.ANONYMOUS_LINK.rateLimit);
      } else {
        setGenerateError('Could not create a share link. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, storedLink]);

  const handleContinueToLobby = useCallback(() => {
    trackGoogleAnalyticsEvent('rally_continue_to_lobby_click');
    navigateToSplashView('Tour');
  }, [navigateToSplashView]);

  const openCredentials = useCallback(
    (path: CredentialsFormView) => {
      setCredentialsPath(path);
      setShowModal((s) => ({ ...s, credentials: true }));
    },
    [setCredentialsPath, setShowModal]
  );

  const handleEmailFocus = useCallback(() => {
    trackGoogleAnalyticsEvent('rally_email_signup_started');
  }, []);

  const handleEmailSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    trackGoogleAnalyticsEvent('rally_email_signup_started');
    setEmailNotice(true);
    setEmail('');
  }, []);

  const handleNativeShare = useCallback(async () => {
    markManualShareSeen();
    if (!navigator.share) {
      await copyText(suggestedMessage, 'url');
      return;
    }
    try {
      await navigator.share({
        title: SPLASH_COPY.SPLASH.SLOGAN,
        text: suggestedMessage,
        url: siteUrl,
      });
    } catch {
      // User cancelled or unsupported
    }
  }, [copyText, markManualShareSeen, siteUrl, suggestedMessage]);

  return (
    <Container
      fluid
      id='rally--page'
      className='d-flex align-items-center justify-content-center'
    >
      <Container
        id='rally'
        className='rally-page'
      >
        <section
          className='rally--hero text-center'
          aria-labelledby='rally-headline'
        >
          <h1
            id='rally-headline'
            className='rally--headline'
          >
            {RALLY_COPY.HERO.headline}
          </h1>
          <p className='rally--subcopy'>{RALLY_COPY.HERO.subcopy}</p>
        </section>

        <div className='rally--actions-row'>
          <section
            className='rally--section rally--manual-share'
            aria-labelledby='rally-manual-title'
            onFocus={markManualShareSeen}
            onMouseEnter={markManualShareSeen}
          >
            <h2
              id='rally-manual-title'
              className='rally--section-title'
            >
              {RALLY_COPY.MANUAL_SHARE.title}
            </h2>
            <p className='rally--hint'>{RALLY_COPY.MANUAL_SHARE.hint}</p>
            <Stack
              direction='horizontal'
              gap={2}
              className='flex-wrap justify-content-center rally--btn-row'
            >
              <Button
                variant='dark'
                type='button'
                className='rally--copy-btn'
                onClick={() => {
                  markManualShareSeen();
                  void copyText(siteUrl, 'url');
                }}
              >
                {RALLY_COPY.MANUAL_SHARE.copySiteLink}
              </Button>
              <Button
                variant='outline-dark'
                type='button'
                className='rally--copy-btn'
                onClick={() => {
                  markManualShareSeen();
                  void copyText(suggestedMessage, 'url');
                }}
              >
                {RALLY_COPY.MANUAL_SHARE.copyMessage}
              </Button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button
                  variant='outline-dark'
                  type='button'
                  className='rally--copy-btn'
                  onClick={() => void handleNativeShare()}
                >
                  {RALLY_COPY.MANUAL_SHARE.nativeShare}
                </Button>
              )}
            </Stack>
          </section>

          <section
            className='rally--section rally--anonymous-link'
            aria-labelledby='rally-link-title'
          >
            <h2
              id='rally-link-title'
              className='rally--section-title'
            >
              {RALLY_COPY.ANONYMOUS_LINK.title}
            </h2>
            <p className='rally--hint'>{RALLY_COPY.ANONYMOUS_LINK.explain}</p>

            {!storedLink ? (
              <>
                <Button
                  variant='dark'
                  type='button'
                  className='rally--generate-btn button--continue'
                  disabled={isGenerating}
                  onClick={() => void handleGenerateLink()}
                >
                  {isGenerating
                    ? RALLY_COPY.ANONYMOUS_LINK.generating
                    : RALLY_COPY.ANONYMOUS_LINK.generate}
                </Button>
                {generateError && (
                  <Alert
                    variant='danger'
                    className='mt-2'
                    dismissible
                    onClose={() => setGenerateError(null)}
                  >
                    {generateError}
                  </Alert>
                )}
              </>
            ) : (
              <div className='rally--link-panel'>
                <div className='rally--link-url-block'>
                  <span className='rally--link-url-label'>Share link</span>
                  <RallyClipboardLine
                    value={storedLink.shareUrl}
                    className='rally--share-url'
                    copyLabel={RALLY_COPY.ANONYMOUS_LINK.copyUrl}
                    onCopy={() => void copyText(storedLink.shareUrl, 'url')}
                  />
                </div>

                <div
                  className={
                    justCreatedClaim
                      ? 'rally--claim-block'
                      : 'rally--claim-block rally--claim-block--compact'
                  }
                >
                  <div
                    className={
                      justCreatedClaim
                        ? 'rally--claim-warning-slot'
                        : 'rally--claim-warning-slot rally--claim-warning-slot--empty'
                    }
                    aria-hidden={!justCreatedClaim}
                  >
                    <p
                      className={
                        justCreatedClaim
                          ? 'rally--claim-warning'
                          : 'rally--claim-warning rally--claim-slot--hidden'
                      }
                    >
                      {RALLY_COPY.ANONYMOUS_LINK.claimWarning}
                    </p>
                  </div>
                  <Button
                    variant='link'
                    type='button'
                    className='rally--reveal-claim p-0'
                    aria-expanded={showClaimCode}
                    onClick={() => setShowClaimCode((v) => !v)}
                  >
                    {showClaimCode
                      ? RALLY_COPY.ANONYMOUS_LINK.hideClaim
                      : RALLY_COPY.ANONYMOUS_LINK.revealClaim}
                  </Button>
                  <div
                    className={
                      showClaimCode
                        ? 'rally--claim-code-row'
                        : 'rally--claim-code-row rally--claim-slot--hidden'
                    }
                    aria-hidden={!showClaimCode}
                  >
                    <span className='rally--claim-display'>
                      {storedLink.claimCode}
                    </span>
                    <Button
                      variant='outline-dark'
                      type='button'
                      size='sm'
                      className='rally--claim-copy-btn'
                      onClick={() =>
                        void copyText(storedLink.claimCode, 'claim')
                      }
                    >
                      {RALLY_COPY.ANONYMOUS_LINK.copyClaim}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section
            className='rally--section rally--email'
            aria-labelledby='rally-email-title'
          >
            <h2
              id='rally-email-title'
              className='rally--section-title rally--section-title--secondary'
            >
              {RALLY_COPY.EMAIL.title}
            </h2>
            <p className='rally--hint'>{RALLY_COPY.EMAIL.hint}</p>
            <Form onSubmit={handleEmailSubmit}>
              <Row className='rally--email-form g-2'>
                <Col
                  xs={12}
                  md={6}
                >
                  <Form.Control
                    type='email'
                    name='rally-email'
                    autoComplete='email'
                    placeholder={RALLY_COPY.EMAIL.placeholder}
                    value={email}
                    onFocus={handleEmailFocus}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Col>
                <Col
                  xs='auto'
                  className='d-flex align-items-center'
                >
                  <Button
                    variant='outline-dark'
                    type='submit'
                  >
                    {RALLY_COPY.EMAIL.submit}
                  </Button>
                </Col>
              </Row>
            </Form>
            {emailNotice && (
              <p className='rally--email-todo mt-2'>
                {RALLY_COPY.EMAIL.todoNotice}
              </p>
            )}
          </section>
        </div>

        <section className='rally--section rally--continue text-center'>
          <ContinueBtn
            classProp='rally--continue-btn button--continue'
            handleClick={handleContinueToLobby}
            label={RALLY_COPY.CONTINUE.label}
            variant='dark'
            type='button'
            size='lg'
          />
          <small className='rally--disclaimer d-block mt-2'>
            {RALLY_COPY.CONTINUE.disclaimer}
          </small>
        </section>

        <section className='rally--section rally--account text-center'>
          <Button
            variant='link'
            type='button'
            className='rally--account-link'
            onClick={() => openCredentials('Join Now')}
          >
            {RALLY_COPY.ACCOUNT.join}
          </Button>
          <span
            className='rally--account-sep'
            aria-hidden
          >
            {' '}
            ·{' '}
          </span>
          <Button
            variant='link'
            type='button'
            className='rally--account-link'
            onClick={() => openCredentials('Sign In')}
          >
            {RALLY_COPY.ACCOUNT.signIn}
          </Button>
        </section>
      </Container>
    </Container>
  );
};

export default React.memo(Rally);
