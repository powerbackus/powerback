import React, {
  useRef,
  useMemo,
  Suspense,
  useState,
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  DeviceProp,
  DialogueProp,
  UserDataProp,
  Celebration,
} from '@Types';
import type { CelebrationsProps, CelebrationEventsAction } from './types';
import { VerticalTimeline } from 'react-vertical-timeline-component';
import { CelebrationEvent, Explore, Methods } from './subcomps';
import { Col, Row, Tab, Stack, Button } from 'react-bootstrap';
import { celebrationsToCSV, downloadCSV } from '@Utils';
import type { PolsOnParade } from '@Interfaces';
import { useCelebrationEvents } from '@Hooks';
import EventPlaceholder from './Placeholder';
import type { UserData } from '@Contexts';
import accounting from 'accounting';
import './style.css';

type FilteredEvents = {
  filteredEvents: Celebration[];
};

type CelebrationsPaneProps = DeviceProp & {
  setActiveProfileTab?: Dispatch<SetStateAction<string>>;
  polsOnParade?: PolsOnParade;
  activeProfileTab?: string;
  hasDonated?: boolean;
  user: UserData;
} & CelebrationsProps &
  DialogueProp &
  UserDataProp;

const CelebrationsPane = ({
  polsOnParade,
  isMobile,
  user,
  ...props
}: CelebrationsPaneProps) => {
  // Sync user.donations into hook input so timeline stays up-to-date after celebration cycle; avoid setState in render
  const prevUserCelebrationsRef = useRef(user.donations);
  const [syncedCelebrations, setSyncedCelebrations] = useState(user.donations);
  useEffect(() => {
    if (prevUserCelebrationsRef.current !== user.donations) {
      prevUserCelebrationsRef.current = user.donations;
      setSyncedCelebrations(user.donations);
    }
  }, [user.donations]);
  const [celebrationEvents, { setCelebrationEvents }] = useCelebrationEvents(
    syncedCelebrations as Celebration[]
  );

  const textInputRef = useRef<HTMLInputElement>(null);

  const filterActive = useCallback(() => {
    if (!textInputRef) return;
    else if (!textInputRef.current) return;
    else
      return textInputRef.current.value
        ? textInputRef.current.value.trim().length > 0
        : false;
  }, []);

  const totalViewedDonations = useCallback(
    ({ filteredEvents }: FilteredEvents) => {
      if (!filteredEvents.length) {
        return;
      } else {
        return accounting.formatMoney(
          filteredEvents.reduce((a, b) => a + b.donation, 0)
        );
      }
    },
    []
  );

  const eventsReady = useMemo(() => {
    return (
      celebrationEvents &&
      celebrationEvents.events &&
      celebrationEvents.events.length
    );
  }, [celebrationEvents]);

  const timelineStyles = {
    contentStyle: { background: '#1f1f1f', color: '#f9c' },
    contentArrowStyle: { borderLeft: '7px solid #fc9' },
    iconStyle: { background: '#5E8191', color: '#ccc' },
  };

  const handleExportCSV = useCallback(() => {
    const celebrations = celebrationEvents.filteredEvents as Celebration[];
    if (celebrations.length === 0) return;

    const csvContent = celebrationsToCSV(celebrations);
    const filename = filterActive()
      ? `powerback-celebrations-filtered-${new Date().toISOString().split('T')[0]}.csv`
      : undefined;
    downloadCSV(csvContent, filename);
  }, [celebrationEvents.filteredEvents, filterActive]);

  return (
    <Tab.Pane
      id={'celebrations-modal-subpane'}
      onEnter={() => setCelebrationEvents({ type: 'INIT' })}
      eventKey={'Celebrations'}
      unmountOnExit={true}
      mountOnEnter={true}
      className={'pt-1'}
    >
      <Row className={'celebrations-modal-subpane'}>
        <Col
          xs={12}
          lg={3}
        >
          <Methods
            filterEvents={
              setCelebrationEvents as (action: CelebrationEventsAction) => void
            }
            pols={polsOnParade?.houseMembers ?? []}
            textInputRef={textInputRef}
            isMobile={isMobile}
            user={user}
            {...props}
          />
        </Col>

        <Col
          xs={12}
          lg={9}
        >
          <Row className={'flex-lg-column'}>
            <Col xs={12}>
              <Explore
                filterActive={filterActive}
                events={celebrationEvents}
                user={user}
              />
            </Col>

            <Col className={'mx-lg-4'}>
              <div
                tabIndex={-1}
                className={
                  'px-lg-3 timeline-bg' + (!eventsReady ? 'stop-scroll' : '')
                }
              >
                <VerticalTimeline
                  key={user.id + '-vertical-timeline'}
                  lineColor={'var(--attention-muted)'}
                  layout={'1-column-right'}
                >
                  <Suspense
                    fallback={
                      <>
                        <EventPlaceholder
                          timelineStyles={timelineStyles}
                          isMobile={isMobile as boolean}
                        />
                        <EventPlaceholder
                          timelineStyles={timelineStyles}
                          isMobile={isMobile as boolean}
                        />
                      </>
                    }
                  >
                    {celebrationEvents.filteredEvents.map((c: Celebration) => (
                      <CelebrationEvent
                        key={c.idempotencyKey + '-celebration-event'}
                        elementId={c.idempotencyKey + '-celebration-event'}
                        pols={polsOnParade?.houseMembers}
                        id={c.idempotencyKey as string}
                        timelineStyles={timelineStyles}
                        celebration={c}
                      />
                    ))}
                    {celebrationEvents.filteredEvents.length > 0 && (
                      <div className={'viewed-celebrations-total-wrapper'}>
                        <Stack
                          className={
                            'justify-content-center align-items-center flex-wrap'
                          }
                          direction={'horizontal'}
                          gap={2}
                        >
                          <div className={'viewed-celebrations-total'}>
                            {(!filterActive() ? 'Grand ' : 'Filtered ') +
                              'Total: ' +
                              totalViewedDonations(celebrationEvents)}
                          </div>
                          <Button
                            aria-label={'Download celebrations in CSV format'}
                            className={'export-csv-btn ms-lg-1'}
                            variant={'outline-secondary'}
                            onClick={handleExportCSV}
                            size={'sm'}
                          >
                            Export CSV&nbsp;
                            <i className={'bi bi-download'} />
                          </Button>
                        </Stack>
                      </div>
                    )}
                  </Suspense>
                </VerticalTimeline>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Tab.Pane>
  );
};

export default React.memo(CelebrationsPane);
