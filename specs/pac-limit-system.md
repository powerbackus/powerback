# Spec: PAC Limit System

## Purpose
Define the Political Action Committee (PAC) contribution limit system, including business logic, technical implementation, and user experience flows.

## Scope
- In-scope: PAC limit validation, tipLimitReached field behavior, frontend/backend integration, payment flow integration
- Out-of-scope: General FEC compliance tiers (guest/compliant), donation limits, election cycle resets

## Requirements
- PAC contributions (tips) are subject to a $5,000 annual limit per user
- `tipLimitReached` field acts as a "ratchet" - once true, stays true until annual reset
- Users can donate exactly $5,000 in tips but cannot exceed this amount
- PAC limit violations trigger specific UX flows (banner, TipAsk bypass, limit modal)
- Payment completion must work even when TipAsk is bypassed

## Business Rules

### PAC Limit Definition
- **Annual Limit**: $5,000 per user per calendar year
- **Scope**: All tips to POWERBACK.us platform (considered PAC contributions under FEC rules)
- **Reset**: January 1st of each year (Eastern Time)
- **Authority**: Backend is authoritative for validation; frontend calculates for UX

### Limit States
- **Under Limit**: User can add tips up to remaining amount
- **At Limit**: User has reached exactly $5,000; can still complete donations with $0 tip
- **Over Limit**: User attempts to exceed $5,000; tip is set to $0 and limit modal shown

### tipLimitReached Field Behavior
- **Set to true**: When user reaches or exceeds $5,000 annual PAC limit
- **Persistent**: Once true, remains true until annual reset
- **Purpose**: Enables TipAsk bypass and PAC limit banner display
- **Authority**: Backend sets this field during celebration creation

## Technical Implementation

### Backend Validation (routes/api/celebrations.js)
```javascript
// PAC limit validation during celebration creation
if (req.body.tip && req.body.tip > 0) {
  const pacLimitInfo = checkPACLimit(celebrations, req.body.tip);
  const newTotal = pacLimitInfo.currentPACTotal + req.body.tip;
  
  if (newTotal >= pacLimitInfo.pacLimit) {
    // Set tipLimitReached to true
    await User.findByIdAndUpdate(userId, { tipLimitReached: true });
    
    // Only set tip to 0 if exceeding limit
    if (newTotal > pacLimitInfo.pacLimit) {
      req.body.tip = 0;
    }
  }
}
```

### Frontend Calculation (Confirmation.tsx)
```typescript
// Calculate PAC limit status from donations array
const hasReachedPACLimit = useMemo(() => {
  if (!userData?.donations) return false;
  const currentYear = new Date().getFullYear();
  const currentYearTips = userData.donations
    .filter(donation => 
      donation.createdAt &&
      new Date(donation.createdAt).getFullYear() === currentYear &&
      (donation.tip || 0) > 0
    )
    .reduce((sum, donation) => sum + (donation.tip || 0), 0);
  return currentYearTips >= 5000;
}, [userData?.donations]);
```

### Payment Flow Integration
- **Normal Flow**: Payment → TipAsk → Confirmation
- **PAC Limit Flow**: Payment → Confirmation (TipAsk bypassed)
- **Payment Completion**: Must be accessible from Payment tab when TipAsk is bypassed
- **Custom Hook Architecture**: Payment processing logic extracted to `usePaymentProcessing` hook for reusability
- **Webhook Optimization**: Users with tipLimitReached: true skip webhook processing to reduce database load

## User Experience Flows

### PAC Limit Banner (Confirmation.tsx)
- **Trigger**: User reaches $5,000 annual PAC limit
- **Display**: Info alert explaining PAC limit reached
- **Frequency**: Show only once per user (until annual reset)
- **Calculation**: Based on current year tips from donations array

### TipAsk Bypass (DonationLimitsContext.tsx)
- **Condition**: `userData.tipLimitReached === true`
- **Behavior**: Skip TipAsk screen entirely
- **Navigation**: Payment → Confirmation (direct)
- **Payment**: Must complete payment from Payment tab

### Limit Modal (Limit.tsx)
- **Trigger**: User attempts to exceed $5,001 in tips
- **Behavior**: Show limit modal with PAC-specific messaging
- **Action**: "Shave off" excess amount to maximum allowed
- **Result**: Tip amount reduced to remaining limit

## Integration Points

### With Existing Compliance System
- **Independent**: PAC limits are separate from compliance tiers
- **Additive**: Users can hit PAC limits regardless of compliance tier
- **Validation**: Backend validates both compliance and PAC limits

### With Payment Processing
- **Stripe Integration**: Payment intents created before PAC validation
- **Webhook Handling**: Celebration creation triggers PAC limit checks
- **Error Handling**: PAC violations return validation errors, not payment failures
- **Performance Optimization**: Webhook processing skipped for users at PAC limit to reduce database load

### With User State Management
- **AuthContext**: Provides `refreshUserData` utility for server sync
- **DonationStateContext**: Manages payment state and localStorage
- **NavigationContext**: Handles TipAsk bypass logic

## Data Flow

### Celebration Creation Flow
```
1. User submits donation with tip
2. Backend validates FEC compliance
3. Backend checks PAC limits
4. If PAC limit reached/exceeded:
   - Set tipLimitReached: true
   - Set tip to 0 if exceeding limit
5. Create celebration record
6. Return success response
```

### Frontend State Update Flow
```
1. Celebration created successfully
2. Frontend updates userData.donations
3. Confirmation.tsx calculates PAC limit status
4. PAC limit banner shows if applicable
5. Future donations skip TipAsk if tipLimitReached: true
```

## Error Handling

### Backend Errors
- **PAC Validation Failure**: Log error, continue with celebration creation
- **Database Update Failure**: Log error, continue with celebration creation
- **Missing Data**: Use defensive defaults, log warnings

### Frontend Errors
- **Calculation Errors**: Use fallback values, log warnings
- **State Sync Issues**: Refresh user data from server
- **Payment Flow Errors**: Show error messages, allow retry

## Testing Scenarios

### Unit Tests
- PAC limit calculation functions
- tipLimitReached field updates
- Frontend PAC limit status calculation
- Payment flow integration

### Integration Tests
- Backend PAC validation during celebration creation
- Frontend banner display logic
- TipAsk bypass functionality
- Payment completion when TipAsk bypassed

### E2E Tests
- Complete donation flow with PAC limit reached
- PAC limit exceeded scenario
- Annual reset behavior
- Cross-browser compatibility

## Acceptance Criteria

### Backend Validation
- PAC limits enforced during celebration creation
- tipLimitReached field updated correctly
- Proper distinction between reaching vs exceeding limit
- Comprehensive logging for debugging

### Frontend Experience
- PAC limit banner displays when appropriate
- TipAsk bypassed for users with tipLimitReached: true
- Limit modal shows for PAC limit violations
- Payment completion works in all scenarios

### Data Consistency
- Backend and frontend calculations align
- tipLimitReached field persists correctly
- Annual reset logic works properly
- No race conditions between validation and display

## Links
- Rules: 40-pac-limit-system
- Code: `routes/api/celebrations.js`, `client/src/pages/Celebrate/TabContents/Confirmation/Confirmation.tsx`
- Related: specs/backend-compliance.md, specs/frontend-compliance.md, specs/escrow-and-aggregate-limits.md
