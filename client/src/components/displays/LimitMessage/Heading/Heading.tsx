import React from 'react';
import { LIMIT_MESSAGE_COPY, CELEBRATE_COPY } from '@CONSTANTS';
import { InfoTooltip } from '@Components/modals';
import './style.css';

const Heading = ({
  title = LIMIT_MESSAGE_COPY.HEADER.TITLE,
  message = CELEBRATE_COPY.AMOUNT.reached,
}: {
  title?: string;
  message?: string;
}) => (
  <div className='limit-header'>
    <h6 className='limit-title'>{title}</h6>

    <InfoTooltip
      toolTipId={'limit-message-heading-tooltip'}
      infoPlacement={'top'}
      icon={'info-circle'}
      showToolTips={true}
      message={message}
    />
  </div>
);

export default React.memo(Heading);
