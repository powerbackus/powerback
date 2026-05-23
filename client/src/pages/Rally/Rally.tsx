/**
 * Rally page: share-first funnel between Splash and Lobby.
 *
 * Does not POST share-links on mount; generate is explicit only.
 * Inbound attribution uses pb:refShareCode at signup, not on this page directly.
 *
 * @module Rally
 */
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import API from '@API';
import {
  GIT_REPO,
  RALLY_COPY,
  SPLASH_COPY,
  PATREON_URL,
  TWITTER_URL,
  ALERT_TIMEOUT,
  DISCORD_INVITE,
  INITIAL_ALERTS,
  RALLY_SHARE_PLATFORMS,
  type RallySharePlatform,
} from '@CONSTANTS';
import {
  storage,
  logError,
  handleKeyDown,
  getStoredShareLink,
  setStoredShareLink,
  getStoredRefShareCode,
  type StoredShareLink,
  trackGoogleAnalyticsEvent,
  hasShareInboundThisSession,
} from '@Utils';
import { createPortal } from 'react-dom';
import { StyledAlert } from '@Components/alerts';
import { GenericBtn, SubmitBtn } from '@Components/buttons';
import { useNavigation, type ShowAlert } from '@Contexts';
import RallyCarouselBackdrop from './RallyCarouselBackdrop';
import { Form, Stack, Container } from 'react-bootstrap';
import {
  buildSuggestedShareMessage,
  getRallySiteUrl,
  resolveRallyShareUrl,
} from './fn';
import './style.css';

/** Session dedupe for rally_page_seen (pb:rallySeen). */
const RALLY_SEEN_KEY = 'rallySeen';

/** Web Share API (runtime-only; DOM types always include `share`). */
const canUseNativeShare =
  typeof navigator !== 'undefined' && 'share' in navigator;

type RallyCopyTarget = 'url' | 'claim' | 'message';

type RallyClipboardLineProps = {
  value: string;
  className: string;
  copyLabel: string;
  onCopy: () => void;
};

/**
 * Copyable text with clipboard icon (Confirmation btc-address pattern).
 *
 * @param props - Clipboard line props
 * @param props.onCopy - Invoked for span click, keyboard, and icon button
 * @param props.value - URL or code shown and copied
 * @param props.className - Display class (e.g. rally--share-url)
 * @param props.copyLabel - Accessible name for icon-only GenericBtn
 */
const RallyClipboardLine = ({
  onCopy,
  value,
  className,
  copyLabel,
}: RallyClipboardLineProps) => (
  <div className='rally--clipboard-line'>
    <span
      role='button'
      tabIndex={0}
      className={`${className} to-clipboard`}
      onClick={() => void onCopy()}
      onKeyDown={(e) => handleKeyDown(e, onCopy)}
    >
      {value}
    </span>
    <GenericBtn
      label={copyLabel}
      cls='rally--clipboard-icon-btn'
      onPress={onCopy}
    >
      <i
        className='bi bi-clipboard powerback'
        aria-hidden
      />
    </GenericBtn>
  </div>
);

/**
 * Rally page component — share-first guest funnel step.
 *
 * Layout: faded Lobby underlay (RallyCarouselBackdrop) + foreground card.
 * GA: coarse copy events only; no emails, codes, or full share URLs in params.
 */
const Rally = () => {
  const { navigateToSplashView } = useNavigation();

  const [storedLink, setStoredLink] = useState<StoredShareLink | null>(() =>
    getStoredShareLink()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [sharePlatform, setSharePlatform] =
    useState<RallySharePlatform>('generic');
  const [showCopyNotification, setShowCopyNotification] =
    useState<ShowAlert>(INITIAL_ALERTS);
  const [copyNotificationMessage, setCopyNotificationMessage] = useState('');
  const manualShareSeenRef = useRef(false);

  const siteUrl = useMemo(() => getRallySiteUrl(), []);

  const publicShareUrl = useMemo(
    () => resolveRallyShareUrl(siteUrl, storedLink?.shareUrl),
    [siteUrl, storedLink?.shareUrl]
  );

  const suggestedMessage = useMemo(
    () => buildSuggestedShareMessage(sharePlatform, publicShareUrl),
    [sharePlatform, publicShareUrl]
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

  const showCopyToast = useCallback((message: string) => {
    setCopyNotificationMessage(message);
    setShowCopyNotification((s) => ({ ...s, update: true }));
  }, []);

  const copyText = useCallback(
    async (
      text: string,
      target: RallyCopyTarget,
      options?: { platform?: RallySharePlatform; location?: string }
    ) => {
      try {
        await navigator.clipboard.writeText(text);
        const toastByTarget: Record<RallyCopyTarget, string> = {
          url: RALLY_COPY.MANUAL_SHARE.copyUrlSuccess,
          claim: RALLY_COPY.MANUAL_SHARE.copyClaimSuccess,
          message: RALLY_COPY.MANUAL_SHARE.copyMessageSuccess,
        };
        showCopyToast(toastByTarget[target]);
        trackGoogleAnalyticsEvent('share_link_copied', {
          target,
          ...(options?.platform ? { platform: options.platform } : {}),
          ...(options?.location ? { location: options.location } : {}),
        });
      } catch (error) {
        logError('Rally copy failed', error);
      }
    },
    [showCopyToast]
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

  const handleEmailFocus = useCallback(() => {
    trackGoogleAnalyticsEvent('rally_email_signup_started');
  }, []);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed || isEmailSubmitting) {
        return;
      }
      trackGoogleAnalyticsEvent('rally_email_signup_started');
      setIsEmailSubmitting(true);
      setEmailError(null);
      setEmailSuccess(false);
      const sourcePublicCode = getStoredRefShareCode();
      try {
        await API.createRallySubscriber({
          email: trimmed,
          ...(sourcePublicCode ? { source_public_code: sourcePublicCode } : {}),
        });
        setEmailSuccess(true);
        setEmail('');
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 429) {
          setEmailError(RALLY_COPY.EMAIL.rateLimit);
        } else {
          setEmailError(RALLY_COPY.EMAIL.errorGeneric);
        }
      } finally {
        setIsEmailSubmitting(false);
      }
    },
    [email, isEmailSubmitting]
  );

  const handleNativeShare = useCallback(async () => {
    markManualShareSeen();
    if (!canUseNativeShare) {
      await copyText(suggestedMessage, 'message', {
        platform: sharePlatform,
        location: 'manual',
      });
      return;
    }
    try {
      await navigator.share({
        title: SPLASH_COPY.SPLASH.SLOGAN,
        text: suggestedMessage,
        url: publicShareUrl,
      });
    } catch {
      // User cancelled or unsupported
    }
  }, [
    copyText,
    markManualShareSeen,
    publicShareUrl,
    sharePlatform,
    suggestedMessage,
  ]);

  return (
    <>
      {showCopyNotification.update &&
        createPortal(
          <StyledAlert
            message={copyNotificationMessage}
            alertClass='copy-notification'
            setShow={setShowCopyNotification}
            show={showCopyNotification}
            time={ALERT_TIMEOUT.copy}
            icon='clipboard-check'
            iconClass='text-info'
            dismissible
            type='update'
          />,
          document.body
        )}

      <Container
        fluid
        id='rally--page'
        className='rally--page-shell'
      >
        <RallyCarouselBackdrop />
        <div className='rally--foreground-wrap d-flex align-items-center justify-content-center'>
          <Container
            id='rally'
            className='rally-page rally-page--foreground'
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

                <Form.Group
                  className='rally--platform-field'
                  controlId='rally-share-platform'
                >
                  <Form.Label className='rally--platform-label'>
                    {RALLY_COPY.MANUAL_SHARE.platformLabel}
                  </Form.Label>
                  <Form.Select
                    aria-label={RALLY_COPY.MANUAL_SHARE.platformLabel}
                    value={sharePlatform}
                    onChange={(e) =>
                      setSharePlatform(e.target.value as RallySharePlatform)
                    }
                  >
                    {RALLY_SHARE_PLATFORMS.map(({ id, label }) => (
                      <option
                        key={id}
                        value={id}
                      >
                        {label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className='rally--suggested-message-block'>
                  <span className='rally--suggested-message-label'>
                    {RALLY_COPY.MANUAL_SHARE.suggestedMessageLabel}
                  </span>
                  <p className='rally--suggested-message-preview'>
                    {suggestedMessage}
                  </p>
                </div>

                <Stack
                  direction='horizontal'
                  gap={2}
                  className='flex-wrap justify-content-center rally--btn-row'
                >
                  <SubmitBtn
                    btnId='rally-copy-message'
                    variant='outline-dark'
                    type='button'
                    classProp='rally--copy-btn'
                    onClick={() => {
                      markManualShareSeen();
                      void copyText(suggestedMessage, 'message', {
                        platform: sharePlatform,
                        location: 'manual',
                      });
                    }}
                    value={RALLY_COPY.MANUAL_SHARE.copyMessage}
                  />
                  {canUseNativeShare && (
                    <SubmitBtn
                      btnId='rally-native-share'
                      variant='outline-dark'
                      type='button'
                      classProp='rally--copy-btn'
                      onClick={() => void handleNativeShare()}
                      value={RALLY_COPY.MANUAL_SHARE.nativeShare}
                    />
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
                <p className='rally--hint'>
                  {RALLY_COPY.ANONYMOUS_LINK.explain}
                </p>

                {!storedLink ? (
                  <>
                    <SubmitBtn
                      btnId='rally-generate-share-link'
                      variant='dark'
                      type='button'
                      classProp='rally--generate-btn button--continue'
                      disabled={isGenerating}
                      onClick={() => void handleGenerateLink()}
                      value={
                        isGenerating
                          ? RALLY_COPY.ANONYMOUS_LINK.generating
                          : RALLY_COPY.ANONYMOUS_LINK.generate
                      }
                    />
                    <div className='rally--feedback-slot'>
                      <div
                        className={`invalid-feedback d-block${
                          generateError ? '' : ' rally--feedback-hidden'
                        }`}
                        role={generateError ? 'alert' : undefined}
                        aria-hidden={!generateError}
                      >
                        {generateError || RALLY_COPY.ANONYMOUS_LINK.rateLimit}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='rally--link-panel'>
                    <p className='rally--claim-warning'>
                      {RALLY_COPY.ANONYMOUS_LINK.claimWarning}
                    </p>
                    <div className='rally--link-url-block'>
                      <span className='rally--link-url-label'>Share link</span>
                      <RallyClipboardLine
                        value={storedLink.shareUrl}
                        className='rally--share-url'
                        copyLabel={RALLY_COPY.ANONYMOUS_LINK.copyUrl}
                        onCopy={() =>
                          void copyText(storedLink.shareUrl, 'url', {
                            location: 'anonymous',
                          })
                        }
                      />
                    </div>
                    <div className='rally--link-url-block'>
                      <span className='rally--link-url-label'>Claim code</span>
                      <RallyClipboardLine
                        value={storedLink.claimCode}
                        className='rally--claim-display'
                        copyLabel={RALLY_COPY.ANONYMOUS_LINK.copyClaim}
                        onCopy={() =>
                          void copyText(storedLink.claimCode, 'claim', {
                            location: 'anonymous',
                          })
                        }
                      />
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
                  className='rally--section-title rally--section-title'
                >
                  {RALLY_COPY.EMAIL.title}
                </h2>
                <p className='rally--hint'>{RALLY_COPY.EMAIL.hint}</p>
                <Form
                  onSubmit={handleEmailSubmit}
                  className='rally--email-form'
                >
                  <Form.Group className='form-input-wfeedback rally--email-field input--translucent'>
                    <Form.Control
                      type='email'
                      name='rally-email'
                      autoComplete='email'
                      placeholder={RALLY_COPY.EMAIL.placeholder}
                      value={email}
                      isInvalid={!!emailError}
                      onFocus={handleEmailFocus}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) {
                          setEmailError(null);
                        }
                        if (emailSuccess) {
                          setEmailSuccess(false);
                        }
                      }}
                      aria-describedby='rally-email-error'
                    />
                    <div className='rally--feedback-slot'>
                      <div
                        className={`invalid-feedback d-block${
                          emailError ? '' : ' rally--feedback-hidden'
                        }`}
                        id='rally-email-error'
                        role={emailError ? 'alert' : undefined}
                        aria-hidden={!emailError}
                      >
                        {emailError || RALLY_COPY.EMAIL.rateLimit}
                      </div>
                    </div>
                  </Form.Group>
                  <SubmitBtn
                    btnId='rally-email-submit'
                    variant='outline-dark'
                    type='submit'
                    classProp='rally--email-submit'
                    disabled={isEmailSubmitting || emailSuccess}
                    ariaLabel={
                      emailSuccess
                        ? RALLY_COPY.EMAIL.submitSuccess
                        : RALLY_COPY.EMAIL.submit
                    }
                    value={
                      <span className='rally--email-submit-inner'>
                        <span
                          className={
                            emailSuccess ? 'rally--feedback-hidden' : undefined
                          }
                          aria-hidden={emailSuccess}
                        >
                          {RALLY_COPY.EMAIL.submit}
                        </span>
                        <i
                          className={`bi bi-check-lg rally--email-submit-check${
                            emailSuccess ? '' : ' rally--feedback-hidden'
                          }`}
                          aria-hidden
                        />
                      </span>
                    }
                  />
                  <div className='rally--email-status-slot'>
                    <p
                      className={`rally--email-success${
                        emailSuccess ? '' : ' rally--feedback-hidden'
                      }`}
                      role={emailSuccess ? 'status' : undefined}
                      aria-hidden={!emailSuccess}
                    >
                      {RALLY_COPY.EMAIL.success}
                    </p>
                  </div>
                </Form>
              </section>
            </div>

            <section className='rally--section rally--continue text-center'>
              <SubmitBtn
                btnId='rally-continue-to-lobby'
                classProp='splash-enter--btn rally--continue-btn button--continue'
                onClick={handleContinueToLobby}
                value={RALLY_COPY.CONTINUE.label}
                variant='dark'
                type='button'
                size='lg'
              />
              <small className='rally--disclaimer d-block mt-2'>
                {RALLY_COPY.CONTINUE.disclaimer}
              </small>
            </section>

            <footer className='rally--social-footer text-center'>
              <p className='rally--social-blurb'>
                {RALLY_COPY.SOCIAL.discordBlurb}
              </p>
              <nav
                className='rally--social-links'
                aria-label='POWERBACK community links'
              >
                <a
                  href={DISCORD_INVITE}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rally--social-link'
                >
                  <i
                    className='bi bi-discord'
                    aria-hidden
                  />
                  <span>{RALLY_COPY.SOCIAL.discordLabel}</span>
                </a>
                <a
                  href={GIT_REPO}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rally--social-link'
                >
                  <i
                    className='bi bi-github'
                    aria-hidden
                  />
                  <span>{RALLY_COPY.SOCIAL.githubLabel}</span>
                </a>
                {PATREON_URL && (
                  <a
                    href={PATREON_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='rally--social-link'
                  >
                    <i
                      className='bi bi-heart'
                      aria-hidden
                    />
                    <span>{RALLY_COPY.SOCIAL.patreonLabel}</span>
                  </a>
                )}
                <a
                  href={TWITTER_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rally--social-link'
                >
                  <i
                    className='bi bi-twitter-x'
                    aria-hidden
                  />
                  <span>{RALLY_COPY.SOCIAL.xLabel}</span>
                </a>
              </nav>
            </footer>
          </Container>
        </div>
      </Container>
    </>
  );
};

export default React.memo(Rally);
