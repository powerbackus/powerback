import React, { KeyboardEvent, useCallback } from 'react';
import { Form, Stack, FormGroup, FormCheck } from 'react-bootstrap';
import { ARROW_KEYS } from './tuples';
import ToggleLabel from './label';
import './style.css';

/// responsive and accessible expansion of Bootstrap's Form.Check "switch" type input element
// paired with two dynamically styled and interactive labels (sub-component).
/// Updates a boolean state prop.

type Props = {
  toggleSelectionClass: string[];
  swapPaths: () => void;
  labels: string[];
  splash: string;
};

const ToggleSwitch = ({
  toggleSelectionClass,
  swapPaths,
  splash,
  labels,
}: Props) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (
        e.key === 'Enter' ||
        e.key ===
          'Arrow' +
            ARROW_KEYS[0][
              +labels.indexOf(
                (e.target as HTMLLabelElement).textContent as string
              )
            ]
      )
        swapPaths();
    },
    [labels, swapPaths]
  );

  const checked = splash === labels[1],
    label = labels[0];

  return (
    <FormGroup
      controlId={label + '-switch'}
      className={'mb-3'}
    >
      <Form.Check
        className={'form-toggle'}
        onChange={swapPaths}
        checked={checked}
        type={'switch'}
      />{' '}
      <FormCheck.Label htmlFor={label + '-switch'}>
        <Stack
          direction={'vertical'}
          gap={2}
        >
          {labels &&
            labels.map((label: string, i: number) => {
              return (
                <ToggleLabel
                  cls={toggleSelectionClass[checked ? +!i : i]}
                  key={'toggle-label-' + label + '-' + i}
                  handleKeyDown={handleKeyDown}
                  value={label}
                />
              );
            })}
        </Stack>
      </FormCheck.Label>
    </FormGroup>
  );
};

export default React.memo(ToggleSwitch);
