# Compliance Component

## Overview

The Compliance component displays user's FEC compliance tier and provides promotion functionality to increase donation limits. It handles the complex FEC rules for different compliance tiers:

- **Guest**: $50 per donation, $200 annual cap
- **Compliant**: $3,500 per candidate per election (primary and general separate)

## Recent Improvements

### 1. Simplified Cap Component (`cap/Cap.tsx`)

**Before**: Complex logic with multiple boolean flags and convoluted conditional rendering
**After**: Clean, focused component with clear props and straightforward logic

**Key improvements**:
- Removed complex boolean logic (`willBeRaised`, `showIcon`, etc.)
- Simplified props to `currentValue`, `nextValue`, `showPromotion`, `isPromotable`
- Clear separation of concerns for styling and promotion indicators
- Better handling of edge cases (zero values)

### 2. New useComplianceCaps Hook (`hooks/compliance/useComplianceCaps.ts`)

**Purpose**: Centralizes the complex compliance cap calculation logic

**Features**:
- Calculates current and next tier values based on FEC rules
- Determines promotion eligibility and visual indicators
- Handles different display logic for guest vs compliant tiers
- Provides consistent interface for compliance cap data

### 3. Simplified Compliance Component

**Before**: 377 lines with complex `calculateTierValues` function and convoluted `CAPS` array
**After**: Cleaner component focused on UI logic, with business logic moved to hook

**Key improvements**:
- Removed `calculateTierValues` function (moved to hook)
- Removed complex `CAPS` array configuration (handled by hook)
- Simplified rendering logic
- Better separation of concerns

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

## FEC Compliance Rules

The component follows FEC regulations for campaign contributions:

1. **Guest Tier**: Anonymous users with basic account
   - Per donation: $50
   - Annual cap: $200
   - Reset: Annual (calendar year)

2. **Compliant Tier**: Users with name, address, occupation, employer
   - Per candidate per election: $3,500
   - Reset: Election cycle (primary/general separate)

## Promotion Logic

The component implements a **tier ratchet** system where compliance tiers can only go up, never down:

- **Ratchet Behavior**: Once a user achieves a higher compliance tier, they cannot lose it even if they remove information from their profile form
- **Effective Tier**: The component always displays the higher of the user's current tier and form-calculated tier
- **Promotion Only**: Promotion buttons and indicators only appear when the form compliance is higher than the user's current compliance

### Promotion Indicators

The component shows promotion indicators when:
- Form compliance is higher than user's current compliance tier
- OR user has potential to promote (employment status change, address completion)
- The next tier has higher limits
- Form is valid and ready for submission

**Potential Promotion Scenarios:**
- **Guest → Compliant**: User completes required profile and employment information

Visual indicators include:
- Green color for promotable values
- Upward arrow icon
- Tooltip showing the increased amount

### Example Scenarios

1. **User at compliant tier, removes some profile fields**: UI still shows compliant-tier limits (no change)
2. **User at guest tier, adds address and employment info**: UI shows promotion to compliant tier
