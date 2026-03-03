import React, { MouseEvent, KeyboardEvent } from 'react';
import { InputGroup } from 'react-bootstrap';
import { handleKeyDown } from '@Utils';
import './style.css';

type InputGroupBtnProps = {
  cb?: () => void;
  arg?: unknown;
  title: string;
  tab?: number;
  cls: string;
  ico: string;
};

const InputGroupBtn = ({
  cb,
  arg,
  cls,
  ico,
  title,
  tab = 0,
}: InputGroupBtnProps) => (
  <InputGroup.Text
    onKeyDown={(e: KeyboardEvent) => handleKeyDown(e, cb, arg)}
    onClick={(e: MouseEvent) => handleKeyDown(e, cb, arg)}
    tabIndex={tab ? -1 : tab}
    className={cls}
    title={title}
  >
    <i className={`bi bi-${ico}`} />
  </InputGroup.Text>
);

export default React.memo(InputGroupBtn);
