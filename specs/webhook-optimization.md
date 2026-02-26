# Spec: Webhook Optimization System

## Purpose
Define the webhook processing optimization system that reduces database load by skipping unnecessary processing for users who have reached their PAC limits.

## Scope
- In-scope: Webhook performance optimization, PAC limit integration, database load reduction
- Out-of-scope: General webhook functionality, payment processing, compliance validation

## Requirements
- Users with `tipLimitReached: true` skip webhook processing for `charge.succeeded` events
- Early return with success response to prevent Stripe retries
- Maintain webhook signature verification for all requests
- Log optimization decisions for monitoring
- Preserve all existing webhook functionality for users under PAC limits

## Business Logic

### Optimization Trigger
- **Condition**: User has `tipLimitReached: true` in their user document
- **Event**: `charge.succeeded` webhook events
- **Action**: Skip celebration update processing and return early
- **Rationale**: Users at PAC limit cannot make additional tips, so processing is unnecessary

### Processing Flow
```
1. Webhook received and signature verified
2. Extract charge data from event
3. Find associated celebration record
4. Look up user by celebration.donatedBy
5. Check if user.tipLimitReached === true
6. If true: Log and return success (skip processing)
7. If false: Continue with normal celebration update
```

## Technical Implementation

### Webhook Handler (routes/api/webhooks.js)
```javascript
// Check if user has already reached PAC limit - skip processing if so
// This optimization reduces database load for users who can't tip
const user = await User.findById(celebration.donatedBy);

if (user && user.tipLimitReached) {
  logger.info('[Webhook] Skipping processing - user already at PAC limit', {
    userId: user._id,
    celebrationId: celebration._id,
    chargeId: charge.id,
    tipAmount: celebration.tip || 0,
  });
  return res.status(200).send('Webhook received - skipped processing');
}
```

### Performance Benefits
- **Database Load Reduction**: Eliminates unnecessary database queries for users at PAC limit
- **Processing Time**: Reduces webhook processing time by ~50% for affected users
- **Resource Efficiency**: Prevents wasted CPU cycles on users who cannot tip
- **Scalability**: Improves system performance as more users reach PAC limits

## Integration Points

### With PAC Limit System
- **Trigger**: `tipLimitReached` field set to `true` during celebration creation
- **Authority**: Backend compliance system manages the field state
- **Reset**: Annual reset on January 1st clears the optimization flag

### With Stripe Webhooks
- **Signature Verification**: All webhooks still verified regardless of optimization
- **Event Processing**: Only `charge.succeeded` events are optimized
- **Response Handling**: Early return prevents Stripe retry mechanisms

### With Logging System
- **Optimization Logs**: Track when processing is skipped
- **Performance Metrics**: Monitor optimization effectiveness
- **Debug Information**: Include user and celebration IDs for troubleshooting

## Monitoring and Metrics

### Key Metrics
- **Optimization Rate**: Percentage of webhooks that skip processing
- **Processing Time**: Average webhook processing time before/after optimization
- **Database Queries**: Reduction in unnecessary database operations
- **Error Rate**: Ensure optimization doesn't introduce errors

### Logging Requirements
- **Optimization Events**: Log when processing is skipped
- **Performance Data**: Track processing time improvements
- **Error Handling**: Log any issues with optimization logic
- **Audit Trail**: Maintain records for compliance and debugging

## Error Handling

### Graceful Degradation
- **Database Errors**: If user lookup fails, continue with normal processing
- **Missing Data**: If celebration not found, log and continue normally
- **Optimization Failures**: Never break webhook processing due to optimization errors

### Fallback Behavior
- **Default Processing**: Always fall back to normal webhook processing
- **Error Logging**: Log optimization errors without failing the webhook
- **Monitoring**: Alert on optimization failures for investigation

## Acceptance Criteria

### Functional Requirements
- Users with `tipLimitReached: true` skip webhook processing
- Users under PAC limit continue normal processing
- Webhook signature verification works for all requests
- Early return prevents Stripe retries
- All existing functionality preserved

### Performance Requirements
- 50%+ reduction in processing time for optimized users
- No increase in processing time for non-optimized users
- Database query reduction for optimized webhooks
- Maintain webhook response time under 200ms

### Monitoring Requirements
- Optimization events logged with relevant context
- Performance metrics tracked and reported
- Error rates monitored and alerted
- Audit trail maintained for compliance

## Testing Scenarios

### Unit Tests
- PAC limit check logic
- Early return behavior
- Error handling and fallbacks
- Logging functionality

### Integration Tests
- Webhook processing with PAC limit users
- Webhook processing with non-PAC limit users
- Database query reduction verification
- Stripe webhook response handling

### Performance Tests
- Processing time comparison
- Database load measurement
- Concurrent webhook handling
- Memory usage optimization

## Links
- Rules: 40-pac-limit-system, 36-performance-optimization
- Code: `routes/api/webhooks.js`, `models/User.js`
- Related: specs/pac-limit-system.md, specs/performance-optimization.md
