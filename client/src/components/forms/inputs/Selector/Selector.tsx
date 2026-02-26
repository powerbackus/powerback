import React, { ChangeEvent, MutableRefObject, RefObject } from 'react';
import { FormSelect } from 'react-bootstrap';

type SelectorProps = {
  getCountry: RefObject<MutableRefObject<null>>;
  handleChange: (e: ChangeEvent) => void;
  disabled: boolean;
  items: string[];
  value: string;
  name: string;
};

const Selector = ({
  handleChange,
  getCountry,
  disabled,
  items,
  value,
  name,
}: SelectorProps) => (
  <FormSelect
    name={name}
    value={value}
    disabled={disabled}
    onChange={handleChange}
    aria-label={`${name} selector`}
    id={'profile-form-input-' + name.toLowerCase()}
    ref={
      name === 'country'
        ? (getCountry as unknown as MutableRefObject<HTMLSelectElement>)
        : null
    }
    required
  >
    {items
      .sort((x, y) => {
        return x === value ? -1 : y === value ? 1 : 0;
      }) // h/t @https://bit.ly/3zntsre https://bit.ly/3gUnzLE
      .map((item) => (
        <option
          key={name + item}
          value={item}
        >
          {item}
        </option>
      ))}
    ;
  </FormSelect>
);

export default React.memo(Selector);
