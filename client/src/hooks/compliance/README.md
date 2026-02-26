# useComplianceCaps Hook

## Overview

The `useComplianceCaps` hook centralizes the complex FEC compliance cap calculation logic. It determines which donation limits to display based on the user's current compliance tier and their potential to promote to a higher tier.

## Purpose

This hook was extracted from the Compliance component to:
- Centralize complex FEC compliance tier calculations
- Provide consistent interface for compliance cap data
- Handle promotion eligibility and visual indicators
- Support different display logic for guest vs compliant tiers

## FEC Compliance Rules

The hook implements FEC regulations for campaign contributions using the current two-tier model:

### Guest Tier
- **Per donation**: $50
- **Annual cap**: $200
- **Reset**: Annual (calendar year)
- **Requirements**: Basic account (anonymous)

### Compliant Tier
- **Per candidate per election**: $3,500
- **Reset**: Election cycle (primary and general are separate)
- **Requirements**: Name, address, occupation, and employer

## Hook Signature

```typescript
export const useComplianceCaps = (
  serverConstants: any,
  formCompliance: ComplianceTier,
  userCompliance: ComplianceTier,
  contactInfo?: any
): ComplianceCap[]
```

### Parameters

- `serverConstants` - Server constants for compliance limits (if provided, uses server values)
- `formCompliance` - Form's calculated compliance tier based on current form state
- `userCompliance` - User's current compliance tier (from database)
- `contactInfo` - User's contact information (optional, used for promotion potential detection)

### Returns

Array of `ComplianceCap` objects with:
- `label: string` - Display label (e.g., "Single Donation Limit", "Annual Cap")
- `nextValue: number` - Limit value for the next tier (if promotable)
- `currentValue: number` - Limit value for the current tier
- `isPromotable: boolean` - Whether to show promotion arrow indicator
- `resetType: 'annual' | 'election_cycle'` - When the limit resets

## Key Concepts

### Effective Compliance (Tier Ratchet)

The hook implements a **tier ratchet** system where compliance tiers can only go up, never down:

```typescript
const effectiveCompliance =
  TIERS.indexOf(formCompliance) >= TIERS.indexOf(userCompliance)
    ? formCompliance
    : userCompliance;
```

- Once a user achieves a higher compliance tier, they cannot lose it
- The effective tier is always the higher of user and form compliance
- This ensures users see correct labels when they have promotion potential

### Promotion Detection

The hook detects two types of promotion scenarios:

1. **Direct Promotion** (`canPromote`): Form compliance is higher than user compliance
   - Example: User at guest tier, completes required fields → formCompliance becomes `compliant`

2. **Potential Promotion** (`hasPromotionPotential`): User has employment info that enables promotion
   - Guest → Compliant: User has `isEmployed`, `occupation`, and `employer`

### Display Logic

#### Compliant Tier Users
- Shows single cap: "Per Candidate, Per Election"
- No promotion arrows (already at maximum tier)
- `currentValue` equals `nextValue` to avoid showing arrows

#### Guest Tier Users
- Shows two caps:
  1. "Single Donation Limit" - Per donation maximum
  2. "Annual Cap" - Total annual contribution limit
- Promotion arrows shown when `isPromotable` is true

#### Special Case: Promotion to Compliant
When user can promote to the compliant tier, the hook may return an **empty array**:
- The large limit increase is better explained by CTA text
- No caps displayed to avoid confusion

## Usage Example

```typescript
import { useComplianceCaps } from '@Hooks/compliance';

const Compliance = ({ formCompliance, contactInfo }) => {
  const { userCompliance } = useComplianceTier();
  const { serverConstants } = useProfile();

  const complianceCaps = useComplianceCaps(
    serverConstants,
    formCompliance,
    userCompliance,
    contactInfo
  );

  return (
    <div>
      {complianceCaps.map((cap) => (
        <Cap
          key={cap.label}
          currentValue={cap.currentValue}
          nextValue={cap.nextValue}
          showPromotion={cap.isPromotable}
          isPromotable={cap.isPromotable}
        />
      ))}
    </div>
  );
};
```

## Related Hooks

### usePACLimitData

Also exported from this file, calculates PAC (Political Action Committee) limit information for tips:

```typescript
export const usePACLimitData = (donations: Celebration[]): {
  pacLimit: number;              // $5,000 annual PAC limit
  currentPACTotal: number;        // Total tips this year
  pacLimitExceeded: boolean;      // Whether limit is exceeded
  remainingPACLimit: number;      // Remaining amount available
}
```

**PAC Limit Rules**:
- PAC contributions are limited to $5,000 annually
- Only counts tips (not donations) from active celebrations
- Resets annually (calendar year)
- Filters out resolved, defunct, or paused celebrations

## Dependencies

- `FEC.COMPLIANCE_TIERS` - FEC tier configuration constants
- `getFECTierInfo()` - Utility function to get tier information
- `ComplianceTier` type from `@Contexts`

## Notes

- The hook uses `useMemo` for performance optimization
- All calculations are pure functions based on input parameters
- Promotion logic handles edge cases like employment status changes
- Server constants can override default FEC limits if provided
