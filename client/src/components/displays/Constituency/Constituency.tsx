import React from 'react';
import { HOUSE_AT_LARGE_LABEL } from '@Utils';
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
}) => {
  const useDistrictWord =
    Boolean(district) && district !== HOUSE_AT_LARGE_LABEL;
  return (
    <span
      title={title}
      aria-label={title}
      className={cls + ' h' + headingSize}
    >
      {useDistrictWord ? 'District ' : ''}
      {district}
      {district ? ' of ' : ''}
      {state}
    </span>
  );
};

export default React.memo(Constituency);
