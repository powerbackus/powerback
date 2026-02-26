import React, { useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { StyledModal } from '@Components/modals';
import { Logio } from '@Components/interactive';
import { useEntryForm, useTour } from '@Hooks';
import type { NavigationProp } from '@Types';
import { Col, Row } from 'react-bootstrap';
import { ACCOUNT_COPY } from '@CONSTANTS';
import {
  type CredentialsPath,
  useDonationState,
  useDialogue,
  useNavigation,
  useDevice,
  useAuth,
} from '@Contexts';
import './style.css';

/**
 * CredentialsModal Component
 *
 * Modal wrapper for the Logio authentication component that handles
 * user login and registration flows. Manages modal state, form cleanup,
 * and provides contextual messaging based on user's donation state.
 *
 * Key responsibilities:
 * - Modal lifecycle management (open/close/cleanup)
 * - Form state reset on modal close
 * - Contextual messaging for users with existing selections
 * - Tour integration for desktop users
 * - Password reset overlay management
 *
 * @param props - Additional props passed to the Logio component
 */

const CredentialsModal = ({ route, ...props }: NavigationProp) => {
  // Donation state context for determining user flow
  const { donation, selectedPol, credentialsPath, setCredentialsPath } =
    useDonationState();

  // Form state management for cleanup
  const [, { setUserFormValidated, clearUserEntryForm }] = useEntryForm();

  // Device detection for tour functionality
  const { isDesktop } = useDevice(),
    [, { closeTour }] = useTour(isDesktop);

  /**
   * Modal cleanup on exit
   * Resets all form states and closes any active tours
   */
  const onExited = useCallback(() => {
    (setUserFormValidated as (isValid: boolean) => void)(false);
    (setCredentialsPath as (path: CredentialsPath) => void)('');
    (clearUserEntryForm as () => void)();
    closeTour('User');
  }, [setUserFormValidated, clearUserEntryForm, setCredentialsPath, closeTour]);

  // Authentication state
  const { isLoggedIn } = useAuth();

  /**
   * Check if user has made donation selections
   * Used to determine if contextual messaging should be shown
   */
  const hasSelections = useMemo(
    () => donation !== 0 && selectedPol !== null,
    [donation, selectedPol]
  );

  /**
   * Determine if user is in registration mode
   * Used for dynamic heading and messaging
   */
  const isJoinNow = useMemo(
      () => (credentialsPath as CredentialsPath) === 'Join Now',
      [credentialsPath]
    ),
    /**
     * Dynamic modal heading based on authentication mode
     * Shows appropriate messaging for login vs registration
     */
    heading = useMemo(
      () => (
        <Row className={'align-items-baseline'}>
          {!isLoggedIn && hasSelections && (
            <Col xs={'auto'}>
              <span className='papers-please'>Papers, please.</span>
            </Col>
          )}
          <Col xs={'auto'}>
            {ACCOUNT_COPY.APP.CREDENTIALS.TO_START[+isJoinNow]}{' '}
            <span className='powerback'>POWERBACK</span> account.
          </Col>
        </Row>
      ),
      [isJoinNow, isLoggedIn, hasSelections]
    );

  // Splash and dialogue state management
  const { splash } = useNavigation();
  const { setShowSideNav, setShowAlert, setShowOverlay } = useDialogue();

  // Track previous splash state for cleanup
  const prevSplashView = useRef(splash);

  /**
   * Cleanup on splash view changes
   * Closes side navigation and resets form state
   */
  useLayoutEffect(() => {
    prevSplashView.current = splash;
    setShowSideNav(false); // close sidenav after clicking its link
    (clearUserEntryForm as () => void)(); // clear credentials form
  }, [splash, setShowSideNav, clearUserEntryForm]);

  /**
   * Close password reset overlay on modal enter
   * Ensures clean state when modal opens
   */
  const closeOpenOverlaysAndAlerts = useCallback(() => {
    setShowAlert((s) => ({ ...s, join: false, delete: false, logout: false }));
    setShowOverlay((o) => ({ ...o, resetPass: false })); // kills reset password overlay if open
  }, [setShowAlert, setShowOverlay]);

  return (
    <StyledModal
      heading={heading}
      closeButton={true}
      onExited={onExited}
      type={'credentials'}
      onEnter={closeOpenOverlaysAndAlerts}
      body={
        <Logio
          route={route} /* Main authentication form component */
          {...props}
        />
      }
      // no footer
    />
  );
};

export default React.memo(CredentialsModal);
