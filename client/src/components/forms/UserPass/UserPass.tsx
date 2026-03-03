import React, { FormEventHandler, ChangeEvent } from 'react';
import { PasswordField, UsernameField } from '../inputs';
import { BtnErrorSwapper } from '@Components/displays';
import type { SwapButtonError } from '@Hooks';
import { Form } from 'react-bootstrap';
import './style.css';

type UserPassProps = {
  value: string;
  uValue: string;
  pValue: string;
  uLabel: string;
  pLabel: string;
  uFeedback: string;
  pFeedback: string;
  isGenerating?: boolean;
  hideFeedback: boolean;
  uAutoComplete: string;
  pAutoComplete: string;
  userFormValidated: boolean;
  buttonErrorSwapper: SwapButtonError;
  handleChange: (e: ChangeEvent) => void;
  handleSubmit: FormEventHandler<HTMLFormElement>;
};
// simple username/password form with these two input elements ONLY
const UserPassForm = ({
  value,
  uValue,
  pValue,
  uLabel,
  pLabel,
  uFeedback,
  pFeedback,
  handleChange,
  handleSubmit,
  hideFeedback,
  isGenerating = false,
  uAutoComplete,
  pAutoComplete,
  buttonErrorSwapper,
  userFormValidated,
}: UserPassProps) => (
  <Form
    noValidate
    onSubmit={handleSubmit}
    validated={userFormValidated}
    className={'userpass-form input--translucent'}
  >
    <UsernameField
      value={uValue}
      label={uLabel}
      placeholder={''}
      feedback={uFeedback}
      onChange={handleChange}
      hideFeedback={hideFeedback}
      autoComplete={uAutoComplete}
    />
    <PasswordField
      value={pValue}
      label={pLabel}
      feedback={pFeedback}
      onChange={handleChange}
      isGenerating={isGenerating}
      autoComplete={pAutoComplete}
    />
    <BtnErrorSwapper
      btnProps={{
        btnId: 'resetpass-submitbtn',
        value: value,
      }}
      {...buttonErrorSwapper}
    />
  </Form>
);

export default React.memo(UserPassForm);
