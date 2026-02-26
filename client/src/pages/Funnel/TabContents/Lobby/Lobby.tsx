/**
 * Funnel lobby tab. Pol search, carousel, donation section, and continue.
 * @module Lobby
 */
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import type { UserEvent, DonationStateProp } from '@Types';
import type { PolComboboxProps } from '@Components/search/PolCombobox';
import './style.css';

type LobbyProps = DonationStateProp &
  PolComboboxProps & {
    handleContinue: (e: UserEvent) => void;
    showRefreshAppSpinner?: boolean;
    isDemoMode: boolean;
  };

const PolCarousel = React.lazy(
    () => import('../../../../components/interactive/PolCarousel/PolCarousel')
  ),
  Search = React.lazy(() => import('../../../../components/search/Search')),
  DonationSection = React.lazy(() => import('./DonationSection'));

/**
 * Lobby component for the initial celebration setup
 *
 * This component provides the main interface for users to select politicians
 * and set donation amounts. It includes a search interface, politician carousel
 * for browsing candidates, and donation amount selection. This is the first
 * step in the celebration funnel.
 *
 * Accessibility: Includes a skip link that appears adjacent to the selected
 * politician card, allowing keyboard users to bypass the carousel and jump
 * directly to the donation section.
 *
 * @component
 * @param {LobbyProps} props - Component props passed from parent (spread via {...props})
 * @param {(e: UserEvent) => void} handleContinue - Function to handle continue button click
 * @param {boolean} isDemoMode - Whether the app is in demo mode
 *
 * @example
 * ```tsx
 * <Lobby
 *   handleContinue={handleContinue}
 *   {...otherProps}
 * />
 * ```
 */
const Lobby = ({ handleContinue, isDemoMode, ...props }: LobbyProps) => (
  <div className={'lobby'}>
    <section aria-label='Choose politicians to support'>
      <Row>
        <Col className={'lobby-top third'}>
          <Row className={'selector-bar'}>
            <Col
              id={'choose-pols'}
              lg={5}
            >
              <Search {...props} />
            </Col>
          </Row>
        </Col>
      </Row>
    </section>

    <section aria-label='Selected politicians'>
      <Row>
        <Col className={'lobby-middle third'}>
          <PolCarousel
            isDemoMode={isDemoMode}
            {...props}
          />
        </Col>
      </Row>
    </section>

    <section aria-label='Set donation amount'>
      <Row>
        <Col className={'lobby-bottom third'}>
          <DonationSection
            handleContinue={handleContinue}
            isDemoMode={isDemoMode}
            {...props}
          />
        </Col>
      </Row>
    </section>
  </div>
);

export default React.memo(Lobby);
