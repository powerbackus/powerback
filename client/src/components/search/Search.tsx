/**
 * Search section. PolCombobox and link group.
 * @module Search
 */
import React from 'react';
import PolCombobox, { type PolComboboxProps } from './PolCombobox';
import { Col, Row, Container } from 'react-bootstrap';
import { SEARCH_COPY } from '@CONSTANTS';
import LinkGroup from './LinkGroup';
import './style.css';

const Search = ({ ...props }: PolComboboxProps) => (
  <Container fluid>
    <Row className={'pol-search-options'}>
      <Col
        className={'section-title'}
        xs={5}
        lg={2}
      >
        <span className={'chamber'}>{SEARCH_COPY.SEARCH.SET}</span>
      </Col>

      <Col
        xs={3}
        lg={5}
      >
        <LinkGroup />
      </Col>
    </Row>

    <PolCombobox {...props} />
  </Container>
);

export default React.memo(Search);
