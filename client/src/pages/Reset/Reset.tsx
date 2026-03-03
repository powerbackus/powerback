/**
 * Password reset page with hash verification via MagicLink.
 * @module Reset
 */
import React, {
  useCallback,
  type Dispatch,
  type ChangeEvent,
  type SetStateAction,
  type FormEventHandler,
} from 'react';
import { useDialogue, type ShowOverlay } from '@Contexts';
import type { AxiosError, HttpStatusCode } from 'axios';
import type { FormValidationProp } from '@Types';
import { UserPassForm } from '@Components/forms';
import type { SwapButtonError } from '@Hooks';
import { MagicLink } from '@Components/page';
import { ACCOUNT_COPY } from '@CONSTANTS';
import API from '@API';
import { logError } from '@Utils';
import {
  useButtonErrorSwapper,
  type UserEntryForm,
  useEntryForm,
} from '@Hooks';
import './style.css';

type ResetProps = FormValidationProp & {
  setLinkIsExpired: Dispatch<SetStateAction<boolean>>;
  homeLinkRedirect?: () => void;
};

/** Request payload for PUT /users/reset (password reset with hash) */
export interface ResetPasswordRequest {
  givenUsername: string;
  newPassword: string;
  hash: string;
}
interface Feedback {
  1: string;
  2: string;
}

const Reset = ({
  setUserIsAssumedValid,
  homeLinkRedirect,
  setLinkIsExpired,
  ...props
}: ResetProps) => {
  const [
    { userEntryForm, userFormValidated, secureUserPassFeedback },
    { setUserEntryForm, setUserFormValidated, setSecureUserPassFeedback },
  ] = useEntryForm();

  const { setShowAlert, setShowOverlay } = useDialogue();

  const [buttonErrorSwapper, { swapToError, swapToButton }] =
    useButtonErrorSwapper();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as HTMLInputElement;
      (setUserFormValidated as (v: boolean) => void)(false); // reset form validation
      setUserEntryForm((prev) => ({
        ...prev,
        [name]: value,
      })); // update form obj
      (setShowOverlay as Dispatch<SetStateAction<ShowOverlay>>)((s) => ({
        ...s,
        resetPass: false,
      }));
      (swapToButton as () => void)(); // flip error message back to button face
      setShowAlert((s) => ({ ...s, err: false })); // kill err
    },
    [
      setUserFormValidated,
      setUserEntryForm,
      setShowOverlay,
      setShowAlert,
      swapToButton,
    ]
  );

  const createHandleSubmit = useCallback(
    (hash: string) => (e: SubmitEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const t = e.currentTarget,
        o = userEntryForm;
      if (!(t as HTMLFormElement).checkValidity()) {
        (setUserFormValidated as (v: boolean) => void)(true); // form validation
        (setSecureUserPassFeedback as (feedback: string) => void)(
          ACCOUNT_COPY.RESET.uFeedback
        );
        return;
      } else {
        API.resetPassword({
          // api call to attempt reset
          givenUsername: (o as UserEntryForm).username,
          newPassword: (o as UserEntryForm).password,
          hash: hash,
        })
          .then(({ data }) => {
            const feedback = ACCOUNT_COPY.RESET.feedback;
            if (!data) {
              window.location.replace('/');
            } else if (typeof data === 'number' && data < 3) {
              (setUserFormValidated as (v: boolean) => void)(true);
              (setSecureUserPassFeedback as (feedback: string) => void)(
                feedback[data as keyof Feedback]
              ); //form feedback
            } else {
              (setUserFormValidated as (v: boolean) => void)(true);
              (setSecureUserPassFeedback as (feedback: string) => void)(
                typeof data === 'string' ? data : ACCOUNT_COPY.RESET.lockedOut
              );
            }
          })
          .catch((err) => {
            logError('Reset password error', err);
            const status = (err as AxiosError).status ?? 500;
            (swapToError as (errorCode: HttpStatusCode) => void)(status);
          });
      }
    },
    [
      swapToError,
      userEntryForm,
      setUserFormValidated,
      setSecureUserPassFeedback,
    ]
  );

  return (
    <MagicLink
      routeType={'reset'}
      containerId={'reset-container'}
      onExpired={(data) => {
        setLinkIsExpired(data.isLinkExpired || false);
      }}
      homeLinkRedirect={homeLinkRedirect as () => void}
      verifyHash={(hash) => API.confirmResetPasswordHash(hash)}
      onValid={(data) => {
        (setUserIsAssumedValid as Dispatch<SetStateAction<boolean>>)(
          data.isHashConfirmed || false
        );
      }}
      onInvalid={() => {
        (setUserIsAssumedValid as Dispatch<SetStateAction<boolean>>)(false);
      }}
    >
      {({ hash }) => {
        if (!hash) return null;

        return (
          <>
            <h1 className={'mb-4 display-6'}>{ACCOUNT_COPY.RESET.title}</h1>
            <UserPassForm
              handleSubmit={
                createHandleSubmit(
                  hash
                ) as unknown as FormEventHandler<HTMLFormElement>
              }
              buttonErrorSwapper={buttonErrorSwapper as SwapButtonError}
              handleChange={handleChange as (e: ChangeEvent) => void}
              uValue={
                !userEntryForm ? '' : (userEntryForm as UserEntryForm).username
              }
              pValue={
                !userEntryForm ? '' : (userEntryForm as UserEntryForm).password
              }
              {...ACCOUNT_COPY.RESET}
              userFormValidated={userFormValidated as boolean}
              value={ACCOUNT_COPY.RESET.buttonText}
              uFeedback={secureUserPassFeedback}
              hideFeedback={!userFormValidated}
              uAutoComplete={'email'}
              pAutoComplete={'off'}
              isGenerating={true}
              {...props}
            />
          </>
        );
      }}
    </MagicLink>
  );
};

export default React.memo(Reset);
