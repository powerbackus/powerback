import React, {
  useRef,
  useCallback,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { ProfileProp, DialogueProp, UserDataProp } from '@Types';
import { Col, Row, TabPane, TabContainer } from 'react-bootstrap';
import { CONTROLS, ProfileSideNav, ProfileSubPane } from '.';
import type { UserData } from '@Contexts';
import { useFieldList } from '@Hooks';
import './style.css';

const autosaveNotice =
  'This form validates and updates your changes automatically.';

type ProfilePaneProps = {
  setActiveTab: Dispatch<SetStateAction<string>>;
  handleAccountUpdate?: () => void;
  updating?: boolean;
  activeTab: string;
  user: UserData;
} & UserDataProp &
  DialogueProp &
  ProfileProp;

const ProfilePane = ({
  handleAccountUpdate,
  setActiveTab,
  contactInfo,
  activeTab,
  updating,
  user,
  ...props
}: ProfilePaneProps) => {
  const [fieldList, { setFieldList }] = useFieldList(
    CONTROLS,
    activeTab,
    contactInfo as Partial<UserData>
  );
  const [, startTabbing] = useTransition();

  const prevTabRef = useRef(activeTab);
  if (prevTabRef.current !== activeTab) {
    prevTabRef.current = activeTab;
    startTabbing(() => setFieldList());
  }
  const fieldsRef = useRef<Map<string, HTMLElement> | null>(null);
  const getFieldMap = useCallback(() => {
    if (!fieldsRef.current) fieldsRef.current = new Map();
    return fieldsRef.current;
  }, []);

  return (
    <TabPane eventKey={'Profile'}>
      <TabContainer
        onSelect={handleAccountUpdate}
        defaultActiveKey={'contact'}
      >
        <Row>
          <Col
            lg={3}
            xs={'auto'}
          >
            <ProfileSideNav
              {...props}
              user={user}
              fieldList={fieldList}
              activeTab={activeTab}
              contactInfo={contactInfo}
              getFieldMap={getFieldMap}
              setFieldList={setFieldList}
              setActiveTab={setActiveTab}
              handleAccountUpdate={handleAccountUpdate}
            />
          </Col>

          <Col lg={9}>
            <ProfileSubPane
              {...props}
              user={user}
              updating={updating}
              fieldList={fieldList}
              activeTab={activeTab}
              contactInfo={contactInfo}
              getFieldMap={getFieldMap}
              setActiveTab={setActiveTab}
              setFieldList={setFieldList}
              handleAccountUpdate={handleAccountUpdate}
            />

            <Row className={'text-center ms-lg-5'}>
              <Col className={`'mt-lg-4'`}>
                <span className={'autosave-notice'}>
                  <i className={'bi bi-file-earmark-lock'} />

                  {autosaveNotice}
                </span>
              </Col>
            </Row>
          </Col>
        </Row>
      </TabContainer>
    </TabPane>
  );
};

export default React.memo(ProfilePane);
