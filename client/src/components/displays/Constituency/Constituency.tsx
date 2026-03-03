import React from 'react';
import './style.css';

const Constituency = ({
  cls,
  state,
  title,
  district,
  headingSize,
}: {
  cls: string;
  state: string;
  title?: string;
  district: string;
  headingSize: number;
}) => (
  <span
    title={title}
    aria-label={title}
    className={cls + ' h' + headingSize}
    children={
      (district !== 'At-Large' ? 'District ' : '') +
      district +
      ' of ' +
      state
    }
  />
);

export default React.memo(Constituency);
