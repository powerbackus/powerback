import React from 'react';
import { AlertProps } from '@Components/alerts/props';
import StyledAlert from '../../StyledAlert';
import './style.css';

const AlertResetLinkSent = ({ show, setShow, timeout }: AlertProps) => (
  <StyledAlert
    show={show}
    time={timeout}
    variant={'info'}
    setShow={setShow}
    type={'linkSent'}
    dismissible={true}
    icon={'send-check'}
    iconClass={'text-dark'}
    alertClass={'alert-emailed-link'}
    heading={' Sent reset password link'}
    message={
      <p>
        Please check the email address you have just provided to find
        instructions on setting your new password.
        <br />
        <br />
        It may be different from your username address if you've previously
        changed that in your account settings.
      </p>
    }
  />
);

export default React.memo(AlertResetLinkSent);
