/**
 * Account modal. Profile, settings, celebrations tabs.
 * @module Account
 */
import React, { useMemo } from 'react';
import { useAuth, useDevice, type UserData } from '@Contexts';
import type { AuthProp, NavigationProp } from '@Types';
import { StyledModal } from '@Components/modals';
import type { PolsOnParade } from '@Interfaces';
import { TabContainer } from 'react-bootstrap';
import { Body, Heading } from './subcomps';
import { ACCOUNT_COPY } from '@CONSTANTS';
import {
  useAccountModalLifecycle,
  useFormValidation,
  useFormCompliance,
  useAccountUpdate,
  useContactInfo,
  useAccountTabs,
  useMontyHall,
  useSpinner,
} from '@Hooks';
import type { SelectCallback } from '@restart/ui/esm/types';

/**
 * AccountModal Component
 *
 * A comprehensive modal component for managing user account settings and profile information.
 * This component handles user contact information updates, form validation, compliance checking,
 * and security features like password changes and account deletion.
 *
 * Key Features:
 * - Contact information management with real-time validation
 * - Form compliance checking for FEC requirements
 * - Employment information handling
 * - Address validation with automatic OCD ID lookup
 * - Security theater for sensitive operations
 * - Responsive design for mobile and desktop
 * - Auto-save functionality with change detection
 *
 * @param {AccountProps} props - Component props including modal control and user data
 * @param {Dispatch<SetStateAction<string>>} props.setActiveKey - Function to set the active tab key
 * @param {string} props.activeKey - Currently active tab key for the modal
 * @param {() => void} props.stopTour - Function to stop any active user tours
 *
 * @example
 * ```tsx
 * <AccountModal
 *   setActiveKey={setActiveKey}
 *   activeKey="contact"
 *   stopTour={stopTour}
 * />
 * ```
 */
type AccountProps = {
  stopTour?: (tourType: 'User' | 'Celebration') => void;
  polsOnParade?: PolsOnParade;
} & NavigationProp &
  AuthProp;

const AccountModal = ({
  setActiveKey,
  activeKey,
  stopTour,
  ...props
}: AccountProps) => {
  /** Get current user data and setter from authentication context */
  const { userData } = useAuth();
  /** Get device type for responsive rendering and lifecycle (open-to-Celebrations on desktop) */
  const { isMobile, isDesktop } = useDevice();

  // Custom hooks
  /** Form validation state and handlers */
  const [isInvalid, { validateField, resetValidation }] = useFormValidation(),
    /** Computed boolean indicating if any form field is invalid */
    formIsInvalid = useMemo(
      () => !Object.values(isInvalid).every((v) => !v),
      [isInvalid]
    ),
    /** Contact information state and management handlers */
    [contactInfo, { setContactInfo, setIntl }] = useContactInfo(
      userData as UserData
    ),
    /** Form compliance state and handlers for FEC requirements */
    [formCompliance] = useFormCompliance(contactInfo, formIsInvalid),
    /** Loading spinner state and handlers for async operations */
    [updating, { start: startUpdatingSpinner, stop: stopUpdatingSpinner }] =
      useSpinner();

  // Account update logic
  const { handleAccountUpdate, handleUpdateUser } = useAccountUpdate(
    startUpdatingSpinner,
    stopUpdatingSpinner,
    contactInfo,
    formIsInvalid,
    updating
  );

  // Security theater
  /** Security theater state and handlers for password/account deletion flows */
  const [
    securityTheater,
    { openDoor: showSecurityTheater, closeDoors: closeSecurityCurtain },
  ] = useMontyHall(ACCOUNT_COPY.APP.SECURITY_BUTTONS);

  // Tab management
  const {
    activeProfileTab,
    setActiveProfileTab: setProfileTab,
    handleOnSelect,
  } = useAccountTabs(handleAccountUpdate, closeSecurityCurtain, setActiveKey);

  // Modal lifecycle
  const { onEnter, onExit } = useAccountModalLifecycle(
    handleAccountUpdate,
    closeSecurityCurtain,
    resetValidation,
    setProfileTab,
    stopUpdatingSpinner,
    updating,
    userData,
    stopTour,
    isDesktop,
    setActiveKey
  );

  // Computed values
  /** Check if user has made any donations */
  const hasDonated = useMemo(() => {
    return userData && userData.donations && userData.donations.length > 0;
  }, [userData]);

  return (
    <TabContainer
      unmountOnExit={true}
      activeKey={activeKey}
      onSelect={handleOnSelect as SelectCallback}
    >
      <StyledModal
        closeButton={true}
        onEnter={onEnter}
        type={'account'}
        onExit={onExit}
        heading={
          <Heading
            isMobile={isMobile}
            hasDonated={hasDonated as boolean}
          />
        }
        body={
          <Body
            {...props}
            closeSecurityCurtain={closeSecurityCurtain}
            handleAccountUpdate={handleAccountUpdate}
            showSecurityTheater={showSecurityTheater}
            setActiveProfileTab={setProfileTab}
            activeProfileTab={activeProfileTab}
            handleUpdateUser={handleUpdateUser}
            resetValidation={resetValidation}
            securityTheater={securityTheater}
            formCompliance={formCompliance}
            setContactInfo={setContactInfo}
            formIsInvalid={formIsInvalid}
            validateField={validateField}
            contactInfo={contactInfo}
            hasDonated={hasDonated}
            isInvalid={isInvalid}
            isMobile={isMobile}
            updating={updating}
            userData={userData}
            setIntl={setIntl}
            user={userData}
          />
        }
        footer={null}
      />
    </TabContainer>
  );
};

export default React.memo(AccountModal);
