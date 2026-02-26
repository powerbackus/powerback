import React, {
  useState,
  type Dispatch,
  type ChangeEvent,
  type SetStateAction,
} from 'react';
import type { FormValidationProp, DialogueProp } from '@Types';
import type { ShowAlert, ShowOverlay } from '@Contexts';
import { UsernameField } from '@Components/forms';
import { SubmitBtn } from '@Components/buttons';
import { change, submit } from './handlers';
import { Form } from 'react-bootstrap';
import API from '@API';
import './style.css';

type ForgotPasswordFormProps = FormValidationProp & {
  setShowOverlay: Dispatch<SetStateAction<ShowOverlay>>;
  setValidated: Dispatch<SetStateAction<boolean>>;
  setAlert: Dispatch<SetStateAction<ShowAlert>>;
  validated: boolean;
} & DialogueProp;

const ForgotPasswordForm = ({
  setShowOverlay,
  setValidated,
  validated,
  setAlert,
}: ForgotPasswordFormProps) => {
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState('');
  return (
    <Form
      noValidate
      onSubmit={(e) => {
        submit(
          e,
          email,
          setAlert,
          setFeedback,
          setValidated,
          setShowOverlay,
          API.forgotPassword
        );
      }}
      validated={validated}
      id={'forgot-pass-form'}
      className={'special-invalid'}
    >
      <div id={'forgot-password-input'}>
        <UsernameField
          placeholder={''}
          label={undefined}
          value={undefined}
          feedback={feedback}
          hideFeedback={undefined}
          autoComplete={'username'}
          onChange={(e: ChangeEvent) => change(e, setValidated, setEmail)}
        />
      </div>
      <SubmitBtn
        btnId={'forgot-password--submit-btn'}
        classProp={undefined}
        value={'Send Link'}
        variant={undefined}
        hidden={undefined}
        size={'sm'}
      />
    </Form>
  );
};

export default React.memo(ForgotPasswordForm);
