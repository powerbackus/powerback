import React, { useCallback } from 'react';
import { useIsDemoMode } from '../../../../../demoMode';
import { Col, Nav, Row, Tab } from 'react-bootstrap';
import { APP, GIT_REPO } from '@CONSTANTS';
import type { AuthProp } from '@Types';
import SideLink from './Link';
import {
  type CredentialsPath,
  type ShowModal,
  useDonationState,
  useProfile,
} from '@Contexts';
import './style.css';

type PanelProps = AuthProp & {
  openModal: (modal: keyof ShowModal | string) => void;
  username: string;
};

const SidePanel = ({
  handleLogOut,
  isLoggedIn,
  openModal,
  username,
}: PanelProps) => {
  const { serverConstants } = useProfile(),
    { setCredentialsPath } = useDonationState();

  const discordUrl =
    serverConstants?.APP?.DISCORD_INVITE || 'https://powerback.us/discord';

  const isDemoMode = useIsDemoMode();

  const openCredentialsWithPath = useCallback(
    (path: CredentialsPath) => {
      setCredentialsPath(path);
      openModal('credentials');
    },
    [setCredentialsPath, openModal]
  );

  return (
    <Tab.Container id='side-nav-tabs'>
      <Row
        id={'account-slide-row'}
        className={'side-menu-profile-row flex-row'}
        style={{ fontFamily: 'Red Hat Text' }}
      >
        <Col>
          <Nav className='flex-column pt-2'>
            {APP.NAV.MODALS.map((modal) => (
              <SideLink
                key={modal + '-sidelink'}
                modal={modal as keyof ShowModal & string}
                openModal={openModal}
                cls='-'
              />
            ))}

            {(isLoggedIn && (
              <>
                <SideLink
                  icon={'person-circle'}
                  openModal={openModal}
                  modal={'account'}
                  cls={'pt-5 pb-3'}
                />
                <SideLink
                  icon={'box-arrow-left'}
                  handler={handleLogOut}
                  label={'Sign out'}
                  cls={'py-4'}
                />
                <span className='signedin-info'>
                  {'Signed in as ' + username}
                </span>
              </>
            )) ||
              (!isDemoMode && (
                <>
                  {APP.NAV.SIDENAV_TOUR.map((o) => (
                    <SideLink
                      key={o.label + '-sidelink'}
                      handler={() =>
                        openCredentialsWithPath(o.label as CredentialsPath)
                      }
                      label={o.label}
                      icon={o.icon}
                      cls={o.cls}
                    />
                  ))}
                </>
              ))}
            <SideLink
              trackingMedium={'sidenav'}
              cls={'pt-5 mt-5 fs-6'}
              label={'Contribute'}
              href={GIT_REPO}
              icon={'github'}
            />
            <SideLink
              trackingMedium={'sidenav'}
              cls={'pt-3 fs-6'}
              label={'Discord'}
              href={discordUrl}
              icon={'discord'}
            />
          </Nav>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default React.memo(SidePanel);
