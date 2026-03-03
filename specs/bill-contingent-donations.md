# Spec: Bill-Contingent Donations Architecture

## Purpose
Define the fundamental architecture principle that all donations in the Powerback system are contingent upon specific pieces of legislation.

## Scope
- In-scope: Bill-contingent donation flow, bill_id requirements, data flow architecture
- Out-of-scope: Bill selection UI, legislative data management, campaign finance regulations

## Core Principle
**All Celebrations are bill-contingent donations** - there is no such thing as a "general political donation" in the Powerback system.

## Key Concepts

### Bill-Contingent Nature
- Every single donation is tied to a specific piece of legislation that the user wants to support
- Bills don't need campaign financing - donations are contingent on legislative outcomes, not campaign funding
- The `bill_id` field is ALWAYS required and must flow through the entire donation process
- There is no distinction between "donations to politicians" vs "bill-related donations" - they are all bill-contingent

### Data Flow Requirements
- `bill_id` must be passed through the entire donation flow: Lobby → Payment → TipAsk → Support
- All Celebration objects must include a valid `bill_id`
- Backend validation requires `bill_id` for all donation processing
- Frontend components must handle bill data as a core requirement, not an optional feature

## Technical Implementation

### Data Flow Architecture
```
Celebrate.tsx (bill state) → TabContents.tsx → TipAsk.tsx → API.sendPayment()
```

### Required Components
- **Celebrate.tsx**: Manages bill state (currently hardcoded to WE_THE_PEOPLE)
- **TabContents.tsx**: Passes bill prop through to child components
- **TipAsk.tsx**: Includes bill_id in donation package creation
- **Backend**: Validates bill_id presence in all donation requests

### Bill Data Structure
```typescript
interface Bill {
  _id: string;
  bill_id: string;        // Required for all donations
  bill_slug: string;
  congress: string;
  bill: string;
  title: string;
  short_title: string;
  sponsor: string;
  // ... other bill properties
}
```

## Business Rules

### Donation Processing
- All donations must be associated with a specific bill
- Backend validation rejects donations without valid `bill_id`
- Frontend must pass bill data through entire donation flow
- No "general political donations" are supported

### User Experience
- Users are donating to support specific legislation
- Donations are contingent on legislative outcomes
- Bill information should be displayed in donation flow
- Users understand they're supporting specific bills, not general campaigns

## Common Pitfalls

### ❌ Incorrect Assumptions
- Treating `bill_id` as optional or conditional
- Distinguishing between "political donations" and "bill donations"
- Assuming bills are only for campaign financing
- Making `bill_id` conditional in donation package creation

### ❌ Implementation Errors
- Forgetting to pass bill prop through component hierarchy
- Making bill_id optional in API calls
- Creating "general donation" flows without bill context
- Treating bill selection as optional feature

## Acceptance Criteria

### Frontend Requirements
- All donation flows include bill data
- Bill props are passed through entire component hierarchy
- Donation packages always include valid `bill_id`
- No donation can be processed without bill context

### Backend Requirements
- All donation endpoints validate `bill_id` presence
- Celebration creation requires valid bill reference
- API responses include bill information
- No donations accepted without bill association

### User Experience
- Users understand they're supporting specific legislation
- Bill information is displayed in donation flow
- No confusion about "general political donations"
- Clear connection between donation and legislative outcome

## Integration Points

### With Existing Systems
- **FEC Compliance**: Bill-contingent donations still follow FEC limits
- **Payment Processing**: Stripe integration includes bill context
- **User Management**: Donation history includes bill information
- **Reporting**: All reports include bill-contingent context

### With External Services
- **Congress.gov**: Bill data sourced from official APIs
- **OpenFEC**: Compliance validation includes bill context
- **Stripe**: Payment processing includes bill metadata

## Data Examples

### Current Bill (WE_THE_PEOPLE)
```javascript
const WE_THE_PEOPLE = {
  _id: '6809879a6bb46a7928eac3f0',
  bill_id: 'hjres54-119',
  bill_slug: 'hjres54',
  congress: '119',
  bill: 'H.J.RES.54',
  title: 'Proposing an amendment to the Constitution...',
  short_title: 'We The People Amendment',
  sponsor: 'Pramila Jayapal',
  // ... other properties
};
```

### Donation Package with Bill
```typescript
const donationPackage = {
  pol_id: selectedPol,
  donatedBy: userId,
  payment_method: paymentMethodId,
  bill_id: bill.bill_id,  // REQUIRED - always included
  donation: donation,
  tip: tip,
  // ... other properties
};
```

## Links
- Rules: 41-bill-contingent-donations
- Code: `client/src/pages/Celebrate/Celebrate.tsx`, `client/src/constants/bill.ts`
- Related: specs/backend-compliance.md, specs/frontend-ui.md
