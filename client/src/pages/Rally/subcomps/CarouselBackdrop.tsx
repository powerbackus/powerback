/**
 * Faded Lobby layout underlay: mirrors Lobby tab stack so the carousel band
 * aligns with the real Lobby page. Rally-only; does not modify Lobby.tsx.
 *
 * @module Rally/subcomps/CarouselBackdrop
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import '../../Funnel/TabContents/Lobby/DonationSection/style.css';
import { buildSessionPolParade, logError } from '@Utils';
import { Col, Container, Row } from 'react-bootstrap';
import '../../Funnel/TabContents/Lobby/style.css';
import type { PolsOnParade } from '@Interfaces';
import '../../../components/search/style.css';
import { CELEBRATE_COPY } from '@CONSTANTS';
import API from '@API';

const PolCarousel = React.lazy(
  () => import('@Components/interactive/PolCarousel/PolCarousel')
);

/** Subset size for backdrop fetch; full carousel scroll not needed for visual hint. */
const BACKDROP_POL_COUNT = 10;

/**
 * CarouselBackdrop component
 *
 * Renders a non-interactive, dimmed PolCarousel behind the Rally card.
 * Reuses Lobby DOM sections (search band, carousel, donation band) with hidden
 * spacers so vertical centering matches `#funnel--page` + Lobby on all breakpoints.
 *
 * @returns Faded lobby underlay or null while pols load
 */
const CarouselBackdrop = () => {
  const [polsOnParade, setPolsOnParade] = useState<PolsOnParade | null>(null);
  const underlayRef = useRef<HTMLDivElement>(null);

  // Decorative only: keep pol cards and carousel skip controls out of tab order
  useEffect(() => {
    const el = underlayRef.current;
    if (!el) return;
    el.inert = true;
    return () => {
      el.inert = false;
    };
  }, [polsOnParade]);

  useEffect(() => {
    let cancelled = false;
    API.getPols()
      .then(({ data }) => {
        if (cancelled || !data?.length) {
          return;
        }
        const parade = buildSessionPolParade(data);
        setPolsOnParade({
          houseMembers: parade.houseMembers,
          applied: parade.houseMembers.slice(0, BACKDROP_POL_COUNT),
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
      ref={underlayRef}
      className={'rally--lobby-underlay'}
      aria-hidden
    >
      <Container
        fluid
        className={'rally--lobby-underlay-shell d-flex align-items-center'}
      >
        <Row className={'flex-column w-100'}>
          <Col>
            <div className={'lobby'}>
              {/* Hidden search band: reserves .selector-bar height from Lobby */}
              <section aria-hidden>
                <Row>
                  <Col className={'lobby-top third'}>
                    <Row className={'selector-bar rally--lobby-spacer'}>
                      <Col
                        id={'choose-pols'}
                        lg={5}
                      />
                    </Row>
                  </Col>
                </Row>
              </section>
              <section aria-hidden>
                <Row>
                  <Col className={'lobby-middle third'}>
                    <Suspense fallback={null}>
                      {/* Demo mode skips escrow API; backdrop is visual only */}

                      <PolCarousel
                        polsOnParade={polsOnParade}
                        isDemoMode
                        suppressHorizontalScroll
                      />
                    </Suspense>
                  </Col>
                </Row>
              </section>
              {/* Hidden donation band: .starting text matches DonationSection height */}
              <section aria-hidden>
                <Row>
                  <Col className={'lobby-bottom third'}>
                    <Row
                      id={'donation-section'}
                      className={'rally--lobby-spacer'}
                    >
                      <div className={'starting mt-lg-2 mb-2 px-2 w-75'}>
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

export default React.memo(CarouselBackdrop);
