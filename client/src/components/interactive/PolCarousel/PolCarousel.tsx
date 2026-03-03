import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Row, Container, Placeholder } from 'react-bootstrap';
import { getDemoDonationsByPol } from '../../../demoMode';
import { useDevice, useNavigation } from '@Contexts';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import type { PolsOnParade } from '@Interfaces';
import Pol, { type PolSilage } from './Pol';
import type { PolDonations } from '@API';
import { APP } from '@CONSTANTS';
import { Loading } from '.';
import API from '@API';
import { logError } from '@Utils';
import './style.css';

export type PolCarouselProps = {
  polsOnParade?: PolsOnParade;
  isDemoMode: boolean;
};

// PolCarousel displays a horizontally scrollable list of Representatives
const PolCarousel = ({ polsOnParade, isDemoMode }: PolCarouselProps) => {
  const { funnel: tabKey } = useNavigation();

  // Extract the array of applied representatives or fallback to empty
  const applied = useMemo(() => polsOnParade?.applied || [], [polsOnParade]),
    // Check if we need to center the items
    shouldCenter = useMemo(
      () => applied.length > 0 && applied.length < 8,
      [applied.length]
    ),
    centerFilteredRosters = useMemo(
      () => (applied.length < 8 ? { justifyContent: 'center' } : {}),
      [applied.length]
    );

  const { isMobile, orientation, height } = useDevice();

  // Gap between cards on mobile portrait; two bands so one value does not overlap on short-tall or look tight on very-tall
  const MOBILE_GAP_LOW = 24;
  const MOBILE_GAP_HIGH = 36;
  const MOBILE_GAP = (() => {
    if (!isMobile || orientation !== 'portrait') return 0;
    if (height > APP.HEIGHT.tallPortraitHigh) return MOBILE_GAP_HIGH;
    if (height > APP.HEIGHT.tallPortraitLow) return MOBILE_GAP_LOW;
    return 0;
  })();

  // Determine card width based on device type; memoize for performance
  const RESPONSIVE_CARD_WIDTH = useMemo(
    () => (isMobile ? APP.POLMUG.m : APP.POLMUG.d),
    [isMobile]
  );
  // Slot width for react-window: on mobile include gap so cards don't deform
  const itemSize = useMemo(
    () =>
      isMobile ? RESPONSIVE_CARD_WIDTH + MOBILE_GAP : RESPONSIVE_CARD_WIDTH,
    [isMobile, RESPONSIVE_CARD_WIDTH, MOBILE_GAP]
  );

  const [totalCelebrations, setTotalCelebrations] = useState<
    PolDonations[] | []
  >([]);

  // Use useRef to track if API call has been made (full app only)
  const hasFetchedEscrow = useRef(false);

  // Demo: use cumulative mock donations from localStorage only
  const syncDemoEscrow = useCallback(() => {
    if (!isDemoMode) return;
    setTotalCelebrations(getDemoDonationsByPol() as PolDonations[]);
  }, [isDemoMode]);

  // Fetch escrow data function (full app only)
  const fetchEscrowData = useCallback(
    (forceRefresh = false) => {
      if (isDemoMode) return;
      if (hasFetchedEscrow.current && !forceRefresh) return;

      API.getWhatPolsHaveInEscrow()
        .then(({ data: escrow }) => {
          setTotalCelebrations(escrow as PolDonations[]);
          hasFetchedEscrow.current = true;
        })
        .catch((err) => logError('Failed to fetch escrow data', err));
    },
    [isDemoMode]
  );

  // Initial fetch: demo from localStorage, full app from API
  useEffect(() => {
    if (isDemoMode) {
      syncDemoEscrow();
    } else {
      fetchEscrowData();
    }
  }, [isDemoMode, syncDemoEscrow, fetchEscrowData]);

  // Refresh when navigating to pol-donation tab
  useEffect(() => {
    if (tabKey !== 'pol-donation') return;
    if (isDemoMode) syncDemoEscrow();
    else if (hasFetchedEscrow.current) fetchEscrowData(true);
  }, [tabKey, isDemoMode, syncDemoEscrow, fetchEscrowData]);

  return (
    <Container
      id={'pol-carousel'}
      className={'pol-carousel'}
      style={
        isMobile
          ? {
              ['--pol-card-width' as string]: `${RESPONSIVE_CARD_WIDTH}px`,
              ['--pol-gap' as string]: `${MOBILE_GAP}px`,
            }
          : undefined
      }
    >
      {!applied.length ? (
        // Show animated placeholder when loading
        <Placeholder
          className={'pol-carousel-placeholder'}
          animation={'wave'}
          as={Container}
        >
          <Placeholder
            className={'pol-row-placeholder'}
            animation={'wave'}
            as={Row}
          >
            <Loading />
          </Placeholder>
        </Placeholder>
      ) : (
        <Row
          className={'pol-carousel pol-row'}
          style={centerFilteredRosters}
        >
          <AutoSizer>
            {({ width, height }: { width: number; height: number }) => (
              <div
                style={{
                  justifyContent: shouldCenter ? 'center' : 'flex-start',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: shouldCenter ? width : '100%',
                  }}
                >
                  {/* react-window */}
                  <List
                    width={
                      shouldCenter
                        ? (isMobile ? window.innerWidth * 0.05 : 0) +
                          applied.length * itemSize
                        : width
                    }
                    style={{
                      paddingRight: shouldCenter ? 0 : isMobile ? 0 : '2vw',
                      overflowX: shouldCenter ? 'hidden' : 'scroll',
                    }}
                    className={'hide-scrollbar list'}
                    itemCount={applied.length}
                    layout={'horizontal'}
                    itemSize={itemSize}
                    itemData={applied}
                    height={height}
                  >
                    {(props: PolSilage) => (
                      <Pol
                        {...props}
                        totalCelebrations={totalCelebrations}
                        polsOnParade={polsOnParade}
                      />
                    )}
                  </List>
                </div>
              </div>
            )}
          </AutoSizer>
        </Row>
      )}
    </Container>
  );
};

export default React.memo(PolCarousel);
