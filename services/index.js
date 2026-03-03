/**
 * @fileoverview Services Module - Main Export
 *
 * This module serves as the central export point for all service modules
 * in the POWERBACK application. It consolidates services from all domains
 * (celebration, congress, user, utils) into a single importable interface.
 *
 * SERVICE CATEGORIES
 *
 * CELEBRATION SERVICES
 * - Orchestration, validation, data, email, status, defunct, notification
 *
 * CONGRESS SERVICES
 * - Election cycle, election date notification, session management
 *
 * USER SERVICES
 * - Donor validation, user promotion, user district
 *
 * UTILS SERVICES
 * - Logger, database, cookies, CSRF, rate limiting, audit logging,
 *   error responses, docking manager, name formatting, SMS
 *
 * DEPENDENCIES
 * - ./celebration: Celebration services
 * - ./congress: Congress services
 * - ./utils: Utility services
 * - ./user: User services
 *
 * @module services
 * @requires ./celebration
 * @requires ./congress
 * @requires ./utils
 * @requires ./user
 */

const { ...celebrationServices } = require('./celebration'),
  { ...congressServices } = require('./congress'),
  { ...utilsServices } = require('./utils'),
  { ...userServices } = require('./user');

module.exports = {
  ...celebrationServices,
  ...congressServices,
  ...utilsServices,
  ...userServices,
};
