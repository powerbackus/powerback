/**
 * EscrowTotal – total $ in escrow for the donee-pol on Confirmation.
 * Same figure as EscrowDisplay in the pol carousel; emphasizes growing total.
 *
 * @module Confirmation/content/EscrowTotal
 */

import React from 'react';
import accounting from 'accounting';
import { CONFIRMATION_COPY } from '@CONSTANTS';

export interface EscrowTotalProps {
  /** Total dollar amount and count for this pol; null when loading or none. */
  escrowForPol: { donation: number; count: number } | null;
}

const EscrowTotal = ({ escrowForPol }: EscrowTotalProps) => {
  if (!escrowForPol || escrowForPol.donation <= 0) return null;

  const amount = accounting.formatMoney(escrowForPol.donation),
    text = CONFIRMATION_COPY.ESCROW_TOTAL(amount);

  return (
    <p
      className='escrow-total small mb-0 mt-1'
      aria-live='polite'
    >
      {text}
    </p>
  );
};

export default React.memo(EscrowTotal);
