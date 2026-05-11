/**
 * @fileoverview Last-sent timestamp per bioguide for pfp image error admin emails.
 *
 * Used to throttle duplicate alerts from PUT /api/sys/errors/img (24h window).
 *
 * @module models/PfpImageErrorAlert
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const pfpImageErrorAlertSchema = new Schema(
  {
    polId: {
      type: String,
      required: true,
      maxlength: 7,
    },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pfpImageErrorAlertSchema.index({ polId: 1 }, { unique: true });

module.exports = mongoose.model(
  'PfpImageErrorAlert',
  pfpImageErrorAlertSchema,
  'pfp_image_error_alerts'
);
