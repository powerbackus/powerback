import React from 'react';
import { Button, type ButtonProps } from 'react-bootstrap';
import './style.css';

export interface SubmitButtonProps {
  variant?: ButtonProps['variant'];
  classProp?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  hidden?: boolean;
  btnId: string;
  value: string;
}

const SubmitBtn = ({
  disabled = false,
  hidden = false,
  size = 'lg',
  classProp,
  variant,
  btnId,
  value,
}: SubmitButtonProps) => (
  <Button
    id={btnId}
    size={size}
    tabIndex={0}
    hidden={hidden}
    type={'submit'}
    variant={variant}
    disabled={disabled}
    aria-disabled={disabled}
    className={classProp && classProp.length ? classProp : 'submit-btn'}
  >
    <>{value}</>
  </Button>
);

export default React.memo(SubmitBtn);
