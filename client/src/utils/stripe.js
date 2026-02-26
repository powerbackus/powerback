/**
 * Stripe config. Load public key at runtime; init Stripe.
 * @module utils/stripe
 */

import { logError } from './clientLog';

/**
 * Loads the Stripe public key from the server
 * @returns {Promise<string>} The Stripe public key
 */
export const loadStripeKey = async () => {
  try {
    const response = await fetch('/api/config/stripe-key');

    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe key: ${response.status}`);
    }

    const { stripePublicKey } = await response.json();

    if (!stripePublicKey) {
      throw new Error('No Stripe key returned from server');
    }

    return stripePublicKey;
  } catch (error) {
    logError('Error loading Stripe key', error);
    throw error;
  }
};

/**
 * Initializes Stripe with the public key loaded from the server
 * @returns {Promise<Object>} Stripe instance
 */
export const initializeStripe = async () => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripePublicKey = await loadStripeKey();

    return await loadStripe(stripePublicKey);
  } catch (error) {
    logError('Error initializing Stripe', error);
    throw error;
  }
};
