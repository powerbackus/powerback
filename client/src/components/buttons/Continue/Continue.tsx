/**
 * Continue CTA button (Splash, Lobby, Rally continue actions).
 * @module buttons/Continue
 */
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
  /** Accessible name override when label content is not sufficient */
  ariaLabel?: string;
  /** For expandable controls paired with visible label */
  ariaExpanded?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
  hidden?: boolean;
};

/**
 * ContinueBtn component
 *
 * @param props - Continue button props
 * @returns Bootstrap Button with continue styling defaults
 */
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
  ariaLabel,
  ariaExpanded,
  handleClick,
}: Props) => (
  <Button
    type={type}
    tabIndex={0}
    hidden={hidden}
    variant={variant}
    disabled={disabled}
    className={classProp}
    onClick={handleClick}
    aria-pressed={ariaPressed}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    size={size ?? (isMobile ? 'sm' : 'lg')}
  >
    {label}
  </Button>
);

export default React.memo(ContinueBtn);
