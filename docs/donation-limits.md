# Donation Limit Reset System

This document describes the donation limit system that implements annual and election cycle resets for FEC compliance.

## Overview

The donation limit system supports two types of resets:

1. **Annual Resets** (guest tier): Reset at midnight EST on December 31st/January 1st
2. **Election Cycle Resets** (compliant tier): Reset based on state-specific primary and general election dates

## FEC Compliance Tiers

### Guest Tier

- **Per-donation limit**: $50
- **Annual cap**: $200 across all candidates
- **Reset type**: Annual (midnight EST on Dec 31st/Jan 1st)
- **Requirements**: Basic account (no additional info beyond login)

### Compliant Tier

- **Per-candidate per-election limit**: $3,500 per candidate per election
- **Reset type**: Election cycle (state-specific primary/general election dates)
- **Requirements**: Name, address, occupation, and employer provided

## Implementation Details

### Recent Improvements

The compliance system has undergone significant refactoring to improve maintainability and user experience:

#### 1. Simplified Component Architecture

- **Before**: Complex logic with multiple boolean flags and convoluted conditional rendering
- **After**: Clean, focused components with clear separation of concerns

#### 2. Centralized Business Logic

- **useComplianceCaps Hook**: Centralizes complex compliance cap calculation logic
- **Tier Ratchet Logic**: Ensures users can only promote, never demote compliance tiers
- **Employment Status Changes**: Handles promotion indicators when employment status changes

#### 3. Improved User Experience

- **Visual Indicators**: Clear distinction between current (warning color) and next (green color) values
- **Promotion Arrows**: Shows when promotion is available with clear visual feedback
- **Contextual Messages**: Provides guidance based on user's current tier and potential

#### 4. Escrowed Donations Fix (Latest)

- **Issue**: Escrowed donations (resolved: false) were not being counted toward FEC compliance limits
- **Fix**: Updated both frontend and backend to count all donations (including escrowed ones) toward limits
- **Rationale**: FEC considers donations as "made" when money is committed, not when released from escrow
- **Impact**: Ensures accurate remaining limit calculations and prevents over-limit donations

#### 5. Component Structure

```
Compliance/
├── Compliance.tsx          # Main component (UI logic)
├── cap/
│   ├── Cap.tsx            # Individual cap display
│   └── index.js           # Export
├── style.css              # Styling
└── index.js               # Export
```

### Server-Side Components

#### 1. FEC Constants (`constants/fec.js`)

```javascript
FEC: {
  COMPLIANCE_TIERS: {
    get COMPLIANCE_TIERS() {
      return {
        guest: {
          perDonationLimit: 50,
          annualCap: 200,
          resetType: 'annual',
          resetTime: 'midnight_est',
        },
        compliant: {
          perDonationLimit: 3500,
          perElectionLimit: 3500,
          resetType: 'election_cycle',
          resetTime: 'election_date',
        },
      };
    },
  },
  ELECTION_CYCLE: {
    // Election cycle configuration
  }
}
```

#### 2. Election Cycle Service (`services/congress/electionCycleService.js`)

Handles the complex logic for:

- Annual reset detection (midnight EST)
- Election date fetching from OpenFEC API
- Fallback to default election dates
- Limit calculation with reset considerations

#### 3. Compliance Validation (`controller/users/account/utils/reckon.js`)

- Validation uses the election cycle service
- Falls back to project constants when external APIs are unavailable
- Supports both annual and election cycle resets

#### 4. Updated Payment Route (`routes/api/payments.js`)

- Uses compliance validation
- Fetches politician state for compliant tier validation
- Logs validation source (API vs constants fallback)

### Client-Side Components

#### 1. Compliance Display Components

**Main Compliance Component** (`client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/Compliance.tsx`)

- Displays user's current FEC compliance tier and promotion options
- Shows donation limits based on compliance tier (guest: $50/$200, compliant: $3,500 per candidate per election)
- Handles promotion button logic and contextual messages
- Implements tier ratchet behavior (can only promote, never demote)

**Cap Subcomponent** (`client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/cap/Cap.tsx`)

- Displays individual compliance limits with labels and formatted currency values
- Handles promotion indicators (arrows, color changes) and dynamic styling
- Shows current values in warning color, next values in green when promotion available

**useComplianceCaps Hook** (`client/src/hooks/compliance/useComplianceCaps.ts`)

- Centralizes complex compliance cap calculation logic
- Determines current and next tier values based on FEC rules
- Handles promotion eligibility and visual indicators
- Manages different display logic for guest vs compliant tiers

**Frontend remaining limit** (`client/src/utils/limits.ts`)

- `computeRemainingDonationLimit(tierInfo, userCompliance, currentAnnualTotal, currentElectionTotal)` returns the maximum allowed donation for the next contribution (guest: min of per-donation and remaining annual cap; compliant: min of per-donation and remaining election limit).
- Funnel and limit modal use this so remaining-limit math is centralized and aligned with backend.

#### 2. Compliance Tier Context (`client/src/contexts/ComplianceTierContext.tsx`)

- Manages compliance tier state and information
- Provides tier comparison and effective tier calculation
- Handles FEC compliance information for tiers
- Manages tier transition logic and ratchet behavior

#### 3. Form Compliance Hook (`client/src/hooks/forms/useFormCompliance.ts`)

- Calculates potential compliance tier based on form completion
- Determines what tier user could achieve with current form data
- Handles employment status changes and promotion to the compliant tier when eligible
- Separate from actual user compliance tier (managed by context)

#### 4. Legacy Client Limit Hooks (removed)

The legacy client-side limit hooks (`useLowerTierLimit`, `useHighestTierLimit`) from the pre–guest/compliant refactor have been removed from the codebase. Their behavior has been fully replaced by `DonationLimitsContext` and backend election-cycle services. See git history if you need their historical implementation.

#### 5. Updated Constants (`client/src/constants/constants.ts`)

- Mirrors server-side FEC constants structure
- Includes election cycle configuration
- Default election dates for all states

## Annual Reset Logic

### Guest Tier

Annual resets occur at **midnight EST on December 31st/January 1st**:

```javascript
function shouldAnnualReset(date) {
  const estOffset = -5; // EST is UTC-5
  const estDate = new Date(date.getTime() + estOffset * 60 * 60 * 1000);

  const month = estDate.getUTCMonth();
  const day = estDate.getUTCDate();
  const hour = estDate.getUTCHours();

  // December 31st at or after midnight EST, or January 1st before midnight EST
  return (
    (month === 11 && day === 31 && hour >= 0) ||
    (month === 0 && day === 1 && hour < 24)
  );
}
```

### Reset Behavior

- **Before reset**: Calculate remaining limit based on current calendar year donations
- **After reset**: Reset to full annual cap ($200 for guest tier)
- **Next reset**: January 1st of the following year

## Election Cycle Reset Logic

### Compliant Tier

Election cycle resets are based on state-specific election dates:

1. **Primary Election**: First reset point
2. **General Election**: Second reset point
3. **Next Cycle**: After general election, move to next election cycle

### Election Date Sources

1. **Primary**: OpenFEC API (`/elections/` endpoint)
2. **Fallback**: Default dates in constants
3. [Removed] Do not use fabricated generic dates. When dates are unknown, rely on snapshot/constants and conservative server validation.

### Reset Behavior

- **Before primary**: Calculate limit based on donations before primary election
- **Between primary and general**: Calculate limit based on donations before general election
- **After general**: Move to next election cycle

## Promotion Logic and User Experience

### Tier Ratchet System

The compliance system implements a **tier ratchet** where compliance tiers can only go up, never down:

- **Ratchet Behavior**: Once a user achieves a higher compliance tier, they cannot lose it even if they remove information from their profile form
- **Effective Tier**: The system always displays the higher of the user's current tier and form-calculated tier
- **Promotion Only**: Promotion buttons and indicators only appear when the form compliance is higher than the user's current compliance

### Promotion Detection

The system detects promotion opportunities through multiple mechanisms:

1. **Direct Promotion**: `formCompliance > userCompliance`
2. **Employment Status Change**: User switches employment to "YES" with empty occupation/employer fields
3. **Profile completion**: Guest users can promote to compliant tier when all required fields are provided

### Visual Indicators

- **Current values**: Always warning color (`.warning-limit`) - "this is what you have now"
- **Next values**: Green color (`.dollar-limit`) when promotion available - "this is what you'll get"
- **Promotion arrow**: Shows when `showPromotion && hasValueChange && isPromotable`

### Button Behavior

- **Show button**: When promotion possible AND form valid AND user not already at compliant tier
- **Hide button**: When no promotion possible OR after successful promotion
- **Contextual messages**: Show guidance when button not available

### Example Scenarios

1. **User at compliant tier, removes some profile fields**: UI still shows compliant-tier limits (ratchet behavior)
2. **User at guest tier, adds required address and employment info**: UI shows promotion to compliant tier
3. **User at compliant tier, temporarily clears occupation/employer**: UI still shows compliant-tier limits (no demotion)

## API Integration

### OpenFEC API

```javascript
// Example API call
const url = 'https://api.open.fec.gov/v1/elections/';
const params = {
  state: 'CA',
  election_year: 2026,
  office: 'H', // House elections
  api_key: process.env.FEC_API_KEY,
};
```

### Required Environment Variables

```bash
FEC_API_KEY=your_fec_api_key_here
```

## Fallback Mechanisms

### When API is Unavailable

1. Use default election dates from constants
2. Log warning about API failure
3. Continue with fallback dates
4. Maintain system functionality

### When State is Unknown

1. Do not invent election dates
2. Log warning about unknown state and continue with available constants
3. Provide conservative server-side validation only

## Monitoring and Logging

### Logging

The system includes comprehensive logging for:

- API successes and failures
- Reset calculations
- Validation method used (enhanced vs legacy)
- Election date updates

On the **client side**, React contexts and hooks that surface limit information (`ComplianceTierContext`, `DonationLimitsContext`, `ElectionCycleContext`, `useComplianceCaps`, `useFormCompliance`) use the shared client logging helper (`logError` / `logWarn` from `@Utils`) rather than raw `console.error` / `console.warn`. This ensures development has full diagnostics, while production logs only high-level messages and never include raw `error.response` payloads or other sensitive data.

### Example Log Entries

```
INFO: Compliance check succeeded for user123
INFO: Election dates updated for CA: { primary: '2026-03-05', general: '2026-11-05' }
WARN: Using fallback dates for unknown state
ERROR: FEC API key not configured, using fallback validation
```

## Testing

### Annual Reset Testing

```javascript
// Test annual reset detection
const newYearsEve = new Date('2026-12-31T05:00:00Z'); // Midnight EST
const newYearsDay = new Date('2027-01-01T05:00:00Z'); // Midnight EST
const regularDay = new Date('2026-06-15T12:00:00Z');

shouldAnnualReset(newYearsEve); // true
shouldAnnualReset(newYearsDay); // true
shouldAnnualReset(regularDay); // false
```

### Election Cycle Testing

```javascript
// Test election cycle calculations
const beforePrimary = new Date('2026-02-01');
const betweenElections = new Date('2026-08-01');
const afterGeneral = new Date('2026-12-01');

// Should calculate limits based on appropriate election date
```

## Migration Status

### ✅ Migration Complete

The migration from legacy FEC validation to enhanced compliance system has been completed:

1. **Legacy Structures Removed**:
   - `FEC.LIMIT_INDICES` removed
   - `FEC.LIMITS` object removed
   - Deprecated `wouldExceedLimits` and `getLimitInfo` functions removed

2. **Enhanced System Active**:
   - All code now uses `FEC.COMPLIANCE_TIERS` with proper function-based limits
   - Election cycle resets for the compliant tier implemented
   - Annual resets for the guest tier implemented
   - Dynamic election date handling active

3. **Validation Methods**:
   - Frontend: `DonationLimitsContext` for all validation
   - Backend: `services/congress/electionCycleService.js` for enhanced validation
   - Fallback mechanisms in place for API failures

## Future Enhancements

### Planned Features

1. **Database Storage**: Store election dates in database for faster access
2. **Real-time Updates**: WebSocket updates for election date changes (WIP: [feat/real-time-celebration-notifications](https://github.com/powerbackus/powerback/tree/feat/real-time-celebration-notifications))
3. **Advanced Analytics**: Track reset patterns and user behavior
4. **Multi-cycle Support**: Support for multiple election cycles simultaneously

### API Improvements

1. **Caching**: Cache election dates to reduce API calls
2. **Batch Processing**: Fetch multiple states in single API call
3. **Error Recovery**: Automatic retry mechanisms for failed API calls

## Troubleshooting

### Common Issues

#### 1. API Key Not Configured

**Symptoms**: All election date fetches fail
**Solution**: Set `FEC_API_KEY` environment variable in your backend `.env` file

#### 2. Unknown State

**Symptoms**: Missing or unknown election dates
**Solution**: Verify politician state data in database; ensure snapshot/constants are present

#### 3. Timezone Issues

**Symptoms**: Annual resets not triggering correctly
**Solution**: Verify EST offset calculation (-5 hours from UTC)

#### 4. Fallback Validation

**Symptoms**: Legacy validation used instead of enhanced
**Solution**: Check logs for API failures or configuration issues

### Debug Commands

```javascript
// Manual trigger for election dates update
const { triggerElectionDatesUpdate } = require('./jobs/electionDatesUpdater');
await triggerElectionDatesUpdate();

// Test enhanced compliance validation
const {
  checkEnhancedCompliance,
} = require('./controller/users/account/utils/reckon');
const isValid = await checkEnhancedCompliance(
  donations,
  'compliant',
  100,
  'pol123',
  'CA'
);
```

## Support

For questions or issues with the donation limit reset system:

1. Check the logs for error messages
2. Verify environment variable configuration
3. Test with known election dates
4. Review API documentation for OpenFEC

The system is designed to be robust with multiple fallback mechanisms to ensure compliance validation continues even when external services are unavailable.

## Related Documentation

- [FEC Compliance Guide](./fec-compliance-guide.md) - Comprehensive FEC compliance
- [Donor Validation](./donor-validation-comprehensive.md) - Donor information validation
- [Election Dates](./election-dates.md) - Election date notifications
- [Background Jobs](./background-jobs.md) - Election dates updater job
- [Payment Processing](./payment-processing.md) - Payment flow integration
- [API Documentation](./API.md) - API endpoints
