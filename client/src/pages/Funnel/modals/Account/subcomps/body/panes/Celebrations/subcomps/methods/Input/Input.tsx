import React from 'react';
import type { CelebrationsProps } from '../../../types';
import { FilterInput } from '@Components/forms';
import { Form } from 'react-bootstrap';
import './style.css';

type Filters = Filter[];

interface Filter {
  type: 'NAME' | 'STATE' | 'BILL';
  name: string;
  text: string;
  cls: string;
}

const Input = ({ filterEvents, textInputRef, ...props }: CelebrationsProps) => {
  const FILTERS = [
    { name: 'name', text: 'try "O" for "Ocasio"', type: 'NAME' },
    // { name: 'state', text: 'try "T" for "Texas"', type: 'STATE' },
    // { name: 'bill', text: 'try "1976" or "Medi"', type: 'BILL' },
  ];
  return (
    <>
      <Form.Label className='mt-lg-3'>FILTER BY</Form.Label>;
      {(FILTERS as unknown as Filters).map((f: Filter) => (
        <FilterInput
          {...props}
          onChange={(e) =>
            filterEvents?.({
              type: f.type,
              payload: (e.target as HTMLInputElement).value as string,
            })
          }
          key={f.name + '-input-filter'}
          textInputRef={textInputRef}
          autoComplete={'off'}
          name={f.name}
          text={f.text}
          cls={f.cls}
        />
      ))}
    </>
  );
};

export default React.memo(Input);
