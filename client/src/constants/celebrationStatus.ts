/**
 * Celebration status constants and types – re-exported from shared (single source of truth).
 * Backend: models/Celebration, services/celebration/statusService use shared/celebrationStatus.js
 *
 * @module client/src/constants/celebrationStatus
 */

import { celebrationStatus } from '@Shared';

const CELEBRATION_STATUSES_ARR = celebrationStatus.CELEBRATION_STATUSES;
const CELEBRATION_NON_ACTIVE_STATUSES_ARR =
  celebrationStatus.CELEBRATION_NON_ACTIVE_STATUSES;

/** All valid celebration statuses (active + terminal/transition states). Matches backend enum. */
export const CELEBRATION_STATUSES = CELEBRATION_STATUSES_ARR as readonly [
  'active',
  'paused',
  'resolved',
  'defunct',
];

/** Statuses that can appear in status_ledger as new_status (excludes 'active'). */
export const CELEBRATION_NON_ACTIVE_STATUSES =
  CELEBRATION_NON_ACTIVE_STATUSES_ARR as readonly [
    'paused',
    'resolved',
    'defunct',
  ];

/** Current celebration status – matches models/Celebration current_status enum. */
export type CelebrationStatus = (typeof CELEBRATION_STATUSES)[number];

/** Ledger target status (non-active) for getStatusDate and similar. */
export type CelebrationTargetStatus =
  (typeof CELEBRATION_NON_ACTIVE_STATUSES)[number];
