/**
 * @fileoverview Contact API routes for public contact forms
 *
 * Provides unauthenticated endpoints for contributing inquiries and other
 * contact form submissions. Rate limited to prevent abuse.
 *
 * @module routes/api/contact
 * @requires express
 * @requires express-rate-limit
 * @requires ../../controller/comms
 * @requires ../../validation
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const Controller = require('../../controller/comms');
const { validate } = require('../../validation');
const schemas = require('../../validation');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/contact/contributing
 * Submits the contributing form (name, email, GitHub link, message)
 *
 * @route POST /api/contact/contributing
 * @param {Object} req.body - Form data
 * @param {string} req.body.name - Submitter name
 * @param {string} req.body.email - Submitter email
 * @param {string} [req.body.githubUrl] - Optional GitHub profile or repo URL
 * @param {string} [req.body.message] - Optional message
 * @returns {Object} { success: true }
 * @throws {403} Validation error
 * @throws {500} Email send failure
 */
router.post(
  '/contributing',
  limiter,
  validate(schemas.contributing),
  async (req, res, next) => {
    try {
      const result = await Controller.submitContributing(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
