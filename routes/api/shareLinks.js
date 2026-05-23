/**
 * @fileoverview Anonymous share link API routes for Rally.
 * @module routes/api/shareLinks
 */

const router = require('express').Router();
const Controller = require('../../controller/shareLinks');
const { validatePayload } = require('../../validation');
const schemas = require('../../validation');
const { rateLimiters } = require('../../services/utils');

const shareLinkCreateLimiter = rateLimiters.shareLinkCreate;
const shareLinkVisitLimiter = rateLimiters.general;

/**
 * POST /api/share-links
 * Create a new anonymous share link (explicit Rally generate only).
 *
 * @route POST /api/share-links
 * @returns {201} { publicCode, shareUrl, claimCode } claimCode plaintext once
 */
router.post('/', shareLinkCreateLimiter, async (req, res, next) => {
  try {
    const result = await Controller.createShareLink();
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/share-links/:publicCode
 * Record an inbound visit (app bootstrap when location has ?share=).
 *
 * @route GET /api/share-links/:publicCode
 * @returns {200} { publicCode, visitCount }
 * @throws {404} Unknown or invalid publicCode
 */
router.get(
  '/:publicCode',
  shareLinkVisitLimiter,
  async (req, res, next) => {
    try {
      validatePayload(schemas.shareLinkPublicCode, {
        publicCode: req.params.publicCode,
      });
      const result = await Controller.recordShareLinkVisit(
        req.params.publicCode
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
