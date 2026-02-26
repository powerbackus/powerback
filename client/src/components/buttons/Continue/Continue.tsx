import React from 'react';
import { Button, type ButtonProps } from 'react-bootstrap';
import './style.css';

type Props = {
  handleClick: () => void;
  type?: 'button' | 'reset' | 'submit';
  variant?: ButtonProps['variant'];
  label: string | React.ReactNode;
  classProp?: string | undefined;
  size?: 'sm' | 'lg' | undefined;
  ariaPressed?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
  hidden?: boolean;
};

const ContinueBtn = ({
  size = 'lg',
  type = 'button',
  label,
  hidden,
  variant,
  isMobile,
  disabled,
  classProp = 'button--continue',
  ariaPressed,
  handleClick,
}: Props) => (
  <Button
    type={type}
    tabIndex={0}
    variant={variant}
    disabled={disabled}
    className={classProp}
    onClick={handleClick}
    hidden={hidden ?? false}
    aria-pressed={ariaPressed}
    size={size ? size : isMobile ? 'sm' : 'lg'}
  >
    {label}
  </Button>
);

export default React.memo(ContinueBtn);
