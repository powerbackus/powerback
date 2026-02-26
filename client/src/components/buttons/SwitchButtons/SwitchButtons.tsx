import React, { type ChangeEvent } from 'react';
import { FormGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { handleKeyDown, simulateMouseClick } from '@Utils';

type Btn = {
  dispatch: string;
  value: string;
  icon: string;
};

type SwitchButtonsProps = {
  handleChange: (e: ChangeEvent, type: string) => void;
  size: 'lg' | 'sm' | undefined;
  togglePosition: string;
  ariaLabel: string;
  controlId: string;
  btns: Btn[];
  name: string;
};

const SwitchButtons = ({
  togglePosition,
  handleChange,
  size = 'lg',
  ariaLabel,
  controlId,
  btns,
  name,
}: SwitchButtonsProps) => (
  <FormGroup controlId={controlId}>
    <ToggleButtonGroup
      defaultValue={togglePosition}
      aria-label={ariaLabel}
      className={'mt-1'}
      vertical={false}
      name={name}
      size={size}
    >
      {btns.map((b) => (
        <ToggleButton
          name={'radio'}
          value={b.value}
          key={name + b.value}
          id={`sort-btn-${b.value}`}
          checked={togglePosition === b.value}
          onChange={(e) => handleChange(e, b.dispatch)}
          onKeyDown={(e) => {
            if (togglePosition !== b.value)
              handleKeyDown(
                e,
                simulateMouseClick as unknown as () => void,
                e.target
              );
          }}
        >
          {b.icon ? <i className={`bi bi-${b.icon}`} /> : b.value}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </FormGroup>
);

export default React.memo(SwitchButtons);
