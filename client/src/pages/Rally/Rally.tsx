/**
 * Rally page: share-first guest funnel between Splash and Lobby.
 *
 * Owns share-link generate, clipboard copy, email signup, and continue-to-Lobby
 * navigation. UI sections live in `./subcomps`; copy in `@CONSTANTS` `RALLY_COPY`.
 *
 * @module Rally
 *
 * KEY FUNCTIONS
 * - `copyText` — clipboard + toast + GA (no PII in event params)
 * - `handleGenerateLink` — explicit POST share-link; persists `pb:shareLink`
 * - `handleEmailSubmit` — rally subscriber signup with optional ref attribution
 * - `handleContinueToLobby` — navigates splash Tour → funnel
 *
 * FLOW
 * CarouselBackdrop (decorative) → hero → SupportActions → continue CTA → social footer
 */
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevice, useNavigation, type ShowAlert } from '@Contexts';
import { SubmitBtn } from '@Components/buttons';
import { CarouselBackdrop, SupportActions } from './subcomps';
import { StyledAlert } from '@Components/alerts';
import { Container } from 'react-bootstrap';
import {
  GIT_REPO,
  RALLY_COPY,
  SPLASH_COPY,
  PATREON_URL,
  TWITTER_URL,
  ALERT_TIMEOUT,
  DISCORD_INVITE,
  INITIAL_ALERTS,
  type RallySocialLink,
  type RallySupportTab,
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
  getTrackedLink,
} from '@Utils';
import {
  getRallySiteUrl,
  resolveRallyShareUrl,
  buildSuggestedShareMessage,
} from './fn';
import API from '@API';
import './style.css';

/** Session dedupe for rally_page_seen (pb:rallySeen). */
const RALLY_SEEN_KEY = 'rallySeen';

/** Web Share API (runtime-only; DOM types always include `share`). */
const canUseNativeShare =
  typeof navigator !== 'undefined' && 'share' in navigator;

/** Clipboard copy target for toast copy and GA `share_link_copied` events. */
type RallyCopyTarget = 'url' | 'claim' | 'message';

/**
 * Props for {@link RallyClipboardLine} (injected into SupportActions as ClipboardLine).
 *
 * @property value - URL or claim code displayed and copied
 * @property className - Display class (e.g. rally--share-url)
 * @property copyLabel - Accessible name for click-to-copy control
 * @property onCopy - Invoked for span click, keyboard, and icon button
 */
type RallyClipboardLineProps = {
  onCopy: () => void;
  className: string;
  copyLabel: string;
  value: string;
};

/**
 * Copyable text row for share link / claim code (click or keyboard to copy).
 *
 * @param props - Clipboard line props
 * @param props.onCopy - Invoked for span click and keyboard
 * @param props.value - URL or code shown and copied
 * @param props.className - Display class (e.g. rally--share-url)
 * @param props.copyLabel - Accessible name for the copy control
 */
const RallyClipboardLine = ({
  onCopy,
  className,
  copyLabel,
  value,
}: RallyClipboardLineProps) => (
  <div className={'rally--clipboard-line'}>
    <span
      onKeyDown={(e) => handleKeyDown(e, onCopy)}
      className={`${className} to-clipboard`}
      onClick={() => void onCopy()}
      role={'button'}
      title={value}
      aria-label={copyLabel}
      tabIndex={0}
    >
      {value}
    </span>
  </div>
);

/**
 * Rally page component — share-first guest funnel step.
 *
 * Layout: faded Lobby underlay ({@link CarouselBackdrop}) + foreground card
 * ({@link SupportActions}, continue CTA, social footer). Does not POST
 * share-links on mount; generate is explicit only. Inbound attribution uses
 * `pb:refShareCode` at email signup, not on this page directly.
 *
 * @returns Rally page shell with optional copy toast portal
 */
const Rally = () => {
  const { navigateToSplashView } = useNavigation();
  const { isTabletLandscape } = useDevice();

  const [activeSupportTab, setActiveSupportTab] =
    useState<RallySupportTab>('tell');
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
  const [socialHover, setSocialHover] = useState<RallySocialLink | null>(null);

  /** Social footer blurb: platform-specific on hover/focus, Discord copy otherwise. */
  const socialBlurb = useMemo(
    () =>
      socialHover
        ? RALLY_COPY.SOCIAL.hoverBlurbs[socialHover]
        : RALLY_COPY.SOCIAL.hoverBlurbs['discord'],
    [socialHover]
  );

  /** UTM + GA click tracking on footer outbound links (medium rally). */
  const rallySocialLinks = useMemo(
    () => ({
      discord: getTrackedLink(
        DISCORD_INVITE || 'https://powerback.us/discord',
        { medium: 'rally', content: 'discord' },
        RALLY_COPY.SOCIAL.discordLabel
      ),
      github: getTrackedLink(
        GIT_REPO,
        { medium: 'rally', content: 'github' },
        RALLY_COPY.SOCIAL.githubLabel
      ),
      patreon: PATREON_URL
        ? getTrackedLink(
            PATREON_URL,
            { medium: 'rally', content: 'patron' },
            RALLY_COPY.SOCIAL.patreonLabel
          )
        : null,
      x: getTrackedLink(
        TWITTER_URL,
        { medium: 'rally', content: 'x' },
        RALLY_COPY.SOCIAL.xLabel
      ),
    }),
    []
  );

  const clearSocialHover = useCallback(() => {
    setSocialHover(null);
  }, []);

  /** Reset social blurb when focus leaves the community links nav. */
  const handleSocialNavBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        clearSocialHover();
      }
    },
    [clearSocialHover]
  );

  const siteUrl = useMemo(() => getRallySiteUrl(), []);

  const publicShareUrl = useMemo(
    () => resolveRallyShareUrl(siteUrl, storedLink?.shareUrl),
    [siteUrl, storedLink?.shareUrl]
  );

  const [shareMessage, setShareMessage] = useState(() =>
    buildSuggestedShareMessage(
      'generic',
      resolveRallyShareUrl(getRallySiteUrl(), getStoredShareLink()?.shareUrl)
    )
  );
  const shareMessageDirtyRef = useRef(false);
  const syncedShareUrlRef = useRef(publicShareUrl);
  const syncedSharePlatformRef = useRef<RallySharePlatform>(sharePlatform);

  /**
   * Keep share message in sync with platform template unless the user edited it.
   * When dirty and a personal share link is created, swap the previous URL in place.
   */
  useEffect(() => {
    const urlChanged = syncedShareUrlRef.current !== publicShareUrl;
    const platformChanged = syncedSharePlatformRef.current !== sharePlatform;

    if (!shareMessageDirtyRef.current && (urlChanged || platformChanged)) {
      setShareMessage(
        buildSuggestedShareMessage(sharePlatform, publicShareUrl)
      );
      syncedShareUrlRef.current = publicShareUrl;
      syncedSharePlatformRef.current = sharePlatform;
      return;
    }

    if (
      shareMessageDirtyRef.current &&
      urlChanged &&
      syncedShareUrlRef.current
    ) {
      const previousUrl = syncedShareUrlRef.current;
      setShareMessage((current) => {
        if (current.includes(previousUrl)) {
          return current.replaceAll(previousUrl, publicShareUrl);
        }
        return `${current.trim()} ${publicShareUrl}`.trim();
      });
      syncedShareUrlRef.current = publicShareUrl;
    }
  }, [sharePlatform, publicShareUrl]);

  const handleShareMessageChange = useCallback((value: string) => {
    shareMessageDirtyRef.current = true;
    setShareMessage(value);
  }, []);

  /** Reset template when platform changes; user edits do not carry across platforms. */
  const handleSharePlatformChange = useCallback(
    (platform: RallySharePlatform) => {
      shareMessageDirtyRef.current = false;
      setSharePlatform(platform);
      setShareMessage(buildSuggestedShareMessage(platform, publicShareUrl));
      syncedShareUrlRef.current = publicShareUrl;
      syncedSharePlatformRef.current = platform;
    },
    [publicShareUrl]
  );

  /** Fire `rally_page_seen` once per tab session (pb:rallySeen). */
  useEffect(() => {
    if (storage.session.getItem(RALLY_SEEN_KEY)) {
      return;
    }
    storage.session.setItem(RALLY_SEEN_KEY, '1');
    trackGoogleAnalyticsEvent('rally_page_seen', {
      entry: hasShareInboundThisSession() ? 'share' : 'splash',
    });
  }, []);

  /** Deduped GA when user engages Tell the People (manual share path). */
  const markManualShareSeen = useCallback(() => {
    if (manualShareSeenRef.current) {
      return;
    }
    manualShareSeenRef.current = true;
    trackGoogleAnalyticsEvent('rally_manual_share_seen');
  }, []);

  /** Landscape pills default to Tell; count as manual-share seen without a click. */
  useEffect(() => {
    if (isTabletLandscape && activeSupportTab === 'tell') {
      markManualShareSeen();
    }
  }, [isTabletLandscape, activeSupportTab, markManualShareSeen]);

  /** Confirmation toast after clipboard copy (portal to document.body). */
  const showCopyToast = useCallback((message: string) => {
    setCopyNotificationMessage(message);
    setShowCopyNotification((s) => ({ ...s, update: true }));
  }, []);

  /**
   * Copy text to clipboard, show success toast, and emit coarse GA event.
   *
   * @param text - Payload written to clipboard (never logged to GA)
   * @param target - Drives toast copy and `share_link_copied.target`
   * @param options - Optional platform/location dimensions for GA
   */
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

  /**
   * POST /api/share-links on explicit user action; persist result to localStorage.
   * No-op when a link already exists or a request is in flight.
   */
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

  /** Guest continue: splash Tour → funnel (Lobby entry). */
  const handleContinueToLobby = useCallback(() => {
    trackGoogleAnalyticsEvent('rally_continue_to_lobby_click');
    navigateToSplashView('Tour');
  }, [navigateToSplashView]);

  /** GA when Keep Watch email field receives focus. */
  const handleEmailFocus = useCallback(() => {
    trackGoogleAnalyticsEvent('rally_email_signup_started');
  }, []);

  /**
   * Rally movement email signup (double opt-in). Attaches `source_public_code`
   * from inbound ref when present (pb:refShareCode).
   *
   * @param e - Form submit event
   */
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

  /**
   * Web Share API when available; otherwise falls back to clipboard copy.
   * User cancel is ignored (no error surface).
   */
  const handleNativeShare = useCallback(async () => {
    markManualShareSeen();
    if (!canUseNativeShare) {
      await copyText(shareMessage, 'message', {
        platform: sharePlatform,
        location: 'manual',
      });
      return;
    }
    try {
      await navigator.share({
        title: SPLASH_COPY.SPLASH.SLOGAN,
        text: shareMessage,
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
    shareMessage,
  ]);

  return (
    <>
      {showCopyNotification.update &&
        createPortal(
          <StyledAlert
            message={copyNotificationMessage}
            setShow={setShowCopyNotification}
            alertClass={'copy-notification'}
            show={showCopyNotification}
            time={ALERT_TIMEOUT.copy}
            icon={'clipboard-check'}
            type={'update'}
            dismissible
          />,
          document.body
        )}

      <Container
        fluid
        id={'rally--page'}
        className={'rally--page-shell'}
      >
        <CarouselBackdrop />
        <div
          className={
            'rally--foreground-wrap d-flex align-items-center justify-content-center'
          }
        >
          <Container
            id={'rally'}
            className={'rally-page rally-page--foreground'}
          >
            <section
              className={'rally--hero text-center'}
              aria-labelledby={'rally-headline'}
            >
              <h1
                id={'rally-headline'}
                className={'rally--headline mt-lg-1'}
              >
                {RALLY_COPY.HERO.headline}
              </h1>
              <p className={'rally--subcopy'}>{RALLY_COPY.HERO.subcopy}</p>
            </section>

            <SupportActions
              markManualShareSeen={markManualShareSeen}
              handleGenerateLink={handleGenerateLink}
              handleNativeShare={handleNativeShare}
              handleEmailSubmit={handleEmailSubmit}
              handleEmailFocus={handleEmailFocus}
              onSharePlatformChange={handleSharePlatformChange}
              ClipboardLine={RallyClipboardLine}
              onSelectTab={setActiveSupportTab}
              setEmailSuccess={setEmailSuccess}
              setEmailError={setEmailError}
              copyText={copyText}
              setEmail={setEmail}
              email={email}
              storedLink={storedLink}
              emailError={emailError}
              isGenerating={isGenerating}
              emailSuccess={emailSuccess}
              activeTab={activeSupportTab}
              sharePlatform={sharePlatform}
              generateError={generateError}
              useTabsLayout={isTabletLandscape}
              shareMessage={shareMessage}
              onShareMessageChange={handleShareMessageChange}
              isEmailSubmitting={isEmailSubmitting}
              canUseNativeShare={canUseNativeShare}
            />

            <section className={'rally--section rally--continue text-center'}>
              <SubmitBtn
                classProp={
                  'splash-enter--btn rally--continue-btn button--continue'
                }
                btnId={'rally-continue-to-lobby'}
                value={RALLY_COPY.CONTINUE.label}
                onClick={handleContinueToLobby}
                variant={'dark'}
                type={'button'}
                size={'lg'}
              />
              <small className={'rally--disclaimer d-block mt-2'}>
                {RALLY_COPY.CONTINUE.disclaimer}
              </small>
            </section>

            <footer className={'rally--social-footer text-center'}>
              <p
                className={'rally--social-blurb'}
                aria-live={'polite'}
              >
                {socialBlurb}
              </p>
              <nav
                className={'rally--social-links'}
                aria-label={'POWERBACK community links'}
                onMouseLeave={clearSocialHover}
                onBlur={handleSocialNavBlur}
              >
                <a
                  href={rallySocialLinks.discord.trackedUrl}
                  onClick={rallySocialLinks.discord.onClick}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rally--social-link'
                  onMouseEnter={() => setSocialHover('discord')}
                  onFocus={() => setSocialHover('discord')}
                >
                  <i
                    className={'bi bi-discord'}
                    aria-hidden
                  />
                  <span>{RALLY_COPY.SOCIAL.discordLabel}</span>
                </a>
                <a
                  onMouseEnter={() => setSocialHover('github')}
                  onFocus={() => setSocialHover('github')}
                  className={'rally--social-link'}
                  rel={'noopener noreferrer'}
                  target={'_blank'}
                  href={rallySocialLinks.github.trackedUrl}
                  onClick={rallySocialLinks.github.onClick}
                >
                  <i
                    className={'bi bi-github'}
                    aria-hidden
                  />
                  <span>{RALLY_COPY.SOCIAL.githubLabel}</span>
                </a>
                {rallySocialLinks.patreon && (
                  <a
                    onMouseEnter={() => setSocialHover('patreon')}
                    onFocus={() => setSocialHover('patreon')}
                    className={'rally--social-link'}
                    rel={'noopener noreferrer'}
                    href={rallySocialLinks.patreon.trackedUrl}
                    onClick={rallySocialLinks.patreon.onClick}
                    target={'_blank'}
                  >
                    <svg
                      className={'rally--social-icon-svg'}
                      xmlns={'http://www.w3.org/2000/svg'}
                      viewBox={'0 0 24 24'}
                      aria-hidden
                    >
                      <path
                        d={'M0 0v24h4.8V4.8H9.6V0zm14.4 0v24h4.8V4.8H24V0z'}
                      />
                    </svg>
                    <span>{RALLY_COPY.SOCIAL.patreonLabel}</span>
                  </a>
                )}
                <a
                  onMouseEnter={() => setSocialHover('x')}
                  onFocus={() => setSocialHover('x')}
                  className={'rally--social-link'}
                  rel={'noopener noreferrer'}
                  href={rallySocialLinks.x.trackedUrl}
                  onClick={rallySocialLinks.x.onClick}
                  target={'_blank'}
                >
                  <i
                    className={'bi bi-twitter-x'}
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
