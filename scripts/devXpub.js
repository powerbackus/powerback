/**
 * Generate BIP84 Extended Public Key
 *
 * Generates a random seed and derives an account-level extended public key
 * for BIP84 (native SegWit) derivation path m/84'/0'/0'.
 *
 * Output will be zpub (mainnet) or vpub (testnet) format depending on
 * the BTC_NETWORK environment variable.
 */

const crypto = require('crypto');
const { HDKey } = require('@scure/bip32');

// Random 32-byte seed
const seed = crypto.randomBytes(32);

// Root node
const root = HDKey.fromMasterSeed(seed);

// Derive account path m/84'/0'/0' (BIP84)
const account = root.derive("m/84'/0'/0'");

// Print extended public key (zpub for mainnet, vpub for testnet)
// This will have BIP84 version bytes automatically
console.log(account.publicExtendedKey);
