/**
 * Submit button wrapper (form submit default; supports type=button for Rally actions).
 * @module buttons/Submit
 */
import React, { type ReactNode } from 'react';
import { Button, type ButtonProps } from 'react-bootstrap';
import './style.css';

export interface SubmitButtonProps {
  /** Bootstrap variant; defaults to submit-btn styling when classProp omitted */
  variant?: ButtonProps['variant'];
  /** Additional CSS classes; falls back to `submit-btn` when empty */
  classProp?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  hidden?: boolean;
  /** Optional id for forms and analytics hooks */
  btnId?: string;
  /** Button label or rich content (e.g. Rally email success checkmark) */
  value: string | ReactNode;
  /** `submit` for forms; `button` when onClick is required (Rally copy CTAs) */
  type?: 'button' | 'submit';
  /** Used when type is `button`; ignored for native form submit */
  onClick?: () => void;
  /** Accessible name when visible label is icon-only or state changes */
  ariaLabel?: string;
  /** For toggle controls (e.g. Rally claim code reveal) */
  ariaExpanded?: boolean;
}

/**
 * SubmitBtn component
 *
 * @param props - SubmitButtonProps
 * @returns Bootstrap Button with project submit styling
 */
const SubmitBtn = ({
  disabled = false,
  hidden = false,
  size = 'lg',
  classProp,
  variant,
  btnId,
  value,
  type = 'submit',
  onClick,
  ariaLabel,
  ariaExpanded,
}: SubmitButtonProps) => (
  <Button
    id={btnId}
    size={size}
    tabIndex={0}
    hidden={hidden}
    type={type}
    variant={variant}
    disabled={disabled}
    aria-disabled={disabled}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    className={classProp && classProp.length ? classProp : 'submit-btn'}
    onClick={type === 'button' ? onClick : undefined}
  >
    <>{value}</>
  </Button>
);

export default React.memo(SubmitBtn);
