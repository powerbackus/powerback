import React, {
  useMemo,
  useState,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { Stack, FormGroup, FormLabel } from 'react-bootstrap';
import type { CelebrationsProps } from '../../../types';
import { SwitchButtons } from '@Components/buttons';
import './style.css';

const Sort = ({ isMobile, filterEvents }: CelebrationsProps) => {
  const [toggleDirectionBtn, setToggleDirectionBtn] = useState('descending'),
    [toggleTypeBtn, setToggleTypeBtn] = useState('date'),
    TOGGLE_BTNS = useMemo(
      () => [
        {
          name: 'sort-mode',
          btns: [
            {
              icon: 'currency-dollar',
              value: 'amount',
              dispatch: 'AMOUNT',
            },
            { icon: 'calendar3', value: 'date', dispatch: 'DATE' },
          ],
          ariaLabel: 'sort donation mode toggle button group',
          togglePosition: toggleTypeBtn,
          controlId: 'sortModeBtn',
        },
        {
          name: 'sort-reverse',
          btns: [
            {
              icon: 'sort-down',
              value: 'descending',
              dispatch: 'REVERSE',
            },
            {
              icon: 'sort-down-alt',
              value: 'ascending',
              dispatch: 'REVERSE',
            },
          ],
          ariaLabel: 'sort donation order toggle button group',
          togglePosition: toggleDirectionBtn,
          controlId: 'sortReverseBtn',
        },
      ],
      [toggleTypeBtn, toggleDirectionBtn]
    );

  const handleChange = useCallback(
    (e: ChangeEvent | KeyboardEvent, type: string) => {
      const value = (e.target as HTMLInputElement | HTMLSelectElement).value;
      if (type === 'REVERSE')
        setToggleDirectionBtn((btn) =>
          btn === 'descending' ? 'ascending' : 'descending'
        );
      else if (value === 'date' || value === 'amount')
        setToggleTypeBtn((btn) => (btn === 'date' ? 'amount' : 'date'));
      filterEvents?.({ type: type, payload: '' });
    },
    [filterEvents]
  );

  return (
    <>
      <FormLabel className='indent'>
        {'SORT BY ' +
          toggleTypeBtn +
          (isMobile ? '' : ', ' + toggleDirectionBtn)}
      </FormLabel>
      <FormGroup className='text-center'>
        <Stack
          className={'donation-subpane-filter-btns'}
          direction={isMobile ? 'vertical' : 'vertical'}
        >
          {TOGGLE_BTNS.map((btn) => (
            <SwitchButtons
              togglePosition={btn.togglePosition}
              key={btn.name + 'toggle-buttons'}
              size={isMobile ? 'sm' : 'lg'}
              handleChange={handleChange}
              ariaLabel={btn.ariaLabel}
              controlId={btn.controlId}
              btns={btn.btns}
              name={btn.name}
            />
          ))}
        </Stack>
      </FormGroup>
    </>
  );
};

export default React.memo(Sort);
