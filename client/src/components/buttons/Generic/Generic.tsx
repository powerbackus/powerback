import React, { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { handleKeyDown } from '@Utils';
import './style.css';

type GenericBtnProps = {
  cls?: string;
  label?: string;
  size?: 'sm' | 'lg';
  children?: ReactNode;
  onPress: (e?: KeyboardEvent | MouseEvent | undefined) => void;
};

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
    {label ? label : children}
  </Button>
);

export default React.memo(GenericBtn);
