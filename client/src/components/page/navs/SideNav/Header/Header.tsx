import React, { KeyboardEventHandler, MouseEventHandler } from 'react';
import { Col, Row, CloseButton } from 'react-bootstrap';
import { BRAND_DISPLAY } from '@CONSTANTS';
import Marquee from './Marquee';
import './style.css';

type Props = {
  handleClose: MouseEventHandler & KeyboardEventHandler;
};

const SideNavHeader = ({ handleClose }: Props) => (
  <>
    <Row
      id={'sidenav-header'}
      className={'pb-3'}
    >
      <Col
        xs={7}
        className={'powerback fs-3'}
      >
        {BRAND_DISPLAY}
      </Col>
      <Col>
        <CloseButton
          className={'sidenav-close--btn'}
          aria-label={'Hide sidenav'}
          onClick={handleClose}
          variant={'white'}
        />
      </Col>
    </Row>

    <Marquee />
  </>
);

export default React.memo(SideNavHeader);
