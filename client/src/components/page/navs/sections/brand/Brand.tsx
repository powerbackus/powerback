import React, { useCallback } from 'react';
import { BRAND_DISPLAY, SPLASH_COPY, LOGO_DIMS, MEDIA_PATHS } from '@CONSTANTS';
import { Col, Row, Image, Navbar } from 'react-bootstrap';
import { useIsDemoMode } from '../../../../../demoMode';
import { handleKeyDown, publicAsset } from '@Utils';
import { routes } from '../../../../../router';
import type { DeviceProp } from '@Types';
import './style.css';

type BrandProps = DeviceProp & {
  handleSideNavBrandIcon: () => void;
  roleType: 'button' | 'banner';
  isSpinning: boolean;
  spin: () => void;
};

const cableImgSrc = publicAsset(MEDIA_PATHS.CABLE_LOGO);

const NavBrand = ({
  handleSideNavBrandIcon,
  isSpinning,
  isDesktop,
  roleType,
  spin,
}: BrandProps) => {
  const spinClassName = isSpinning ? 'spinning-logo ' : '';

  const handleLogoClick = useCallback(() => {
    if (isDesktop) {
      spin();
      routes.main().replace();
    } else {
      handleSideNavBrandIcon();
    }
  }, [isDesktop, spin, handleSideNavBrandIcon]);

  const isDemoMode = useIsDemoMode();

  return (
    <Row
      tabIndex={0}
      role={roleType}
      className={'nav-right'}
      onClick={handleLogoClick}
      title={'Return to home page'}
      aria-label={`${BRAND_DISPLAY} home`}
      onKeyDown={(e) => handleKeyDown(e, handleLogoClick, 'logo')}
    >
      <Col
        xs={2}
        lg={1}
        className='mt-1'
      >
        <Navbar.Brand className={spinClassName}>
          <Image
            alt={`${BRAND_DISPLAY} "cable" icon`}
            height={LOGO_DIMS.default.height}
            width={LOGO_DIMS.default.width}
            loading={'eager'}
            src={cableImgSrc}
          />
        </Navbar.Brand>
      </Col>
      {isDesktop && <Col lg={1}></Col>}
      <Col
        xs={10}
        lg={10}
        className='navbar-text'
      >
        <Navbar.Text>
          <span className='powerback'>{BRAND_DISPLAY}</span>

          {(isDemoMode && !isDesktop && (
            <span className='demo-label'> DEMO MODE</span>
          )) || <i className='tagline'> {SPLASH_COPY.SPLASH.TAGLINE}</i>}
        </Navbar.Text>
      </Col>
    </Row>
  );
};

export default React.memo(NavBrand);
