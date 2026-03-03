import React from 'react';
import './style.css';

const LimitInfo = ({ message }: { message: string }) => (
  <p className='limit-main-message'>{message}</p>
);

export default React.memo(LimitInfo);
