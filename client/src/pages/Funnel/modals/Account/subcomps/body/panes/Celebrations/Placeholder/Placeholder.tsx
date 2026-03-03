import React from 'react';
import {
  Col,
  Row,
  Stack,
  Placeholder,
  PlaceholderButton,
} from 'react-bootstrap';
import { VerticalTimelineElement } from 'react-vertical-timeline-component';
import { Icon } from '../subcomps/event/subcomps';
import './style.css';

type Props = {
  timelineStyles: object;
  isMobile: boolean;
};

const EventPlaceholder = ({ isMobile, timelineStyles }: Props) => (
  <Placeholder
    as={VerticalTimelineElement}
    {...timelineStyles}
    animation={'glow'}
    icon={<Icon />}
    date={
      <Row>
        <Col xs={12}>
          <span>
            <Stack
              direction='horizontal'
              gap={3}
            >
              {isMobile ? (
                <>
                  <Placeholder className='w-25' />{' '}
                  <Placeholder className='w-75' />
                </>
              ) : (
                <Stack
                  direction='vertical'
                  gap={1}
                >
                  <Placeholder className='w-75' />
                  <Placeholder className='w-75' />
                </Stack>
              )}
            </Stack>
          </span>
        </Col>
      </Row>
    }
    //
  >
    <Row>
      <Col>
        <span className={'donation-counter'}>
          <Placeholder className='w-25' />
        </span>
      </Col>
      <Col
        xs={3}
        lg={3}
      >
        <Stack
          direction='vertical'
          gap={1}
        >
          <span className={'donation-counter'}>
            <Placeholder className='w-100' />
          </span>
          <span className={'donation-counter'}>
            <Placeholder className='w-100' />
          </span>
        </Stack>
      </Col>
    </Row>
    <Row className='mt-1 mb-2'>
      <Col>
        <Stack
          direction='vertical'
          gap={1}
        >
          <Placeholder className='w-25' />
          <Placeholder className='w-50' />
        </Stack>
      </Col>
    </Row>
    <Row>
      <Col>
        <div className='donation-receipt-btn-group mb-1 px-3'>
          <Stack
            direction={'horizontal'}
            gap={4}
          >
            <PlaceholderButton
              variant={'secondary'}
              inert={'true'}
              size={'sm'}
              xs={4}
            />
            <PlaceholderButton
              variant={'secondary'}
              inert={'true'}
              size={'sm'}
              xs={4}
            />
          </Stack>
        </div>
      </Col>
    </Row>
  </Placeholder>
);

export default React.memo(EventPlaceholder);
