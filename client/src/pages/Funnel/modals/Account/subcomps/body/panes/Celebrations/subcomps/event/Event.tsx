import React, { useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { VerticalTimelineElement } from 'react-vertical-timeline-component';
import { Icon, Title, ButtonSet, Subtitle, TipAmount } from './subcomps';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import StyledAlert from '@Components/alerts/StyledAlert';
import { Col, Row, Image, Stack } from 'react-bootstrap';
import 'react-vertical-timeline-component/style.min.css';
import type { Celebration, UserDataProp } from '@Types';
import { useDevice, type ShowAlert } from '@Contexts';
import relativeTime from 'dayjs/plugin/relativeTime';
import { InfoTooltip } from '@Components/modals';
import EventPlaceholder from '../../Placeholder';
import type { HouseMember } from '@Interfaces';
import { logError, publicAsset } from '@Utils';
import timezone from 'dayjs/plugin/timezone';
import { createPortal } from 'react-dom';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import API from '@API';
import {
  CELEBRATION_EVENT_COPY,
  INITIAL_ALERTS,
  ALERT_TIMEOUT,
  BRAND_DISPLAY,
  MEDIA_PATHS,
} from '@CONSTANTS';
import './style.css';

type EventLocalProps = UserDataProp & {
  polsOnParade?: { houseMembers?: HouseMember[] };
  timelineStyles: {
    contentArrowStyle: object;
    contentStyle: object;
    iconStyle: object;
  };
  celebration: Celebration;
  pols?: HouseMember[];
  elementId: string;
  id: string;
};

type CelebrationEventProps = EventLocalProps;

const logoImgSrc = publicAsset(MEDIA_PATHS.CABLE_LOGO);

const CelebrationEvent = ({
  id,
  pols,
  elementId,
  celebration,
  timelineStyles,
}: CelebrationEventProps) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(relativeTime);
  dayjs.extend(advancedFormat);

  const idToDate = useMemo(() => {
    // Use createdAt if available, otherwise fall back to ObjectId extraction
    return celebration.createdAt
      ? new Date(celebration.createdAt)
      : celebration._id
        ? new Date(
            parseInt(
              (celebration._id as unknown as string).substring(0, 8),
              16
            ) * 1000
          )
        : new Date();
  }, [celebration.createdAt, celebration._id]);

  const descriptionSet = ['date', 'time', 'id'];

  const dDT = useMemo(() => {
      const dT = ['MM-DD-YYYY', 'HH:mm'];
      const ET_TIMEZONE = 'America/New_York';
      return {
        date: dayjs(idToDate).tz(ET_TIMEZONE).format(dT[0]),
        time: dayjs(idToDate).tz(ET_TIMEZONE).format(dT[1]) + ' ET',
        id: celebration.idempotencyKey as string,
      };
    }, [idToDate, celebration.idempotencyKey]),
    BILL_ID = useMemo(
      () =>
        celebration.bill_id
          .substring(0, celebration.bill_id.length - 4)
          .toUpperCase(),
      [celebration.bill_id]
    );

  const [donee, setDonee] = useState<HouseMember | undefined>();

  type OnHoldStatus = 'PAUSED' | 'DEFUNCT' | 'RESOLVED' | '';

  const [onHoldStatus, setOnHoldStatus] = useState<OnHoldStatus>('');
  const [showCopyNotification, setShowCopyNotification] =
    useState<ShowAlert>(INITIAL_ALERTS);

  useLayoutEffect(() => {
    if (!pols?.filter((d: HouseMember) => d.id === celebration.pol_id).length) {
      const abortController = new AbortController();

      API.getPol(celebration.pol_id)
        .then(({ data }) => {
          if (!abortController.signal.aborted) {
            setDonee(data);
            if (celebration.paused) setOnHoldStatus('PAUSED');
            if (celebration.defunct) setOnHoldStatus('DEFUNCT');
            if (celebration.resolved) setOnHoldStatus('RESOLVED');
          }
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            logError('Celebration status fetch failed', error);
          }
        });

      return () => abortController.abort();
    } else {
      setDonee(
        (pols as HouseMember[]).filter(
          (d: HouseMember) => d.id === celebration.pol_id
        )[0]
      );
    }
  }, [pols, celebration]);

  const { isMobile } = useDevice();

  /**
   * Determines the tooltip message and icon based on the onHoldStatus.
   */
  const tooltip =
      onHoldStatus === 'DEFUNCT'
        ? CELEBRATION_EVENT_COPY.STATUS.TOOLTIPS.DEFUNCT
        : onHoldStatus === 'PAUSED'
          ? CELEBRATION_EVENT_COPY.STATUS.TOOLTIPS.PAUSED
          : CELEBRATION_EVENT_COPY.STATUS.TOOLTIPS.RESOLVED,
    statusIcon =
      onHoldStatus === 'DEFUNCT'
        ? CELEBRATION_EVENT_COPY.STATUS.ICONS.DEFUNCT
        : onHoldStatus === 'PAUSED'
          ? CELEBRATION_EVENT_COPY.STATUS.ICONS.PAUSED
          : CELEBRATION_EVENT_COPY.STATUS.ICONS.RESOLVED,
    descriptionSetClassName = 'd-flex flex-row gap-4 text-start text-nowrap';

  /**
   * Copies the celebration ID to clipboard and shows a success notification
   */
  const handleCopyId = useCallback(async (id: string) => {
    if (!id) return;

    try {
      await navigator.clipboard.writeText(id);
      setShowCopyNotification((s) => ({ ...s, update: true }));
    } catch (error) {
      logError('Failed to copy ID to clipboard', error);
    }
  }, []);

  const DescriptionSet = ({
    label,
    value,
    isId = false,
  }: {
    label: string;
    value: string;
    isId?: boolean;
  }) => (
    <div className={descriptionSetClassName}>
      <dt>{label}:</dt>
      <dd
        className={isId ? 'celebration-id to-clipboard' : ''}
        onClick={isId ? () => handleCopyId(value) : undefined}
        style={isId ? { cursor: 'copy' } : undefined}
      >
        {value}
        {isId && (
          <i
            className={'bi bi-clipboard powerback ms-1'}
            aria-hidden={'true'}
          />
        )}
      </dd>
    </div>
  );

  return donee ? (
    <>
      {showCopyNotification.update &&
        createPortal(
          <StyledAlert
            message={' Celebration ID has been copied to clipboard!'}
            alertClass={'copy-notification'}
            setShow={setShowCopyNotification}
            show={showCopyNotification}
            time={ALERT_TIMEOUT.copy}
            icon={'clipboard-check'}
            iconClass={'text-info'}
            dismissible={true}
            variant={'info'}
            type={'update'}
          />,
          document.body
        )}
      <VerticalTimelineElement
        id={elementId}
        {...timelineStyles}
        key={id + '-celebration-event'}
        icon={
          <Icon
            donee={donee}
            onHoldStatus={onHoldStatus}
          />
        }
        className={
          !!onHoldStatus ? 'inactive ' + onHoldStatus.toLowerCase() : ''
        }
        aria-label={`Celebration for ${donee.first_name} ${donee.last_name} - ${onHoldStatus}`}
        date={
          (
            <Row>
              <Col xs={'auto'}>
                <dl
                  className={
                    'event-description-set d-flex flex-column gap-1 mt-lg-1 px-lg-1'
                  }
                >
                  {descriptionSet.map((ds) => (
                    <DescriptionSet
                      key={ds + '-description-set'}
                      label={
                        CELEBRATION_EVENT_COPY.LABELS[
                          ds.toUpperCase() as keyof typeof CELEBRATION_EVENT_COPY.LABELS
                        ]
                      }
                      value={dDT[ds as keyof typeof dDT]}
                      isId={ds === 'id'}
                    />
                  ))}
                </dl>
              </Col>
              <Col>
                <Image
                  className={
                    'receipt-mark navbar-brand pb-lg-1 ' +
                    onHoldStatus.toLowerCase()
                  }
                  alt={`${BRAND_DISPLAY} "cable" icon`}
                  loading={'eager'}
                  src={logoImgSrc}
                  height={40}
                />
              </Col>
            </Row>
          ) as unknown as string
        }
      >
        <>
          {!!onHoldStatus && (
            <div
              className={'celebration-status'}
              aria-label={tooltip}
              aria-live={'polite'}
              role={'status'}
              tabIndex={0}
            >
              <InfoTooltip
                toolTipId={id + '-celebration-status-tooltip'}
                showToolTips={true}
                icon={statusIcon}
                message={tooltip}
              >
                <span>{onHoldStatus}</span>
              </InfoTooltip>
            </div>
          )}
          <Row className={'align-items-start pb-2 pb-lg-0'}>
            <Col
              xs={6}
              lg={8}
              className={'d-flex flex-column'}
            >
              <Title donee={donee} />

              <Subtitle donee={donee} />
            </Col>
            <Col className={'contingency-info'}>
              <Stack
                className={'text-end'}
                direction={'vertical'}
                gap={1}
              >
                <span
                  title={CELEBRATION_EVENT_COPY.LABELS.BILL_ID}
                  className={'donation-bill'}
                >
                  {BILL_ID}
                </span>
                <span
                  title={CELEBRATION_EVENT_COPY.LABELS.DONATION_AMOUNT}
                  className={'donation-amount'}
                >
                  ${celebration.donation}
                </span>
                <TipAmount tip={celebration.tip || 0} />
              </Stack>
            </Col>
          </Row>
          <Row>
            <Col>
              <ButtonSet celebration={{ ...celebration }} />
            </Col>
          </Row>
        </>
      </VerticalTimelineElement>
    </>
  ) : (
    <EventPlaceholder
      timelineStyles={timelineStyles}
      isMobile={isMobile}
    />
  );
};

export default React.memo(CelebrationEvent);
