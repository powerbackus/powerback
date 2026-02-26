import React from 'react';
import { congressOrdinal, daysUntilElectionDay } from './fn';
import './style.css';

const Marquee = ({ id = 'side-nav-marquee' }) => (
  <div id={id}>
    <span className='congress-ordinal'>{congressOrdinal}</span> Congress
    <br />
    <span className='day-counter'>
      {daysUntilElectionDay <= 0
        ? daysUntilElectionDay + 365
        : daysUntilElectionDay}
    </span>
    {daysUntilElectionDay <= 0 ? '' : ' Days To Election Day'}
  </div>
);

export default React.memo(Marquee);
