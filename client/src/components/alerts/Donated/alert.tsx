import React from 'react';
import { handleMessage } from './fn/handleMessage';
import StyledAlert from '../StyledAlert';
import { AlertProps } from '../props';
import './style.css';

type DonatedAlertProps = {
  firstName?: string;
  donation: number;
} & AlertProps;

const AlertDonated = ({ firstName, donation }: DonatedAlertProps) => (
  <StyledAlert
    show={{ update: true } as import('@Contexts').ShowAlert}
    message={handleMessage(firstName, donation)}
    alertClass={'donation-ok-alert'}
    iconClass={'success'}
    dismissible={false}
    variant={'success'}
    setShow={() => {}}
    icon={'check-lg'}
    type={'update'}
  />
);

export default React.memo(AlertDonated);
