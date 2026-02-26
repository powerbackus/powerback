/**
 * @fileoverview FEC Compliance Hooks Module
 *
 * This module provides hooks for FEC compliance tier limit calculations and
 * PAC (Political Action Committee) tip limit tracking. These hooks handle
 * the complex business logic for determining donation limits based on user
 * compliance tiers and form completion status.
 *
 * KEY HOOKS
 *
 * useComplianceCaps(serverConstants, formCompliance, userCompliance, contactInfo)
 * - Calculates compliance cap configurations for display
 * - Shows current tier limits vs. potential tier limits
 * - Handles promotion scenarios and employment status changes
 * - Returns array of ComplianceCap objects
 *
 * usePACLimitData(donations)
 * - Calculates PAC tip limit information
 * - Tracks current year PAC contributions
 * - Determines if PAC limit is exceeded
 * - Returns remaining PAC limit amount
 *
 * BUSINESS LOGIC
 *
 * COMPLIANCE CAPS
 * - Bronze/Silver: Per-donation limit and annual cap
 * - Gold: Per-candidate per-election limit
 * - Promotion arrows show potential tier increases
 * - Hides caps if user can promote to Gold
 *
 * PAC LIMITS
 * - $5,000 annual limit for tips
 * - Calendar year based (Jan 1 - Dec 31)
 * - Only counts resolved, non-defunct, non-paused celebrations
 *
 * DEPENDENCIES
 * - ./useComplianceCaps: Compliance cap and PAC limit calculations
 *
 * @module hooks/compliance
 * @requires ./useComplianceCaps
 */

export {
  usePACLimitData,
  useComplianceCaps,
  type ComplianceCap,
} from './useComplianceCaps';
