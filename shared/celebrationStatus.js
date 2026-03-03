/**
 * @fileoverview Celebration status constants – single source of truth for status values
 *
 * Used by models/Celebration (current_status enum), services/celebration/statusService
 * (transitions), and client (export types, filters). Update here to keep backend and
 * frontend in sync.
 *
 * @module shared/celebrationStatus
 */

/** All valid celebration statuses (active + terminal/transition states) */
const CELEBRATION_STATUSES = Object.freeze([
  'active',
  'paused',
  'resolved',
  'defunct',
]);

/** Statuses that can appear in status_ledger as new_status (excludes 'active' for target lookups) */
const CELEBRATION_NON_ACTIVE_STATUSES = Object.freeze(
  CELEBRATION_STATUSES.filter((s) => s !== 'active')
);

module.exports = {
  CELEBRATION_STATUSES,
  CELEBRATION_NON_ACTIVE_STATUSES,
};
