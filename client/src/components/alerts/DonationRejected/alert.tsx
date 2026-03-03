import React, { useMemo } from 'react';
import StyledAlert from '../StyledAlert';
import { AlertProps } from '../props';
import './style.css';

const AlertDonationRejected = ({
  show,
  message,
  setShow,
  variant,
}: AlertProps) => {
  const alertProps = useMemo(() => {
    return {
      message: message,
      variant: variant,
      iconClass: variant as string,
      icon: 'exclamation-octagon-fill',
      alertClass: 'donation-failed-alert',
    };
  }, [variant, message]);

  return (
    <StyledAlert
      show={show}
      time={60000}
      {...alertProps}
      type={'rejected'}
      setShow={setShow}
      dismissible={true}
      heading={<>&nbsp;Donation Cannot Be Processed</>}
    />
  );
};

export default React.memo(AlertDonationRejected);
