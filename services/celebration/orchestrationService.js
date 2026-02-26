/**
 * @fileoverview Celebration Orchestration Service
 *
 * This service orchestrates the complete celebration (donation) creation process,
 * coordinating FEC compliance validation, PAC limit checks, donor validation,
 * and email notifications. It serves as the main entry point for celebration
 * creation, handling all business logic and error scenarios.
 *
 * KEY FUNCTIONS
 *
 * createCelebration(req, res)
 * - Main orchestration function for celebration creation
 * - Coordinates all validation and processing steps
 * - Returns celebration object or error response
 *
 * PROCESSING FLOW
 *
 * 1. Calculate Stripe processing fee
 * 2. Get user data and compliance tier
 * 3. Validate FEC compliance (with fallback to legacy validation)
 * 4. Handle PAC limits for tips (check, set flag, send email if needed)
 * 5. Validate donor information and capture validation flags
 * 6. Prepare donor information snapshot for FEC compliance
 * 7. Create celebration record
 * 8. Send receipt email (if enabled in user settings)
 *
 * BUSINESS LOGIC
 *
 * FEC COMPLIANCE VALIDATION
 * - Uses enhanced compliance check with election cycle resets (Compliant tier)
 * - Falls back to legacy validation if enhanced check fails
 * - Rejects donations that exceed compliance tier limits
 *
 * PAC LIMIT HANDLING
 * - Checks if tip would exceed $5,000 annual PAC limit
 * - Sets tipLimitReached flag when limit is reached
 * - Sends email notification when limit is reached
 * - Sets tip to 0 if limit would be exceeded
 *
 * DONOR VALIDATION
 * - Validates donor information against compliance tier requirements
 * - Captures validation flags for recipient committee review
 * - Stores immutable snapshot of donor info at donation time
 *
 * DEPENDENCIES
 * - controller/celebrations: Celebration creation controller
 * - controller/users: User data and compliance checking
 * - services/celebration/emailService: Email notifications
 * - services/user/donorValidation: Donor information validation
 * - controller/users/account/utils/reckon: PAC limit checking
 *
 * @module services/celebration/orchestrationService
 * @requires ../../controller/celebrations
 * @requires ../../models
 * @requires ../../controller/users
 * @requires ../logger
 * @requires ../../controller/users/account/utils/reckon
 * @requires ../user/donorValidation
 * @requires ./emailService
 */

const Controller = require('../../controller/celebrations');
const { User, Pol, Celebration, Bill } = require('../../models');
const UserController = require('../../controller/users');

const { requireLogger } = require('../logger');
const { postToSocial } = require('../utils');

const logger = requireLogger(__filename);

const {
  checkPACLimit,
} = require('../../controller/users/account/utils/reckon');
const {
  validateDonorInfo: validateDonor,
  getValidationSummary,
} = require('../user/donorValidation');
const { sendPACLimitEmail, handleCelebrationEmail } = require('./emailService');
const { getEscrowedTotalsByPol } = require('./dataService');

/**
 * Orchestrates the complete celebration creation process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - Created celebration or error response
 */
async function createCelebration(req, res) {
  try {
    // 1. Calculate Stripe processing fee
    req.body.fee =
      req.body.donation * parseInt(process.env.STRIPE_PROCESSING_PERCENTAGE) +
      parseInt(process.env.STRIPE_PROCESSING_ADDEND);

    // Debug logging for bill_id issue
    logger.debug('Celebration API - Request received:', {
      bill_id: req.body.bill_id,
      bill_id_type: typeof req.body.bill_id,
      bill_id_length: req.body.bill_id?.length,
      full_body: req.body,
    });

    // 2. Get user data and compliance tier
    const compliance = await UserController.deem(req.body.donatedBy, User);
    const celebrations = await Controller.asyncUser(
      req.body.donatedBy,
      Celebration
    );

    // 3. Validate FEC compliance with fallback
    let donationIsCompliant;
    try {
      donationIsCompliant = await UserController.checkEnhancedCompliance(
        celebrations,
        compliance,
        req.body.donation,
        req.body.pol_id,
        null
      );
    } catch (error) {
      logger.warn(
        'Enhanced compliance check failed, falling back to legacy validation:',
        error.message
      );
      donationIsCompliant = await UserController.reckon(
        celebrations,
        compliance,
        req.body.pol_id,
        req.body.donation
      );
    }

    // Log compliance validation results for monitoring
    logger.debug('Celebration Creation - FEC Compliance Validation:', {
      totalDonations: celebrations?.length || 0,
      isCompliant: donationIsCompliant,
      donationAmount: req.body.donation,
      tipAmount: req.body.tip || 0,
      userId: req.body.donatedBy,
      pol_id: req.body.pol_id,
      compliance: compliance,
    });

    // Reject if not compliant
    if (!donationIsCompliant) {
      logger.warn(
        'Celebration creation rejected due to FEC compliance violation:',
        {
          userId: req.body.donatedBy,
          donationAmount: req.body.donation,
          compliance: compliance,
        }
      );
      return {
        status: 400,
        response: {
          error: 'FEC compliance violation',
          message: 'Donation amount exceeds your compliance tier limits',
          donation: req.body.donation,
          complies: false,
        },
      };
    }

    // 4. Handle PAC limits for tips
    let pacLimitInfo = null;
    if (req.body.tip && req.body.tip > 0) {
      try {
        const safeCelebrations = celebrations || [];
        logger.debug('Starting PAC limit validation:', {
          userId: req.body.donatedBy,
          tipAmount: req.body.tip,
          celebrationsCount: safeCelebrations.length,
        });

        pacLimitInfo = checkPACLimit(safeCelebrations, req.body.tip);

        logger.debug('PAC limit check result:', {
          pacLimitInfo,
          tipAmount: req.body.tip,
        });
      } catch (error) {
        logger.error(
          'PAC limit validation failed during celebration creation:',
          {
            stack: error.stack,
            error: error.message,
            tipAmount: req.body.tip,
            userId: req.body.donatedBy,
            celebrationsCount: celebrations?.length || 0,
          }
        );
        // Continue with celebration creation even if PAC validation fails
      }

      if (pacLimitInfo) {
        const newTotal = pacLimitInfo.currentPACTotal + req.body.tip;
        const wouldReachLimit = newTotal >= pacLimitInfo.pacLimit;
        const wouldExceedLimit = newTotal > pacLimitInfo.pacLimit;

        logger.debug('PAC limit check details:', {
          currentPACTotal: pacLimitInfo.currentPACTotal,
          tipAmount: req.body.tip,
          newTotal: newTotal,
          pacLimit: pacLimitInfo.pacLimit,
          wouldReachLimit: wouldReachLimit,
          wouldExceedLimit: wouldExceedLimit,
        });

        if (wouldReachLimit) {
          // Set tipLimitReached to true
          await User.findByIdAndUpdate(
            req.body.donatedBy,
            { tipLimitReached: true },
            { new: true }
          );

          // Send PAC limit reached email
          try {
            await sendPACLimitEmail(
              req.body.donatedBy,
              newTotal,
              pacLimitInfo.pacLimit
            );
          } catch (emailError) {
            logger.error('Failed to send PAC limit email:', emailError);
            // Continue with celebration creation even if email fails
          }

          // Only set tip to 0 if it would exceed the limit
          if (wouldExceedLimit) {
            req.body.tip = 0;
            logger.debug(
              'Set tipLimitReached to true and tip to 0 after PAC limit exceeded'
            );
          } else {
            logger.debug(
              'Set tipLimitReached to true but kept full tip amount after PAC limit reached'
            );
          }
        }
      }
    }

    // 5. Get user information and validate donor info
    const userInfo = await UserController.contact(req.body.donatedBy, User);
    const validationResult = validateDonor(userInfo, compliance);
    const validationSummary = getValidationSummary(validationResult);

    // Log donor validation results
    if (validationSummary.isFlagged) {
      logger.warn(
        'Donation has validation flags - flagged for recipient committee review:',
        {
          userId: userInfo._id,
          flagCount: validationSummary.totalFlags,
          flags: validationResult.flags.map((f) => `${f.field}: ${f.reason}`),
          compliance: compliance,
        }
      );
    } else {
      logger.info('Donor validation completed - no flags detected:', {
        userId: userInfo._id,
        compliance: compliance,
      });
    }

    // 6. Prepare donor information
    const donorInfo = {
      firstName: userInfo.firstName ?? '',
      lastName: userInfo.lastName ?? '',
      address: userInfo.address ?? '',
      city: userInfo.city ?? '',
      state: userInfo.state ?? '',
      zip: userInfo.zip ?? '',
      country: userInfo.country ?? 'United States',
      passport: userInfo.passport ?? '',
      isEmployed:
        userInfo.isEmployed !== undefined ? userInfo.isEmployed : false,
      occupation: userInfo.occupation ?? '',
      employer: userInfo.employer ?? '',
      compliance: compliance,
      email: userInfo.email ?? '',
      username: userInfo.username ?? '',
      phoneNumber: userInfo.phoneNumber ?? '',
      ocd_id: userInfo.ocd_id ?? '',
      locked: userInfo.locked ?? false,
      understands: userInfo.understands ?? false,
      validationFlags: {
        isFlagged: validationSummary.isFlagged,
        summary: {
          totalFlags: validationSummary.totalFlags,
        },
        flags: validationResult.flags,
        validatedAt: new Date(),
        validationVersion: '1.0',
      },
    };
    req.body.donorInfo = donorInfo;

    // 7. Create the celebration record
    const newCelebration = await Controller.create(req, res, Celebration);

    if (process.env.NODE_ENV === 'production') {
      logger.debug('newCelebration', newCelebration);
    }

    // 8. Send receipt email if enabled
    if (newCelebration) {
      await handleCelebrationEmail(
        newCelebration,
        req.body.donatedBy,
        celebrations,
        User,
        Pol
      );
    }

    // 9. Post celebration to social webhook (amount, district, pol, bill only; no donor info)
    if (newCelebration) {
      try {
        const pol = await Pol.findOne({ id: newCelebration.pol_id }).lean();
        const bill = await Bill.findOne({
          bill_id: newCelebration.bill_id,
        }).lean();
        const role = pol?.roles?.[0];
        const state =
          typeof role?.state === 'string' && role.state.trim()
            ? role.state.trim()
            : null;
        const district =
          role?.district != null && !Number.isNaN(Number(role.district))
            ? String(role.district)
            : null;
        if (state && district) {
          let totalDonations;
          try {
            const escrowedArr = await getEscrowedTotalsByPol(
              { pol_id: newCelebration.pol_id },
              Celebration
            );
            totalDonations = escrowedArr[0]?.donation;
          } catch (aggErr) {
            logger.warn(
              'Could not compute total_donations for celebration post',
              {
                celebrationId: newCelebration._id,
                message: aggErr.message,
              }
            );
          }
          await postToSocial({
            eventType: 'celebration',
            dedupeKey: `celebration:${newCelebration._id}`,
            donation: newCelebration.donation,
            totalDonations,
            state,
            district,
            polName:
              newCelebration.pol_name ||
              (pol &&
                `${pol.first_name || ''} ${pol.last_name || ''}`.trim()) ||
              'Representative',
            handles: pol
              ? {
                  bluesky: pol.bluesky_account || '',
                  twitter: pol.twitter_account || '',
                  mastodon: pol.mastodon_account || '',
                  facebook: pol.facebook_account || '',
                  instagram: pol.instagram_account || '',
                  youtube: pol.youtube_account || '',
                  truth: pol.truth_social_account || '',
                }
              : {},
            billId: newCelebration.bill_id,
            billTitle: bill?.title || 'We The People Amendment',
          });
          logger.info('Posted social celebration event', {
            celebrationId: newCelebration._id,
          });
        } else {
          logger.warn(
            'Skipping social celebration post: missing pol state or district',
            {
              celebrationId: newCelebration._id,
              pol_id: newCelebration.pol_id,
            }
          );
        }
      } catch (postErr) {
        logger.error('Failed to post social celebration event:', {
          celebrationId: newCelebration._id,
          message: postErr.message,
        });
      }
    }

    return {
      status: 201,
      response: newCelebration,
    };
  } catch (err) {
    logger.error('Failed to create celebration in orchestration service:', err);
    return {
      status: 500,
      response: { error: 'Server error' },
    };
  }
}

module.exports = {
  createCelebration,
};
