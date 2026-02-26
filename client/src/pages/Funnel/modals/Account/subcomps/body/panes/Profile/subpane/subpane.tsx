import React, { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { UserData, ComplianceTier } from '@Contexts';
import { Col, Row, Tab, Spinner } from 'react-bootstrap';
import type { ControlCategory } from '@Interfaces';
import FieldList from '../sidenav/FieldList';
import { ProfileForm, CONTROLS } from '..';
import Compliance from '../Compliance';
import type {
  FieldControl,
  UserDataProp,
  ProfileProp,
  DeviceProp,
} from '@Types';
import './style.css';

/**
 * Props for field group functionality
 */
type FieldGroupProps = {
  /** List of form fields to display */
  fieldList: FieldControl[]; // swap this with FieldControl? or just reconcile them somehow
  /** Function to update the field list */
  setFieldList: () => void;
};

/**
 * Props for profile pane functionality
 */
type ProfilePaneLocalProps = {
  /** Function to set the active tab */
  setActiveTab: Dispatch<SetStateAction<string>>;
  /** Function that returns the field label → element map */
  getFieldMap: () => Map<string, HTMLElement>;
  /** Handler invoked before switching account panel tab */
  handleAccountUpdate?: () => void;
  /** Form compliance tier for Compliance subcomponent */
  formCompliance?: ComplianceTier;
  /** Whether the profile form has validation errors */
  formIsInvalid?: boolean;
  /** Whether the form is currently being updated */
  updating?: boolean;
  /** Currently active tab */
  activeTab: string;
};

type ProfileSubPaneComponentProps = ProfilePaneLocalProps &
  FieldGroupProps & {
    user: UserData;
  } & UserDataProp &
  ProfileProp &
  DeviceProp;

/**
 * ProfileSubPane component that renders the main profile form interface
 *
 * This component manages the profile form display including:
 * - Compliance status display (desktop only)
 * - Form field rendering based on active tab
 * - Loading states during updates
 * - Mobile-specific field list sidebar
 *
 * The component renders different content based on the active tab:
 * - Contact information
 * - Employment details
 * - Address information
 *
 * @param setActiveTab - Function to change the active tab
 * @param setFieldList - Function to update the field list
 * @param contactInfo - User's current contact information
 * @param getFieldMap - Function to get field mapping reference
 * @param activeTab - Currently active tab
 * @param fieldList - List of form fields to display
 * @param isMobile - Whether user is on mobile device (optional from Props)
 * @param updating - Whether form is currently being updated
 * @param user - Current user data (optional from UserDataProp)
 * @param props - Additional props passed from parent
 *
 * @example
 * ```typescript
 * <ProfileSubPane
 *   setActiveTab={setActiveTab}
 *   setFieldList={setFieldList}
 *   contactInfo={contactInfo}
 *   getFieldMap={getFieldMap}
 *   activeTab={activeTab}
 *   fieldList={fieldList}
 *   isMobile={isMobile}
 *   updating={updating}
 *   user={user}
 *   {...otherProps}
 * />
 * ```
 */
const ProfileSubPane = ({
  setActiveTab,
  setFieldList,
  contactInfo,
  getFieldMap,
  activeTab,
  fieldList,
  isMobile = false,
  updating,
  user,
  ...props
}: ProfileSubPaneComponentProps) => {
  /**
   * Determines if a form group should be active based on current tab
   *
   * @param formGroup - Form group to check
   * @returns Whether the form group should be active
   */
  const handleActiveTab = useCallback(
    (formGroup: ControlCategory) => {
      return formGroup.eventKey === activeTab;
    },
    [activeTab]
  );

  return (
    <Tab.Content className={'p-2 pt-0 pt-lg-2'}>
      {/* Show compliance component on desktop only */}
      {!isMobile && user && (
        <Compliance
          formCompliance={(props.formCompliance as ComplianceTier) || 'bronze'}
          formIsInvalid={props.formIsInvalid || false}
          contactInfo={contactInfo}
        />
      )}
      {/* Render form groups based on CONTROLS configuration */}
      {CONTROLS.map((formGroup) => (
        <Tab.Pane
          aria-labelledby={`profile-tab-${formGroup.eventKey}`}
          active={handleActiveTab(formGroup)}
          eventKey={formGroup.eventKey}
          unmountOnExit={true}
          key={formGroup.key}
          role={'tabpanel'}
        >
          {/* Show loading spinner during updates */}
          {updating ? (
            <Row>
              <Col
                lg={11}
                className={'form-and-fields transition-spinner'}
              >
                <Spinner
                  role={'status'}
                  animation={'border'}
                  className={'account-profile-spinner'}
                >
                  <span className='visually-hidden'>Updating Profile...</span>
                </Spinner>
              </Col>
            </Row>
          ) : contactInfo && user ? (
            <div className='form-and-fields'>
              {/* Main profile form */}
              <ProfileForm
                key={user.id + '-profile-form'}
                isEmployed={String(Number(contactInfo.isEmployed))}
                form={formGroup as unknown as FieldControl[]}
                getFieldMap={getFieldMap}
                contactInfo={contactInfo}
                isMobile={isMobile}
                {...props}
              />
              {/* Mobile-specific field list sidebar */}
              {isMobile && (
                <FieldList
                  key={'account-modal-profile-sidenav-field-list-' + user.id}
                  getFieldMap={getFieldMap}
                  setActiveTab={setActiveTab}
                  setFieldList={setFieldList}
                  contactInfo={contactInfo}
                  activeTab={activeTab}
                  fieldList={fieldList}
                  isMobile={isMobile}
                  user={user}
                  {...props}
                />
              )}
            </div>
          ) : (
            <>Loading...</>
          )}
        </Tab.Pane>
      ))}
    </Tab.Content>
  );
};

export default React.memo(ProfileSubPane);
