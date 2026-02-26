import React, {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Heading, Body, Footer } from './subcomps';
import { StyledModal } from '@Components/modals';
import { AxiosResponse } from 'axios';
import { HideEvent } from '@Types';
import API from '@API';
import {
  useAuth,
  useDialogue,
  useNavigation,
  type UserData,
  type ShowModal,
} from '@Contexts';
import { logError } from '@Utils';

interface Backdrop {
  backdrop?: boolean | 'static';
  override?: (e: HideEvent) => HideEvent | (() => void);
}

const EligibilityModal = () => {
  const { isLoggedIn, userData, setUserData } = useAuth(),
    { funnel: tabKey } = useNavigation(),
    { setShowModal } = useDialogue();

  const handleClick = useCallback(() => {
    if (!isLoggedIn) {
      return;
    } else if (!(userData as UserData).understands)
      API.givePrivilege((userData as UserData).id)
        .then(() => {
          (setUserData as Dispatch<SetStateAction<UserData>>)((u) => ({
            ...u,
            understands: true,
          }));
        })
        .catch((err) => logError('Give privilege failed', err));
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      eligibility: false,
    }));
  }, [setShowModal, setUserData, isLoggedIn, userData]);
  // I want to turn ALL modals to X-button closes only for mobile.
  const [backdrop, setBackdrop] = useState({
    backdrop: true,
    override: null,
  } as unknown as Backdrop);

  const handleBackdrop = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    } else if ((userData as UserData).understands || tabKey !== 'payment')
      return;
    else {
      const privilege = await API.checkPrivilege(
        (userData as UserData).id
      ).catch((err) => logError('Check privilege failed', err));
      if ((privilege as AxiosResponse).data === false) {
        setBackdrop({
          backdrop: 'static',
          override: () => {},
        } as unknown as Backdrop);
      }
    }
  }, [tabKey, userData, isLoggedIn]);

  return (
    <StyledModal
      tabIdx={-1}
      heading={<Heading />}
      body={<Body />}
      footer={
        <Footer
          tabKey={tabKey}
          isLoggedIn={isLoggedIn}
          handleClick={handleClick}
          setShowModal={setShowModal}
        />
      }
      backdrop={backdrop.backdrop as 'static'}
      overrideOnClick={backdrop.override}
      onEnter={handleBackdrop}
      type={'eligibility'}
      size={'lg'}
    />
  );
};

export default React.memo(EligibilityModal);
