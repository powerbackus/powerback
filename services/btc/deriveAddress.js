/**
 * @fileoverview Bitcoin Address Derivation Service
 *
 * This service derives bech32 (p2wpkh) Bitcoin addresses from an extended public key.
 * It auto-detects the key format (zpub, vpub, xpub, tpub) and network, then generates
 * native SegWit addresses. Works with any key format - just set BTC_XPUB and it works.
 *
 * KEY FEATURES
 *
 * AUTO-DETECTION
 * - Automatically detects key format (zpub/vpub/xpub/tpub)
 * - Auto-detects network from key prefix if BTC_NETWORK not set
 * - Uses correct version bytes for each key format
 *
 * SUPPORTED KEY FORMATS
 * - zpub: BIP84 mainnet (preferred)
 * - vpub: BIP84 testnet (preferred)
 * - xpub: BIP32 mainnet (legacy, but works)
 * - tpub: BIP32 testnet (legacy, but works)
 *
 * ADDRESS GENERATION
 * - Always generates native SegWit (bech32) addresses
 * - bc1... for mainnet, tb1... for testnet
 * - Assumes extended key is at account level, derives 0/index
 *
 * DEPENDENCIES
 * - @scure/bip32: HD key derivation (secure, audited)
 * - bitcoinjs-lib: Bitcoin address generation
 *
 * @module services/btc/deriveAddress
 * @requires @scure/bip32
 * @requires bitcoinjs-lib
 */

const { HDKey } = require('@scure/bip32');
const bitcoin = require('bitcoinjs-lib');

// Auto-detect network from key prefix if BTC_NETWORK not set
const getNetwork = (extendedKey) => {
  // If BTC_NETWORK is explicitly set, use it
  if (process.env.BTC_NETWORK === 'testnet') {
    return bitcoin.networks.testnet;
  }
  if (process.env.BTC_NETWORK === 'mainnet' || !process.env.BTC_NETWORK) {
    // Auto-detect from key prefix
    if (extendedKey) {
      if (extendedKey.startsWith('tpub') || extendedKey.startsWith('vpub')) {
        return bitcoin.networks.testnet;
      }
      if (extendedKey.startsWith('xpub') || extendedKey.startsWith('zpub')) {
        return bitcoin.networks.bitcoin;
      }
    }
    return bitcoin.networks.bitcoin;
  }
  return bitcoin.networks.bitcoin;
};

// Version bytes for all key formats
const VERSION_BYTES = {
  // BIP84 (native SegWit) - preferred
  zpub: { public: 0x04b24746, private: 0x04b2430c }, // mainnet
  vpub: { public: 0x045f1cf6, private: 0x045f18bc }, // testnet
  // BIP32 (legacy) - fallback
  xpub: { public: 0x0488b21e, private: 0x0488ade4 }, // mainnet
  tpub: { public: 0x043587cf, private: 0x04358394 }, // testnet
};

// Auto-detect version bytes from key prefix
const getVersionBytes = (extendedKey) => {
  const prefix = extendedKey.substring(0, 4);
  const versions = VERSION_BYTES[prefix];
  if (!versions) {
    throw new Error(
      `Unsupported extended key format: "${prefix}". Supported formats: zpub, vpub, xpub, tpub`
    );
  }
  return versions;
};

const deriveBech32Address = ({ xpub, index }) => {
  if (!xpub) throw new Error('BTC_XPUB missing');
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Invalid BTC derivation index');
  }

  // Auto-detect network and version bytes from key
  const network = getNetwork(xpub);
  const versions = getVersionBytes(xpub);

  let node;
  try {
    node = HDKey.fromExtendedKey(xpub, versions);
  } catch (error) {
    throw new Error(`Failed to parse extended key: ${error.message}`);
  }

  // For BIP84 keys (zpub/vpub), assume account-level: m/84'/coin_type'/0'
  // For BIP32 keys (xpub/tpub), we'll derive from the key as-is
  // Derive external chain then index: 0/index
  let child;
  try {
    child = node.deriveChild(0).deriveChild(index);
  } catch (error) {
    throw new Error(`Failed to derive child key: ${error.message}`);
  }

  // @scure/bip32 returns publicKey as Uint8Array, convert to Buffer for bitcoinjs-lib
  const pubkeyBuf = Buffer.from(child.publicKey);

  let address;
  try {
    // Always generate native SegWit (bech32) addresses regardless of key format
    const payment = bitcoin.payments.p2wpkh({
      pubkey: pubkeyBuf,
      network,
    });
    address = payment.address;
  } catch (error) {
    throw new Error(`Failed to generate address: ${error.message}`);
  }

  if (!address) throw new Error('BTC address derivation failed');
  return address;
};

module.exports = { deriveBech32Address };
