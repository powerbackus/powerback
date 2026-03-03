import React, { KeyboardEventHandler } from 'react';
import './style.css';

type Props = {
  handleKeyDown: KeyboardEventHandler<HTMLSpanElement>;
  value: string;
  cls: string;
};

const ToggleLabel = ({ handleKeyDown, value, cls }: Props) => (
  <span tabIndex={0} className={cls} onKeyDown={handleKeyDown}>
    {value}
  </span>
);

export default React.memo(ToggleLabel);
