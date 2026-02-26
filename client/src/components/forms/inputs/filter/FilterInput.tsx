import React, {
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type ChangeEventHandler
} from 'react';
import {
  FormLabel,
  FormControl,
  InputGroup,
  type FormControlProps
} from 'react-bootstrap';
import './style.css';

type FilterInputProps = {
  textInputRef?: MutableRefObject<HTMLInputElement | null>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: string;
  cls?: string;
  name: string;
  text: string;
};

const FilterInput = ({
  textInputRef = { current: null },
  autoComplete,
  cls = 'mb-lg-1',
  onChange,
  name,
  text
}: FilterInputProps) => {
  const stopEnter = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Enter') {
      return;
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);
  return (
    <div>
      <FormLabel>{name}</FormLabel>
      <InputGroup
        className={cls}
        id={`filter.${name}`}
      >
        <FormControl
          type={'search'}
          placeholder={text}
          ref={textInputRef}
          autoComplete={autoComplete}
          aria-label={`${name} filter`}
          aria-describedby={`filter.${name}`}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
            stopEnter(e as unknown as KeyboardEvent)
          }
          onChange={(e: ChangeEvent<FormControlProps & HTMLInputElement>) =>
            onChange?.(e)
          }
        />
      </InputGroup>
    </div>
  );
};

export default React.memo(FilterInput);
