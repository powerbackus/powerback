/**
 * @fileoverview Congress Services Module - Main Export
 *
 * This module serves as the central export point for all congressional and
 * election-related services in the POWERBACK application. It provides a clean
 * interface for importing congress services throughout the application.
 *
 * SERVICE CATEGORIES
 *
 * CONGRESSIONAL SESSION OPERATIONS
 * - CongressionalSessionService: Session management including current Congress,
 *   session numbers, session end dates, warning periods, and status logging
 *
 * ELECTION CYCLE OPERATIONS
 * - electionCycleService: Election cycle calculations including current year,
 *   calendar year checks, election cycle checks, election dates, resets, and
 *   donation limit validation
 *
 * ELECTION DATE NOTIFICATION OPERATIONS
 * - electionDateNotificationService: Election date change notifications including
 *   user notifications, impact calculations, and active celebration handling
 *
 * DEPENDENCIES
 * - ./sessionService: Congressional session management
 * - ./electionCycleService: Election cycle calculations
 * - ./electionDateNotificationService: Election date notifications
 *
 * @module services/congress
 * @requires ./sessionService
 * @requires ./electionCycleService
 * @requires ./electionDateNotificationService
 */

// Congressional session management
const CongressionalSessionService = require('./sessionService'),
  // Election cycle and date management
  { ...electionCycleService } = require('./electionCycleService'),
  // Election date change notifications
  {
    ...electionDateNotificationService
  } = require('./electionDateNotificationService');

module.exports = {
  CongressionalSessionService,
  ...electionDateNotificationService,
  ...electionCycleService,
};
