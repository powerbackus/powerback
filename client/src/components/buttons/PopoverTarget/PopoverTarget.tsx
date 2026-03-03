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
    onKeyDown={(e) => handleKeyDown(e, () => handleOverlay(e))}
    className={'forgot-pass-link natural-link'}
    onClick={handleOverlay}
  >
    {props.children}
  </span>
);

export default React.memo(PopoverTarget);
