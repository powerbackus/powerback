/**
 * Root app component. Renders router, navigation, footer, and lazy-loaded pages.
 * @module App
 */
import React, {
  Suspense,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import { clearLocalMap, getScrollBehavior } from '@Utils';
import { Navigation, Footer } from '@Components/page';
import { APP, type AccountTab } from '@CONSTANTS';
import { ErrorBoundary, Page } from '@Pages';
import { useRoute } from './router';
import {
  useDonationState,
  useNavigation,
  useDialogue,
  useAuth,
} from '@Contexts';
import './App.css';

type AppProps = {
  serverConstantsError?: Error | null;
};

/**
 * Main application component that handles core routing, state management, and UI rendering.
 *
 * @param {AppProps} props - Component props
 * @param {Error | null} [props.serverConstantsError] - Error from loading server constants, if any
 */
const App = ({ serverConstantsError }: AppProps) => {
  /* notifications, alerts, modals, overlays, etc */
  const { setShowAlert, setShowSideNav } = useDialogue();
  /**
   * State for account modal active tab
   */
  const [activeKey, setActiveKey] = useState<AccountTab>('Profile');

  const { navigateToSplash, navigateToFunnel, navContext, funnel, splash } =
      useNavigation(),
    { authOut, isLoggedIn, isInitializing } = useAuth(),
    { resetDonationState } = useDonationState();

  // Track funnel state: 'reset' | 'progressing' | 'complete'
  const funnelStateRef = useRef<'reset' | 'progressing' | 'complete'>('reset');

  // Track previous funnel state to detect when leaving Confirmation
  const prevFunnelRef = useRef<string | undefined>(undefined);

  /**
   * Handles user logout process
   * Clears session data, resets application state, and shows logout alert
   */
  const handleLogOut = useCallback(() => {
    authOut();

    sessionStorage.removeItem('pb:session');
    setShowAlert((s) => ({
      ...s,
      login: false,
      logout: true,
      activate: false,
    })); // show alert
    setShowSideNav(false);
    resetDonationState(); // Use the new reset function
    funnelStateRef.current = 'reset'; // Reset funnel state
    navigateToSplash(''); // Navigate back to splash landing page
    clearLocalMap();
  }, [
    authOut,
    setShowAlert,
    setShowSideNav,
    navigateToSplash,
    resetDonationState,
  ]);

  /**
   * Handle Confirmation page redirect when navigating away from Confirmation
   * This ensures users go back to pol-donation and reset donation state
   */
  useLayoutEffect(() => {
    // Check if we're navigating away from Confirmation screen
    if (
      navContext === 'funnel' &&
      prevFunnelRef.current === 'confirmation' &&
      funnel !== 'confirmation'
    ) {
      // Redirect to pol-donation (intersection point)
      navigateToFunnel('pol-donation', 0);

      // Reset donation state when leaving Support
      resetDonationState();
    }

    // Update the previous funnel state for next comparison
    prevFunnelRef.current = funnel;
  }, [navContext, funnel, navigateToFunnel, resetDonationState]);

  // Close mobile sidenav when transitioning from funnel to splash
  useLayoutEffect(() => {
    if (navContext === 'splash') setShowSideNav(false);
  }, [navContext, setShowSideNav]);

  // mobile form path control
  const route = useRoute();

  const handleSkipToMain = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      const main = document.getElementById('main-content');
      main?.focus();
      main?.scrollIntoView({ behavior: getScrollBehavior() });
    },
    []
  );

  return (
    <div className={'App flex-column'}>
      {/* Skip to main content -- accessibility feature; no URL hash */}
      <a
        href={'#main-content'}
        className={'skip-link'}
        onClick={handleSkipToMain}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSkipToMain(e);
          }
        }}
      >
        Skip to main content
      </a>
      {/* Navigation component */}
      <Navigation
        route={route}
        activeKey={activeKey}
        isLoggedIn={isLoggedIn}
        handleLogOut={handleLogOut}
        isInitializing={isInitializing}
        serverConstantsError={serverConstantsError}
      />
      <ErrorBoundary error={serverConstantsError || undefined}>
        <Suspense
          children={
            <Page
              isInitializing={isInitializing}
              handleLogOut={handleLogOut}
              setActiveKey={setActiveKey}
              isLoggedIn={isLoggedIn}
              activeKey={activeKey}
              splash={splash}
              route={route}
            />
          }
          fallback={
            <span
              aria-label={APP.BG_ARIA_LABEL}
              className={'background-image'}
              role={'img'}
            />
          }
        />
      </ErrorBoundary>
      <Footer />
    </div>
  );
};

export default React.memo(App);

// Le pouvoir arrête le pouvoir.
