/**
 * Faded Lobby layout underlay: mirrors Lobby tab stack so the carousel band
 * aligns with the real Lobby page. Rally-only; does not modify Lobby.tsx.
 *
 * @module Rally/RallyCarouselBackdrop
 */
import React, { Suspense, useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { CELEBRATE_COPY } from '@CONSTANTS';
import API from '@API';
import type { PolsOnParade } from '@Interfaces';
import { shuffle, logError } from '@Utils';
import '../Funnel/TabContents/Lobby/style.css';
import '../Funnel/TabContents/Lobby/DonationSection/style.css';
import '../../components/search/style.css';

const PolCarousel = React.lazy(
  () => import('@Components/interactive/PolCarousel/PolCarousel')
);

/** Subset size for backdrop fetch; full carousel scroll not needed for visual hint. */
const BACKDROP_POL_COUNT = 10;

/**
 * RallyCarouselBackdrop component
 *
 * Renders a non-interactive, dimmed PolCarousel behind the Rally card.
 * Reuses Lobby DOM sections (search band, carousel, donation band) with hidden
 * spacers so vertical centering matches `#funnel--page` + Lobby on all breakpoints.
 *
 * @returns Faded lobby underlay or null while pols load
 */
const RallyCarouselBackdrop = () => {
  const [polsOnParade, setPolsOnParade] = useState<PolsOnParade | null>(null);

  useEffect(() => {
    let cancelled = false;
    API.getPols()
      .then(({ data }) => {
        if (cancelled || !data?.length) {
          return;
        }
        const shuffled = shuffle([...data]).slice(0, BACKDROP_POL_COUNT);
        setPolsOnParade({
          houseMembers: data,
          applied: shuffled,
        });
      })
      .catch((error) => {
        logError('Rally backdrop pol fetch failed', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!polsOnParade?.applied.length) {
    return null;
  }

  return (
    <div
      className='rally--lobby-underlay'
      aria-hidden
    >
      <Container
        fluid
        className='rally--lobby-underlay-shell d-flex align-items-center'
      >
        <Row className='flex-column w-100'>
          <Col>
            <div className='lobby'>
              {/* Hidden search band: reserves .selector-bar height from Lobby */}
              <section aria-hidden>
                <Row>
                  <Col className='lobby-top third'>
                    <Row className='selector-bar rally--lobby-spacer'>
                      <Col
                        id='choose-pols'
                        lg={5}
                      />
                    </Row>
                  </Col>
                </Row>
              </section>
              <section aria-hidden>
                <Row>
                  <Col className='lobby-middle third'>
                    <Suspense fallback={null}>
                      {/* Demo mode skips escrow API; backdrop is visual only */}
                      <PolCarousel
                        polsOnParade={polsOnParade}
                        isDemoMode
                      />
                    </Suspense>
                  </Col>
                </Row>
              </section>
              {/* Hidden donation band: .starting text matches DonationSection height */}
              <section aria-hidden>
                <Row>
                  <Col className='lobby-bottom third'>
                    <Row
                      id='donation-section'
                      className='rally--lobby-spacer'
                    >
                      <div className='starting mt-lg-2 mb-2 px-2 w-75'>
                        {CELEBRATE_COPY.CELEBRATION_SCREEN_LOAD_HEADER}
                      </div>
                    </Row>
                  </Col>
                </Row>
              </section>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default React.memo(RallyCarouselBackdrop);
