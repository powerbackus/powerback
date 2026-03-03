import React, { useState, useCallback } from 'react';
import type { ProfileProp, UserDataProp } from '@Types';
import type { SecurityTheater } from '@Interfaces';
import { ContinueBtn } from '@Components/buttons';
import { Stack } from 'react-bootstrap';
import { ACCOUNT_COPY } from '@CONSTANTS';
import Theater from './Theater';
import {
  useAuth,
  useDialogue,
  useNavigation,
  useDonationState,
} from '@Contexts';
import API from '@API';
import { logError } from '@Utils';
import './style.css';

type SecurityProps = {
  showSecurityTheater?: (type: string) => void;
  securityTheater?: SecurityTheater;
  closeSecurityCurtain?: () => void;
} & UserDataProp &
  ProfileProp;

const defaultSecurityTheater: SecurityTheater = {
  changePassword: false,
  deleteAccount: false,
};

const Security = ({
  closeSecurityCurtain,
  showSecurityTheater,
  securityTheater = defaultSecurityTheater,
  ...props
}: SecurityProps) => {
  const [passwordChanged, setPasswordChanged] = useState(false),
    handleClick = useCallback(
      (btn: string) => {
        setPasswordChanged(false);
        showSecurityTheater?.(btn);
      },
      [showSecurityTheater]
    );

  const { setDonation, setSelectedPol } = useDonationState(),
    { navigateToSplash } = useNavigation(),
    { authOut, userData } = useAuth(),
    { setShowAlert } = useDialogue();

  const handleDeleteUser = useCallback(() => {
    API.deleteUser(userData.id)
      .then(({ status }) => {
        if (status === 200) {
          setDonation(0); // clear donation
          setSelectedPol(null); // clear pol selection
          navigateToSplash(''); // Navigate back to splash landing page
          setShowAlert((s) => ({ ...s, activate: false, delete: true })); // show alert
          localStorage.removeItem('pb:userTour'); // show user tour again
        }
      })
      .then(authOut)
      .catch((err) => logError('Delete user failed', err));
  }, [
    authOut,
    setDonation,
    setShowAlert,
    setSelectedPol,
    navigateToSplash,
    userData.id,
  ]);

  return (
    <div className={'settings-security'}>
      <span className={'fs-5'}>Security</span>
      <Stack
        className={'mx-lg-4 mx-3 mt-2 security-buttons'}
        direction={'horizontal'}
        gap={2}
      >
        {/* CHANGE PASSWORD, DELETE ACCOUNT */}
        {ACCOUNT_COPY.APP.SECURITY_BUTTONS.map((btn) => (
          <ContinueBtn
            ariaPressed={
              (securityTheater as SecurityTheater)[
                (btn.substring(0, 1).toLowerCase() +
                  btn.slice(1).replace(' ', '')) as keyof SecurityTheater
              ]
            }
            classProp={
              ((securityTheater as SecurityTheater)[
                (btn.substring(0, 1).toLowerCase() +
                  btn.slice(1).replace(' ', '')) as keyof SecurityTheater
              ]
                ? 'option-btn-active '
                : '') + 'button--continue'
            }
            handleClick={() => handleClick(btn)}
            key={'security-btn--' + btn}
            variant={'outline-dark'}
            label={btn}
            size={'sm'}
          />
        ))}
      </Stack>
      <Theater
        handleDeleteUser={handleDeleteUser as () => void}
        closeSecurityCurtain={closeSecurityCurtain ?? (() => {})}
        setPasswordChanged={setPasswordChanged}
        passwordChanged={passwordChanged}
        securityTheater={securityTheater}
        userData={userData}
        {...props}
      />
    </div>
  );
};

export default React.memo(Security);
