import React from 'react';
import './style.css';

type PolNameProps = {
  cls: string;
  name?: string;
  title?: string;
  headingSize: number;
};

const PolName = ({ cls, name, headingSize, title }: PolNameProps) => (
  <span
    className={cls + ' h' + headingSize}
    aria-label={title}
    title={title}>
    {name}
  </span>
);

export default React.memo(PolName);
