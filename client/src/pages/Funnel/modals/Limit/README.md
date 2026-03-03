# Limit Modal

## Overview

The Limit modal displays FEC compliance limit information when users attempt to exceed their donation or tip limits. It provides clear explanations of which limit was exceeded and guidance on how to increase limits by completing profile information.

## Purpose

This modal serves as a critical compliance communication tool that:
- Explains FEC donation limits when exceeded
- Handles both donation limits and PAC tip limits
- Provides guidance on increasing limits through profile completion
- Displays FEC citations with interactive footnote highlighting
- Automatically adjusts donation/tip amounts when acknowledged

## Component Structure

```
Limit/
├── Limit.tsx              # Main modal component
├── useLimitModal.ts       # Business logic hook
├── useFootnoteGlow.ts     # Footnote hover effect hook
├── style.css              # Modal styling
└── index.js               # Export
```

## Limit Types

### Donation Limits

Based on FEC compliance tiers (see `FEC.COMPLIANCE_TIERS`):

- **guest**: Per-donation limit and annual cap (e.g. $50 per donation, $200 annual)
- **compliant**: Per-candidate per-election limit (e.g. $3,500; primary and general separate)

### PAC Tip Limits

- **Annual limit**: $5,000 per year
- **Applies to**: Tips only (not donations)
- **Reset**: Calendar year

## Component Props

```typescript
type LimitProps = {
  message: string;                    // Custom message to display
  isPACLimit?: boolean;               // Whether this is a PAC limit violation
  attemptedAmount?: number;           // Amount user tried to donate/tip
  currentAnnualTotal?: number;        // Current annual total (guest tier)
  currentElectionTotal?: number;      // Current election total (compliant tier)
};
```

Additional props from `Props` (e.g. from Funnel): `setActiveKey` is used by the profile link to open the Account modal on the Profile pane (`setActiveKey('Profile')`).

## Usage

### Basic Donation Limit Modal

```tsx
import LimitModal from '@Pages/Funnel/modals/Limit';

<LimitModal
  message="You've reached your annual donation limit."
  attemptedAmount={250}
  currentAnnualTotal={200}
/>
```

### PAC Limit Modal

```tsx
<LimitModal
  isPACLimit={true}
  attemptedAmount={100}
  currentAnnualTotal={4950}
/>
```

### Via Dialogue Context

The modal is typically shown through the Dialogue context:

```typescript
const { setShowModal, modalData } = useDialogue();

// Show donation limit modal
setShowModal((s) => ({
  ...s,
  limit: true,
}));

// Show PAC limit modal with data
setShowModal((s) => ({
  ...s,
  limit: true,
  pacLimit: {
    pacLimit: 5000,
    currentPACTotal: 4950,
    remainingPACLimit: 50,
    attemptedAmount: 100,
  },
}));
```

## Key Features

### 1. Automatic Amount Adjustment

When the user clicks "Agree", the modal automatically adjusts amounts:

- **Donation limits**: Sets donation to the per-donation limit for user's tier
- **PAC limits**: Sets tip to the remaining PAC limit

```typescript
const handleClickAgree = () => {
  if (isActuallyPACLimit) {
    setTip(pacLimitData.remainingPACLimit);
  } else {
    const tierInfo = FEC.COMPLIANCE_TIERS[userCompliance];
    setDonation(tierInfo.perDonationLimit());
  }
  // Close modal
};
```

### 2. Interactive Footnotes

The modal displays FEC citations with hover effects:

- Footnotes glow when hovered
- Citations link to FEC documentation
- Multiple citations sorted by marker number; context-aware filtering
- **Donation limit**: Superscript 1 after the limits sentence; superscript 2 after the remaining-limit sentence (when two citations apply). Footer lists all citations with markers and URIs.

### 3. Context-Aware Messaging

The modal adapts its message based on:

- **User compliance tier**: Different limits for guest vs compliant
- **Limit type**: Donation vs PAC limit
- **Compliance status**: Anonymous vs identified users (`hasMinimalCompliance`)
- **Promotion potential**: Guidance on increasing limits (profile CTA when not compliant)

### 4. Profile Promotion CTA

For guest-tier users (no minimal compliance), the modal includes a call-to-action under the Agree button:

- Text: "Complete your **profile** to donate up to $X." (X = compliant tier per-donation limit)
- The word "profile" is a link that opens the Account modal and switches to the Profile pane (`setActiveKey('Profile')`), so the user can complete profile to unlock higher limits
- Requires `setActiveKey` from props (passed from App via Page/Funnel)

## Custom Hooks

### useLimitModal

Extracts business logic from the component:

```typescript
const {
  limitInfo,           // Detailed limit information
  complianceInfo,     // Compliance tier info
  userCompliance,     // Current tier
  hasMinimalCompliance // Whether user has minimal compliance
} = useLimitModal({
  attemptedAmount,
  currentElectionTotal,
  currentAnnualTotal,
});
```

**Purpose**: Separates calculation logic from presentation logic

### useFootnoteGlow

Manages footnote hover effects:

```typescript
const {
  glowingFootnotes,    // State object with glow classes
  handleMouseEvent      // Mouse event handler
} = useFootnoteGlow();
```

**Note**: The component uses a reducer pattern instead of this hook for more flexibility with dynamic citations.

## Limit Information Calculation

The modal uses `useDonationLimits` context to determine which limit was hit:

```typescript
const { getLimitInfo } = useDonationLimits();

const limitInfo = getLimitInfo(
  attemptedAmount,
  currentAnnualTotal,
  currentElectionTotal
);
```

Returns:
- `amount: number` - The limit amount
- `scope: string` - The limit scope (e.g., "per donation", "per candidate, per election")
- `type: string` - The limit type

## FEC Citations

Citations are gathered from multiple sources:

1. **Tier-specific citations** from `ComplianceTierContext`
2. **Global citations** from `getGlobalCitations()`
3. **Filtered by context** using `shouldShowCitation()`
4. **Sorted by marker** number

Citations are displayed in the footer with:
- Superscript markers that link to FEC documentation
- Descriptions explaining the citation
- Hover effects for better UX

## Styling and Modal Behavior

The modal uses:
- **StyledModal** with `footerClosesOnClick={false}`: footer is content-only (citations list), not focusable, and does not close the modal on click/Enter/Space. A focus trap keeps Tab/Shift+Tab inside the modal; only **Escape** or **Agree** closes it.
- Bootstrap components (`StyledModal`, `ListGroup`)
- Custom CSS classes for dollar amounts, citations, and footnotes
- Responsive design for mobile and desktop
- Glow effects for interactive footnotes

## Integration Points

### Contexts Used

- `useDialogue` - Modal state and data
- `useDonationState` - Donation/tip amount setters
- `useComplianceTier` - User compliance tier and citations
- `useDonationLimits` - Limit calculation functions

### Props from Parent (Funnel)

- `setActiveKey` - Used by the "profile" link to open the Account modal on the Profile pane

### Constants Used

- `FEC.COMPLIANCE_TIERS` - Tier limit definitions
- `FEC.PAC_ANNUAL_LIMIT` - PAC limit constant ($5,000)
- `CELEBRATE_COPY.LIMIT_MODAL` - Copy text for modal content

## Edge Cases

### PAC Limit Detection

The modal checks both the `isPACLimit` prop and `modalData.pacLimit`:

```typescript
const isActuallyPACLimit = isPACLimit || !!modalData.pacLimit;
```

This allows PAC limit modals to be triggered either:
- Directly via prop (legacy pattern)
- Via context with data (preferred pattern)

### Empty Citations

If no citations are available for the context, the footnote section is still rendered but empty.

### Compliant Tier Users

Compliant-tier users see different messaging:
- No profile promotion CTA (already at maximum tier)
- Per-election limit messaging instead of annual cap
- Different limit scope explanation

## Related Documentation

- FEC compliance rules: `docs/donation-limits.md`
- Compliance component: `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/README.md`
- Donation limits context: `docs/contexts.md`
