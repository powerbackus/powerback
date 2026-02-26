import React, {
  useMemo,
  Dispatch,
  MouseEvent,
  useCallback,
  KeyboardEvent,
  SetStateAction,
  useLayoutEffect,
} from 'react';
import {
  useAuth,
  useProfile,
  useDonationState,
  useComplianceTier,
  useDonationLimits,
  type CredentialsPath,
  type ShowModal,
} from '@Contexts';
import { useIsDemoMode } from '../../../../../demoMode';
import { capitalCaseify, handleKeyDown } from '@Utils';
import { TabLink } from '@Components/interactive';
import { ContinueBtn } from '@Components/buttons';
import { InfoTooltip } from '@Components/modals';
import { Col, Nav, Row } from 'react-bootstrap';
import { ACCOUNT_COPY } from '@CONSTANTS';
import accounting from 'accounting';
import {
  type NavigationProp,
  type DialogueProp,
  type DeviceProp,
  type AuthProp,
} from '@Types';
import './style.css';

type UserProps = AuthProp & DialogueProp & DeviceProp & NavigationProp;

const NavUser = ({
  handleLogOut,
  setShowModal,
  isMobile,
  route,
}: UserProps) => {
  const { credentialsPath, setCredentialsPath } = useDonationState(),
    { effectiveLimits } = useDonationLimits(),
    { userCompliance } = useComplianceTier(),
    { settings } = useProfile(),
    { isLoggedIn } = useAuth();

  useLayoutEffect(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      credentials: !!credentialsPath,
    }));
  }, [setShowModal, credentialsPath]);

  const openCredentialsModal = useCallback(
      (e: KeyboardEvent<Element> | MouseEvent<Element>) => {
        const path = capitalCaseify(
          (e.target as HTMLElement).textContent as string
        ) as CredentialsPath;
        setCredentialsPath(path);
      },
      [setCredentialsPath]
    ),
    openAccountModal = useCallback(
      () =>
        (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
          ...s,
          account: true,
        })),
      [setShowModal]
    );

  // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
  const safeCompliance = useMemo(
    () =>
      userCompliance === 'guest' || userCompliance === 'compliant'
        ? userCompliance
        : 'guest',
    [userCompliance]
  );

  const complianceIcon = useMemo(
    () =>
      `bi bi-patch${
        {
          guest: '-exclamation attention',
          compliant: '-check-fill positive-indicator',
        }[safeCompliance] || ''
      }`,
    [safeCompliance]
  );

  const complianceDonationLimit = useMemo(
    () => accounting.formatMoney(effectiveLimits.effectiveLimit, '$', 0),
    [effectiveLimits.effectiveLimit]
  );

  const complianceTooltips = ACCOUNT_COPY.APP.COMPLIANCE_TOOLTIPS;

  const tooltipMessage = useMemo(
    () =>
      (complianceTooltips[safeCompliance] || complianceTooltips.guest) +
        complianceDonationLimit +
        { guest: ' in total.', compliant: ' per candidate, per election.' }[
          safeCompliance
        ] || '',
    [safeCompliance, complianceTooltips, complianceDonationLimit]
  );

  const labels = ['Sign out', 'Sign in'];

  const isDemoMode = useIsDemoMode();

  // Show demo mode label if in demo mode
  if (isDemoMode) {
    return (
      <Col
        lg={3}
        className={'d-flex align-items-center'}
      >
        <Nav className={'nav-links flex-row'}>
          <Row className={'account-logio--row'}>
            <Col lg={12}>
              <span className={'demo-label'}>DEMO MODE</span>
            </Col>
          </Row>
        </Nav>
      </Col>
    );
  }

  return (
    <Col
      lg={3}
      className={'d-flex align-items-center'}
    >
      <Nav className={'nav-links flex-row'}>
        <Row
          className={'account-logio--row'}
          data-tour='account-open'
        >
          {(isLoggedIn && (
            <Col
              lg={12}
              onClick={openAccountModal}
              onKeyDown={(e: KeyboardEvent) =>
                handleKeyDown(e, openAccountModal)
              }
            >
              <span className={'d-flex align-items-center'}>
                <div className={'account-logio--row-icon'}>
                  {settings?.showToolTips ? (
                    <InfoTooltip
                      icon={complianceIcon}
                      message={tooltipMessage}
                      toolTipId={'compliance-tooltip'}
                      showToolTips={settings?.showToolTips ?? true}
                    />
                  ) : (
                    <i className={complianceIcon} />
                  )}
                </div>

                <TabLink topic={'Account'} />
              </span>
            </Col>
          )) || (
            <Col lg={12}>
              <ContinueBtn
                size={'sm'}
                hidden={false}
                type={'button'}
                variant={'dark'}
                disabled={false}
                label={'JOIN NOW'}
                isMobile={isMobile}
                classProp={'nav-user-btn'}
                handleClick={openCredentialsModal as () => void}
              />
            </Col>
          )}

          <Col xs={'auto'}>
            {(isLoggedIn && (
              <span
                tabIndex={0}
                key={'signout-link'}
                onClick={handleLogOut as unknown as () => void}
                onKeyDown={(e: KeyboardEvent) =>
                  handleKeyDown(e, handleLogOut as unknown as () => void)
                }
                className={'natural-link navbar-logio'}
              >
                {labels[0]}
              </span>
            )) ||
              (route && (route.name === 'main' || route.name === 'reset') && (
                <span
                  onKeyDown={(e) => handleKeyDown(e, openCredentialsModal)}
                  className={'natural-link navbar-logio'}
                  onClick={openCredentialsModal}
                  key={'signin-link'}
                  tabIndex={0}
                >
                  {labels[1]}
                </span>
              ))}
          </Col>
        </Row>
      </Nav>
    </Col>
  );
};

export default React.memo(NavUser);
