import React, { useMemo } from 'react';
import StyledAlert from '../StyledAlert';
import { ShowAlert } from '@Contexts';
import { AlertProps } from '../props';
import './style.css';

type Props = {
  isLoggedIn: boolean;
  timeout: number;
};

const AlertLoginLogout = ({
  show,
  setShow,
  timeout,
  isLoggedIn,
}: AlertProps & Props) => {
  const cls = 'loginlogout-ok-alert ';
  const alertProps = useMemo(() => {
    return {
      variant: isLoggedIn ? 'success' : 'info',
      alertClass: cls + (isLoggedIn ? 'in' : 'out'),
      iconClass: isLoggedIn ? 'success' : 'secondary',
      icon: 'person-' + (isLoggedIn ? 'check' : 'dash'),
      message: (
        <>
          &nbsp;&nbsp;&nbsp;
          {isLoggedIn ? 'Login successful.' : 'Logged out.'}
        </>
      ),
      type: (isLoggedIn ? 'login' : 'logout') as keyof ShowAlert,
    };
  }, [isLoggedIn]);

  return (
    <StyledAlert
      show={show}
      time={timeout}
      {...alertProps}
      setShow={setShow}
      dismissible={true}
    />
  );
};

export default React.memo(AlertLoginLogout);
