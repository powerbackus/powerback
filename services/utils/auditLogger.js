/**
 * @fileoverview Security Audit Logger Module
 *
 * This module provides structured audit logging for security events, compliance
 * tracking, and security monitoring. It implements comprehensive logging for all
 * security-related activities in the POWERBACK application with severity levels
 * and detailed context information.
 *
 * KEY FEATURES
 *
 * SECURITY EVENT TYPES
 * - Authentication: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, TOKEN_REFRESH
 * - Account Management: ACCOUNT_CREATED, ACCOUNT_ACTIVATED, PASSWORD_CHANGED
 * - Security Violations: RATE_LIMIT_EXCEEDED, CSRF_TOKEN_INVALID, CSP_VIOLATION
 * - Payment & Compliance: DONATION_ATTEMPT, COMPLIANCE_VIOLATION, PAC_LIMIT_REACHED
 * - System Events: UNAUTHORIZED_ACCESS, PRIVILEGE_ESCALATION, DATA_BREACH_ATTEMPT
 *
 * SEVERITY LEVELS
 * - LOW: Informational events (successful operations)
 * - MEDIUM: Warning events (failed attempts, violations)
 * - HIGH: Critical events (suspicious activity, unauthorized access)
 * - CRITICAL: Emergency events (data breach attempts, privilege escalation)
 *
 * STRUCTURED LOGGING
 * - Timestamp (ISO format)
 * - Event type and severity
 * - Event-specific data
 * - Request context (IP, user agent, userId, sessionId)
 * - Metadata (version, environment, service)
 *
 * BUSINESS LOGIC
 *
 * LOG LEVEL MAPPING
 * - CRITICAL/HIGH: logger.error()
 * - MEDIUM: logger.warn()
 * - LOW: logger.info()
 *
 * CONTEXT CAPTURE
 * - IP address for geolocation
 * - User agent for device/browser identification
 * - User ID for user tracking
 * - Session ID for session tracking
 * - Request ID for request correlation
 *
 * SUSPICIOUS PATTERN DETECTION
 * - CSP violations with data:/javascript:/eval() patterns
 * - Elevated to HIGH severity
 * - Helps identify XSS attempts
 *
 * DEPENDENCIES
 * - services/utils/logger: Base logging functionality
 *
 * @module services/utils/auditLogger
 * @requires ./logger
 */

const logger = require('./logger')(__filename);

/**
 * Security event types for audit logging
 */
const SECURITY_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE',

  // Account management events
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_INITIATED: 'PASSWORD_RESET_INITIATED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',

  // Security violations
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',
  CSRF_TOKEN_MISSING: 'CSRF_TOKEN_MISSING',
  CSP_VIOLATION: 'CSP_VIOLATION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',

  // Payment and compliance events
  DONATION_ATTEMPT: 'DONATION_ATTEMPT',
  DONATION_SUCCESS: 'DONATION_SUCCESS',
  DONATION_FAILURE: 'DONATION_FAILURE',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
  PAC_LIMIT_REACHED: 'PAC_LIMIT_REACHED',

  // System events
  SECURITY_HEADER_MISSING: 'SECURITY_HEADER_MISSING',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
};

/**
 * Security event severity levels
 */
const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Log a security event with structured data
 * @param {string} eventType - Type of security event
 * @param {Object} eventData - Event-specific data
 * @param {Object} context - Request context (IP, user agent, etc.)
 * @param {string} severity - Severity level
 */
function logSecurityEvent(
  eventType,
  eventData = {},
  context = {},
  severity = SEVERITY_LEVELS.MEDIUM
) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    eventData,
    context: {
      ip: context.ip || 'unknown',
      userAgent: context.userAgent || 'unknown',
      userId: context.userId || null,
      sessionId: context.sessionId || null,
      requestId: context.requestId || null,
    },
    metadata: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'powerback-api',
    },
  };

  // Log based on severity level
  switch (severity) {
    case SEVERITY_LEVELS.CRITICAL:
      logger.error('SECURITY AUDIT - CRITICAL:', auditEntry);
      break;
    case SEVERITY_LEVELS.HIGH:
      logger.error('SECURITY AUDIT - HIGH:', auditEntry);
      break;
    case SEVERITY_LEVELS.MEDIUM:
      logger.warn('SECURITY AUDIT - MEDIUM:', auditEntry);
      break;
    case SEVERITY_LEVELS.LOW:
      logger.info('SECURITY AUDIT - LOW:', auditEntry);
      break;
    default:
      logger.warn('SECURITY AUDIT - UNKNOWN SEVERITY:', auditEntry);
  }

  return auditEntry;
}

/**
 * Log authentication events
 */
function logAuthenticationEvent(eventType, userId, context = {}) {
  const eventData = {
    userId,
    timestamp: new Date().toISOString(),
  };

  const severity = eventType.includes('FAILURE')
    ? SEVERITY_LEVELS.MEDIUM
    : SEVERITY_LEVELS.LOW;

  return logSecurityEvent(eventType, eventData, context, severity);
}

/**
 * Log rate limiting events
 */
function logRateLimitEvent(endpoint, ip, userAgent, limit, windowMs) {
  const eventData = {
    endpoint,
    limit,
    windowMs,
    message: `Rate limit exceeded for ${endpoint}`,
  };

  const context = {
    ip,
    userAgent,
  };

  return logSecurityEvent(
    SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
    eventData,
    context,
    SEVERITY_LEVELS.MEDIUM
  );
}

/**
 * Log CSRF protection events
 */
function logCSRFEvent(
  eventType,
  endpoint,
  ip,
  userAgent,
  tokenProvided = false
) {
  const eventData = {
    endpoint,
    tokenProvided,
    message: `CSRF protection triggered for ${endpoint}`,
  };

  const context = {
    ip,
    userAgent,
  };

  return logSecurityEvent(
    eventType,
    eventData,
    context,
    SEVERITY_LEVELS.MEDIUM
  );
}

/**
 * Log CSP violation events
 */
function logCSPViolation(violation, ip, userAgent) {
  const eventData = {
    blockedURI: violation['blocked-uri'],
    documentURI: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    effectiveDirective: violation['effective-directive'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
    message: 'Content Security Policy violation detected',
  };

  const context = {
    ip,
    userAgent,
  };

  // Check for suspicious patterns
  const isSuspicious =
    violation['blocked-uri']?.includes('data:') ||
    // eslint-disable-next-line no-script-url -- matching CSP violation payload string, not executing
    violation['blocked-uri']?.includes('javascript:') ||
    violation['blocked-uri']?.includes('eval(');

  const severity = isSuspicious ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM;

  return logSecurityEvent(
    SECURITY_EVENTS.CSP_VIOLATION,
    eventData,
    context,
    severity
  );
}

/**
 * Log payment and compliance events
 */
function logPaymentEvent(eventType, userId, amount, context = {}) {
  const eventData = {
    userId,
    amount,
    timestamp: new Date().toISOString(),
  };

  const severity = eventType.includes('VIOLATION')
    ? SEVERITY_LEVELS.HIGH
    : SEVERITY_LEVELS.LOW;

  return logSecurityEvent(eventType, eventData, context, severity);
}

/**
 * Log suspicious activity
 */
function logSuspiciousActivity(activity, details, context = {}) {
  const eventData = {
    activity,
    details,
    timestamp: new Date().toISOString(),
  };

  return logSecurityEvent(
    SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
    eventData,
    context,
    SEVERITY_LEVELS.HIGH
  );
}

/**
 * Log unauthorized access attempts
 */
function logUnauthorizedAccess(
  endpoint,
  method,
  ip,
  userAgent,
  reason = 'No authentication provided'
) {
  const eventData = {
    endpoint,
    method,
    reason,
    message: `Unauthorized access attempt to ${method} ${endpoint}`,
  };

  const context = {
    ip,
    userAgent,
  };

  return logSecurityEvent(
    SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
    eventData,
    context,
    SEVERITY_LEVELS.HIGH
  );
}

/**
 * Log privilege escalation attempts
 */
function logPrivilegeEscalation(userId, attemptedAction, context = {}) {
  const eventData = {
    userId,
    attemptedAction,
    message: `Privilege escalation attempt by user ${userId}`,
  };

  return logSecurityEvent(
    SECURITY_EVENTS.PRIVILEGE_ESCALATION,
    eventData,
    context,
    SEVERITY_LEVELS.CRITICAL
  );
}

/**
 * Log data breach attempts
 */
function logDataBreachAttempt(attemptedAccess, ip, userAgent, context = {}) {
  const eventData = {
    attemptedAccess,
    message: `Potential data breach attempt detected`,
  };

  const contextWithIP = {
    ...context,
    ip,
    userAgent,
  };

  return logSecurityEvent(
    SECURITY_EVENTS.DATA_BREACH_ATTEMPT,
    eventData,
    contextWithIP,
    SEVERITY_LEVELS.CRITICAL
  );
}

/**
 * Get security event statistics
 */
function getSecurityStats() {
  // This would typically query a database or log aggregation system
  // For now, return a placeholder structure
  return {
    totalEvents: 0,
    eventsByType: {},
    eventsBySeverity: {},
    recentEvents: [],
  };
}

module.exports = {
  SECURITY_EVENTS,
  SEVERITY_LEVELS,
  logSecurityEvent,
  logAuthenticationEvent,
  logRateLimitEvent,
  logCSRFEvent,
  logCSPViolation,
  logPaymentEvent,
  logSuspiciousActivity,
  logUnauthorizedAccess,
  logPrivilegeEscalation,
  logDataBreachAttempt,
  getSecurityStats,
};
