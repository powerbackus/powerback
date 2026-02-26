import React, { MouseEventHandler, KeyboardEventHandler } from 'react';
import { Button } from 'react-bootstrap';
import './style.css';

type AgreeBtnProps = {
  handleClick: KeyboardEventHandler & MouseEventHandler;
};

const AgreeBtn = ({ handleClick }: AgreeBtnProps) => (
  <Button
    className={'agree-btn mb-lg-1'}
    variant={'outline-info'}
    onKeyDown={handleClick}
    onClick={handleClick}
    type={'button'}
    size={'lg'}
  >
    Agree
  </Button>
);

export default React.memo(AgreeBtn);
