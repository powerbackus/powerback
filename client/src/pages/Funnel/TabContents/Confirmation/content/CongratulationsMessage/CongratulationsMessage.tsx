/**
 * CongratulationsMessage – Post-celebration greeting with fire icon.
 *
 * @module Confirmation/content/CongratulationsMessage
 * @param displayName - User first name; when present uses personalized copy
 * @returns Div with congratulations text and fire icon
 */

import React from 'react';
import { CONFIRMATION_COPY } from '@CONSTANTS';

const CongratulationsMessage = ({ displayName }: { displayName: string }) => (
  <div className={'d-flex align-items-center justify-content-center'}>
    {displayName
      ? CONFIRMATION_COPY.CONGRATULATIONS.withName(displayName)
      : CONFIRMATION_COPY.CONGRATULATIONS.withoutName}{' '}
    {CONFIRMATION_COPY.CONGRATULATIONS.success}&nbsp;
    <i
      className={'bi bi-fire text-danger ms-1'}
      aria-hidden={'true'}
    />
  </div>
);

export default React.memo(CongratulationsMessage);
