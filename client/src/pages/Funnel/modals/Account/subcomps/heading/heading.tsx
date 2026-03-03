import React from 'react';
import { Nav } from 'react-bootstrap';
import { ACCOUNT_COPY } from '@CONSTANTS';
import { TabLink } from '@Components/interactive';
import './style.css';

type Props = {
  hasDonated: boolean;
  isMobile: boolean;
};

const Heading = ({ isMobile, hasDonated }: Props) => (
  <>
    <span className={'display-' + (isMobile ? '7' : '5')}>Account</span>
    <Nav
      className={'px-2' + (isMobile ? ' mobile-tabs' : '')}
      defaultActiveKey={'Profile'}
      variant={'pills'}
    >
      {ACCOUNT_COPY.APP.ACCOUNT_TABS.map((section) => {
        return (
          (section.topic !== 'Celebrations' ||
            (section.topic === 'Celebrations' && hasDonated)) && (
            <Nav.Item key={'account-tab-' + section.key}>
              <TabLink
                topic={section.topic}
                eventKey={section.topic}
              />
            </Nav.Item>
          )
        );
      })}
    </Nav>
  </>
);

export default React.memo(Heading);
