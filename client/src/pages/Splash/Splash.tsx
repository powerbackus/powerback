/**
 * Landing page with video and navigation.
 * @module Splash
 */
import React, { useMemo, useCallback } from 'react';
import { Col, Row, Stack, Container } from 'react-bootstrap';
import { ContinueBtn } from '@Components/buttons';
import { VideoPlayer } from '@Components/interactive';
import { MEDIA_PATHS, SPLASH_COPY } from '@CONSTANTS';
import { useIsDemoMode } from '../../demoMode';
import {
  type CredentialsFormView,
  type LandingNavView,
  useNavigation,
  useDialogue,
  useDevice,
} from '@Contexts';
import './style.css';

const Splash = () => {
  /* Contexts - Centralized state management */
  const { splash, navigateToSplashView } = useNavigation(),
    { isTabletPortrait, isDesktop, isMobile } = useDevice(),
    { setShowAlert } = useDialogue();

  const changeSplash = useCallback(
    (nextSplash: LandingNavView | CredentialsFormView) => {
      navigateToSplashView(nextSplash);
      setShowAlert((a) => ({ ...a, logout: false }));
    },
    [navigateToSplashView, setShowAlert]
  );

  const IntroParagraph = useMemo(
    () => (
      <p className={'intro mt-lg-0 mt-2'}>
        <span className='powerback fs-1'>{SPLASH_COPY.SPLASH.COPY.demand}</span>
        <p className='intro-text mt-lg-2 mt-1 mb-lg-4 mb-2'>
          {SPLASH_COPY.SPLASH.COPY.intro}
        </p>
        <ContinueBtn
          classProp={'splash-enter--btn button--continue'}
          handleClick={() => changeSplash('Tour')}
          label={SPLASH_COPY.SPLASH.COPY.tour}
          variant={'dark'}
          type={'button'}
          size={'lg'}
        />
        <small className={'mt-lg-2 splash-disclaimer'}>
          {SPLASH_COPY.SPLASH.COPY.disclaimer}
        </small>
      </p>
    ),
    [changeSplash]
  );

  const isDemoMode = useIsDemoMode(),
    demoClass = useMemo(
      () => (isDemoMode && isMobile ? 'demo-splash' : ''),
      [isDemoMode, isMobile]
    );

  return (
    <>
      <Container id={'splash'}>
        {isDesktop && !isTabletPortrait ? (
          <div className={'splash-grid'}>
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
              aria-label={'Explainer video'}
              className={'splash-video'}
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
                            <section
                              aria-label={'Explainer video'}
                              className={'splash-video'}
                            >
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
