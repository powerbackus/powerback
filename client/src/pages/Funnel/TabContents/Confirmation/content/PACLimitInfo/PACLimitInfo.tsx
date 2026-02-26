/**
 * PACLimitInfo – PAC contribution limit copy for tips.
 *
 * @module Confirmation/content/PACLimitInfo
 * @returns Info block with title, body (includes BrandSpan), and reset copy
 */

import React from 'react';
import { CONFIRMATION_COPY } from '@CONSTANTS';
import BrandSpan from '../BrandSpan/BrandSpan';

const PACLimitInfo = () => (
  <div className='d-flex align-items-start'>
    <i className='bi bi-question-circle me-2 mt-1' />
    <div>
      <strong>{CONFIRMATION_COPY.PAC_LIMIT_INFO.title}</strong>
      <br />
      {CONFIRMATION_COPY.PAC_LIMIT_INFO.body} <BrandSpan />.
      <br />
      <em className='text-muted'>
        {CONFIRMATION_COPY.PAC_LIMIT_INFO.resetInfo}
      </em>
    </div>
  </div>
);

export default React.memo(PACLimitInfo);
