import React from 'react';
import StyledAlert from '../StyledAlert';
import './style.css';

const AlertUserEntryError = ({ msg, icon, hidden }) => (
  <StyledAlert
    alertClass={'error-alert'}
    message={'\u00A0' + msg}
    show={{ err: !hidden }}
    setShow={() => {}}
    variant={'danger'}
    type={'err'}
    icon={icon}
  />
);

export default React.memo(AlertUserEntryError);
