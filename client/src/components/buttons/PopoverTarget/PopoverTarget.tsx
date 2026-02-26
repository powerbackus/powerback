import React, {
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { handleKeyDown } from '@Utils';

type Props = {
  handleOverlay: KeyboardEventHandler<HTMLSpanElement> &
    MouseEventHandler<HTMLSpanElement>;
  children: ReactNode;
};

const PopoverTarget = ({ handleOverlay, ...props }: Props) => (
  <span
    tabIndex={0}
    className={'forgot-pass-link natural-link'}
    onKeyDown={(e) => handleKeyDown(e, handleOverlay)}
    onClick={handleOverlay}>
    {props.children}
  </span>
);

export default React.memo(PopoverTarget);
