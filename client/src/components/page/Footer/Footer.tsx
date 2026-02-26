/**
 * Footer. Brand, citations, splash/funnel variants.
 * @module Footer
 */
import React from 'react';
import { Col, Row, Image, Stack, Container } from 'react-bootstrap';
import { BRAND_DISPLAY, CITATIONS, SPLASH_COPY } from '@CONSTANTS';
import { visitCitation } from '@Utils';
import './style.css';

const Footer = () => (
  <footer
    className='footer'
    role='contentinfo'
  >
    <Container fluid>
      <Row>
        <Col className='paid-for mb-1'>
          <p className='mt-2 mb-1'>
            Paid for by <span className='powerback'>POWERBACK</span> (
            <span className='link-appearance'>powerback.us</span>) and not
            authorized by any candidate or candidate's committee.
            <br />
            <br />
            Contributions of gifts to political candidates via{' '}
            <span className='powerback'>{BRAND_DISPLAY}</span> as a conduit are
            not deductible as charitable contributions for Federal income tax
            purposes.
          </p>
        </Col>
      </Row>
      <Stack
        direction='horizontal'
        className='citations'
        gap={3}
      >
        <Row className='footer-links pt-1'>
          {/* GreenGeeks seal of green energy */}
          <Col className='gg'>
            <Image
              alt={
                '300% Green Powered Web Hosting certification from Green Geeks'
              }
              onClick={() => visitCitation('GG')}
              src={CITATIONS.GG.i}
              width={113}
              height={26}
            />
          </Col>
          <Col className='tagline'>{SPLASH_COPY.SPLASH.TAGLINE}</Col>
          <Col>
            ©{new Date().getFullYear() + ' '}
            <a href='/'>{BRAND_DISPLAY}</a>
          </Col>
        </Row>
      </Stack>
    </Container>
  </footer>
);

export default React.memo(Footer);
