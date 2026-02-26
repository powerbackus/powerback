/**
 * @fileoverview Communications Controller Module
 *
 * This module provides controller functions for email communications and
 * user subscription management. It handles email sending with proper
 * authentication, unsubscribe link injection, and batch filtering of
 * unsubscribed users.
 *
 * KEY FUNCTIONS
 *
 * EMAIL SENDING
 * - sendEmail: Sends emails using nodemailer with address-specific credentials
 * - Supports multiple email addresses with separate authentication
 * - Automatically injects unsubscribe links for topic-based emails
 * - Handles email template execution and rendering
 *
 * UNSUBSCRIBE MANAGEMENT
 * - filterUnsubscribed: Batch filters users who have unsubscribed from topics
 * - isUnsubscribed: Checks if single user is unsubscribed from topic
 * - Respects user email preferences from settings.unsubscribedFrom
 *
 * BUSINESS LOGIC
 *
 * EMAIL ADDRESSES
 * - Multiple email addresses with separate credentials
 * - Address-specific authentication for security
 * - Fallback to default credentials in development
 * - Transporter caching for performance
 *
 * UNSUBSCRIBE SYSTEM
 * - Topic-based unsubscription (e.g., 'election_updates', 'celebration_updates')
 * - Batch filtering for efficient email sending
 * - Fail-open behavior if database unavailable
 * - Automatic unsubscribe link injection in emails
 *
 * EMAIL TEMPLATES
 * - Templates return [fromIndex, subject, html, topic?]
 * - Topic parameter triggers unsubscribe link injection
 * - FEC compliance disclaimers included in templates
 *
 * DEPENDENCIES
 * - ./sendEmail: Email sending with nodemailer
 * - ./filterUnsubscribed: Unsubscribe filtering
 * - ./addresses: Email address configuration
 * - nodemailer: Email transport
 *
 * @module controller/comms
 * @requires ./sendEmail
 * @requires ./filterUnsubscribed
 * @requires ./addresses
 * @requires nodemailer
 */

const { sendEmail } = require('./sendEmail');
const { filterUnsubscribed, isUnsubscribed } = require('./filterUnsubscribed');
const { submitContributing } = require('./submitContributing');

module.exports = {
  sendEmail,
  filterUnsubscribed,
  isUnsubscribed,
  submitContributing,
};
