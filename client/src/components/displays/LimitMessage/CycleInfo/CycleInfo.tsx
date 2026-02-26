import React from 'react';
import './style.css';

interface CycleInfoProps {
  details: string;
  title: string;
}

const CycleInfo = ({ details, title }: CycleInfoProps) => (
  <div className='cycle-info'>
    <p className='limit-info-details pb-2'>{details}</p>
    <h6 className='limit-info-title'>{title}</h6>
  </div>
);

export default React.memo(CycleInfo);
