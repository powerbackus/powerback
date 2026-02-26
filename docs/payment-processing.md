# Payment Processing System

## Overview

POWERBACK uses Stripe for payment processing, implementing an escrow-based system where donations are held until celebration conditions are met. The payment system handles payment method collection, payment intent creation, and secure payment processing with FEC compliance validation.

## Architecture

### Payment Flow

1. **Payment Method Setup**: User provides payment method via Stripe Elements
2. **Payment Intent Creation**: Payment intent created but not charged
3. **Escrow Holding**: Funds held in Stripe until celebration resolved
4. **Payment Confirmation**: Payment confirmed when celebration condition met
5. **Fund Release**: Funds released to politician campaign

### Key Components

- **Frontend**: Stripe Elements for payment method collection
- **Backend**: Stripe API for payment processing
- **Webhooks**: Real-time payment event processing
- **Compliance**: FEC validation before payment creation

## Payment Processing Flow

### 1. Payment Method Setup

**Frontend** (`usePaymentProcessing.ts`):

- User enters payment details via Stripe Elements
- Payment method tokenized securely
- Setup intent created for payment method collection

**Backend** (`setupIntent.js`):

- Creates Stripe setup intent
- Returns client secret for frontend
- Allows secure payment method collection

### 2. Payment Method Storage

**Backend** (`setPaymentMethod.js`):

- Sets default payment method for Stripe customer
- Stores payment method for future use
- Associates payment method with user account

### 3. Payment Intent Creation

**Backend** (`createPayment.js`):

- Creates Stripe payment intent with total amount (donation + tip + fee)
- Uses payment method from request or customer's default
- Sets `up_future_usage` to allow reuse
- Includes idempotency key to prevent duplicates
- **Payment intent created but not charged until resolution**

### 4. Payment Confirmation

**Frontend** (`usePaymentProcessing.ts`):

- Confirms payment using client secret from payment intent
- Handles payment confirmation success/failure
- Updates UI based on payment status
- PAC limit: when validation returns `pacLimitInfo`, the hook calls `showPACLimitConfirm(data)` from DonationLimits context; contract (when called, payload shape, caller responsibility) is documented in the hook file.

**Backend** (Webhook):

- Receives `charge.succeeded` event from Stripe
- Updates celebration status
- Processes payment completion

## Stripe Integration

### Payment Intents

- **Purpose**: Hold funds in escrow until celebration resolved
- **Status**: Created but not charged until condition met
- **Amount**: Donation + tip + Stripe processing fee
- **Currency**: USD

### Setup Intents

- **Purpose**: Securely collect payment methods
- **Usage**: One-time setup for payment method collection
- **Security**: Tokenized payment method, never stored directly

### Customers

- **Purpose**: Associate payment methods with users
- **Storage**: Stripe customer ID stored in user document
- **Default Payment Method**: Stored for future use

### Webhooks

- **Purpose**: Real-time payment event processing
- **Events**: `charge.succeeded`, `payment_intent.created`, etc.
- **Security**: Signature verification required
- **Processing**: Updates celebration status when payment confirmed

## FEC Compliance Integration

### Validation Before Payment

- **Backend Validation**: FEC compliance checked before payment intent creation
- **Tier Limits**: Per-donation, annual, and per-election limits enforced
- **PAC Limits**: Tip limits validated ($5,000 annual)
- **Donor Validation**: Donor information validated per compliance tier

### Payment Rejection

- **Validation Failures**: Payment rejected if compliance violated
- **Error Messages**: Clear error messages for users
- **PAC Limit Modal**: Special handling for PAC limit violations

## Amount Calculation

### Total Amount

```
Total = Donation + Tip + Stripe Processing Fee
```

### Stripe Processing Fee

- **Rate**: 2.9% + $0.30 per transaction
- **Calculation**: Applied to donation + tip amount
- **Transparency**: Fee shown to user before payment

### Conversion

- **Dollars to Cents**: All amounts converted to cents for Stripe
- **Precision**: Uses `Math.floor()` to ensure integer cents

## Idempotency

### Idempotency Keys

- **Purpose**: Prevent duplicate charges
- **Generation**: Unique key per payment attempt
- **Storage**: Stored in celebration document
- **Stripe**: Passed to Stripe API for idempotent processing

## Error Handling

### Payment Errors

- **Stripe Errors**: Handled and returned to frontend
- **Network Errors**: Retry logic for transient failures
- **Validation Errors**: Clear error messages for users
- **Client Logging**: Frontend payment hooks (`usePaymentProcessing`, payment forms, and related funnel components) use the shared client logging helper (`logError` / `logWarn` from `@Utils`) instead of raw `console.error` / `console.warn`. In production, logs contain only high-level messages (no Stripe responses, card details, or request bodies); full error objects are available only in development.

### Webhook Errors

- **Signature Verification**: Invalid signatures rejected
- **Processing Errors**: Logged but don't break webhook processing
- **Retry Logic**: Stripe automatically retries failed webhooks

## Security

### Payment Method Security

- **Tokenization**: Payment methods tokenized by Stripe
- **No Storage**: Card details never stored in application
- **PCI Compliance**: Handled by Stripe

### Webhook Security

- **Signature Verification**: All webhooks verified using Stripe signing secret
- **Raw Body Parsing**: Preserves signature for validation
- **Error Handling**: Invalid signatures rejected

## PAC Limit Optimization

### Webhook Optimization

- **Skip Processing**: Users at PAC limit skip webhook processing
- **Performance**: Reduces database load for users who can't tip
- **Early Return**: Returns success to prevent Stripe retries

### Limit Checking

- **Backend Authority**: Backend validates PAC limits
- **Frontend Display**: Frontend shows limit information
- **Annual Reset**: Limits reset on January 1st

## Testing

### Test Mode

- **Stripe Test Keys**: Use test keys in development
- **Test Cards**: Stripe provides test card numbers
- **Webhook Testing**: Stripe CLI for local webhook testing

### Manual Testing

```javascript
// Create payment intent
const { createPayment } = require('./controller/payments/createPayment');
await createPayment(req, res);

// Setup payment method
const { setupIntent } = require('./controller/payments/setupIntent');
await setupIntent(req, res);
```

## Related Documentation

- [FEC Compliance Guide](./fec-compliance-guide.md) - Compliance validation
- [Donation Limits](./donation-limits.md) - Donation limit system
- [Webhook System](./webhooks.md) - Webhook processing
- [API Documentation](./API.md) - Payment API endpoints
- [Celebration System](./defunct-celebrations-system.md) - Celebration lifecycle
