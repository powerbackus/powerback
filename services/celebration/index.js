/**
 * @fileoverview Celebration Services Module - Main Export
 *
 * This module serves as the central export point for all celebration-related
 * services in the POWERBACK application. It provides a clean interface for
 * importing celebration services throughout the application.
 *
 * SERVICE CATEGORIES
 *
 * DATA OPERATIONS
 * - dataService: Celebration data operations including has_stakes updates,
 *   district lookups, user queries, and celebration cancellation
 *
 * EMAIL OPERATIONS
 * - emailService: Celebration-related emails including celebration emails,
 *   PAC limit emails, and receipt emails
 *
 * ORCHESTRATION OPERATIONS
 * - orchestrationService: Main celebration creation flow coordinating
 *   validation, data operations, and email sending
 *
 * STATUS MANAGEMENT
 * - statusService: Celebration status transitions including initial status
 *   creation, status changes, history, queries, and status-specific operations
 *
 * DEFUNCT LIFECYCLE
 * - defunctService: Defunct celebration lifecycle including conversion,
 *   warning emails, notifications, and automatic conversion checks
 *
 * DEPENDENCIES
 * - ./dataService: Data operations
 * - ./emailService: Email operations
 * - ./statusService: Status management
 * - ./defunctService: Defunct lifecycle
 * - ./orchestrationService: Orchestration operations *
 *
 * @module services/celebration
 * @requires ./dataService
 * @requires ./emailService
 * @requires ./statusService
 * @requires ./defunctService
 * @requires ./orchestrationService *
 */

// handles celebration data operations
const { getTotalActiveDonationsForBill } = require('./dataService');
// coordinates the main celebration flow
const { createCelebration } = require('./orchestrationService');
const DefunctCelebrationService = require('./defunctService');
// handles celebration-related emails
const { ...emailServices } = require('./emailService');
// handles celebration data operations
const { ...dataServices } = require('./dataService');
// handles celebration status transitions
const StatusService = require('./statusService');

module.exports = {
  DefunctCelebrationService,
  StatusService,
  ...dataServices,
  ...emailServices,
  createCelebration,
  getTotalActiveDonationsForBill,
};
