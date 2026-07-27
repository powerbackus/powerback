/**
 * Jest mock for @scure/bip32 (ESM-only package).
 * Used when tests load server/routes that pull in BTC address derivation.
 */
function HDKey() {
  this.publicKey = Buffer.alloc(33, 0);
}

HDKey.fromExtendedKey = function () {
  return { publicKey: Buffer.alloc(33, 0) };
};

module.exports = { HDKey };
