import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { Variant } from 'react-bootstrap/esm/types';
import type { ShowAlert } from '@Contexts';

export interface AlertProps {
  setShow: Dispatch<SetStateAction<ShowAlert>>;
  type?: keyof ShowAlert & string;
  heading?: ReactNode | string;
  message?: ReactNode | string;
  variant?: Variant | string;
  dismissible?: boolean;
  isLoggedIn?: boolean;
  alertClass?: string;
  iconClass?: string;
  timeout?: number;
  show: ShowAlert;
  icon?: string;
  time?: number;
}
