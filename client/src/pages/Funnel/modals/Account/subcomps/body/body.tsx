import React, { type Dispatch, type SetStateAction } from 'react';
import { useDialogue, type UserData, type ShowAlert } from '@Contexts';
import { ProfilePane, CelebrationsPane, SettingsPane } from './panes';
import { AlertCompliant } from '@Components/alerts';
import { Tab } from 'react-bootstrap';
import type {
  DialogueProp,
  UserDataProp,
  ProfileProp,
  DeviceProp,
  FormValidationProp,
} from '@Types';
import './style.css';

type BodyProps = {
  securityTheater?: { changePassword?: boolean; deleteAccount?: boolean };
  setActiveProfileTab?: Dispatch<SetStateAction<string>>;
  showSecurityTheater?: (type: string) => void;
  closeSecurityCurtain?: () => void;
  handleAccountUpdate?: () => void;
  activeProfileTab?: string;
  hasDonated?: boolean;
  [key: string]: unknown;
} & FormValidationProp & {
    user: UserData;
  } & UserDataProp &
  DialogueProp &
  ProfileProp &
  DeviceProp;

const Body = ({
  handleAccountUpdate,
  setActiveProfileTab,
  activeProfileTab,
  hasDonated,
  user,
  ...props
}: BodyProps) => {
  const { showAlert, setShowAlert } = useDialogue();

  if (!user) return null;

  return (
    <Tab.Content>
      <AlertCompliant
        key={user.id + '-compliant-alert'}
        setShow={setShowAlert as Dispatch<SetStateAction<ShowAlert>>}
        show={showAlert}
      />
      <ProfilePane
        setActiveTab={setActiveProfileTab as Dispatch<SetStateAction<string>>}
        handleAccountUpdate={handleAccountUpdate as () => void}
        activeTab={activeProfileTab as string}
        setShowAlert={setShowAlert}
        showAlert={showAlert}
        user={user}
        {...props}
      />

      <SettingsPane {...props} />

      {(hasDonated && user && (
        <CelebrationsPane
          setActiveProfileTab={setActiveProfileTab}
          setShowAlert={setShowAlert}
          showAlert={showAlert}
          user={user}
          {...props}
        />
      )) ||
        null}
    </Tab.Content>
  );
};

export default React.memo(Body);
