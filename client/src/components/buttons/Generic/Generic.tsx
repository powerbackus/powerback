/**
 * Generic action button with keyboard handling and optional icon-only content.
 * @module buttons/Generic
 */
import React, { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { handleKeyDown } from '@Utils';
import './style.css';

type GenericBtnProps = {
  cls?: string;
  /** Used as aria-label and visible text when children are omitted */
  label?: string;
  size?: 'sm' | 'lg';
  /** When set with label, renders children for display (label still drives aria-label) */
  children?: ReactNode;
  onPress: (e?: KeyboardEvent | MouseEvent | undefined) => void;
};

/**
 * GenericBtn component
 *
 * @param props - GenericBtnProps
 * @returns Styled generic button
 */
const GenericBtn = ({
  cls = '',
  size = 'lg',
  label,
  children,
  onPress,
}: GenericBtnProps) => (
  <Button
    size={size}
    tabIndex={0}
    type={'button'}
    aria-label={label}
    className={`${cls && cls} generic-btn`}
    onClick={(e: MouseEvent) => handleKeyDown(e, onPress, e)}
    onKeyDown={(e: KeyboardEvent) => handleKeyDown(e, onPress, e)}
  >
    {children ?? label}
  </Button>
);

export default React.memo(GenericBtn);
