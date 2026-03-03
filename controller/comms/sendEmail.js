/**
 * @fileoverview Email Sending Controller
 *
 * This module handles email sending using nodemailer with support for multiple
 * email addresses, address-specific authentication, unsubscribe link injection,
 * and transporter caching for performance. It provides the core email sending
 * functionality for the POWERBACK application.
 *
 * KEY FUNCTIONS
 *
 * sendEmail(to, template, ...args)
 * - Main email sending function
 * - Executes email template and sends via nodemailer
 * - Automatically injects unsubscribe links for topic-based emails
 * - Uses address-specific transporters for authentication
 *
 * getTransporter(addressIndex)
 * - Gets or creates nodemailer transporter for specific email address
 * - Caches transporters per address for performance
 * - Handles credential lookup and configuration
 *
 * getCredentialsForAddress(addressIndex)
 * - Gets credentials for specific email address index
 * - Supports address-specific credentials in production
 * - Falls back to default credentials in development
 *
 * BUSINESS LOGIC
 *
 * EMAIL ADDRESSES
 * - Multiple email addresses with separate SMTP credentials
 * - Address indices: 0=info-noreply, 1=account-security-noreply, 2=jonathan,
 *   3=alerts-noreply, 4=error-reporter, 5=outreach, 6=support
 * - Address-specific credentials: EMAIL_{ADDRESS_NAME}_USER/PASS
 * - Fallback to EMAIL_JONATHAN_USER/EMAIL_JONATHAN_PASS if specific credentials not set
 *
 * TRANSPORTER CACHING
 * - Transporters cached per address index for performance
 * - Cache cleared if credentials become invalid
 * - Prevents repeated transporter creation
 *
 * UNSUBSCRIBE LINK INJECTION
 * - Automatically injects unsubscribe links for topic-based emails
 * - Links generated using user's unsubscribe hash
 * - Respects MongoDB connection status (fails gracefully)
 * - Replaces <!-- UNSUBSCRIBE_LINK_PLACEHOLDER --> in HTML
 *
 * EMAIL TEMPLATES
 * - Templates return [fromIndex, subject, html, topic?]
 * - Topic parameter triggers unsubscribe link injection
 * - Templates include FEC compliance disclaimers
 *
 * DEPENDENCIES
 * - nodemailer: Email transport library
 * - ./addresses: Email address configuration
 * - ../users/account/utils/unsubscribe: Unsubscribe hash generation
 * - models/User: User model for unsubscribe link generation
 * - constants: Email topic constants
 *
 * @module controller/comms/sendEmail
 * @requires nodemailer
 * @requires ./addresses
 * @requires ../users/account/utils/unsubscribe
 * @requires ../../models/User
 * @requires ../../constants
 * @requires ../../shared/emailTopics
 */

const path = require('path');

const nodemailer = require('nodemailer'),
  logger = require('../../services/utils/logger')(__filename),
  { emailTopics } = require('../../constants'),
  { getEmailAddress } = require('./addresses');
// Map address indices to environment variable names for credentials
// Format: EMAIL_{ADDRESS_NAME}_USER and EMAIL_{ADDRESS_NAME}_PASS
// Falls back to EMAIL_JONATHAN_USER/EMAIL_JONATHAN_PASS if specific credentials not set
const ADDRESS_CREDENTIAL_MAP = {
  0: 'info-noreply', // info-noreply@powerback.us
  1: 'account-security-noreply', // account-security-noreply@powerback.us
  2: 'jonathan', // jonathan@powerback.us
  3: 'alerts-noreply', // alerts-noreply@powerback.us
  4: 'error-reporter', // error-reporter@powerback.us
  5: 'outreach', // outreach@powerback.us
  6: 'support', // support@powerback.us
};

/**
 * Get credentials for a specific email address index
 *
 * In development: Falls back to default EMAIL_JONATHAN_USER/EMAIL_JONATHAN_PASS if specific credentials not set.
 * This allows contributors to use a single set of credentials for all addresses.
 *
 * In production: Use address-specific credentials for better security.
 * Set EMAIL_{ADDRESS_NAME}_USER and EMAIL_{ADDRESS_NAME}_PASS for each address.
 *
 * @param {number} addressIndex - Index of the email address
 * @returns {Object} Credentials object with user and pass
 */
const getCredentialsForAddress = (addressIndex) => {
  logger.debug(
    `getCredentialsForAddress called - addressIndex: ${addressIndex}, NODE_ENV: ${process.env.NODE_ENV}`
  );

  // In development, allow using single credentials for all addresses
  // Set EMAIL_USE_SINGLE_CREDENTIALS=true to force using default for all addresses
  const useSingleCredentials =
    process.env.NODE_ENV !== 'production' &&
    process.env.EMAIL_USE_SINGLE_CREDENTIALS === 'true';

  logger.debug(
    `useSingleCredentials check - NODE_ENV !== 'production': ${
      process.env.NODE_ENV !== 'production'
    }, EMAIL_USE_SINGLE_CREDENTIALS: ${
      process.env.EMAIL_USE_SINGLE_CREDENTIALS
    }, result: ${useSingleCredentials}`
  );

  if (useSingleCredentials) {
    logger.debug(
      `Using single credentials mode - EMAIL_JONATHAN_USER: ${
        process.env.EMAIL_JONATHAN_USER || '(not set)'
      }, EMAIL_JONATHAN_PASS: ${
        process.env.EMAIL_JONATHAN_PASS
          ? '(set, length: ' + process.env.EMAIL_JONATHAN_PASS.length + ')'
          : '(not set)'
      }`
    );
    return {
      user: process.env.EMAIL_JONATHAN_USER,
      pass: process.env.EMAIL_JONATHAN_PASS,
    };
  }

  const addressName = ADDRESS_CREDENTIAL_MAP[addressIndex];
  logger.debug(
    `Address name lookup - addressIndex: ${addressIndex}, addressName: ${
      addressName || '(not found)'
    }`
  );

  if (addressName) {
    const envUserKey = `EMAIL_${addressName
      .toUpperCase()
      .replace(/-/g, '_')}_USER`;
    const envPassKey = `EMAIL_${addressName
      .toUpperCase()
      .replace(/-/g, '_')}_PASS`;

    logger.debug(
      `Looking for specific credentials - envUserKey: ${envUserKey}, envPassKey: ${envPassKey}`
    );
    logger.debug(
      `process.env has ${envUserKey}: ${
        envUserKey in process.env
      }, has ${envPassKey}: ${envPassKey in process.env}`
    );

    const specificUser = process.env[envUserKey];
    const specificPass = process.env[envPassKey];

    logger.debug(
      `Specific credentials check - specificUser: ${
        specificUser || '(not set)'
      }${
        specificUser ? ' (length: ' + specificUser.length + ')' : ''
      }, specificPass: ${
        specificPass
          ? '(set, length: ' + specificPass.length + ')'
          : '(not set)'
      }${specificPass === '' ? ' [EMPTY STRING DETECTED]' : ''}`
    );

    // If both specific credentials exist, use them
    if (specificUser && specificPass) {
      logger.debug(
        `Using specific credentials for ${addressName} - user: ${specificUser}, pass: (set, length: ${specificPass.length})`
      );
      return { user: specificUser, pass: specificPass };
    } else {
      logger.debug(
        `Specific credentials not found for ${addressName} - user: ${
          specificUser ? '(set)' : '(not set)'
        }, pass: ${specificPass ? '(set)' : '(not set)'}`
      );
    }
  } else {
    logger.debug(
      `No address name found for index ${addressIndex}, will fall back to default credentials`
    );
  }

  // Fall back to default credentials (works in both dev and prod if specific not set)
  logger.debug(`Falling back to default EMAIL_JONATHAN_USER/EMAIL_JONATHAN_PASS credentials`);
  const defaultUser = process.env.EMAIL_JONATHAN_USER;
  const defaultPass = process.env.EMAIL_JONATHAN_PASS;
  logger.debug(
    `Default credentials - user: ${defaultUser || '(not set)'}, pass: ${
      defaultPass ? '(set, length: ' + defaultPass.length + ')' : '(not set)'
    }`
  );

  if (!defaultUser || !defaultPass) {
    logger.warn(
      `Default credentials incomplete - user: ${
        defaultUser ? 'set' : 'missing'
      }, pass: ${defaultPass ? 'set' : 'missing'}`
    );
  }

  return {
    user: defaultUser,
    pass: defaultPass,
  };
};

// Cache transporters per address index for performance
const transporterCache = {};

/**
 * Get transporter for a specific email address index
 * Creates and caches transporters per address to use correct credentials
 * @param {number} addressIndex - Index of the email address
 * @returns {Object} Nodemailer transporter
 */
const getTransporter = (addressIndex = null) => {
  // Use default transporter (index -1) if no address specified
  const cacheKey = addressIndex !== null ? addressIndex : -1;

  // Check if cached transporter has valid credentials
  if (transporterCache[cacheKey]) {
    const cachedAuth = transporterCache[cacheKey].options?.auth;
    if (!cachedAuth?.pass || cachedAuth.pass.length === 0) {
      logger.warn(
        `Cached transporter for index ${addressIndex} has empty password, clearing cache`
      );
      delete transporterCache[cacheKey];
    }
  }

  if (!transporterCache[cacheKey]) {
    // Ensure environment variables are loaded
    if (process.env.NODE_ENV !== 'production') {
      const dotenv = require('dotenv');
      const envPath = path.resolve(__dirname, '../../.env.local');
      logger.debug(`Reloading .env.local from ${envPath} in getTransporter`);
      const result = dotenv.config({ path: envPath });

      if (result.error) {
        logger.warn(`Failed to reload .env.local: ${result.error.message}`);
        if (!process.env.EMAIL_HOST) {
          // Try root directory as fallback
          const fallbackPath = path.resolve(__dirname, '../../../.env.local');
          logger.debug(`Trying fallback path: ${fallbackPath}`);
          const fallbackResult = dotenv.config({ path: fallbackPath });
          if (fallbackResult.error) {
            logger.warn(
              `Fallback .env.local also failed: ${fallbackResult.error.message}`
            );
          } else {
            logger.debug(`Successfully loaded .env.local from fallback path`);
          }
        }
      } else {
        logger.debug(
          `Reloaded .env.local, parsed ${
            Object.keys(result.parsed || {}).length
          } variables`
        );
        // Log specific password variables to see if they're being loaded (without exposing values)
        const passwordVars = Object.keys(result.parsed || {}).filter((k) =>
          k.includes('PASS')
        );
        logger.debug(
          `Password variables in .env.local: ${
            passwordVars.length
          } found - ${passwordVars
            .map((k) => {
              const val = result.parsed[k];
              return `${k}=${
                val
                  ? val.length > 0
                    ? '(set, length: ' + val.length + ')'
                    : '(empty string)'
                  : '(undefined)'
              }`;
            })
            .join(', ')}`
        );
      }
    }

    // Get credentials for this address (or default)
    logger.debug(`Getting credentials for address index: ${addressIndex}`);
    const credentials = getCredentialsForAddress(addressIndex);
    logger.debug(
      `Credentials retrieved - user: ${
        credentials.user || '(not set)'
      }, pass: ${
        credentials.pass
          ? '(set, length: ' + credentials.pass.length + ')'
          : '(not set)'
      }`
    );

    if (!credentials.user || !credentials.pass) {
      logger.error(
        `Credentials incomplete for address index ${addressIndex} - user: ${
          credentials.user ? 'set' : 'MISSING'
        }, pass: ${credentials.pass ? 'set' : 'MISSING'}`
      );
    }

    const config = {
      auth: credentials,
      tls:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : null,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ?? 465,
      secure: true,
    };

    if (!config.host) {
      throw new Error(
        `EMAIL_HOST is not set. Current env vars: EMAIL_HOST=${process.env.EMAIL_HOST}, EMAIL_PORT=${process.env.EMAIL_PORT}`
      );
    }

    const addressName =
      addressIndex !== null ? ADDRESS_CREDENTIAL_MAP[addressIndex] : 'default';
    logger.debug(
      `Creating email transporter for ${addressName} with host: ${
        config.host
      }, port: ${config.port}, user: ${
        config.auth.user || '(not set)'
      }, pass: ${
        config.auth.pass
          ? '(set, length: ' + config.auth.pass.length + ')'
          : '(not set)'
      }`
    );

    if (!config.auth.user || !config.auth.pass) {
      logger.error(
        `Cannot create transporter - credentials missing for ${addressName}`
      );
      throw new Error(
        `Email credentials incomplete for ${addressName} - user: ${
          config.auth.user ? 'set' : 'missing'
        }, pass: ${config.auth.pass ? 'set' : 'missing'}`
      );
    }

    transporterCache[cacheKey] = nodemailer.createTransport(config);
    logger.debug(
      `Transporter created and cached for ${addressName} (cache key: ${cacheKey})`
    );
  }
  return transporterCache[cacheKey];
};

const sendEmail = async (to, template, ...args) => {
  logger.debug(
    `sendEmail called - to: ${to}, template: ${
      template?.name || 'unknown'
    }, args count: ${args.length}`
  );

  const result = await template(...args);
  logger.debug(
    `Template executed, result type: ${
      Array.isArray(result) ? 'array' : typeof result
    }, length: ${Array.isArray(result) ? result.length : 'N/A'}`
  );

  let from, subject, html, topic;

  if (Array.isArray(result) && result.length === 4) {
    [from, subject, html, topic] = result;
    logger.debug(
      `Parsed email data - from index: ${from}, subject: ${
        subject?.substring(0, 50) || 'N/A'
      }, has topic: ${!!topic}`
    );
  } else {
    [from, subject, html] = result;
    logger.debug(
      `Parsed email data - from index: ${from}, subject: ${
        subject?.substring(0, 50) || 'N/A'
      }, no topic`
    );
  }

  // Inject unsubscribe link if topic is present
  if (topic) {
    try {
      // Lazy-load mongoose and User only when needed to avoid module loading issues
      const mongoose = require('mongoose');
      const { User } = require('../../models');
      const { unsubscribe } = require('../users/account/utils');

      // Check MongoDB connection before querying
      const isConnected = mongoose.connection.readyState === 1;

      if (!isConnected) {
        logger.debug(
          `MongoDB not connected, skipping unsubscribe link injection for ${topic}`
        );
        html = html.replace('<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->', '');
      } else {
        // Find user to generate unsubscribe link
        const user = await User.findOne({
          $or: [{ email: to }, { username: to }],
        });

        // Generate unsubscribe link if user exists
        let unsubscribeLink = '';
        if (user) {
          const hash = await unsubscribe.getOrInitiate(user, User);
          const baseUrl = (process.env.PROD_URL || '').replace(/\/$/, '');
          const url = `${baseUrl}/unsubscribe/${hash}?topic=${topic}`;
          const topicName = emailTopics.EMAIL_TOPIC_NAMES[topic] || topic;

          unsubscribeLink = `
            <div style="margin-top: 10px; font-size: 10px; color: #666;">
              <a href="${url}" style="color: #666; text-decoration: underline;">
                Unsubscribe from ${topicName}
              </a>
            </div>
          `;
        }

        html = html.replace(
          '<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->',
          unsubscribeLink
        );
      }
    } catch (err) {
      logger.error('Error injecting unsubscribe link:', err);
      // Continue sending email but without unsubscribe link if error
      html = html.replace('<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->', '');
    }
  } else {
    html = html.replace('<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->', '');
  }

  const fromAddress = getEmailAddress(from);
  logger.debug(
    `Preparing to send email - to: ${to}, from: ${fromAddress}, from index: ${from}`
  );

  const mailOptions = {
    to,
    from: fromAddress,
    subject,
    html,
  };

  try {
    logger.debug(`Getting transporter for address index: ${from}`);
    // Use address-specific transporter to authenticate with correct credentials
    const transporter = getTransporter(from);
    logger.debug(`Transporter obtained, attempting to send email`);

    // Log the actual auth config being used (without exposing password)
    const transporterOptions = transporter.options || {};
    const authConfig = transporterOptions.auth || {};
    logger.debug(
      `Transporter auth config - user: ${
        authConfig.user || '(not set)'
      }, pass: ${
        authConfig.pass
          ? authConfig.pass.length > 0
            ? '(set, length: ' + authConfig.pass.length + ')'
            : '[EMPTY STRING]'
          : '(not set)'
      }`
    );

    if (!authConfig.pass || authConfig.pass.length === 0) {
      logger.error(
        `CRITICAL: Password is empty or missing in transporter auth config!`
      );
      throw new Error('Email password is empty - cannot authenticate');
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `Email sent - template: ${template.name}, messageId: ${info.messageId}`
    );
    return info;
  } catch (err) {
    logger.error('Email transporter error:', {
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
      command: err.command,
      to,
      from: fromAddress,
      fromIndex: from,
      stack: err.stack,
    });
    throw err;
  }
};

// Legacy CONFIG export for backwards compatibility
const CONFIG = {
  auth: {
    pass: process.env.EMAIL_JONATHAN_PASS,
    user: process.env.EMAIL_JONATHAN_USER,
  },
  tls:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : null,
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ?? 465,
  secure: true,
};

module.exports = {
  sendEmail,
  CONFIG,
  getTransporter,
  getCredentialsForAddress,
};
