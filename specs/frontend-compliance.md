# Spec: Frontend Compliance & Promotion

## Purpose
Define frontend compliance tier display, promotion logic, and user experience for FEC donation limits.

## Scope
- In-scope: Compliance component behavior, promotion indicators, tier ratchet logic, employment status changes
- Out-of-scope: Backend validation, payment processing, server-side compliance calculations

## Requirements
- Tiers: guest (anonymous) and compliant (full compliance). Do not use term "enhanced".
- Compliant tier: $3,500 per candidate per election (primary and general separate)
- Guest tier: per-donation limits + annual caps
- Tier ratchet: can only promote, never demote
- Employment status changes trigger promotion indicators
- Visual indicators: warning color for current values, green for next values

## Inputs / Outputs
- Inputs: userCompliance, formCompliance, contactInfo, formIsInvalid
- Outputs: compliance caps display, promotion button, contextual messages

## Interfaces & Contracts
- `client/src/pages/Celebrate/modals/Account/subcomps/body/panes/Profile/Compliance/Compliance.tsx`
- `client/src/pages/Celebrate/modals/Account/subcomps/body/panes/Profile/Compliance/cap/Cap.tsx`
- `client/src/hooks/compliance/useComplianceCaps.ts`
- `client/src/contexts/ComplianceTierContext.tsx`

## Logic & Invariants

### Tier Display Logic
- **Guest tier**: Show "Single Donation Limit" and "Annual Cap"
- **Compliant tier**: Show "Per Candidate Per Election Cap" and "General Election"
- **Promotion to Compliant**: Show Compliant tier labels even when user is currently Guest

### Promotion Detection
- **Direct Promotion**: `formCompliance > userCompliance`
- **Employment Status Change**: User switches employment to "YES" with empty occupation/employer fields

### Visual Indicators
- **Current values**: Always warning color (`.warning-limit`)
- **Next values**: Green color (`.dollar-limit`) when promotion available
- **Promotion arrow**: Shows when `showPromotion && hasValueChange && isPromotable`

### Button Behavior
- **Show button**: When promotion possible AND form valid AND user not already Compliant
- **Hide button**: When no promotion possible OR after successful promotion
- **Contextual messages**: Show guidance when button not available

## Acceptance Checks
- Guest user with Compliant form compliance shows "INCREASE YOUR LIMIT" button
- Employment toggle from "NO" to "YES" shows promotion arrows to Compliant tier
- Current values always show warning color, next values show green
- Compliant tier users see "Please keep your information current" message
- Tier ratchet prevents demotion when removing form information

## Component Structure
```
Compliance/
├── Compliance.tsx          # Main component (UI logic)
├── cap/
│   ├── Cap.tsx            # Individual cap display
│   └── index.js           # Export
├── style.css              # Styling
└── index.js               # Export
```

## Usage
```typescript
import Compliance from './Compliance';

<Compliance
  contactInfo={contactInfo}
  formIsInvalid={formIsInvalid}
  formCompliance={formCompliance}
/>
```

## PAC Limit Integration
- **Banner Display**: PAC limit reached banner in Confirmation.tsx
- **TipAsk Bypass**: Skip TipAsk screen when tipLimitReached: true
- **Limit Modal**: Show PAC-specific limit modal for violations
- **Payment Flow**: Ensure payment completion works when TipAsk bypassed
- **State Management**: Calculate PAC limit status from donations array

## Links
- Rules: 07-frontend-patterns, 18-client-ui-gates-and-server-authority, 40-pac-limit-system
- Code: `client/src/hooks/compliance/`, `client/src/contexts/ComplianceTierContext.tsx`, `client/src/pages/Celebrate/TabContents/Confirmation/Confirmation.tsx`
- Related: specs/backend-compliance.md, specs/escrow-and-aggregate-limits.md, specs/pac-limit-system.md
