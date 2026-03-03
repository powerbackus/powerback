# Status Ledger System for Celebrations

## Overview

The Status Ledger System provides comprehensive tracking of all status changes to Celebrations, creating a complete audit trail for FEC compliance and regulatory reporting. This system replaces the simple boolean flags (`paused`, `resolved`, `defunct`) with a detailed ledger that captures every state transition with full metadata and compliance information.

## Key Features

### **Complete Audit Trail**

- Every status change is permanently recorded with timestamps
- Full metadata for each transition including reasons and triggers
- Compliance tier tracking at time of each change
- FEC compliance validation for all status changes

### **Status constants (single source of truth)**

- All valid status values are defined in `shared/celebrationStatus.js` (`CELEBRATION_STATUSES`, `CELEBRATION_NON_ACTIVE_STATUSES`).
- The Celebration model (`current_status` enum), `services/celebration/statusService.js` (VALID_TRANSITIONS), and the client (`client/src/constants/celebrationStatus.ts`) import from this shared module. Update status values only there to keep backend and frontend in sync.

### **Status State Machine**

- Enforces valid status transitions
- Prevents invalid state changes
- Maintains data integrity and consistency
- Supports complex workflow scenarios

### **Compliance and Regulatory Support**

- Detailed audit trail for FEC reporting
- Complete donor information preservation
- Metadata for congressional session tracking
- Administrative oversight capabilities

## Status Types

### **1. `active`**

- **Description**: Celebration is active and waiting for condition to be met
- **Valid Transitions**: `paused`, `resolved`, `defunct`
- **Typical Triggers**: User donation, system creation, pause reversal

### **2. `paused`**

- **Description**: Celebration is temporarily suspended
- **Valid Transitions**: `active`, `defunct`
- **Typical Triggers**: Bill status changes, administrative action

### **3. `resolved`**

- **Description**: Condition met, funds released to politician
- **Valid Transitions**: None (terminal state)
- **Typical Triggers**: Bill brought to vote, condition satisfied

### **4. `defunct`**

- **Description**: Congressional session ended without condition being met
- **Valid Transitions**: None (terminal state)
- **Typical Triggers**: Session end

## Database Schema

### **Celebration Model Status Fields**

```javascript
// Current status for easy querying (enum values from shared/celebrationStatus.js)
current_status: {
  type: String,
  enum: ['active', 'paused', 'resolved', 'defunct'],
  default: 'active',
  required: true,
},

// Detailed status ledger for compliance and audit purposes
status_ledger: {
  type: [{
    // Status change details
    status_change_id: { type: String, required: true },
    previous_status: { type: String, required: true },
    new_status: { type: String, required: true },
    change_datetime: { type: Date, required: true, default: Date.now },
    reason: { type: String, required: true },

    // Trigger information
    triggered_by: {
      type: String,
      required: true,
      enum: ['system', 'admin', 'user', 'api', 'congressional_session'],
    },
    triggered_by_id: { type: String },
    triggered_by_name: { type: String },

    // Metadata for specific status changes
    metadata: {
      // For defunct status
      congressional_session: {
        session_number: { type: String },
        session_end_date: { type: Date },
        session_type: { type: String },
      },
      // For resolved status
      resolution_details: {
        bill_action_date: { type: Date },
        bill_action_type: { type: String },
        bill_action_result: { type: String },
        house_vote_date: { type: Date },
        senate_vote_date: { type: Date },
      },
      // For paused status
      pause_details: {
        pause_reason: { type: String },
        expected_resume_date: { type: Date },
        related_bill_status: { type: String },
      },
      // For admin actions
      admin_notes: { type: String },
      admin_reason: { type: String },
    },

    // Compliance and audit fields
    compliance_tier_at_time: { type: String, required: true },
    fec_compliant: { type: Boolean, default: true },
    audit_trail: {
      ip_address: { type: String },
      user_agent: { type: String },
      session_id: { type: String },
    },
  }],
  default: [],
}
```

## Service Layer

### **StatusService Class**

The `StatusService` provides comprehensive methods for managing celebration status:

#### **Core Status Management**

```javascript
// Change status with full audit trail
await StatusService.changeStatus(
  celebration,
  newStatus,
  reason,
  options,
  CelebrationModel
);

// Validate status transitions
const validation = StatusService.validateStatusTransition(fromStatus, toStatus);

// Get status history
const history = StatusService.getStatusHistory(celebration, limit);
```

#### **Convenience Methods**

```javascript
// Activate celebration
await StatusService.activateCelebration(
  celebration,
  reason,
  options,
  CelebrationModel
);

// Pause celebration
await StatusService.pauseCelebration(
  celebration,
  reason,
  pauseDetails,
  options,
  CelebrationModel
);

// Resolve celebration
await StatusService.resolveCelebration(
  celebration,
  reason,
  resolutionDetails,
  options,
  CelebrationModel
);

// Make defunct
await StatusService.makeDefunct(
  celebration,
  reason,
  congressionalSession,
  options,
  CelebrationModel
);
```

#### **Query Methods**

```javascript
// Get celebrations by status
const activeCelebrations = await StatusService.getCelebrationsByStatus(
  'active',
  CelebrationModel
);

// Get celebrations needing updates
const needsUpdates =
  await StatusService.getCelebrationsNeedingUpdates(CelebrationModel);
```

## Usage Examples

### **Creating a New Celebration**

```javascript
// Create celebration (handled by existing logic)
const celebration = await Celebration.create(celebrationData);

// Add initial status entry
await StatusService.createInitialStatusEntry(celebration, Celebration);
```

### **Resuming a Paused Celebration**

```javascript
const celebration = await Celebration.findById(celebrationId);

await StatusService.activateCelebration(
  celebration,
  'Bill reintroduced and celebration resumed',
  {
    triggeredBy: 'system',
    triggeredByName: 'Bill Tracking System',
  },
  Celebration
);
```

### **Pausing a Celebration**

```javascript
const celebration = await Celebration.findById(celebrationId);

await StatusService.pauseCelebration(
  celebration,
  'Bill withdrawn from consideration',
  {
    pause_reason: 'Bill H.R. 1234 withdrawn by sponsor',
    related_bill_status: 'withdrawn',
  },
  {
    triggeredBy: 'api',
    triggeredByName: 'Congress.gov API',
  },
  Celebration
);
```

### **Resolving a Celebration**

```javascript
const celebration = await Celebration.findById(celebrationId);

await StatusService.resolveCelebration(
  celebration,
  'Bill brought to House floor for vote',
  {
    bill_action_date: new Date('2026-01-15'),
    bill_action_type: 'house_vote',
    bill_action_result: 'passed',
    house_vote_date: new Date('2026-01-15'),
  },
  {
    triggeredBy: 'api',
    triggeredByName: 'Congress.gov API',
  },
  Celebration
);
```

### **Making a Celebration Defunct**

```javascript
const celebration = await Celebration.findById(celebrationId);
const sessionInfo = await CongressionalSessionService.getSessionInfo();

await StatusService.makeDefunct(
  celebration,
  'Congressional session ended without action on target bill',
  {
    session_number: sessionInfo.sessionNumber,
    session_end_date: sessionInfo.sessionEndDate,
    session_type: sessionInfo.sessionType,
  },
  {
    triggeredBy: 'congressional_session',
    triggeredByName: 'Session End Watcher',
  },
  Celebration
);
```

## FEC Compliance Features

### **Audit Trail Requirements**

- **Complete Status History**: Every status change is recorded with full details
- **Donor Information Preservation**: Original donor information preserved throughout lifecycle
- **Compliance Tier Tracking**: User's compliance tier recorded at time of each change
- **FEC Compliance Flag**: Each change marked for FEC compliance status

### **Compliance Validation**

- Status transitions maintain proper donation lifecycle
- All changes include proper donor identification
- Audit trail supports regulatory reporting requirements
- Status history enables compliance verification

### **Regulatory Reporting**

- Complete status timeline for each celebration
- Metadata for congressional session tracking
- Administrative action logging
- Donor compliance tier history

## Integration with Existing Systems

### **Backward Compatibility**

- Legacy boolean flags (`paused`, `resolved`, `defunct`) maintained for compatibility
- Existing queries continue to work
- Gradual migration path for existing code

### **Defunct Celebration Integration**

- StatusService integrated with DefunctCelebrationService
- Proper status transitions during session end processing
- Complete audit trail for defunct conversions

## Monitoring and Analytics

### **Status Distribution**

```javascript
// Get count of celebrations by status
const statusCounts = await Celebration.aggregate([
  { $group: { _id: '$current_status', count: { $sum: 1 } } },
]);
```

### **Status Transition Analytics**

```javascript
// Analyze status transition patterns
const transitions = await Celebration.aggregate([
  { $unwind: '$status_ledger' },
  {
    $group: {
      _id: {
        from: '$status_ledger.previous_status',
        to: '$status_ledger.new_status',
      },
      count: { $sum: 1 },
    },
  },
]);
```

### **Compliance Monitoring**

```javascript
// Monitor FEC compliance across status changes
const complianceStatus = await Celebration.aggregate([
  { $unwind: '$status_ledger' },
  {
    $group: {
      _id: '$status_ledger.fec_compliant',
      count: { $sum: 1 },
    },
  },
]);
```

## Migration Strategy

### **Phase 1: Schema Update**

- Add `current_status` and `status_ledger` fields to Celebration model
- Maintain backward compatibility with boolean flags
- Create migration script for existing celebrations

### **Phase 2: Service Integration**

- Integrate StatusService with existing celebration creation
- Update DefunctCelebrationService to use StatusService
- Add status transitions to existing workflows

### **Phase 3: Full Migration**

- Update all celebration status changes to use StatusService
- Remove dependency on boolean flags
- Complete audit trail for all celebrations

## Future Enhancements

### **Advanced Analytics**

- Status transition pattern analysis
- Time-in-status analytics
- Compliance trend monitoring
- Performance metrics

### **Enhanced Metadata**

- Bill tracking integration
- Congressional session details
- Administrative action logging
- User interaction tracking

### **API Enhancements**

- Status change webhooks
- Real-time status notifications (WIP: [feat/real-time-celebration-notifications](https://github.com/powerbackus/powerback/tree/feat/real-time-celebration-notifications))
- Bulk status operations
- Advanced querying capabilities

## Troubleshooting

### **Common Issues**

1. **Invalid Status Transitions**: Check StatusService.VALID_TRANSITIONS (derived from `shared/celebrationStatus.js`)
2. **Missing Ledger Entries**: Verify StatusService.changeStatus() calls
3. **Compliance Issues**: Review compliance_tier_at_time and fec_compliant fields
4. **Migration Errors**: Check migration script logs and data integrity

### **Debug Commands**

```javascript
// Check status distribution
const statuses = await Celebration.distinct('current_status');

// Verify ledger entries
const withLedger = await Celebration.find({
  'status_ledger.0': { $exists: true },
});

// Check for missing status fields
const missingStatus = await Celebration.find({
  current_status: { $exists: false },
});
```

## Conclusion

The Status Ledger System provides a robust foundation for celebration lifecycle management with comprehensive audit trails for FEC compliance. The system maintains backward compatibility while enabling advanced tracking and regulatory reporting capabilities.

## Related Documentation

- [Defunct Celebrations System](./defunct-celebrations-system.md) - Defunct status conversion
- [Celebration API](./API.md) - Celebration endpoints
- [FEC Compliance Guide](./fec-compliance-guide.md) - Compliance requirements
- [Background Jobs](./background-jobs.md) - Jobs that update status
