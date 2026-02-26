/**
 * TipTitle – Thank-you or consideration message based on tip.
 *
 * @module Confirmation/content/TipTitle
 * @param tip - Optional tip amount; presence toggles thank-you vs consideration copy
 * @returns Div with tip-related message and BrandSpan
 */

import React from 'react';
import { Image } from 'react-bootstrap';
import { CONFIRMATION_COPY } from '@CONSTANTS';
import BrandSpan from '../BrandSpan/BrandSpan';

const TipTitle = ({ tip }: { tip?: number }) => {
  return (
    <div
      className={`d-flex align-items-center ps-lg-2 tip-title ${tip ? 'h6' : 'h5'}`}
    >
      {tip
        ? CONFIRMATION_COPY.TIP_TITLE.thankYou
        : CONFIRMATION_COPY.TIP_TITLE.consider}
      &nbsp;
      <BrandSpan className='mx-lg-2' />{' '}
      <Image
        src={'/assets/flag.gif'}
        alt={'American flag'}
      />
    </div>
  );
};

export default React.memo(TipTitle);
