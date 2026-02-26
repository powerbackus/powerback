import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
  type Dispatch,
  type FormEvent,
  type ChangeEvent,
  type SetStateAction,
} from 'react';
import { useDevice, useProfile, type UserData } from '@Contexts';
import type { AxiosError, HttpStatusCode } from 'axios';
import { Form, Stack, Spinner } from 'react-bootstrap';
import { BtnErrorSwapper } from '@Components/displays';
import { PasswordField } from '@Components/forms';
import type { SecurityTheater } from '@Interfaces';

import type { UserDataProp } from '@Types';
import type { ChangeProps } from './types';
import { INIT } from '@CONSTANTS';
import {
  type ChangePasswordErrorResponse,
  type ConfirmNewPasswordForm,
} from '@Interfaces';
import {
  useSpinner,
  useButtonErrorSwapper,
  type SwapButtonError,
} from '@Hooks';
import API from '@API';
import './style.css';

const ChangePass = ({
  closeSecurityCurtain,
  setPasswordChanged,
  passwordChanged,
  securityTheater,
  userData,
}: UserDataProp &
  ChangeProps & {
    closeSecurityCurtain: () => void;
    securityTheater: SecurityTheater;
  }) => {
  // input state of change pw form
  const [passFormObject, setPassFormObject] = useState(
    INIT.changePasswordForm as ConfirmNewPasswordForm
  );
  const [passFormValidated, setPassFormValidated] = useState(false); // validation of change pw
  // input state of change pw form
  const [feedback, setFeedback] = useState({ current: '', new: '' }),
    [
      changingPassword,
      {
        start: startChangingPasswordSpinner,
        stop: stopChangingPasswordSpinner,
      },
    ] = useSpinner();

  const [buttonErrorSwapper, { swapToButton, swapToError }] =
    useButtonErrorSwapper();

  const prevSecurityTheaterRef = useRef(securityTheater);
  if (prevSecurityTheaterRef.current !== securityTheater) {
    prevSecurityTheaterRef.current = securityTheater;
    setPassFormObject(INIT.changePasswordForm as ConfirmNewPasswordForm);
  }

  const { serverConstants } = useProfile();

  const minPasswordLength = useMemo(
    () => serverConstants.APP.MIN_PASSWORD_LENGTH,
    [serverConstants]
  );

  const handleChange = useCallback(
      (e: ChangeEvent) => {
        const { name, value } = e.target as HTMLInputElement;
        setPassFormObject((f: ConfirmNewPasswordForm) => ({
          ...f,
          [name]: value,
        })); // update form obj
        swapToButton();
        setPassFormValidated(false);
      },
      [setPassFormObject, swapToButton]
    ),
    handleSubmit = useCallback(() => {
      // api call to attempt pw change
      API.changePassword((userData as UserData).id, {
        currentPassword: passFormObject.currentPassword,
        newPassword: passFormObject.newPassword,
      })
        .then(({ data }) => {
          setPassFormObject(INIT.changePasswordForm);
          if (data.message !== 'Your password has been successfully changed.')
            throw new Error(); // generic 500 error
          else {
            setPasswordChanged(true);
            (closeSecurityCurtain as () => void)();
          }
        })
        .catch((err) => {
          (
            setPassFormObject as Dispatch<
              SetStateAction<ConfirmNewPasswordForm>
            >
          )(INIT.changePasswordForm as ConfirmNewPasswordForm);

          // Use specific error message from backend if available
          const axiosError = err as AxiosError;
          if (
            axiosError.response?.data &&
            typeof axiosError.response.data === 'object' &&
            'details' in axiosError.response.data
          ) {
            const errorResponse = axiosError.response.data
              .details as ChangePasswordErrorResponse;
            (
              setFeedback as (feedback: {
                current: string;
                new: string;
              }) => void
            )({
              current: errorResponse.current ?? '',
              new: errorResponse.new ?? '',
            });
            setPassFormValidated(true);
          } else
            (swapToError as (errorCode: HttpStatusCode) => void)(
              axiosError.status ?? 500
            );
        })
        .finally(() => stopChangingPasswordSpinner());
    }, [
      stopChangingPasswordSpinner,
      closeSecurityCurtain,
      setPassFormValidated,
      setPasswordChanged,
      setPassFormObject,
      passFormObject,
      setFeedback,
      swapToError,
      userData,
    ]),
    doSubmit = useCallback(
      (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setPassFormValidated(false);
        if (!passFormObject.currentPassword || !passFormObject.newPassword) {
          (setFeedback as (feedback: { current: string; new: string }) => void)(
            {
              current: 'All fields are required.',
              new: 'All fields are required.',
            }
          );

          setPassFormValidated(true);
          return;
        } else if (
          passFormObject.currentPassword === passFormObject.newPassword
        ) {
          (setFeedback as (feedback: { current: string; new: string }) => void)(
            {
              current: '',
              new: 'Your new password must be different.',
            }
          );
          setPassFormValidated(true);
          setPassFormObject(INIT.changePasswordForm as ConfirmNewPasswordForm);
          return;
        }
        if (passFormObject.newPassword.length < minPasswordLength) {
          (setFeedback as (feedback: { current: string; new: string }) => void)(
            {
              current: '',
              new: `Password must be at least ${minPasswordLength} characters.`,
            }
          );
          setPassFormObject(INIT.changePasswordForm as ConfirmNewPasswordForm);
          setPassFormValidated(true);
          return;
        }
        setPassFormValidated(false);
        startChangingPasswordSpinner();
        handleSubmit();
      },
      [
        passFormObject.currentPassword,
        startChangingPasswordSpinner,
        passFormObject.newPassword,
        minPasswordLength,
        handleSubmit,
        setFeedback,
      ]
    );

  const prevPasswordChangedRef = useRef(passwordChanged);

  useLayoutEffect(() => {
    if (prevPasswordChangedRef.current !== passwordChanged) {
      prevPasswordChangedRef.current = passwordChanged;
      if (passwordChanged) {
        stopChangingPasswordSpinner();
      }
    }
  }, [passwordChanged, stopChangingPasswordSpinner]);

  // progressive logical conditions:
  const inputsAreNotAllFilled = useMemo(
      () =>
        passFormObject.newPassword === '' ||
        passFormObject.currentPassword === '',
      [passFormObject.currentPassword, passFormObject.newPassword]
    ),
    inputNotNull = useMemo(
      () => passFormObject.newPassword && passFormObject.currentPassword,
      [passFormObject.newPassword, passFormObject.currentPassword]
    ),
    inputsAreTheSame = useMemo(
      () => passFormObject.newPassword !== passFormObject.currentPassword,
      [passFormObject.currentPassword, passFormObject.newPassword]
    ),
    // ...result:
    hideButton = useMemo(
      () => (inputNotNull && inputsAreTheSame) || inputsAreNotAllFilled,
      [inputNotNull, inputsAreTheSame, inputsAreNotAllFilled]
    );

  const { isShortMobile, isDesktop } = useDevice();

  return passwordChanged ? (
    <div className='password-changed text-uppercase mt-5'>password changed</div>
  ) : (
    <Form
      noValidate
      onSubmit={doSubmit}
      validated={passFormValidated}
      className={'change-password'}
    >
      <Stack
        className={'mt-lg-4 mb-lg-3 mb-3'}
        direction={'vertical'}
        gap={2}
      >
        {/* current password */}
        <PasswordField
          value={passFormObject.currentPassword}
          hideFeedback={!passFormValidated}
          autoComplete={'current-password'}
          controlName={'currentPassword'}
          controlId={'current-password'}
          feedback={feedback.current}
          label={'current password'}
          onChange={handleChange}
        />
        {isDesktop && <div className={'mb-1'} />}
        {/* new password */}
        <PasswordField
          value={passFormObject.newPassword}
          hideFeedback={!passFormValidated}
          autoComplete={'new-password'}
          controlName={'newPassword'}
          controlId={'new-password'}
          onChange={handleChange}
          feedback={feedback.new}
          label={'new password'}
          isGenerating={true}
        />
      </Stack>
      <div className='mb-lg-4' />
      {changingPassword ? (
        <Spinner
          role={'status'}
          animation={'border'}
          className={'change-password'}
        >
          <span className={'visually-hidden'}>Changing Password...</span>
        </Spinner>
      ) : (
        <BtnErrorSwapper
          btnProps={{
            hidden: hideButton,
            value: 'Set New Password',
            btnId: 'set-new-password-btn',
            size: isShortMobile ? 'sm' : 'lg',
          }}
          {...(buttonErrorSwapper as SwapButtonError)}
        />
      )}
    </Form>
  );
};

export default React.memo(ChangePass);
