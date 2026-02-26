import React from 'react';
import { AlertProps } from '@Components/alerts/props';
import StyledAlert from '../../StyledAlert';
import './style.css';

const AlertDeleteAcct = ({ show, setShow, timeout }: AlertProps) => (
  <StyledAlert
    show={show}
    time={timeout}
    type={'delete'}
    icon={'person-x'}
    setShow={setShow}
    variant={'danger'}
    dismissible={true}
    alertClass={'delete-ok-alert'}
    iconClass={'dark-mode-text-danger'}
    message={<>&nbsp;&nbsp;&nbsp;Your account has been deleted.</>}
  />
);

export default React.memo(AlertDeleteAcct);
