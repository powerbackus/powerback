/**
 * Security Monitoring API Routes
 *
 * Provides endpoints for security monitoring, CSP violation reporting,
 * and security event logging.
 *
 * @module routes/api/security
 * @version 1.0.0
 * @author fc
 */

const express = require('express');
const router = express.Router();
const logger = require('../../services/utils/logger')(__filename);

/**
 * POST /api/security/csp-report
 * Handles Content Security Policy violation reports
 */
router.post('/csp-report', (req, res) => {
  try {
    const violation = req.body;

    // Suppress logs for API route tester requests
    if (req.get('x-route-tester') !== 'true') {
      logger.warn('CSP Violation Report:', {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        violation: {
          blockedURI: violation['blocked-uri'],
          documentURI: violation['document-uri'],
          violatedDirective: violation['violated-directive'],
          effectiveDirective: violation['effective-directive'],
          originalPolicy: violation['original-policy'],
          referrer: violation.referrer,
          sourceFile: violation['source-file'],
          lineNumber: violation['line-number'],
          columnNumber: violation['column-number'],
          statusCode: violation['status-code'],
        },
      });
    }

    if (
      violation['blocked-uri']?.includes('data:') ||
      // eslint-disable-next-line no-script-url -- matching CSP violation payload string, not executing
      violation['blocked-uri']?.includes('javascript:') ||
      violation['blocked-uri']?.includes('eval(')
    ) {
      // Suppress logs for API route tester requests
      if (req.get('x-route-tester') !== 'true') {
        logger.error('Suspicious CSP violation detected:', violation);
      }
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error processing CSP report:', error);
    res.status(500).json({ error: 'Failed to process CSP report' });
  }
});

/**
 * POST /api/security/security-event
 * Handles general security event reporting
 */
router.post('/security-event', (req, res) => {
  try {
    const event = req.body;

    // Suppress logs for API route tester requests
    if (req.get('x-route-tester') !== 'true') {
      logger.warn('Security Event Report:', {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        event: {
          type: event.type,
          severity: event.severity,
          message: event.message,
          details: event.details,
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error processing security event:', error);
    res.status(500).json({ error: 'Failed to process security event' });
  }
});

/**
 * GET /api/security/status
 * Returns current security configuration status
 */
router.get('/status', (req, res) => {
  try {
    const securityStatus = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      features: {
        rateLimiting: {
          status: 'active',
          localhostExemption: process.env.NODE_ENV !== 'production',
        },
        csrfProtection: {
          status: 'active',
          doubleSubmitCookie: true,
        },
        csp: {
          status: 'active',
          nonceBased: true,
          reportUri: '/api/security/csp-report',
        },
        securityHeaders: {
          status: 'active',
          helmet: true,
          hsts: true,
          xFrameOptions: true,
          xContentTypeOptions: true,
          referrerPolicy: true,
        },
        auditLogging: {
          status: 'active',
          structuredLogging: true,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
      },
    };

    res.json(securityStatus);
  } catch (error) {
    logger.error('Error generating security status:', error);
    res.status(500).json({ error: 'Failed to generate security status' });
  }
});

module.exports = router;
