import React, {
  useMemo,
  useCallback,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import Compliance, { type ComplianceProps } from '../Compliance/Compliance';
import { useDevice, type ComplianceTier, type UserData } from '@Contexts';
import { TabLink } from '@Components/interactive';
import { Col, Nav, Row } from 'react-bootstrap';
import FieldList from './FieldList';
import { CONTROLS } from '..';
import type {
  DeviceProp,
  ProfileProp,
  UserDataProp,
  FieldControl,
} from '@Types';
import './style.css';

type HandleAccountUpdate =
  | ((e?: MouseEvent & KeyboardEvent) => void | Promise<void>)
  | undefined;

type Dataset = {
  rrUiEventKey: string;
};

type FieldListProps = {
  setActiveTab: Dispatch<SetStateAction<string>>;
  getFieldMap: () => Map<string, HTMLElement>;
  fieldList: FieldControl[];
  setFieldList: () => void;
  activeTab: string;
};

type ProfileSideNavLocalProps = {
  setActiveTab: Dispatch<SetStateAction<string>>;
  handleAccountUpdate: HandleAccountUpdate;
  formCompliance?: ComplianceTier;
  formIsInvalid?: boolean;
  activeTab: string;
};

type ProfileSideNavComponentProps = ProfileSideNavLocalProps &
  FieldListProps & {
    user: UserData;
  } & UserDataProp &
  ProfileProp &
  DeviceProp;

const ProfileSideNav = ({
  handleAccountUpdate,
  setActiveTab,
  setFieldList,
  activeTab,
  fieldList,
  user,
  ...props
}: ProfileSideNavComponentProps) => {
  /**
   * Handles the click event for switching the active tab pane.
   *
   * @param e - The keyboard and mouse event object.
   * @returns void or Promise<void> if the event is not valid, or the active tab is the same as the target event key.
   *          Otherwise, updates the active tab and calls the handleAccountUpdate function.
   */
  const handleClickSwitchTabPane = useCallback(
    (e: KeyboardEvent & MouseEvent) => {
      if (!((e.target as HTMLElement).dataset as Dataset)) return;
      else if (activeTab === (e.target as HTMLElement).dataset.rrUiEventKey) {
        return;
      } else {
        (handleAccountUpdate as unknown as () => void)();
        setActiveTab(
          ((e.target as HTMLElement).dataset as Dataset).rrUiEventKey as string
        );
      }
    },
    [activeTab, setActiveTab, handleAccountUpdate]
  );

  /**
   * Handles the key press event for switching the active tab pane.
   *
   * @param e - The keyboard event object.
   * @returns void or Promise<void> if the event is not valid, or the active tab is the same as the target event key.
   *          Otherwise, updates the active tab and calls the handleAccountUpdate function.
   */
  const handleKeySwitchTabPane = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      else if (!((e.target as HTMLElement).firstChild as HTMLElement).dataset)
        return;
      else if (
        ((e.target as HTMLElement).firstChild as HTMLElement).dataset
          .rrUiEventKey === void 0
      ) {
        return;
      } else {
        (handleAccountUpdate as unknown as () => void)();
        setActiveTab(
          (
            ((e.target as HTMLElement).firstChild as HTMLElement)
              .dataset as Dataset
          ).rrUiEventKey
        );
      }
    },
    [setActiveTab, handleAccountUpdate]
  );

  const { isMobile } = useDevice();

  const handleNavClass = useMemo(
    () => 'side-pills' + (isMobile ? ' justify-content-end' : ''),
    [isMobile]
  );

  return (
    <Row id={'profile-sidenav'}>
      <Col xs={12}>
        {isMobile && user && (
          <Compliance {...(props as unknown as ComplianceProps)} />
        )}
        <Nav
          role={'tablist'}
          variant={'pills'}
          activeKey={activeTab}
          className={handleNavClass}
          onKeyDown={(e) => handleKeySwitchTabPane(e)}
        >
          {CONTROLS.map((tab, i) => (
            <Nav.Item
              tabIndex={0}
              key={tab.key}
              onClick={(e: React.MouseEvent<HTMLElement>) =>
                handleClickSwitchTabPane(
                  e as unknown as KeyboardEvent & MouseEvent
                ) as unknown as HandleAccountUpdate
              }
              id={`profile-tab-${tab.eventKey}`}
            >
              <TabLink
                eventKey={tab.eventKey}
                topic={i + 1 + ') ' + tab.label}
                active={activeTab === tab.eventKey}
                ariaLabel={'account panel navigation tab:' + tab.eventKey}
              />
            </Nav.Item>
          ))}
        </Nav>
      </Col>
      <Col className={'pt-lg-1'}>
        {!isMobile && (
          <FieldList
            {...props}
            key={'account-modal-profile-sidenav-field-list-' + user.id}
            setFieldList={setFieldList}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            fieldList={fieldList}
            isMobile={false}
            user={user}
          />
        )}
      </Col>
    </Row>
  );
};

export default React.memo(ProfileSideNav);
