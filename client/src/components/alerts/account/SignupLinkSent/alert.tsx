import React from 'react';
import StyledAlert from '../../StyledAlert';
import { AlertProps } from '@Components/alerts/props';
import './style.css';

const AlertJoinup = ({ show, setShow, timeout }: AlertProps) => (
  <StyledAlert
    show={show}
    time={timeout}
    type={'join'}
    variant={'info'}
    setShow={setShow}
    dismissible={true}
    icon={'send-check'}
    iconClass={'text-dark'}
    alertClass={'alert-emailed-link'}
    heading={' Account confirmation link sent'}
    message={
      <p>
        Please check the email address you have just provided as your
        username. We have sent you a unique link to immediately confirm and
        grant access to your new account.
      </p>
    }
  />
);

export default React.memo(AlertJoinup);
