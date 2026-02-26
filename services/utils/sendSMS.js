/**
 * @fileoverview SMS Notification Utility Module
 *
 * This module provides SMS notification functionality using Twilio. Currently
 * disabled to prevent SMS spam during testing, but can be enabled by
 * uncommenting the Twilio integration code.
 *
 * KEY FEATURES
 *
 * TWILIO INTEGRATION
 * - Sends SMS messages via Twilio API
 * - Requires Twilio account SID and auth token
 * - Sends to PHONE_NUMBER environment variable
 *
 * CURRENT STATUS
 * - Currently disabled (commented out)
 * - Logs debug message instead of sending SMS
 * - Prevents SMS spam during development/testing
 *
 * BUSINESS LOGIC
 *
 * SMS SENDING
 * - Creates Twilio client with SID and token
 * - Sends message to configured phone number
 * - Logs success with message SID
 * - Skips if Twilio not configured
 *
 * DEPENDENCIES
 * - path: Path manipulation
 * - services/logger: Logging
 * - dotenv: Environment variable loading (development)
 * - twilio: SMS sending (commented out)
 *
 * @module services/utils/sendSMS
 * @requires path
 * @requires ../logger
 * @requires dotenv
 */

const path = require('path');
const { requireLogger } = require('../logger');

const logger = requireLogger(__filename);
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env.local'),
  });
}

// const twilio = require('twilio');
// const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
// const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// const TO_SMS = process.env.PHONE_NUMBER;

async function sendSMS(body) {
  // Commented out during testing to avoid SMS spam
  // if (!TWILIO_SID) {
  //   logger.warn('Twilio not configured, skipping SMS');
  //   return;
  // }
  // const client = twilio(TWILIO_SID, TWILIO_TOKEN);
  // const result = await client.messages.create({
  //   to: TO_SMS,
  //   from: 'POWERBACK',
  //   body
  // });
  // logger.info(`SMS sent successfully: ${result.sid}`);
  logger.debug(`SMS would have sent: ${body}`);
}

module.exports = { sendSMS };
