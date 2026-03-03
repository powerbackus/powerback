# Spec: Backend Compliance and Limits

## Purpose

Define server-side compliance behavior, legal limits, reset logic, and authority.

## Scope

- In-scope: Tier definitions, limits, resets, validation, fallbacks, logging
- Out-of-scope: Stripe integration details, client UI gates (handled in frontend spec)

## Requirements

- Tiers: guest (anonymous) and compliant (full compliance). Do not use term "enhanced".
- Compliant limit is per-candidate per-election (not aggregate across all candidates).
- Legal amounts from backend constants; compliant = $3,500 per candidate per election.
- Server is authoritative; it may block donations if validation cannot be ensured.
- Timezone: Eastern (Washington, D.C.) for all reset calculations.

## Inputs / Outputs

- Inputs: user donations, compliance tier, politician/state (for compliant-tier checks), current election dates snapshot, backend constants.
- Outputs: remaining limit, effective limit, reset date(s), accept/reject validation result.

## Interfaces & Contracts

- services/electionCycleService.js
  - getEffectiveLimits(tier, donations, polId?, state?) → { effectiveLimit, remainingLimit, resetDate, nextResetDate }
  - validateDonationLimits(tier, donations, attemptedAmount, polId?, state?) → boolean
  - getElectionDates(state, electionYear?) → { primary: string|null, general: string }
- controller/users/account/utils (promotion, compliance upgrades)
- routes/api/payments.js (server-side validation before payment processing)

## Logic & Invariants

- Guest tier: annual cap across all candidates; resets at year boundary (EST).
- Compliant tier: election-cycle resets based on state primary/general dates.
  - Primary may be null; general must resolve (statutory general if snapshot missing).
  - Donations counted per candidate within the active election window.
- Election dates sourcing:
  - Prefer snapshot on disk; fallback to default constants; never fabricate arbitrary dates.
  - If both are missing for a state, compute statutory general date only and leave primary null.
- API outage or missing data:
  - Rely on project constants/snapshot; if validation cannot be ensured, reject on server and log reason.
- Logging: use services/logger; include source (snapshot/constants), state, and decision path.

## Acceptance Checks

- Guest: end-of-year (EST) zeroes annual total; remainingLimit reflects current-year donations only.
- Compliant: remainingLimit decreases by total donations to the specific candidate before the current boundary (primary or general as applicable).
- Missing primary still produces a valid general-boundary calculation; missing both causes conservative rejection server-side.
- Validation uses backend constants for legal amounts; client inputs are not trusted.

## PAC Limit System

- **Annual Limit**: $5,000 per user per calendar year for tips (PAC contributions)
- **Validation**: Enforced during celebration creation in routes/api/celebrations.js
- **Field Management**: tipLimitReached field acts as ratchet (once true, stays true until annual reset)
- **Authority**: Backend is authoritative for PAC limit enforcement
- **Integration**: Works alongside existing compliance tiers (guest/compliant)
- **Webhook Optimization**: Users with tipLimitReached: true skip webhook processing for performance

## Employment Status Validation

- **Form vs. Data State**: Form defaults `isEmployed: true` for UI toggle; database defaults `isEmployed: false` for business logic
- **Compliant Tier Requirements**: When `isEmployed: true`, both `occupation` and `employer` fields are required
- **Validation Logic**: Empty occupation/employer only allowed when `isEmployed: false`
- **FEC Compliance**: Accurate employment information required for all donations
- **Error Handling**: Missing employment fields flagged as non-compliant with meaningful `originalValue`

## Links

- Rules: 03-backend-authority-and-compliance, 04-election-dates-policy, 09-logging-and-privacy, 40-pac-limit-system, 41-employment-status-validation
- Code: services/electionCycleService.js, routes/api/payments.js, routes/api/celebrations.js, services/donorValidation.js
- Related: specs/pac-limit-system.md

## Service Architecture

### Service Layer Organization

```
services/
├── celebration/
│   ├── dataService.js            # Donation data queries and lookups
│   ├── validationService.js      # FEC compliance and PAC limit validation
│   ├── emailService.js           # Email notifications and receipts
│   ├── orchestrationService.js   # Main celebration flow coordination
│   └── notificationService.js    # User notifications and alerts
├── congressionalSessionService.js # Congressional data integration
├── cookies.js                     # Cookie management utilities
├── db.js                          # Database connection and operations
├── defunctCelebrationService.js   # Celebration lifecycle management
├── electionCycleService.js        # FEC compliance and limits
├── electionDateNotificationService.js # Election date change notifications
├── fixPolName.js                  # Politician name normalization
├── logger.js                      # Structured logging service
├── promoteUser.js                 # User privilege management
├── sendSMS.js                     # SMS notification service
├── statusService.js               # System status and health
└── userDistrict.js                # User district management
```

### Authentication Layer Organization

```
auth/
├── authbase.js                    # Base authentication class with JWT management
├── tokenizer.js                   # Concrete authentication implementation
└── tokenStore.js                  # In-memory token store for refresh tokens
```

### Service Design Patterns

- **Single Responsibility**: Each service handles one domain area
- **Dependency Injection**: Services receive dependencies as parameters
- **Error Handling**: Consistent error patterns across all services
- **Logging**: Structured logging with context using services/logger
- **Validation**: Input validation before processing

### Background Job Architecture

```
jobs/
├── challengersWatcher.js          # Congressional challenger monitoring
├── defunctCelebrationWatcher.js   # Celebration lifecycle monitoring
├── electionDatesUpdater.js        # Election date synchronization
├── houseWatcher.js                # House member monitoring
├── runWatchers.js                 # Job orchestration
└── snapshotManager.js             # Data snapshot management
```

### Job Scheduling Strategy

- **Election Updates**: Odd years monthly, even years weekly
- **Congressional Data**: Daily at 3 PM EST
- **API Rate Limits**: Respect external API limits (Congress.gov, OpenFEC)
- **Snapshot Management**: Local caching with fallback strategies
