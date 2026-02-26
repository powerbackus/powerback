import type { Bill } from '@Interfaces';
import type { Stripe } from '@stripe/stripe-js';
import type { Dispatch, SetStateAction } from 'react';

export interface PaymentProps {
  setDonorId: Dispatch<SetStateAction<string>>;
  stripe: Promise<Stripe | null>;
  paymentError?: Error | null;
  bill: Bill;
}
