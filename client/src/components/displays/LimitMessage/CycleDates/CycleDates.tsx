import React from 'react';
import { LIMIT_MESSAGE_COPY } from '@CONSTANTS';
import './style.css';

interface CycleDatesProps {
  shouldShow: boolean;
  primaryDate: string;
  generalDate: string;
}

const CycleDates = ({
  shouldShow,
  primaryDate,
  generalDate,
}: CycleDatesProps) =>
  shouldShow ? (
    <div className='limit-election-dates'>
      <p className='limit-date-item'>
        <strong>{LIMIT_MESSAGE_COPY.ELECTION_DATES.PRIMARY}</strong>{' '}
        {primaryDate}
      </p>
      <p className='limit-date-item'>
        <strong>{LIMIT_MESSAGE_COPY.ELECTION_DATES.GENERAL}</strong>{' '}
        {generalDate}
      </p>
    </div>
  ) : null;

export default React.memo(CycleDates);
