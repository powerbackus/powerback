/**
 * @fileoverview Celebration Status Service
 *
 * This service manages celebration status transitions and maintains detailed
 * status ledger for FEC compliance and audit trails. It provides comprehensive
 * tracking of all status changes with metadata, compliance information, and
 * audit trail data.
 *
 * STATUS LIFECYCLE
 *
 * Valid statuses: 'active', 'paused', 'resolved', 'defunct'
 *
 * Status Transitions:
 * - active → paused, resolved, defunct
 * - paused → active, defunct
 * - resolved → (terminal state)
 * - defunct → (terminal state)
 *
 * KEY FUNCTIONS
 *
 * changeStatus(celebration, newStatus, reason, options, CelebrationModel)
 * - Changes celebration status and records in ledger
 * - Validates status transition is allowed
 * - Updates legacy boolean flags for backward compatibility
 * - Creates detailed ledger entry with metadata
 *
 * validateStatusTransition(fromStatus, toStatus)
 * - Validates if status transition is allowed
 * - Returns validation result with error message if invalid
 *
 * getStatusHistory(celebration, limit)
 * - Returns status history summary for a celebration
 * - Includes recent changes, current status, and duration information
 *
 * calculateStatusDuration(celebration)
 * - Calculates how long celebration has been in current status
 * - Returns duration in days and total lifetime
 *
 * createInitialStatusEntry(celebration, CelebrationModel)
 * - Creates initial status entry for new celebrations
 * - Sets status to 'active' with creation metadata
 *
 * activateCelebration, pauseCelebration, resolveCelebration, makeDefunct
 * - Convenience methods for specific status transitions
 * - Include appropriate metadata for each status type
 *
 * getCelebrationsByStatus(status, CelebrationModel)
 * - Gets all celebrations with specified status
 *
 * getCelebrationsNeedingUpdates(CelebrationModel)
 * - Gets celebrations that need status updates (for batch processing)
 * - Returns active and paused celebrations
 *
 * BUSINESS LOGIC
 *
 * STATUS LEDGER
 * - Every status change is recorded in status_ledger array
 * - Includes: previous_status, new_status, change_datetime, reason
 * - Includes: triggered_by, triggered_by_id, triggered_by_name
 * - Includes: metadata (status-specific information)
 * - Includes: compliance_tier_at_time, fec_compliant
 * - Includes: audit_trail (ip_address, user_agent, session_id)
 *
 * LEGACY FLAG COMPATIBILITY
 * - Updates resolved, paused, defunct boolean flags
 * - Maintains backward compatibility with existing code
 * - current_status is the authoritative status field
 *
 * METADATA BY STATUS TYPE
 * - defunct: congressional_session information
 * - resolved: resolution_details (bill action info)
 * - paused: pause_details (reason, expected resume date)
 *
 * DEPENDENCIES
 * - nanoid: Unique ID generation for status change entries
 * - models/Celebration: Celebration model for database operations
 *
 * @module services/celebration/statusService
 * @requires nanoid
 * @requires ../utils/logger
 * @requires ../../models/Celebration
 */

const { nanoid } = require('nanoid');
const logger = require('../utils/logger')(__filename);
const {
  CELEBRATION_NON_ACTIVE_STATUSES,
} = require('../../shared/celebrationStatus');

class StatusService {
  /**
   * Valid status transitions (keys and values from shared/celebrationStatus)
   */
  static VALID_TRANSITIONS = {
    active: [...CELEBRATION_NON_ACTIVE_STATUSES],
    paused: ['active', 'defunct'],
    resolved: [], // Terminal state
    defunct: [], // Terminal state
  };

  /**
   * Change celebration status and record in ledger
   * @param {Object} celebration - Celebration document
   * @param {string} newStatus - New status to transition to
   * @param {string} reason - Reason for the status change
   * @param {Object} options - Additional options
   * @param {string} options.triggeredBy - Who/what triggered the change
   * @param {string} options.triggeredById - ID of the trigger
   * @param {string} options.triggeredByName - Human-readable name of trigger
   * @param {Object} options.metadata - Additional metadata for the status change
   * @param {Object} options.auditTrail - Audit trail information
   * @param {Object} CelebrationModel - Celebration model for database operations
   * @returns {Promise<Object>} Status change result
   */
  static async changeStatus(
    celebration,
    newStatus,
    reason,
    options = {},
    CelebrationModel,
  ) {
    try {
      const {
        triggeredByName = 'System',
        triggeredBy = 'system',
        triggeredById = null,
        auditTrail = {},
        metadata = {},
      } = options;

      const previousStatus = celebration.current_status;

      // Validate the status transition
      const validation = this.validateStatusTransition(
        previousStatus,
        newStatus,
      );
      if (!validation.isValid) {
        throw new Error(`Invalid status transition: ${validation.error}`);
      }

      // Create status change entry
      const statusChangeId = nanoid();
      const statusChangeEntry = {
        compliance_tier_at_time: celebration.donorInfo?.compliance || 'guest',
        triggered_by_name: triggeredByName,
        status_change_id: statusChangeId,
        triggered_by_id: triggeredById,
        previous_status: previousStatus,
        change_datetime: new Date(),
        triggered_by: triggeredBy,
        audit_trail: auditTrail,
        new_status: newStatus,
        fec_compliant: true,
        metadata,
        reason,
      };

      // Update celebration with new status and ledger entry
      const updateData = {
        current_status: newStatus,
        $push: { status_ledger: statusChangeEntry },
      };

      // Update legacy boolean flags for backward compatibility
      updateData.resolved = newStatus === 'resolved';
      updateData.paused = newStatus === 'paused';
      updateData.defunct = newStatus === 'defunct';

      // Add defunct-specific fields if transitioning to defunct
      if (newStatus === 'defunct') {
        updateData.defunct_date = new Date();
        updateData.defunct_reason = reason;
      }

      await CelebrationModel.findByIdAndUpdate(celebration._id, updateData);

      logger.info(
        `Status changed for celebration ${celebration._id}: ${previousStatus} → ${newStatus} (${reason})`,
      );

      return {
        success: true,
        statusChangeId,
        previousStatus,
        triggeredBy,
        newStatus,
        reason,
        changeDatetime: statusChangeEntry.change_datetime,
      };
    } catch (error) {
      logger.error('Error changing celebration status:', error);
      throw error;
    }
  }

  /**
   * Validate if a status transition is allowed
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {Object} Validation result
   */
  static validateStatusTransition(fromStatus, toStatus) {
    const validTransitions = this.VALID_TRANSITIONS[fromStatus] || [];

    if (!validTransitions.includes(toStatus)) {
      return {
        isValid: false,
        error: `Cannot transition from '${fromStatus}' to '${toStatus}'. Valid transitions: ${validTransitions.join(
          ', ',
        )}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get status history for a celebration
   * @param {Object} celebration - Celebration document
   * @param {number} limit - Number of recent changes to return
   * @returns {Object} Status history summary
   */
  static getStatusHistory(celebration, limit = 10) {
    const ledger = celebration.status_ledger || [];
    const recentChanges = ledger
      .sort((a, b) => new Date(b.change_datetime) - new Date(a.change_datetime))
      .slice(0, limit);

    const summary = {
      total_changes: ledger.length,
      recent_changes: recentChanges,
      current_status: celebration.current_status,
      status_duration: this.calculateStatusDuration(celebration),
    };

    return summary;
  }

  /**
   * Calculate how long celebration has been in current status
   * @param {Object} celebration - Celebration document
   * @returns {Object} Duration information
   */
  static calculateStatusDuration(celebration) {
    const ledger = celebration.status_ledger || [];
    if (ledger.length === 0) {
      return {
        current_status_duration_days: Math.floor(
          (new Date() - new Date(celebration.createdAt)) /
            (1000 * 60 * 60 * 24),
        ),
        total_lifetime_days: Math.floor(
          (new Date() - new Date(celebration.createdAt)) /
            (1000 * 60 * 60 * 24),
        ),
      };
    }

    const latestChange = ledger.sort(
      (a, b) => new Date(b.change_datetime) - new Date(a.change_datetime),
    )[0];

    return {
      current_status_duration_days: Math.floor(
        (new Date() - new Date(latestChange.change_datetime)) /
          (1000 * 60 * 60 * 24),
      ),
      total_lifetime_days: Math.floor(
        (new Date() - new Date(celebration.createdAt)) / (1000 * 60 * 60 * 24),
      ),
      last_change_date: latestChange.change_datetime,
    };
  }

  /**
   * Create initial status entry for new celebrations
   * @param {Object} celebration - New celebration document
   * @param {Object} CelebrationModel - Celebration model for database operations
   * @returns {Promise<Object>} Initial status entry result
   */
  static async createInitialStatusEntry(celebration, CelebrationModel) {
    try {
      const statusChangeId = nanoid();
      const initialEntry = {
        triggered_by_id: celebration.donatedBy?.toString(),
        compliance_tier_at_time: celebration.donorInfo?.compliance || 'guest',
        triggered_by_name: 'System - Creation',
        status_change_id: statusChangeId,
        reason: 'Celebration created',
        change_datetime: new Date(),
        previous_status: 'none',
        triggered_by: 'system',
        new_status: 'active',
        fec_compliant: true,
        audit_trail: {},
        metadata: {},
      };

      await CelebrationModel.findByIdAndUpdate(celebration._id, {
        current_status: 'active',
        $push: { status_ledger: initialEntry },
      });

      logger.info(
        `Created initial status entry for celebration ${celebration._id}`,
      );

      return {
        success: true,
        statusChangeId,
        status: 'active',
      };
    } catch (error) {
      logger.error('Error creating initial status entry:', error);
      throw error;
    }
  }

  /**
   * Transition celebration to active status (from paused)
   * @param {Object} celebration - Celebration document
   * @param {string} reason - Reason for activation
   * @param {Object} options - Additional options
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Object>} Activation result
   */
  static async activateCelebration(
    celebration,
    reason,
    options = {},
    CelebrationModel,
  ) {
    return this.changeStatus(
      celebration,
      'active',
      reason,
      {
        triggeredBy: 'system',
        triggeredByName: 'System - Activation',
        ...options,
      },
      CelebrationModel,
    );
  }

  /**
   * Transition celebration to paused status
   * @param {Object} celebration - Celebration document
   * @param {string} reason - Reason for pause
   * @param {Object} pauseDetails - Pause-specific details
   * @param {Object} options - Additional options
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Object>} Pause result
   */
  static async pauseCelebration(
    celebration,
    reason,
    pauseDetails = {},
    options = {},
    CelebrationModel,
  ) {
    return this.changeStatus(
      celebration,
      'paused',
      reason,
      {
        triggeredBy: 'system',
        triggeredByName: 'System - Pause',
        metadata: { pause_details: pauseDetails },
        ...options,
      },
      CelebrationModel,
    );
  }

  /**
   * Transition celebration to resolved status
   * @param {Object} celebration - Celebration document
   * @param {string} reason - Reason for resolution
   * @param {Object} resolutionDetails - Resolution-specific details
   * @param {Object} options - Additional options
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Object>} Resolution result
   */
  static async resolveCelebration(
    celebration,
    reason,
    resolutionDetails = {},
    options = {},
    CelebrationModel,
  ) {
    return this.changeStatus(
      celebration,
      'resolved',
      reason,
      {
        triggeredBy: 'system',
        triggeredByName: 'System - Resolution',
        metadata: { resolution_details: resolutionDetails },
        ...options,
      },
      CelebrationModel,
    );
  }

  /**
   * Transition celebration to defunct status
   * @param {Object} celebration - Celebration document
   * @param {string} reason - Reason for defunct status
   * @param {Object} congressionalSession - Congressional session details
   * @param {Object} options - Additional options
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Object>} Defunct result
   */
  static async makeDefunct(
    celebration,
    reason,
    congressionalSession = {},
    options = {},
    CelebrationModel,
  ) {
    return this.changeStatus(
      celebration,
      'defunct',
      reason,
      {
        triggeredBy: 'congressional_session',
        triggeredByName: 'Congressional Session End',
        metadata: { congressional_session: congressionalSession },
        ...options,
      },
      CelebrationModel,
    );
  }

  /**
   * Get celebrations by status
   * @param {string} status - Status to filter by
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Array>} Array of celebrations with specified status
   */
  static async getCelebrationsByStatus(status, CelebrationModel) {
    return CelebrationModel.find({ current_status: status });
  }

  /**
   * Get celebrations that need status updates (for batch processing)
   * @param {Object} CelebrationModel - Celebration model
   * @returns {Promise<Object>} Object with celebrations grouped by status
   */
  static async getCelebrationsNeedingUpdates(CelebrationModel) {
    const activeCelebrations = await CelebrationModel.find({
      current_status: 'active',
      resolved: false,
      defunct: false,
      paused: false,
      idempotencyKey: { $not: /^seed:/ },
    });

    const pausedCelebrations = await CelebrationModel.find({
      current_status: 'paused',
      resolved: false,
      defunct: false,
      idempotencyKey: { $not: /^seed:/ },
    });

    return {
      active: activeCelebrations,
      paused: pausedCelebrations,
    };
  }
}

module.exports = StatusService;
