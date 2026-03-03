/**
 * Styled brand name for Support content.
 * Used by PACLimitInfo and TipMessage for consistent brand styling.
 *
 * @module Confirmation/content/common/BrandSpan
 * @returns Styled span with BRAND_DISPLAY text
 */

import React from 'react';
import { BRAND_DISPLAY } from '@CONSTANTS';

const BrandSpan = ({ className }: { className?: string }) => (
  <span className={`powerback ${className}`}>{BRAND_DISPLAY}</span>
);

export default React.memo(BrandSpan);
