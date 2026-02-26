import React from 'react';
import { Col, Row, Form } from 'react-bootstrap';
import type { CelebrationsProps } from '../../types';
import Input from './Input';
import Sort from './Sort';
import './style.css';

const Methods = ({ ...props }: CelebrationsProps) => (
  // prevent weird sort query redirect from ToggleButtonGroup on Enter key
  <Form onSubmit={(e) => e.preventDefault()}>
    <Row>
      <Col
        xs={5}
        lg={12}
        className={'mb-lg-2'}
      >
        <Sort {...props} />
      </Col>

      <Col xs={6}>
        <Input {...props} />
      </Col>
    </Row>
  </Form>
);

export default React.memo(Methods);
