/**
 * @fileoverview Phone Number Normalization Utility
 *
 * This utility function formats phone number input as the user types, providing
 * real-time formatting with the pattern (XXX) XXX-XXXX. It handles input
 * validation by removing non-numeric characters and applies formatting
 * progressively as the user types.
 *
 * FORMATTING LOGIC
 *
 * INPUT VALIDATION
 * - Removes all non-numeric characters (0-9 only)
 * - Preserves only digits for formatting
 *
 * PROGRESSIVE FORMATTING
 * - 1-3 digits: "x", "xx", "xxx" (no formatting)
 * - 4-6 digits: "(xxx)", "(xxx) x", "(xxx) xx", "(xxx) xxx"
 * - 7-10 digits: "(xxx) xxx-", "(xxx) xxx-x", "(xxx) xxx-xx", "(xxx) xxx-xxx", "(xxx) xxx-xxxx"
 *
 * FORMATTING RULES
 * - Only formats when value length increases (typing forward)
 * - Does not reformat when deleting (preserves user's deletion)
 * - Returns undefined if no value provided
 *
 * USAGE
 * Used in contact information forms to provide real-time phone number
 * formatting as users type, improving UX and data consistency.
 *
 * DEPENDENCIES
 * None (pure function)
 *
 * @module hooks/fn/normalize
 * @param {string} value - Current input value
 * @param {string} previousValue - Previous input value (for change detection)
 * @returns {string|undefined} Formatted phone number or undefined
 *
 * @example
 * ```javascript
 * const formatted = normalize('1234567890', '123456789');
 * // Returns: "(123) 456-7890"
 * ```
 */

// formats field input for user contact form phone number

const // h/t https://bit.ly/3NjLlgr @https://bit.ly/3NjfMU7
  normalize = (value, previousValue) => {
    // return nothing if no value
    if (!value) return value;

    // only allows 0-9 inputs
    const currentValue = value.replace(/[^\d]/g, '');
    const cvLength = currentValue.length;

    if (!previousValue || value.length > previousValue.length) {
      // returns: "x", "xx", "xxx"
      if (cvLength < 4) return currentValue;

      // returns: "(xxx)", "(xxx) x", "(xxx) xx", "(xxx) xxx",
      if (cvLength < 7)
        return `(${currentValue.slice(0, 3)}) ${currentValue.slice(3)}`;

      // returns: "(xxx) xxx-", (xxx) xxx-x", "(xxx) xxx-xx", "(xxx) xxx-xxx", "(xxx) xxx-xxxx"
      return `(${currentValue.slice(0, 3)}) ${currentValue.slice(
        3,
        6
      )}-${currentValue.slice(6, 10)}`;
    }
  };

export default normalize;
