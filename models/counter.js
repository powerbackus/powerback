/**
 * @fileoverview Counter model schema for MongoDB
 *
 * This module defines the Counter schema, which provides a simple counter
 * mechanism for generating sequential IDs or tracking counts. The counter
 * uses a document-per-counter pattern where each counter has a unique _id
 * and maintains a numeric value.
 *
 * KEY FIELDS
 *
 * IDENTIFICATION
 * - _id: Counter identifier (String, required) - unique name for the counter
 *
 * VALUE
 * - value: Current counter value (Number, required, default: 0)
 *
 * USAGE PATTERN
 *
 * Counters are typically used for:
 * - Generating sequential IDs for other collections
 * - Tracking counts across the application
 * - Implementing optimistic locking patterns
 *
 * Example usage:
 * ```javascript
 * // Get next ID
 * const counter = await Counter.findByIdAndUpdate(
 *   'userId',
 *   { $inc: { value: 1 } },
 *   { new: true, upsert: true }
 * );
 * const nextId = counter.value;
 * ```
 *
 * RELATIONSHIPS
 * - Referenced by: None (standalone counter storage)
 * - References: None
 *
 * BUSINESS RULES
 * - Each counter has unique _id (counter name)
 * - Value starts at 0 and increments via $inc operations
 * - Atomic operations ensure thread-safe counter increments
 * - Timestamps track creation and update times
 *
 * @module models/counter
 * @requires mongoose
 */

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
