/**
 * @fileoverview Dev-only routes
 *
 * Non-production only. Auth required. A user may only seed/clear their own data.
 */

const { nanoid } = require('nanoid');
const router = require('express').Router();
const { User, Pol, Celebration } = require('../../models');
const { isAdmin } = require('../../constants/admin');
const tokenizer = require('../../auth/tokenizer');

const logger = require('../../services/utils/logger')(__filename);

function ensureNonProduction(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  return null;
}

function requireLocalhost(req, res, next) {
  const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!allowedIPs.includes(req.ip)) {
    return res
      .status(403)
      .json({ error: 'Access restricted to localhost only' });
  }
  next();
}

function assertSelf(userIdFromBody, authUserId) {
  return String(userIdFromBody) === String(authUserId);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.jwt?.payload?.sub)) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

function generateIdempotencyKey() {
  return nanoid();
}

function computeFee(amount) {
  return (
    amount * parseInt(process.env.STRIPE_PROCESSING_PERCENTAGE) +
    parseInt(process.env.STRIPE_PROCESSING_ADDEND)
  );
}

async function pickPols(limit, preferHasStakes) {
  let allPols;
  if (preferHasStakes) {
    const withStakes = await Pol.find({ has_stakes: true }).lean();
    const withoutStakes = await Pol.find({
      has_stakes: { $ne: true },
    }).lean();
    allPols = [...withStakes, ...withoutStakes];
  } else {
    allPols = await Pol.find({}).lean();
  }

  // Randomly sample unique pols
  const shuffled = allPols.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}

function randomInRange(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

router.post(
  '/celebrations/seed',
  requireLocalhost,
  tokenizer.guard(),
  requireAdmin,
  async (req, res) => {
    try {
      if (ensureNonProduction(req, res)) return;

      const {
        userId,
        count = 25,
        tipMin = 0,
        tipMax = 25,
        polIds = [],
        donationMin = 5,
        donationMax = 200,
        preferHasStakes = true,
        idKeyPrefix = 'seed',
        bill_id = 'hjres54-119',
      } = req.body || {};

      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (!assertSelf(userId, req.jwt?.payload?.sub)) {
        return res.status(403).json({ error: 'Can only seed your own data' });
      }

      const user = await User.findById(userId).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });

      const limit = Math.max(1, Math.min(Number(count) || 1, 500));
      let pols = [];
      if (Array.isArray(polIds) && polIds.length > 0) {
        pols = await Pol.find({ id: { $in: polIds } }).lean();
      } else {
        pols = await pickPols(limit, !!preferHasStakes);
      }

      const docs = [];
      for (let i = 0; i < pols.length && docs.length < limit; i++) {
        const pol = pols[i];
        const role = Array.isArray(pol.roles)
          ? pol.roles.find((r) => !!r.fec_candidate_id) || pol.roles[0]
          : null;
        const fecId = role?.fec_candidate_id || `FEC${pol.id}`;
        const donation = randomInRange(donationMin, donationMax);
        const tip = randomInRange(tipMin, tipMax);
        const idempotencyKey = `${idKeyPrefix}:${generateIdempotencyKey()}`;
        const pol_name = [pol.first_name, pol.last_name]
          .filter(Boolean)
          .join(' ');

        docs.push({
          updateOne: {
            filter: { idempotencyKey },
            update: {
              $set: {
                fee: computeFee(donation),
                payment_intent: null,
                charge_id: null,
                resolved: false,
                paused: false,
                defunct: false,
                current_status: 'active',
                status_ledger: [],
                twitter: pol.twitter_account || '',
                tip,
                FEC_id: fecId,
                pol_id: pol.id,
                bill_id,
                donation,
                pol_name: pol_name || pol.id,
                idempotencyKey,
                donatedBy: user._id,
                donorInfo: {
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  address: user.address || '',
                  city: user.city || '',
                  state: user.state || '',
                  zip: user.zip || '',
                  country: user.country || 'United States',
                  passport: user.passport || '',
                  isEmployed:
                    user.isEmployed !== undefined ? user.isEmployed : false,
                  occupation: user.occupation || '',
                  employer: user.employer || '',
                  compliance: user.compliance,
                  email: user.email || '',
                  username: user.username || '',
                  phoneNumber: user.phoneNumber || '',
                  ocd_id: user.ocd_id || '',
                  locked: !!user.locked,
                  understands: !!user.understands,
                  validationFlags: {
                    isFlagged: false,
                    summary: { totalFlags: 0 },
                    flags: [],
                    validatedAt: new Date(),
                    validationVersion: '1.0',
                  },
                },
              },
            },
            upsert: true,
          },
        });
      }

      if (docs.length === 0) {
        return res.status(400).json({ error: 'No pols available to seed' });
      }

      const result = await Celebration.bulkWrite(docs, { ordered: false });
      logger.info('Dev seed complete', {
        userId,
        countSeeded: docs.length,
        matched: result.matchedCount ?? result.nMatched,
        upserted: result.upsertedCount ?? result.nUpserted,
        modified: result.modifiedCount ?? result.nModified,
      });

      res.json({
        ok: true,
        countRequested: limit,
        countSeeded: docs.length,
        summary: {
          matched: result.matchedCount ?? result.nMatched,
          upserted: result.upsertedCount ?? result.nUpserted,
          modified: result.modifiedCount ?? result.nModified,
        },
      });
    } catch (err) {
      logger.error('Dev seed failed', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/celebrations/clear',
  requireLocalhost,
  tokenizer.guard(),
  requireAdmin,
  async (req, res) => {
    try {
      if (ensureNonProduction(req, res)) return;
      const { userId, idKeyPrefix = 'seed' } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (!assertSelf(userId, req.jwt?.payload?.sub)) {
        return res.status(403).json({ error: 'Can only clear your own data' });
      }

      const regex = new RegExp(`^${idKeyPrefix}:`);
      const del = await Celebration.deleteMany({
        donatedBy: userId,
        idempotencyKey: { $regex: regex },
      });
      res.json({ ok: true, deletedCount: del.deletedCount });
    } catch (err) {
      logger.error('Dev clear failed', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
