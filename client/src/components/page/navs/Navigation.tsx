/**
 * Top navigation. Brand, user menu, tab links, side nav.
 * @module Navigation
 */
import React, {
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useDevice, useDialogue, useNavigation } from '@Contexts';
import { NavTabLinks as Links } from '@Components/interactive';
import { Col, Row, Navbar } from 'react-bootstrap';
import Marquee from './SideNav/Header/Marquee';
import type { NavigationProp } from '@Types';
import { User, Brand } from './sections';
import { useSpinner } from '@Hooks';
import { APP } from '@CONSTANTS';
import { SideNav } from '.';
import './style.css';

type NavigationProps = NavigationProp & {
  serverConstantsError?: Error | null;
  isInitializing: boolean;
  handleLogOut: () => void;
  isLoggedIn: boolean;
};

const Navigation = ({
  serverConstantsError,
  isInitializing,
  handleLogOut,
  isLoggedIn,
  route,
  ...props
}: NavigationProps) => {
  const { isMobile, isDesktop, isTabletPortrait } = useDevice(),
    { setShowModal, setShowSideNav } = useDialogue(),
    { splash, navigateToSplashView, navContext } = useNavigation();

  const [isSpinning, { start: spin, stop: stopSpin }] = useSpinner();

  const isBrandSpinning = useMemo(
    () =>
      isSpinning &&
      (route?.name === 'reset' || route?.name === 'unsubscribe' || isMobile),
    [isSpinning, isMobile, route?.name]
  );

  const isBrandButtonOrBanner = useMemo(
    () =>
      (route?.name === 'reset' || route?.name === 'unsubscribe') && isDesktop
        ? 'button'
        : 'banner',
    [route?.name, isDesktop]
  );

  const handleSideNavBrandIcon = useCallback(() => {
    // On mobile: open side navigation and spin logo
    (setShowSideNav as Dispatch<SetStateAction<boolean>>)(true);
    spin();
  }, [spin, setShowSideNav]);

  const handleCloseSideNav = useCallback(() => {
    (setShowSideNav as Dispatch<SetStateAction<boolean>>)(false);
    stopSpin();
  }, [stopSpin, setShowSideNav]);

  // Show skeleton during initialization to prevent flash of logged-out state
  // Also show skeleton if auth/splash are truly uninitialized
  const authUnknown = typeof isLoggedIn !== 'boolean';
  const splashUnknown = typeof splash === 'undefined' || splash === null;
  const shouldShowSkeleton = isInitializing || (authUnknown && splashUnknown);

  // conditionally render the navbar skeleton
  if (shouldShowSkeleton) {
    return (
      <Navbar
        id={'navbar'}
        role={'navigation'}
        className={'navbar-sizer'}
        aria-label={'Main navigation'}
      />
    );
  }

  /**
   * Main navigation component
   * @returns {React.ReactNode} Main navigation component
   * @description Main navigation component
   * @param {boolean} serverConstantsError - Indicates if there was an error loading server constants
   * @param {boolean} isInitializing - Indicates if the application is initializing
   * @param {() => void} handleLogOut - Handles the logout action
   * @param {boolean} isLoggedIn - Indicates if the user is logged in
   * @param {Route<typeof routes>} route - The current route
   * @param {NavigationProp} props - The component props
   * @param {SetStateAction<boolean>} setShowModal - Sets the show modal state
   */
  return (
    <>
      <Navbar
        id={'navbar'}
        role={'navigation'}
        aria-label={'Main navigation'}
      >
        <Row>
          {(isDesktop ||
            (route?.name === 'main' &&
              !isLoggedIn &&
              navContext === 'splash' &&
              splash !== 'Tour')) && (
            <Col lg={4}>
              <Row>
                <Col>
                  <Links
                    LINK_LABELS={APP.NAV.MODALS}
                    stateSetter={setShowModal}
                  />
                </Col>
              </Row>
            </Col>
          )}
          <Col lg={2} />
          <Col
            xs={12}
            lg={5}
          >
            <Row>
              {((isDesktop || isTabletPortrait) &&
                ((!serverConstantsError && (
                  <Col
                    lg={3}
                    className={'marquee'}
                  >
                    <Marquee id={'desktop-marquee'} />
                  </Col>
                )) || <Col lg={3} />)) || <Col lg={1} />}
              {(isDesktop ||
                isTabletPortrait ||
                (!isDesktop &&
                  (isLoggedIn ||
                    (route?.name === 'main' && navContext === 'funnel')))) && (
                <Col
                  xs={12}
                  lg={isTabletPortrait ? 7 : 6}
                >
                  <Brand
                    handleSideNavBrandIcon={handleSideNavBrandIcon}
                    roleType={isBrandButtonOrBanner}
                    isSpinning={isBrandSpinning}
                    isDesktop={isDesktop}
                    spin={spin}
                  />
                </Col>
              )}
              {(isDesktop || isTabletPortrait) && !serverConstantsError && (
                <User
                  handleLogOut={handleLogOut}
                  setShowModal={setShowModal}
                  isMobile={isMobile}
                  route={route}
                />
              )}
            </Row>
          </Col>
        </Row>
      </Navbar>

      {(isMobile || isTabletPortrait) && (
        <SideNav
          handleClose={handleCloseSideNav}
          handleLogOut={handleLogOut}
          isLoggedIn={isLoggedIn}
          setSplash={navigateToSplashView}
          isMobile={isMobile}
          {...props}
        />
      )}
    </>
  );
};

export default React.memo(Navigation);
