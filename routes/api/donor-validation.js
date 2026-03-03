/**
 * @fileoverview Donor Validation API routes for FEC compliance validation (unmounted)
 *
 * This router is intentionally kept for future use and documentation parity.
 * It is not mounted in routes/api/index.js. Celebration creation flow uses
 * the donor validation service directly without calling these endpoints.
 */

const express = require('express');
const router = express.Router();
const {
  validateDonorInfo,
  getValidationSummary,
} = require('../../services/user/donorValidation');

const logger = require('../../services/utils/logger')(__filename);

// POST /api/donor-validation/validate
router.post('/validate', async (req, res) => {
  try {
    const {
      zip,
      city,
      state,
      address,
      employer,
      firstName,
      lastName,
      occupation,
      compliance = 'guest',
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'First name and last name are required',
        required: ['firstName', 'lastName'],
      });
    }

    const validTiers = ['guest', 'compliant'];
    if (!validTiers.includes(compliance)) {
      return res.status(400).json({
        error: 'Invalid compliance tier',
        message: 'Compliance tier must be one of: guest, compliant',
        validTiers,
      });
    }

    const donorInfo = {
      zip,
      city,
      state,
      address,
      employer,
      firstName,
      lastName,
      occupation,
    };

    const validationResult = validateDonorInfo(donorInfo, compliance);
    const summary = getValidationSummary(validationResult);

    logger.info('Donor validation request processed', {
      hasFlags: validationResult.flags.length > 0,
      isCompliant: summary.isCompliant,
      hardFlags: summary.hardFlags,
      softFlags: summary.softFlags,
      compliance,
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      validation: validationResult,
      compliance,
      summary,
    });
  } catch (error) {
    logger.error('Error processing donor validation request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while validating donor information',
    });
  }
});

// POST /api/donor-validation/batch
router.post('/batch', async (req, res) => {
  try {
    const { donors = [], compliance = 'guest' } = req.body;

    if (!Array.isArray(donors)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Donors must be an array',
      });
    }

    if (donors.length === 0) {
      return res.status(400).json({
        error: 'Empty batch',
        message: 'At least one donor record is required',
      });
    }

    if (donors.length > 100) {
      return res.status(400).json({
        error: 'Batch too large',
        message: 'Maximum 100 donors per batch',
      });
    }

    const validTiers = ['guest', 'compliant'];
    if (!validTiers.includes(compliance)) {
      return res.status(400).json({
        error: 'Invalid compliance tier',
        message: 'Compliance tier must be one of: guest, compliant',
        validTiers,
      });
    }

    const results = [];
    const batchSummary = {
      total: donors.length,
      withHardFlags: 0,
      withSoftFlags: 0,
      compliant: 0,
      errors: 0,
    };

    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i];
      try {
        if (!donor.firstName || !donor.lastName) {
          results.push({
            error: 'Missing required fields',
            index: i,
            message: 'First name and last name are required',
          });
          batchSummary.errors++;
          continue;
        }

        const validationResult = validateDonorInfo(donor, compliance);
        const summary = getValidationSummary(validationResult);

        results.push({ index: i, summary, validation: validationResult });

        if (summary.isCompliant) batchSummary.compliant++;
        if (summary.hardFlags > 0) batchSummary.withHardFlags++;
        if (summary.softFlags > 0) batchSummary.withSoftFlags++;
      } catch (error) {
        logger.error(`Error validating donor at index ${i}:`, error);
        results.push({
          error: 'Validation error',
          index: i,
          message: 'An error occurred during validation',
        });
        batchSummary.errors++;
      }
    }

    logger.info('Batch donor validation completed', {
      withHardFlags: batchSummary.withHardFlags,
      withSoftFlags: batchSummary.withSoftFlags,
      compliant: batchSummary.compliant,
      errors: batchSummary.errors,
      total: batchSummary.total,
    });

    res.json({
      compliance,
      results,
      summary: batchSummary,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error processing batch donor validation:', error);
    res.status(500).json({
      message: 'An error occurred while processing batch validation',
      error: 'Internal server error',
    });
  }
});

// GET /api/donor-validation/health
router.get('/health', (req, res) => {
  res.json({
    features: [
      'address validation',
      'compliance tier validation',
      'employer validation',
      'flagging system',
      'name validation',
      'normalization',
      'occupation validation',
    ],
    service: 'donor-validation',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Intentionally unmounted; retained for future use
module.exports = router;
