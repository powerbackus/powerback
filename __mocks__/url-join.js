/**
 * Jest mock for url-join (ESM package not transformable by Jest).
 * Joins path segments with single slashes, no double slashes.
 */
function urlJoin(...parts) {
  return parts
    .filter((p) => p != null && p !== '')
    .join('/')
    .replace(/([^:])\/+/g, '$1/');
}

module.exports = urlJoin;
module.exports.default = urlJoin;
