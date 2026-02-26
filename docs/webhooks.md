# Webhook System

## Overview

POWERBACK uses webhooks to receive real-time events from external services, primarily Stripe for payment processing. The webhook system provides secure, reliable event processing with signature verification and comprehensive error handling.

## Architecture

### Webhook Endpoints

- **POST `/api/webhooks/stripe`**: Handles Stripe payment events
- **Security**: Signature verification required for all webhooks
- **Processing**: Event-specific processing logic
- **Error Handling**: Graceful error handling with logging

### Event Processing

- **charge.succeeded**: Primary processing event for celebration updates
- **payment_intent.created**: Logged but not processed
- **payment_intent.succeeded**: Logged but not processed
- **Other Events**: Logged as unhandled in development mode

## Stripe Webhook Integration

### Signature Verification

**Security Features**:

- Webhook signature verification using Stripe signing secret
- Raw body parsing to preserve signature for validation
- Error handling for invalid or expired signatures
- Environment-specific signing secrets (Workbench for production, CLI for development)

**Implementation**:

```javascript
const event = stripe.webhooks.constructEvent(req.body, sig, signingSecret);
```

### Event Types

#### charge.succeeded

**Purpose**: Process successful payment charges

**Processing**:

1. Extract charge data from event
2. Find associated celebration record
3. Check user PAC limit status (optimization)
4. Update celebration status if needed
5. Log processing result

**Optimization**:

- Users with `tipLimitReached: true` skip processing
- Early return prevents unnecessary database operations
- Reduces system load for users at PAC limit

#### payment_intent.created

**Purpose**: Log payment intent creation

**Processing**:

- Logged for monitoring
- Not processed (payment intent created earlier)

#### payment_intent.succeeded

**Purpose**: Log payment intent success

**Processing**:

- Logged for monitoring
- Not processed (charge.succeeded handles actual processing)

## Webhook Security

### Signature Verification

- **Required**: All webhooks must have valid Stripe signature
- **Validation**: Uses Stripe signing secret to verify authenticity
- **Error Handling**: Invalid signatures return 400 error

### Raw Body Parsing

- **Purpose**: Preserve request body for signature verification
- **Implementation**: `express.raw({ type: 'application/json' })`
- **Critical**: Body must be raw for signature validation

### Environment-Specific Secrets

- **Production**: Uses `STRIPE_SIGNING_SECRET_WORKBENCH`
- **Development**: Uses `STRIPE_SIGNING_SECRET_CLI`
- **Configuration**: Set in environment variables

## Performance Optimization

### PAC Limit Optimization

**Purpose**: Reduce database load for users at PAC limit

**Implementation**:

- Check `user.tipLimitReached` before processing
- Skip celebration update if user at limit
- Early return with success response
- Prevents Stripe retry mechanisms

**Benefits**:

- Reduces database queries by ~50% for affected users
- Improves webhook processing time
- Prevents wasted CPU cycles
- Scales better as more users reach PAC limits

### Logging Optimization

- **Route Tester**: Suppresses logs for API route tester requests
- **Production**: Minimal logging for performance
- **Development**: Comprehensive logging for debugging

## Error Handling

### Signature Verification Errors

- **Missing Signature**: Returns 400 error
- **Invalid Signature**: Returns 400 error with message
- **Expired Signature**: Returns 400 error

### Processing Errors

- **Celebration Not Found**: Logged but doesn't break processing
- **Database Errors**: Logged with error details
- **Stripe API Errors**: Logged and handled gracefully

### Retry Logic

- **Stripe Retries**: Stripe automatically retries failed webhooks
- **Idempotency**: Processing is idempotent (safe to retry)
- **Early Returns**: Success responses prevent unnecessary retries

## Webhook Event Structure

### Stripe Event Format

```javascript
{
  "id": "evt_1234567890",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "amount": 10000,
      "currency": "usd",
      "status": "succeeded"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1234567890",
    "idempotency_key": null
  },
  "type": "charge.succeeded"
}
```

## Testing

### Local Testing

**Stripe CLI**:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger charge.succeeded
```

### Manual Testing

```javascript
// Test webhook endpoint
const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
  method: 'POST',
  headers: {
    'stripe-signature': signature,
    'content-type': 'application/json',
  },
  body: JSON.stringify(event),
});
```

## Monitoring

### Logging

- **Incoming Requests**: Logged with body length
- **Signature Verification**: Success/failure logged
- **Event Processing**: Event type and processing result logged
- **Errors**: Comprehensive error logging with details

### Metrics

- **Processing Time**: Track webhook processing time
- **Success Rate**: Monitor successful vs failed webhooks
- **Optimization Rate**: Track PAC limit optimization usage
- **Error Rate**: Monitor error frequency and types

## Outgoing: H.J.Res.54 bill-update webhook

The app can POST to an external URL when H.J.Res.54 (We The People Amendment) has new activity. This is intended for Make.com or similar automation.

### Configuration

- **Env**: `HJRES54_WEBHOOK_URL` – full URL to POST to (e.g. Make webhook). If unset, no request is sent.

### Request

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON (flat schema for Make.com scenario mapping; see below)

### JSON body schema

The payload uses a flat structure so Make.com scenarios can map fields directly.

```json
{
  "event_type": "bill_updated",
  "change_summary": [
    "Status: Introduced → Committee Consideration",
    "Latest action: Referred to the House Committee on the Judiciary.",
    "Committees: HJUD"
  ],
  "session_label": "119th Congress",
  "bill_id": "H.J.Res.54",
  "bill_title": "We The People Amendment",
  "previous_status": "Introduced",
  "new_status": "Passed House",
  "last_action_text": "Referred to the House Committee on the Judiciary.",
  "update_date": "2025-02-20",
  "total_donations": 12500,
  "dedupe_key": "2025-02-23T12:00:00.000Z-hjres54-119",
  "committees_changed": true,
  "committees": ["HJUD"]
}
```

| Field                | Type     | Description                                                                                                              |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `event_type`         | string   | Always `"bill_updated"` for this webhook                                                                                 |
| `change_summary`     | string[] | Human-readable change lines (status, action, committees)                                                                 |
| `session_label`      | string   | Congress session (e.g. `119th Congress`)                                                                                 |
| `bill_id`            | string   | Display form e.g. `H.J.Res.54`                                                                                           |
| `bill_title`         | string   | Short title from Congress.gov                                                                                            |
| `previous_status`    | string   | Status before this update                                                                                                |
| `new_status`         | string   | Current status                                                                                                           |
| `last_action_text`   | string   | Text of latest action from Congress.gov                                                                                  |
| `update_date`        | string   | Bill update date from Congress.gov API (same value/type as API)                                                          |
| `total_donations`    | number   | Sum of `donation` for Celebrations with this bill and `current_status: 'active'` (all users, all candidates), in dollars |
| `dedupe_key`         | string   | `{timestamp}-{internal_bill_id}` for scenario deduplication                                                              |
| `committees_changed` | boolean  | Whether committee list changed                                                                                           |
| `committees`         | string[] | Current committee codes/names                                                                                            |

Errors (e.g. non-2xx response or timeout) are logged; the job does not fail. No retries are performed by the app.

## Related Documentation

- [Payment Processing System](./payment-processing.md) - Payment processing details
- [FEC Compliance Guide](./fec-compliance-guide.md) - Compliance validation
- [PAC Limit System](../specs/pac-limit-system.md) - PAC limit details
- [Webhook Optimization](../specs/webhook-optimization.md) - Performance optimization
- [API Documentation](./API.md) - Webhook API endpoints
