/**
 * Main page shell. Handles route-based rendering, lazy loading, and layout.
 * @module Page
 */
import React, {
  useRef,
  useMemo,
  Suspense,
  useState,
  useEffect,
  useReducer,
  useCallback,
  useLayoutEffect,
} from 'react';
import { useDialogue, useNavigation } from '@Contexts';
import type { AuthProp, NavigationProp } from '@Types';
import { activation, regexMatchURI } from '@Utils';
import { Wrapper } from '@Components/page';
import { ALERT_TIMEOUT } from '@CONSTANTS';
import { Loading, Splash } from '@Pages';
import { routes } from '../router';

/**
 * Lazy-loaded page components.
 * Reset and Unsub are wrapped by MagicLink component to handle hash-based verification.
 */
const Funnel = React.lazy(() => import('./Funnel'));
const Reset = React.lazy(() => import('./Reset'));
const Unsub = React.lazy(() => import('./Unsub'));

// Modal component lazy-loading configuration
const MODAL_IMPORTS = {
    eligibility: () => import('../components/page/navs/modals/Eligibility'),
    credentials: () => import('../components/modals/Credentials'),
    resetPass: () => import('../components/modals/ForgotPassword'),
    privacy: () => import('../components/page/navs/modals/Privacy'),
    terms: () => import('../components/page/navs/modals/Terms'),
    FAQ: () => import('../components/page/navs/modals/FAQ'),
  } as const,
  ALERT_IMPORTS = {
    activate: () => import('../components/alerts/account/AcctActivated'),
    linkSent: () => import('../components/alerts/account/ResetLinkSent'),
    join: () => import('../components/alerts/account/SignupLinkSent'),
    rejected: () => import('../components/alerts/DonationRejected'),
    delete: () => import('../components/alerts/account/Delete'),
    login: () => import('../components/alerts/LoginLogout'),
  } as const;

// Lazy-loaded modal components
const componentConstructor = (
  imports: Record<string, () => Promise<{ default: React.ComponentType<any> }>>
) => {
  return Object.fromEntries(
    Object.entries(imports).map(([key, importFn]) => [
      key,
      React.lazy(
        importFn as () => Promise<{ default: React.ComponentType<any> }>
      ),
    ])
  ) as Record<string, React.LazyExoticComponent<any>>;
};

const MODAL_COMPONENTS = componentConstructor(MODAL_IMPORTS),
  ALERT_COMPONENTS = componentConstructor(ALERT_IMPORTS);

type PageProps = NavigationProp & AuthProp;

const Page = ({
  isInitializing,
  handleLogOut,
  isLoggedIn,
  route,
  ...props
}: PageProps) => {
  const [linkIsExpired, setLinkIsExpired] = useState(false); // for reset pw etc
  const { showAlert, setShowAlert } = useDialogue();

  /**
   * State for account activation status
   */
  const [accountActivated, setAccountActivated]: [boolean, () => void] =
    useReducer(() => true, false);

  /**
   * Handles account activation through hash verification
   * @param {string} hash - The activation hash from the URL
   * @returns {Promise<Object>} Activation result containing isHashConfirmed status
   */
  const handleActivateAccount = useCallback(
    async (hash: string) => await activation(hash),
    []
  );

  // prereq for reset pw etc;
  const [userIsAssumedValid, setUserIsAssumedValid] = useState(true);
  // redirects from consumed, expired or faulty reset password hash-URIs
  const homeLinkRedirect = useCallback(() => routes.main().replace(), []);

  /**
   * Checks for and processes join/activate link activation
   * Redirects to home after processing (success or failure)
   */
  const activateAccount = useCallback(async () => {
    // Skip if on reset page
    if (window.location.href.includes('reset')) return;

    // Check for activate or join hash in URL
    // Emails use /join/:hash, but router also supports /activate/:hash
    let matchObj = regexMatchURI('activate');
    if (matchObj === null) {
      matchObj = regexMatchURI('join');
    }
    if (matchObj === null) return;

    const hash = matchObj[0];
    const activated = await handleActivateAccount(hash);

    if (activated?.data.isHashConfirmed && !showAlert.delete) {
      setAccountActivated();
    }

    // Always redirect to home after activation attempt
    homeLinkRedirect();
  }, [showAlert.delete, homeLinkRedirect, handleActivateAccount]);

  const prevAccountActivatedRef = useRef(accountActivated);

  useLayoutEffect(() => {
    if (prevAccountActivatedRef.current !== accountActivated) {
      prevAccountActivatedRef.current = accountActivated;
      if (accountActivated) {
        setShowAlert((m) => ({ ...m, activate: true }));
      }
    }
  }, [accountActivated, setShowAlert]);

  /**
   * Effect to handle account activation when route is activate/join
   */
  useEffect(() => {
    if (route?.name === 'activate' || route?.name === 'join') {
      activateAccount();
    }
  }, [route?.name, activateAccount]);

  /**
   * Checks if reset link is invalid or expired
   * Checks if route is 'main' or 'reset'
   * Returns true if either is true
   */
  const isInvalidResetRoute = useMemo(
      () => route?.name === 'reset' && (!userIsAssumedValid || linkIsExpired),
      [route?.name, userIsAssumedValid, linkIsExpired]
    ),
    isInvalidSiteRoute = useMemo(
      () =>
        route?.name !== 'main' &&
        route?.name !== 'reset' &&
        route?.name !== 'unsubscribe' &&
        route?.name !== 'activate' &&
        route?.name !== 'join',
      [route?.name]
    ),
    shouldRedirect = useMemo(
      () => isInvalidResetRoute || isInvalidSiteRoute,
      [isInvalidResetRoute, isInvalidSiteRoute]
    );

  /**
   * Effect to handle redirect to home
   */
  useEffect(() => {
    if (shouldRedirect) homeLinkRedirect();
  }, [shouldRedirect, homeLinkRedirect]);

  /**
   * Effect to add/remove magic-link-page class on body element
   */
  useEffect(() => {
    if (route?.name === 'reset' || route?.name === 'unsubscribe') {
      document.body.classList.add('magic-link-page');
    } else {
      document.body.classList.remove('magic-link-page');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('magic-link-page');
    };
  }, [route?.name]);

  const { funnel: tabKey, navContext } = useNavigation();

  /**
   * Track legitimate guest access to funnel
   * Only set to true when guest explicitly navigates via "Occupy the lobby" button
   */
  const hasGuestAccess = useRef(false);

  useEffect(() => {
    // Reset guest access flag when user logs in
    if (isLoggedIn) {
      hasGuestAccess.current = false;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Listen for legitimate guest access granted via "Occupy the lobby" button
    const handleGuestAccessGranted = () => {
      hasGuestAccess.current = true;
    };

    window.addEventListener('guestAccessGranted', handleGuestAccessGranted);
    return () =>
      window.removeEventListener(
        'guestAccessGranted',
        handleGuestAccessGranted
      );
  }, []);

  useEffect(() => {
    // Reset non-logged-in users to splash context on refresh
    // This ensures that when a non-logged-in user refreshes the page,
    // they return to the splash page instead of staying in the funnel
    if (
      !isLoggedIn &&
      !isInitializing &&
      navContext === 'funnel' &&
      !hasGuestAccess.current
    ) {
      // Simply walk the guest back to the splash page
      // This positions them at the previous splash entry without modifying history
      window.history.back();
    }
    // hasGuestAccess is a ref; run only when auth/nav state changes, not when ref.current changes
  }, [isInitializing, isLoggedIn, navContext]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Effect to enable scrolling on Splash page by adding/removing splash-scrollable class
   * Allows vertical scrolling when Splash content (including Pitch) exceeds viewport height
   */
  useEffect(() => {
    const isSplashPage =
      navContext === 'splash' &&
      route?.name === 'main' &&
      !isInitializing &&
      !isLoggedIn;

    if (isSplashPage) {
      // add the class to the body and document element
      // this allows the page to scroll vertically when the content exceeds the viewport height
      document.body.classList.add('splash-scrollable');
      document.documentElement.classList.add('splash-scrollable');
    } else {
      // remove the class from the body and document element
      document.body.classList.remove('splash-scrollable');
      document.documentElement.classList.remove('splash-scrollable');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('splash-scrollable');
      document.documentElement.classList.remove('splash-scrollable');
    };
  }, [route?.name, isInitializing, isLoggedIn, navContext]);

  /**
   * Global modals configuration - single source of truth for all modals
   */
  const MODALS = useMemo(
      () =>
        Object.entries(MODAL_COMPONENTS).map(([modalKey, element]) => ({
          key: modalKey,
          modalKey,
          element,
        })),
      []
    ),
    // Global alerts configuration - single source of truth for all alerts
    GLOBAL_ALERTS = useMemo(
      () =>
        Object.entries(ALERT_COMPONENTS).map(([key, element]) => ({
          element,
          key,
        })),
      []
    );

  /**
   * State for tracking the target element of the forgot password overlay
   * Used to position the overlay correctly when clicked
   */
  const [forgotPwOverlayTarget, setForgotPwOverlayTarget] =
    useState<HTMLSpanElement | null>(null);

  return (
    <>
      {MODALS.map((modal) => {
        const Modal = modal.element as React.ComponentType<any>;
        return (
          <Modal
            {...props}
            key={`${modal.key}-modal-nouser`}
            setForgotPwOverlayTarget={setForgotPwOverlayTarget}
            forgotPwOverlayTarget={forgotPwOverlayTarget}
            accountActivated={accountActivated}
            handleLogOut={handleLogOut}
            route={route}
          />
        );
      })}

      {/* Global alerts - rendered from single source of truth */}
      {GLOBAL_ALERTS.map((alert) => {
        const AlertComponent = alert.element as React.ComponentType<any>;
        // Map linkSent to reset timeout since that's what the constants use
        const timeoutKey = alert.key === 'linkSent' ? 'reset' : alert.key;
        return (
          <AlertComponent
            key={'global-alert-' + alert.key}
            timeout={(ALERT_TIMEOUT as Record<string, number>)[timeoutKey]}
            isLoggedIn={isLoggedIn}
            setShow={setShowAlert}
            show={showAlert}
          />
        );
      })}

      <Wrapper classProps={`wrapper-${tabKey ?? 'pol-donation'}`}>
        {/* Reset password page */}
        {route?.name === 'reset' && userIsAssumedValid && !linkIsExpired && (
          <Suspense
            fallback={<Loading msg={'Loading Reset Password Page...'} />}
          >
            <Reset
              {...props}
              setUserIsAssumedValid={setUserIsAssumedValid}
              homeLinkRedirect={homeLinkRedirect}
              setLinkIsExpired={setLinkIsExpired}
            />
          </Suspense>
        )}

        {/* Unsubscribe page */}
        {route?.name === 'unsubscribe' && (
          <Suspense fallback={<Loading msg={'Loading Unsubscribe Page...'} />}>
            <Unsub homeLinkRedirect={homeLinkRedirect} />
          </Suspense>
        )}

        {/* Main page */}
        {(route?.name === 'main' || accountActivated) && !isInitializing && (
          <Suspense fallback={<main />}>
            {isLoggedIn ||
            (navContext === 'funnel' && hasGuestAccess.current) ? (
              <Funnel
                route={route}
                {...props}
              />
            ) : (
              // Landing page
              <Splash />
            )}
          </Suspense>
        )}
      </Wrapper>
    </>
  );
};

export default React.memo(Page);
