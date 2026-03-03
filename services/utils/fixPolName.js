/**
 * @fileoverview Politician Name Formatting Utility
 *
 * This utility function normalizes and formats politician names with proper
 * capitalization for prefixes, suffixes, and special name patterns. It handles
 * common name formatting issues like "Mc", "O'", hyphenated names, and
 * European prefixes.
 *
 * FORMATTING RULES
 *
 * MC PREFIX
 * - "Mc" + lowercase letter → "Mc" + uppercase letter
 * - Example: "mcdonald" → "McDonald"
 * - Handles "Mc" anywhere in the word
 *
 * O' PREFIX
 * - "o'" + lowercase letter → "O'" + uppercase letter
 * - Example: "o'brien" → "O'Brien"
 * - Only at start of word
 *
 * HYPHENATED NAMES
 * - Hyphen + lowercase letter → Hyphen + uppercase letter
 * - Example: "smith-jones" → "Smith-Jones"
 * - Only if not already capitalized
 *
 * EUROPEAN PREFIXES
 * - "van", "von", "de", "da", "di", "der" + lowercase → Proper case
 * - Example: "van der berg" → "Van Der Berg"
 * - Only at start of word
 *
 * BASIC CAPITALIZATION
 * - First letter uppercase, rest lowercase
 * - Fallback for names without special patterns
 *
 * BUSINESS LOGIC
 *
 * CONSERVATIVE APPROACH
 * - Skips already correctly capitalized parts
 * - Pattern: /^(Mc[A-Z][a-z]+|O'[A-Z][a-z]+|[A-Z][a-z]+-[A-Z][a-z]+)$/
 * - Prevents over-processing of correctly formatted names
 *
 * PROCESSING ORDER
 * 1. Split name into words
 * 2. Check if word already correctly formatted
 * 3. Apply known fixes (Mc, O', prefixes, hyphens)
 * 4. Fallback to basic capitalization
 * 5. Join words with spaces
 *
 * DEBUG LOGGING
 * - Logs when applying fixes (development)
 * - Shows before/after for debugging
 * - Helps identify edge cases
 *
 * DEPENDENCIES
 * None (pure function)
 *
 * @module services/utils/fixPolName
 * @param {string} name - Politician name to format
 * @returns {string} Formatted name with proper capitalization
 *
 * @example
 * ```javascript
 * const { fixPolName } = require('./services/utils/fixPolName');
 * const formatted = fixPolName('john mcdonald o\'brien');
 * // Returns: "John McDonald O'Brien"
 * ```
 */

const logger = require('./logger')(__filename);

function fixPolName(name) {
  const fixMc = (s) =>
    s.replace(
      /[Mm]c([a-z])(.*)/g,
      (_, c1, rest) => 'Mc' + c1.toUpperCase() + rest
    );

  const fixO = (s) =>
    s.replace(
      /^o'([a-z])(.*)/,
      (_, c1, rest) => "O'" + c1.toUpperCase() + rest.toLowerCase()
    );

  const fixHyphenated = (s) =>
    s.replace(
      /-([a-z])([a-z]*)/g,
      (_, c1, rest) => '-' + c1.toUpperCase() + rest.toLowerCase()
    );

  const fixPrefix = (s) =>
    s.replace(
      /^(van|von|de|da|di|der)([a-z])(.*)/,
      (_, p, c1, rest) =>
        p.charAt(0).toUpperCase() +
        p.slice(1).toLowerCase() +
        c1.toUpperCase() +
        rest.toLowerCase()
    );

  return name
    .split(/\s+/)
    .map((part) => {
      // Skip already correctly capitalized parts (conservatively)
      if (
        /^(Mc[A-Z][a-z]+|O'[A-Z][a-z]+|[A-Z][a-z]+-[A-Z][a-z]+)$/.test(part)
      ) {
        return part;
      }

      // Try known fixes
      if (/^[Mm]c[a-z]/.test(part)) {
        logger.debug(`  Applying Mc fix to "${part}"`);
        const result = fixMc(part);
        logger.debug(`  Result: "${result}"`);
        return result;
      }
      if (/[Mm]c[a-z]/.test(part)) {
        logger.debug(`  Applying Mc fix (anywhere) to "${part}"`);
        const result = fixMc(part);
        logger.debug(`  Result: "${result}"`);
        return result; // Also check for mc anywhere in the word
      }
      if (/^o'[a-z]/.test(part)) return fixO(part);
      if (/^(van|von|de|da|di|der)[a-z]/.test(part)) return fixPrefix(part);
      if (/-[a-z]/.test(part) && !/-[A-Z]/.test(part))
        return fixHyphenated(part);

      // As a fallback, basic capitalization
      const result = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      return result;
    })
    .join(' ');
}

module.exports = { fixPolName };
