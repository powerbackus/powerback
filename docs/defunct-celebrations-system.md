# Defunct Celebrations System

## Overview

The Defunct Celebrations System automatically handles the conversion of active Celebrations to defunct status when Congressional sessions end. This ensures that users' political donations are not lost when bills fail to reach the House floor for a vote. Celebrations are non-refundable, but the system is working to expand service beyond the single issue of Citizens United.

## Key Concepts

### Congressional Session End

- Congressional sessions have defined start and end dates
- When a session ends, any bills that haven't been brought to the House floor become inactive
- This means the conditions for Celebrations can no longer be met
- All unresolved Celebrations from that session become "defunct"

### Celebration status constants

- Valid status values (`active`, `paused`, `resolved`, `defunct`) are defined in `shared/celebrationStatus.js`. The Celebration model and status service use this shared module. See [Status Ledger System](./status-ledger-system.md).

### Backend Defunct Handling (Internal)

- Defunct Celebrations are automatically marked when Congressional sessions end
- The original donation amount never moves to campaigns when conditions are not met
- Status changes are tracked in a detailed ledger for compliance purposes

## System Components

### 1. Congressional Session Service (`services/congress/sessionService.js`)

- Fetches actual session end dates from Congress.gov API
- Handles "sine die" adjournments and early session endings
- Falls back to constitutional defaults if API unavailable
- Provides session information for email templates

### 2. Defunct Celebration Service (`services/celebration/defunctService.js`)

- Converts active Celebrations to defunct status
- Records status transitions and congressional session metadata
- Sends notification emails to users

### 3. Defunct Celebration Watcher (`jobs/defunctCelebrationWatcher.js`)

- Scheduled job that runs daily to check session status
- Triggers conversion and email notifications when needed
- Provides manual trigger functions for testing

### 4. Email Templates

- **Warning Email** (`DefunctCelebrationWarning.js`): Sent 1 month before session ends
- **Notification Email** (`DefunctCelebrationNotification.js`): Sent when Celebrations become defunct

## Workflow

### 1. Warning Period (1 Month Before Session End)

- System detects we're within 1 month of session end
- Sends warning emails to users with active Celebrations
- Explains what will happen to unresolved Celebrations at session end
- Sets expectations for the upcoming conversion

### 2. Session End Processing

- System detects Congressional session has ended
- Finds all active, unresolved, non-paused Celebrations
- Converts them to defunct status with reason and date
- Creates detailed status ledger entries for compliance
- Sends notification emails with conversion details

### 3. User Communication

- Users are notified that Celebrations are non-refundable
- Users are informed that the system is working to expand service beyond the current focus

## Email Notifications

### Warning Email (1 Month Before)

**Purpose**: Set expectations about session end
**Content**:

- Congressional session ending soon
- Number of active Celebrations affected
- Explanation of what "defunct" means
- Non-refundable policy information
- Next general election date
- Call to review current Celebrations

### Defunct Notification Email (Immediate)

**Purpose**: Notify of conversion and explain policy
**Content**:

- Congressional session has ended
- Acknowledgment of disappointment
- Non-refundable policy explanation
- Detailed table of defunct Celebrations
- Information about future service expansion
- Next election opportunity

## Database Schema Changes

### Celebration Model

```javascript
// New fields added
defunct_date: { type: Date },
defunct_reason: { type: String },
```

### User Model

```javascript
// No additional fields required for defunct handling
```

## API Endpoints

### Manual Triggers (Administrative)

The system includes manual trigger functions in the watcher for testing and administrative purposes:

- `defunctCelebrationWatcher.manualTrigger()` - Check and process if needed
- `defunctCelebrationWatcher.forceConversion()` - Force conversion
- `defunctCelebrationWatcher.forceWarningEmails()` - Force warning emails

## Configuration

### Job Scheduling

The defunct celebration watcher should be scheduled to run daily:

```javascript
// Example cron schedule
'0 2 * * *'; // Daily at 2 AM
```

### Warning Period

Currently set to 1 month before session end. This can be adjusted in `CongressionalSessionService.isInWarningPeriod()`.

### Congress.gov API Integration

The system requires a `CONGRESS_GOV_API_KEY` environment variable to fetch actual session end dates. Without the API key, the system falls back to constitutional default dates (January 3rd of odd years).

## Monitoring and Logging

### Key Log Events

- Session status changes
- Warning email batches sent
- Defunct conversion batches processed
- Email delivery status

### Metrics to Track

- Number of active Celebrations by session
- Warning emails sent per session
- Defunct conversions per session

## Compliance Features

### FEC Compliance

- All defunct conversions are logged with detailed information
- Original donor information preserved in Celebration records
- No refunds issued - funds never move to campaigns when conditions are not met

### Audit Trail

- Each defunct conversion creates a status ledger entry
- Includes original celebration details
- Tracks compliance tier at time of donation
- Maintains FEC-compliant transaction history

## User Experience

### In-App Indicators

- Defunct Celebrations clearly marked in Celebrations panel
- Clear distinction between active and defunct Celebrations

## Testing

### Manual Testing

```javascript
// Trigger manual check
const watcher = require('./jobs/defunctCelebrationWatcher');
await watcher.manualTrigger();

// Force conversion for testing
await watcher.forceConversion();

// Force warning emails for testing
await watcher.forceWarningEmails();
```

### Test Scenarios

1. **Warning Period**: Verify warning emails sent 1 month before session end
2. **Session End**: Verify conversion happens immediately when session ends
3. **Email Delivery**: Verify both warning and notification emails sent with correct policy language
4. **Status Ledger Entries**: Verify detailed status history created
5. **User Communication**: Verify emails match FAQ language about non-refundable policy

## Future Enhancements

### Potential Improvements

- Configurable warning period length
- Multiple warning emails at different intervals
- Advanced analytics on defunct conversion patterns
- Integration with election cycle notifications

### UI Enhancements (Future)

- Defunct celebration filtering options

## Troubleshooting

### Common Issues

1. **Emails not sent**: Check email service configuration
2. **Session detection wrong**: Check Congressional session calculation
3. **Job not running**: Verify cron schedule and job registration

### Debug Commands

```javascript
// Check session status
const sessionInfo = CongressionalSessionService.getSessionInfo();
console.log(sessionInfo);

// Check active celebrations (current_status from shared/celebrationStatus.js)
const active = await Celebration.find({ current_status: 'active' });
console.log(`Active celebrations: ${active.length}`);
```

## Security Considerations

### Data Protection

- User email addresses protected during batch processing
- Ledger entries cannot be modified after creation
- All operations logged for audit purposes

### Rate Limiting

- Email sending rate limited to prevent spam
- Batch processing limited to prevent system overload
- Manual triggers require administrative access

## Related Documentation

- [Email System](./email-system.md) - Email notifications and templates
- [Background Jobs](./background-jobs.md) - Job system and watchers
- [Status Ledger System](./status-ledger-system.md) - Status tracking
- [Election Date Notifications](./election-dates.md) - Election date changes
