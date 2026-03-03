/**
 * @fileoverview Bitcoin Address Service
 *
 * This service generates Bitcoin (BTC) addresses for users using hierarchical
 * deterministic (HD) wallet derivation. It maintains a counter to ensure each
 * user gets a unique address from the extended public key (xpub).
 *
 * KEY FEATURES
 *
 * ADDRESS GENERATION
 * - Generates bech32 (p2wpkh) addresses from extended public key
 * - Uses BIP84 derivation path (m/84'/coin_type'/0'/0/index)
 * - Each user gets unique address based on counter index
 *
 * COUNTER MANAGEMENT
 * - Uses Counter model to track next index
 * - Atomic increment prevents duplicate addresses
 * - Zero-based indexing for derivation
 *
 * BUSINESS LOGIC
 *
 * DERIVATION PROCESS
 * 1. Get next index from counter (atomic increment)
 * 2. Derive address using xpub and index
 * 3. Return bech32 address to user
 *
 * COUNTER STORAGE
 * - Counter ID: 'btc_address_index'
 * - Stored in Counter collection
 * - Upserted if doesn't exist (starts at 1)
 * - Zero-based for derivation (value - 1)
 *
 * DEPENDENCIES
 * - ./deriveAddress: Address derivation function
 * - models/counter: Counter model for index tracking
 * - process.env.BTC_XPUB: Extended public key for derivation
 *
 * @module services/btc/addressService
 * @requires ./deriveAddress
 * @requires ../../models/counter
 */

/**
 * BTC Address Service
 *
 * This service is responsible for generating BTC addresses for users.
 * It uses a counter to track the next index to use for the address derivation.
 * It uses the deriveBech32Address function to generate the address.
 * It uses the Counter model to store the counter value.
 */

const Counter = require('../../models/counter.js');
const { deriveBech32Address } = require('./deriveAddress');

const COUNTER_ID = 'btc_address_index';

const getNextIndex = async () => {
  const doc = await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  ).lean();

  // zero-based index
  return doc.value - 1;
};

const getBTCAddress = async (_context = {}) => {
  const index = await getNextIndex();

  const address = deriveBech32Address({
    xpub: process.env.BTC_XPUB,
    index,
  });

  return address;
};

module.exports = { getBTCAddress };
