import type { Bill } from '@Interfaces';
import type { Stripe } from '@stripe/stripe-js';
import type { Dispatch, SetStateAction } from 'react';

export interface PaymentProps {
  stripe: PromiseLike<Stripe | null> | Stripe | null;
  setDonorId: Dispatch<SetStateAction<string>>;
  paymentError?: Error | null;
  bill: Bill;
}
