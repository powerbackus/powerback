import React from 'react';
import StyledAlert from '../../StyledAlert';
import { AlertProps } from '@Components/alerts/props';
import './style.css';

const AlertAcctActivated = ({ show, setShow, timeout }: AlertProps) => {
  return (
    <StyledAlert
      show={show}
      time={timeout}
      setShow={setShow}
      type={'activate'}
      dismissible={true}
      variant={'success'}
      icon={'person-plus'}
      iconClass={'text-success'}
      alertClass={'alert-confirmed'}
      heading={' Welcome to POWERBACK!'}
      message={
        <>
          &nbsp;&nbsp;&nbsp;Your account has been confirmed - please sign
          in.
        </>
      }
    />
  );
};

export default React.memo(AlertAcctActivated);
