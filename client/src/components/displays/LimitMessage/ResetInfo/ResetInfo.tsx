import React from 'react';
import './style.css';

const ResetInfo = ({ message }: { message: string }) => (
  <p className='limit-reset-text'>{message}</p>
);

export default React.memo(ResetInfo);
