/**
 * @fileoverview Payments Controller Module
 *
 * This module provides controller functions for Stripe payment processing,
 * including payment intent creation, payment method management, and customer
 * setup. It handles the integration between the application and Stripe's
 * payment processing system.
 *
 * KEY FUNCTIONS
 *
 * PAYMENT PROCESSING
 * - createPayment: Creates Stripe payment intent for celebration donations
 * - setupIntent: Creates Stripe setup intent for payment method configuration
 * - setPaymentMethod: Sets default payment method for Stripe customer
 *
 * BUSINESS LOGIC
 *
 * STRIPE INTEGRATION
 * - Payment intents created but not charged until celebration resolved
 * - Setup intents allow secure payment method collection
 * - Customer and payment method stored for future use
 * - Idempotency keys prevent duplicate charges
 *
 * PAYMENT FLOW
 * 1. User selects payment method → setupIntent creates setup intent
 * 2. Payment method saved → setPaymentMethod stores as default
 * 3. Celebration created → createPayment creates payment intent (not charged)
 * 4. Celebration resolved → Payment intent charged through Stripe webhook
 *
 * DEPENDENCIES
 * - ./setPaymentMethod: Payment method management
 * - ./createPayment: Payment intent creation
 * - ./setupIntent: Setup intent creation
 * - stripe: Stripe SDK for payment processing
 *
 * @module controller/payments
 * @requires ./setPaymentMethod
 * @requires ./createPayment
 * @requires ./setupIntent
 * @requires stripe
 */

const { setPaymentMethod } = require('./setPaymentMethod'),
  { createPayment } = require('./createPayment'),
  { setupIntent } = require('./setupIntent');

module.exports = {
  setPaymentMethod,
  createPayment,
  setupIntent,
};
