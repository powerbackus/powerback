# Spec: Jobs and Notifications

## Purpose
Define background job cadence and election-date change notifications.

## Scope
- In-scope: electionDatesUpdater cadence, diffs, email notifications
- Out-of-scope: SMTP provider details

## Requirements
- electionDatesUpdater: odd years monthly; even years weekly; API page cap 100
- Other jobs daily at 3 PM EST
- Notifications to users with active celebrations and users with ocd_id (excluding duplicates)

## Inputs / Outputs
- Inputs: OpenFEC data, snapshots, DB state
- Outputs: Snapshot updates, email sends, logs

## Interfaces & Contracts
- jobs/electionDatesUpdater.js, services/electionDateNotificationService.js
- controller/comms/sendEmail.js

## Logic & Invariants
- Use statutory general date; do not fabricate dates
- Only notify on diffs; log counts and success/failure (no PII)

## Acceptance Checks
- States with changes produce emails; unchanged states do not
- No duplicate emails to the same user from both categories

## Links
- Rules: 05-jobs-and-scheduling, 19-election-date-notifications, 06-email-policy

