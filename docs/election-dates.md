# Election Date Change Notifications

This document describes the automated notification system for election date changes that affect POWERBACK users.

## Overview

When election dates change in a state, the system automatically identifies and notifies users who may be affected by these changes. The notification system serves two types of users:

1. **Users with Active Celebrations** - Users who have made donations to politicians in the affected state
2. **Users with Residential Address** - Users who have provided a validated address in the affected state

## Notification Triggers

Notifications are sent when:

- Election dates are updated in the `electionDates.snapshot.json` file
- The `electionDatesUpdater.js` job detects changes in primary or general election dates
- Changes are significant enough to potentially affect donation limits or timing

## User Categories

### 1. Users with Active Celebrations

**Criteria:**

- Have active Celebrations (not resolved, defunct, or paused)
- Celebrations are for politicians in the affected state
- Have a valid email address

**Notification Type:** `ElectionDateChanged`

- High priority email (priority: 5)
- Includes detailed impact analysis
- Shows specific changes to donation limits
- Provides actionable next steps

**Impact Analysis:**

- Calculates how election date changes affect compliant-tier election-cycle donation limits
- Determines if donation limits have increased or decreased
- Identifies any election timeline changes that affect reset timing

### 2. Users with Residential Address

**Criteria:**

- Have a validated `ocd_id` in the affected state
- Have a valid email address
- Do NOT have active Celebrations in the state (to avoid duplicate notifications)

**Notification Type:** `ElectionDateNotification`

- Medium priority email (priority: 3)
- Informational notification about election date changes
- Invites users to visit POWERBACK to learn more
- Focuses on engagement rather than specific impact

## Email Templates

### ElectionDateChanged Template

**Subject:** `Important: Election Dates Changed in [STATE] - Your Celebrations May Be Affected`

**Content includes:**

- Detailed comparison table of old vs new dates
- Specific impact description for the user
- Changes to donation limits (if applicable)
- Actionable next steps
- Link to Account section

### ElectionDateNotification Template

**Subject:** `Election Dates Updated in [STATE] - Stay Informed with POWERBACK`

**Content includes:**

- Updated election schedule table
- Explanation of why election dates matter
- Invitation to visit POWERBACK
- Educational content about political engagement

## Technical Implementation

### Files Involved

1. **`services/electionDateNotificationService.js`**
   - Main service for handling notifications
   - User discovery and impact calculation
   - Email sending coordination

2. **`controller/comms/emails/alerts/ElectionDateChanged.js`**
   - Email templates for both notification types
   - HTML formatting and styling

3. **`jobs/electionDatesUpdater.js`**
   - Integration point for triggering notifications
   - Detects changes and calls notification service

### Key Functions

#### `handleElectionDateChange(state, oldDates, newDates)`

Main function that orchestrates the notification process:

1. Finds users with active Celebrations in the state
2. Finds users with ocd_id in the state (excluding those already notified)
3. Calculates impact for each user
4. Sends appropriate notifications
5. Returns summary statistics

#### `calculateElectionDateImpact(user, state, oldDates, newDates)`

Analyzes how election date changes affect a specific user:

- Only applies to compliant-tier users (election cycle limits)
- Calculates old vs new donation limits
- Determines if any election date changes affect reset timing
- Returns impact description and limit changes

#### `findUsersWithActiveCelebrations(state)`

Discovers users who have active Celebrations in the affected state:

1. Finds all politicians in the state with `has_stakes: true`
2. Finds active Celebrations for those politicians
3. Returns unique users with valid email addresses

#### `findUsersWithOcdIdInState(state)`

Discovers users with residential addresses in the affected state:

1. Uses regex pattern to match ocd_id for the state
2. Filters for users with valid email addresses
3. Excludes users already notified via Celebrations

## Notification Flow

```
electionDatesUpdater.js
    ↓ (detects changes)
saveElectionDatesToSnapshot()
    ↓ (identifies changed states)
handleElectionDateChange()
    ↓ (for each changed state)
├── findUsersWithActiveCelebrations()
├── findUsersWithOcdIdInState()
├── calculateElectionDateImpact()
└── sendEmail() (via sendEmail service)
```

## Logging and Monitoring

The system provides comprehensive logging:

- **Change Detection:** Logs which states have election date changes
- **User Discovery:** Logs how many users are found in each category
- **Impact Analysis:** Logs which users are affected and why
- **Email Sending:** Logs successful and failed email attempts
- **Summary Statistics:** Logs total emails sent per state

On the **frontend**, election-cycle–aware contexts such as `ElectionCycleContext` and donation-limit views use the shared client logging helper (`logError` / `logWarn` from `@Utils`) to report fallback scenarios (for example, when generic dates are used because a state is missing precise data) and calculation failures. In production these logs are message-only; full error objects and stacks are restricted to development to avoid leaking request/response details to user-visible consoles.

### Example Log Output

```
INFO: Election date changes detected (2):
INFO:   Updated CA: 2026-03-05/2026-11-05 → 2026-03-08/2026-11-05
INFO:   Updated TX: 2026-03-05/2026-11-05 → 2026-03-01/2026-11-05
INFO: Sending notifications for 2 states with changes
INFO: Found 15 users with active Celebrations in CA
INFO: Found 8 users with ocd_id in CA
INFO: Sent election date change notification to user@example.com
INFO: Election date change notifications completed: 23 emails sent across 2 states
```

## Error Handling

The system includes robust error handling:

- **Database Errors:** Graceful fallback if user queries fail
- **Email Failures:** Individual email failures don't stop the process
- **Impact Calculation Errors:** Users without impact analysis still receive basic notifications
- **Service Failures:** Logs errors but continues processing other states

## Configuration

### Environment Variables Required

- `PROD_URL` - Base URL for POWERBACK (server config)
- `PHONE_NUMBER` - Support phone number (server config)
- `REACT_APP_EMAIL_SUPPORT_USER` - Support email address (shared; see [Environment Management](./environment-management.md#shared-react_app_-variables))
- Email configuration (SMTP settings: `EMAIL_HOST`, `EMAIL_JONATHAN_USER`, etc.)

### Database Requirements

- `User` collection with `email`, `firstName`, `compliance`, `ocd_id` fields
- `Celebration` collection with `donatedBy`, `pol_id`, `resolved`, `defunct`, `paused` fields
- `Pol` collection with `id`, `roles.state`, `has_stakes` fields

## Testing

To test the notification system:

1. **Manual Trigger:** Call `electionDateNotificationService.handleElectionDateChange()` with test data
2. **Integration Test:** Modify election dates in snapshot and run `electionDatesUpdater.js`
3. **Email Testing:** Use test email addresses to verify template rendering

## Future Enhancements

Potential improvements to consider:

- **SMS Notifications:** Add SMS alerts for critical changes
- **Preference Settings:** Allow users to opt out of certain notification types
- **Impact Scoring:** More sophisticated impact analysis algorithms
- **Batch Processing:** Process multiple states more efficiently
- **Analytics:** Track notification effectiveness and user engagement

## Related Documentation

- [Background Jobs](./background-jobs.md) - Election dates updater job
- [Donation Limits](./donation-limits.md) - Election cycle resets for compliant tier
- [Email System](./email-system.md) - Notification emails
- [FEC Compliance Guide](./fec-compliance-guide.md) - Compliance requirements
