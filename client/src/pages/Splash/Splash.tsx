/**
 * Landing page with video, cookie consent, and navigation.
 * @module Splash
 */
import React, { useMemo, useCallback } from 'react';
import { SPLASH, MEDIA_PATHS, SPLASH_COPY, BRAND_DISPLAY } from '@CONSTANTS';
import { Col, Row, Image, Stack, Container } from 'react-bootstrap';
import { VideoPlayer } from '@Components/interactive';
import { handleKeyDown, publicAsset } from '@Utils';
import { CookieConsent } from '@Components/alerts';
import { useIsDemoMode } from '../../demoMode';
import {
  type CredentialsFormView,
  type LandingNavView,
  useNavigation,
  useDialogue,
  useDevice,
} from '@Contexts';
import './style.css';

const logoImgPath = publicAsset(MEDIA_PATHS.CABLE_LOGO);

const Splash = () => {
  const { splash, navigateToSplashView } = useNavigation(),
    { isTabletPortrait, isDesktop, isMobile } = useDevice(),
    { setShowAlert } = useDialogue();
  const isDemoMode = useIsDemoMode();

  const changeSplash = useCallback(
    (nextSplash: LandingNavView | CredentialsFormView) => {
      navigateToSplashView(nextSplash);
      setShowAlert((a) => ({ ...a, logout: false }));
    },
    [navigateToSplashView, setShowAlert]
  );

  const demoClass = useMemo(
    () => (isDemoMode && isMobile ? 'demo-splash' : ''),
    [isDemoMode, isMobile]
  );

  return (
    <>
      <Container id='splash'>
        {isDesktop && !isTabletPortrait ? (
          <div className='splash-grid'>
            <h1
              id={'splash-mission'}
              className={'mission-statement'}
            >
              {SPLASH_COPY.SPLASH.SLOGAN}
            </h1>
            <div
              className={'splash-blank'}
              aria-hidden={true}
            />

            <section
              className={'splash-copy'}
              aria-labelledby={'splash-mission'}
            >
              {splash === '' && (
                <p className={'intro'}>
                  <span className='powerback'>{'POWERBACK'}</span>
                  {SPLASH_COPY.SPLASH.COPY.intro} {/* Tour link >> */}
                  <span
                    onKeyDown={(e) =>
                      handleKeyDown(e, () => changeSplash('Tour'))
                    }
                    className={'natural-link'}
                    onClick={() => changeSplash('Tour')}
                    tabIndex={0}
                  >
                    {SPLASH_COPY.SPLASH.COPY.tour}
                  </span>
                </p>
              )}

              <div className={'cta-w-icon'}>
                {SPLASH_COPY.SPLASH.COPY.cta}
                <Image
                  height={SPLASH.IMG_HEIGHT}
                  width={SPLASH.IMG_HEIGHT * 0.905}
                  alt={`${BRAND_DISPLAY} "cable" icon`}
                  className={'splash-icon pt-1'}
                  loading={'eager'}
                  src={logoImgPath}
                />
              </div>
            </section>

            <section
              className={'splash-video'}
              aria-label={'Explainer video'}
            >
              <VideoPlayer
                altVideoPath={MEDIA_PATHS.EXPLAINER.MP4}
                videoPath={MEDIA_PATHS.EXPLAINER.WEBM}
                isDesktop={isDesktop}
                isMobile={isMobile}
                height={'100%'}
                width={'100%'}
              />
            </section>
          </div>
        ) : (
          <>
            <h1
              id={'splash-mission'}
              className={`mission-statement ${demoClass}`}
            >
              {SPLASH_COPY.SPLASH.SLOGAN}
            </h1>
            <Row>
              <div className={'splash-content'}>
                {splash === '' && (
                  <Col lg={isTabletPortrait ? 12 : 6}>
                    <section aria-labelledby={'splash-mission'}>
                      <Stack direction='vertical'>
                        {isMobile && (
                          <Col className={'mb-3'}>
                            <section aria-label='Explainer video'>
                              <VideoPlayer
                                altVideoPath={MEDIA_PATHS.EXPLAINER.MP4}
                                videoPath={MEDIA_PATHS.EXPLAINER.WEBM}
                                isDesktop={isDesktop}
                                isMobile={isMobile}
                              />
                            </section>
                          </Col>
                        )}

                        {/* Splash written copy */}
                        <p className={'intro'}>
                          <span className='powerback'>{BRAND_DISPLAY}</span>
                          {SPLASH_COPY.SPLASH.COPY.intro} {/* Tour link >> */}
                          <span
                            onKeyDown={(e) =>
                              handleKeyDown(e, () => changeSplash('Tour'))
                            }
                            className={'natural-link'}
                            onClick={() => changeSplash('Tour')}
                            tabIndex={0}
                          >
                            {SPLASH_COPY.SPLASH.COPY.tour}
                          </span>
                        </p>
                      </Stack>
                    </section>
                  </Col>
                )}
                {/* Video player */}
                {(isDesktop || isTabletPortrait) && (
                  <Col
                    lg={'auto'}
                    className={'mb-3'}
                  >
                    <section aria-label='Explainer video'>
                      <VideoPlayer
                        altVideoPath={MEDIA_PATHS.EXPLAINER.MP4}
                        videoPath={MEDIA_PATHS.EXPLAINER.WEBM}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                      />
                    </section>
                  </Col>
                )}
              </div>

              {/* Slogan and logo */}
              {(isDesktop ||
                isTabletPortrait ||
                (splash !== 'Join Now' &&
                  splash !== 'Sign In' &&
                  isMobile)) && (
                <Col
                  lg={isTabletPortrait ? 12 : 3}
                  className={'cta-w-icon'}
                >
                  {SPLASH_COPY.SPLASH.COPY.cta}
                  <Image
                    height={SPLASH.IMG_HEIGHT}
                    width={SPLASH.IMG_HEIGHT * 0.905}
                    className={'splash-icon pt-1'}
                    alt={'POWERBACK Logo'}
                    src={logoImgPath}
                    loading={'eager'}
                  />
                </Col>
              )}
            </Row>
          </>
        )}
      </Container>
      {!isDemoMode && <CookieConsent />}
    </>
  );
};

export default React.memo(Splash);
