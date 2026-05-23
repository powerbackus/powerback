/**
 * @fileoverview Rally email subscriber API routes.
 * @module routes/api/rallySubscribers
 */

const router = require('express').Router();
const Controller = require('../../controller/rallySubscribers');
const { validate, validatePayload } = require('../../validation');
const schemas = require('../../validation');
const { rateLimiters } = require('../../services/utils');

const createLimiter = rateLimiters.rallySubscriberCreate;
const tokenLimiter = rateLimiters.general;

/**
 * POST /api/rally-subscribers
 * Create or refresh pending subscriber; send confirmation email.
 *
 * @route POST /api/rally-subscribers
 * @returns {200} { message } generic success (anti-enumeration)
 */
router.post(
  '/',
  createLimiter,
  validate(schemas.rallySubscriberCreate),
  async (req, res, next) => {
    try {
      const result = await Controller.createRallySubscriber(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/rally-subscribers/confirm/:token
 * Confirm double opt-in.
 *
 * @route GET /api/rally-subscribers/confirm/:token
 * @returns {200} { confirmed, message }
 */
router.get('/confirm/:token', tokenLimiter, async (req, res, next) => {
  try {
    validatePayload(schemas.rallySubscriberToken, {
      token: req.params.token,
    });
    const result = await Controller.confirmRallySubscriber(req.params.token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rally-subscribers/unsubscribe/:token
 * Unsubscribe confirmed subscriber.
 *
 * @route POST /api/rally-subscribers/unsubscribe/:token
 * @returns {200} { unsubscribed, message }
 */
router.post('/unsubscribe/:token', tokenLimiter, async (req, res, next) => {
  try {
    validatePayload(schemas.rallySubscriberToken, {
      token: req.params.token,
    });
    const result = await Controller.unsubscribeRallySubscriber(
      req.params.token
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
