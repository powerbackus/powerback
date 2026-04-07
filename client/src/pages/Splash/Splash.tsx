/**
 * Landing page with video and navigation.
 * @module Splash
 */
import React, { useMemo, useCallback } from 'react';
import { Col, Row, Stack, Container } from 'react-bootstrap';
import { VideoPlayer } from '@Components/interactive';
import { MEDIA_PATHS, SPLASH_COPY } from '@CONSTANTS';
import { useIsDemoMode } from '../../demoMode';
import { handleKeyDown } from '@Utils';
import {
  type CredentialsFormView,
  type LandingNavView,
  useNavigation,
  useDialogue,
  useDevice,
} from '@Contexts';
import './style.css';

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

  const IntroParagraph = useMemo(
    () => (
      <p className={'intro'}>
        <span className='powerback fs-2'>{SPLASH_COPY.SPLASH.COPY.demand}</span>
        <p className='intro-text mt-lg-1 mb-lg-3 mb-2'>
          {SPLASH_COPY.SPLASH.COPY.intro}
        </p>
        {/* Tour link >> */}
        <span
          onKeyDown={(e) => handleKeyDown(e, () => changeSplash('Tour'))}
          onClick={() => changeSplash('Tour')}
          className={`natural-link fs-${isDesktop ? '2' : '4'}`}
          tabIndex={0}
        >
          {SPLASH_COPY.SPLASH.COPY.tour}
        </span>
      </p>
    ),
    [changeSplash, isDesktop]
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
              {splash === '' && IntroParagraph}
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
                          <Col className={'mb-2'}>
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
                        {IntroParagraph}
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
            </Row>
          </>
        )}
      </Container>
    </>
  );
};

export default React.memo(Splash);
