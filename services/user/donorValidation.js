/**
 * @fileoverview Donor Information Validation Service
 *
 * This service validates donor records to help meet FEC "best efforts" compliance
 * requirements by identifying entries that are missing, incomplete, inconsistent,
 * or obviously false. It normalizes data while preserving original values and
 * flags issues for recipient committee review.
 *
 * KEY FEATURES
 *
 * FIELD VALIDATION
 * - Name: Missing, single word, initials, placeholders, profanity, gibberish
 * - Address: Missing, jokey addresses, placeholders, invalid format
 * - City: Numeric cities, placeholders
 * - State: Invalid state codes, non-US states
 * - ZIP: Invalid format, repeated digits
 * - Occupation: Missing, placeholders, profanity, generic occupations
 * - Employer: Missing, placeholders, profanity, too short, inconsistencies
 *
 * DATA NORMALIZATION
 * - Text normalization: Trimming, whitespace collapse, title case
 * - Standard values: Retired, Student, Self-employed, None
 * - Employment indicators: Me, Self, Freelance → Self-employed
 * - Not employed: Disabled, Retired, Student → None
 *
 * FLAG DETECTION
 * - Placeholder keywords: "test", "xxx", "n/a", "unknown"
 * - Profanity keywords: "batman", "mars", "white house"
 * - Jokey addresses: "area 51", "under a bridge"
 * - Gibberish patterns: Repeated chars, keyboard mashing
 * - Inconsistencies: Employment status vs employer
 *
 * BUSINESS LOGIC
 *
 * COMPLIANCE TIER REQUIREMENTS
 * - Guest: No address/employment validation
 * - Compliant: Name, address, occupation, and employer validation
 *
 * VALIDATION FLAGS
 * - Each flag includes: field, reason, match type, originalValue
 * - Flags stored for recipient committee review
 * - Normalized data stored separately from flags
 *
 * NORMALIZATION RULES
 * - Title case with special handling (Mc, O', prefixes)
 * - Standard occupation/employer values
 * - State codes uppercase
 * - ZIP codes trimmed
 *
 * DEPENDENCIES
 * - services/utils/logger: Logging
 * - shared/states: Valid US state codes
 *
 * @module services/user/donorValidation
 * @requires ../utils/logger
 * @requires ../../shared/states
 */

const logger = require('../utils/logger')(__filename);

const { states } = require('../../shared');

// USPS state/territory codes
const VALID_STATES = new Set(states);

// Standard occupation values for normalization
const STANDARD_OCCUPATIONS = {
  retired: 'Retired',
  student: 'Student',
  disabled: 'Disabled',
  homemaker: 'Homemaker',
  unemployed: 'Unemployed',
  'not employed': 'Not employed',
  'self-employed': 'Self-employed',
};

// Standard employer values for normalization
const STANDARD_EMPLOYERS = {
  none: 'None',
  retired: 'None',
  student: 'None',
  disabled: 'None',
  homemaker: 'None',
  unemployed: 'None',
  me: 'Self-employed',
  self: 'Self-employed',
  myself: 'Self-employed',
  freelance: 'Self-employed',
  consultant: 'Self-employed',
  independent: 'Self-employed',
  'not employed': 'None',
  'own business': 'Self-employed',
  'sole proprietor': 'Self-employed',
};

// General placeholder/junk keywords (case-insensitive)
const PLACEHOLDER_KEYWORDS = [
  '-',
  '.',
  '--',
  '...',
  '???',
  'idk',
  'na',
  'nil',
  'null',
  'same',
  'test',
  'tbd',
  'unk',
  'xxx',
  'yyy',
  'zzz',
  'asdf',
  'lorem',
  'n/a',
  'none',
  'no one',
  'qwerty',
  'refuse',
  'refused',
  'sample',
  'testing',
  'unknown',
  'dont know',
  'no idea',
  'prefer not',
  "don't know",
];

// Profanity/joke keywords (case-insensitive)
const PROFANITY_KEYWORDS = [
  'cia',
  'fbi',
  'god',
  'nsa',
  'hell',
  'mars',
  'moon',
  'elon',
  'jesus',
  'santa',
  'batman',
  'heaven',
  'nowhere',
  'somewhere',
  'spiderman',
  'spider man',
  'your mom',
  'the queen',
  'area 51',
  'at your house',
  'milky way',
  'planet earth',
  'white house',
  'under a bridge',
  '1600 pennsylvania ave',
];

// Jokey address keywords (case-insensitive)
const JOKEY_ADDRESS_KEYWORDS = [
  'hell',
  'mars',
  'moon',
  'heaven',
  'nowhere',
  'somewhere',
  'area 51',
  'at your house',
  'milky way',
  'planet earth',
  'white house',
  'under a bridge',
  '1600 pennsylvania ave',
];

// Self-employment indicators
const SELF_EMPLOYMENT_INDICATORS = [
  'me',
  'self',
  'myself',
  'freelance',
  'consultant',
  'independent',
  'own business',
  'sole proprietor',
];

// Not employed categories
const NOT_EMPLOYED_CATEGORIES = [
  'disabled',
  'retired',
  'student',
  'unemployed',
  'homemaker',
  'not employed',
];

/**
 * Normalize text by trimming spaces, collapsing whitespace, and title-casing
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Title case
    .replace(/\b\w{2,}\b/g, (word) => {
      // Handle special cases like "Mc", "O'", etc.
      if (/^Mc[A-Z]/.test(word)) return word;
      if (/^O'[A-Z]/.test(word)) return word;
      if (/^Van\b|^Von\b|^De\b|^Da\b|^Di\b|^Der\b/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

/**
 * Check if text contains any keywords from a list (case-insensitive)
 * @param {string} text - Text to check
 * @param {string[]} keywords - Keywords to search for
 * @returns {boolean} True if any keyword is found
 */
function containsKeywords(text, keywords) {
  if (!text || typeof text !== 'string') return false;

  const normalizedText = text.toLowerCase();
  return keywords.some((keyword) =>
    normalizedText.includes(keyword.toLowerCase())
  );
}

/**
 * Check if text matches a regex pattern
 * @param {string} text - Text to check
 * @param {RegExp} pattern - Regex pattern to match
 * @returns {boolean} True if pattern matches
 */
function matchesPattern(text, pattern) {
  if (!text || typeof text !== 'string') return false;
  return pattern.test(text);
}

/**
 * Validate name field
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {Object} Validation result with normalized data and flags
 */
function validateName(firstName, lastName) {
  const result = {
    normalized: {
      firstName: normalizeText(firstName),
      lastName: normalizeText(lastName),
    },
    flags: [],
  };

  const fullName = `${firstName} ${lastName}`.trim();

  // Check for missing names
  if (!firstName || !lastName) {
    result.flags.push({
      field: 'name',
      reason: 'Missing required name fields',
      match: 'missing',
      originalValue: fullName,
    });
  }

  // Check for single word name
  if (fullName && !fullName.includes(' ')) {
    result.flags.push({
      field: 'name',
      reason: 'Single word name provided',
      match: 'single_word',
      originalValue: fullName,
    });
  }

  // Check for initials only
  if (matchesPattern(fullName, /^([A-Z]\.){1,3}$/)) {
    result.flags.push({
      field: 'name',
      reason: 'Only initials provided',
      match: 'initials_only',
      originalValue: fullName,
    });
  }

  // Check for placeholders/profanity
  if (containsKeywords(fullName, PLACEHOLDER_KEYWORDS)) {
    result.flags.push({
      field: 'name',
      reason: 'Placeholder or junk content detected',
      match: 'placeholder',
      originalValue: fullName,
    });
  }

  if (containsKeywords(fullName, PROFANITY_KEYWORDS)) {
    result.flags.push({
      field: 'name',
      reason: 'Profanity or joke content detected',
      match: 'profanity',
      originalValue: fullName,
    });
  }

  // Check for gibberish patterns
  if (matchesPattern(fullName, /^(.)\1{3,}$/)) {
    result.flags.push({
      field: 'name',
      reason: 'Repeated characters detected',
      match: 'repeated_chars',
      originalValue: fullName,
    });
  }

  if (matchesPattern(fullName, /^(as?df|qwe?r?ty|zxcv|poiuy|lkjh){1,}$/)) {
    result.flags.push({
      field: 'name',
      reason: 'Keyboard mashing detected',
      match: 'keyboard_mash',
      originalValue: fullName,
    });
  }

  return result;
}

/**
 * Validate address fields
 * @param {string} address - Street address
 * @param {string} city - City
 * @param {string} state - State code
 * @param {string} zip - ZIP code
 * @returns {Object} Validation result with normalized data and flags
 */
function validateAddress(address, city, state, zip) {
  const result = {
    normalized: {
      address: normalizeText(address),
      city: normalizeText(city),
      state: state ? state.toUpperCase() : '',
      zip: zip ? zip.trim() : '',
    },
    flags: [],
  };

  // Check for missing required fields
  if (!address || !city || !state || !zip) {
    const fullAddress = `${address || ''} ${city || ''} ${state || ''} ${
      zip || ''
    }`.trim();
    result.flags.push({
      field: 'address',
      reason: 'Missing required address fields',
      match: 'missing',
      originalValue: fullAddress || 'Not provided',
    });
  }

  // Validate address format
  if (address) {
    // Check for jokey addresses
    if (containsKeywords(address, JOKEY_ADDRESS_KEYWORDS)) {
      result.flags.push({
        field: 'address',
        reason: 'Jokey or impossible address detected',
        match: 'jokey_address',
        originalValue: address,
      });
    }

    // Check for placeholders
    if (containsKeywords(address, PLACEHOLDER_KEYWORDS)) {
      result.flags.push({
        field: 'address',
        reason: 'Placeholder content detected',
        match: 'placeholder',
        originalValue: address,
      });
    }

    // Check for valid street format (requires digit and letters)
    if (!matchesPattern(address, /(?=.*\d)(?=.*[A-Za-z])/)) {
      result.flags.push({
        field: 'address',
        reason: 'Address format may be invalid',
        match: 'invalid_format',
        originalValue: address,
      });
    }

    // Check for PO Box format
    if (
      matchesPattern(address, /^(P(\.|OST)?\s*O(ffice)?\.?\s*Box)\s+\d+/i)
    ) {
      // PO Box is valid, no flag needed
    }
  }

  // Validate city
  if (city) {
    if (matchesPattern(city, /^\d+$/)) {
      result.flags.push({
        field: 'city',
        reason: 'City contains only numbers',
        match: 'numeric_city',
        originalValue: city,
      });
    }

    if (containsKeywords(city, PLACEHOLDER_KEYWORDS)) {
      result.flags.push({
        field: 'city',
        reason: 'Placeholder city detected',
        match: 'placeholder',
        originalValue: city,
      });
    }
  }

  // Validate state
  if (state) {
    const normalizedState = state.toUpperCase();
    if (!VALID_STATES.has(normalizedState)) {
      result.flags.push({
        field: 'state',
        reason: 'Invalid or non-US state code',
        match: 'invalid_state',
        originalValue: state,
      });
    }
  }

  // Validate ZIP code
  if (zip) {
    // Check for valid US ZIP format (flags non-US formats for reporting but allows through)
    // International postal codes are allowed per FEC guidance - we flag but don't block
    if (!matchesPattern(zip, /^\d{5}(-\d{4})?$/)) {
      result.flags.push({
        field: 'zip',
        reason: 'Non-US ZIP code format (may be international postal code)',
        match: 'invalid_format',
        originalValue: zip,
      });
    }

    // Check for all same digits
    if (matchesPattern(zip, /^([0-9])\1{4}(-\1{4})?$/)) {
      result.flags.push({
        field: 'zip',
        reason: 'ZIP code contains all same digits',
        match: 'repeated_digits',
        originalValue: zip,
      });
    }
  }

  return result;
}

/**
 * Validate occupation field
 * @param {string} occupation - Occupation
 * @returns {Object} Validation result with normalized data and flags
 */
function validateOccupation(occupation) {
  const result = {
    normalized: {
      occupation: '',
    },
    flags: [],
  };

  if (!occupation) {
    result.flags.push({
      match: 'missing',
      field: 'occupation',
      originalValue: occupation || 'Not provided',
      reason: 'Missing required occupation',
    });
    return result;
  }

  const normalized = normalizeText(occupation);
  result.normalized.occupation = normalized;

  // Check for standard values and normalize
  const lowerOccupation = normalized.toLowerCase();
  if (STANDARD_OCCUPATIONS[lowerOccupation]) {
    result.normalized.occupation = STANDARD_OCCUPATIONS[lowerOccupation];
  }

  // Check for placeholders/profanity
  if (containsKeywords(normalized, PLACEHOLDER_KEYWORDS)) {
    result.flags.push({
      field: 'occupation',
      reason: 'Placeholder or junk content detected',
      match: 'placeholder',
      originalValue: occupation,
    });
  }

  if (containsKeywords(normalized, PROFANITY_KEYWORDS)) {
    result.flags.push({
      field: 'occupation',
      reason: 'Profanity or joke content detected',
      match: 'profanity',
      originalValue: occupation,
    });
  }

  // Check for gibberish
  if (matchesPattern(normalized, /^(.)\1{3,}$/)) {
    result.flags.push({
      field: 'occupation',
      reason: 'Repeated characters detected',
      match: 'repeated_chars',
      originalValue: occupation,
    });
  }

  if (
    matchesPattern(normalized, /^(as?df|qwe?r?ty|zxcv|poiuy|lkjh){1,}$/)
  ) {
    result.flags.push({
      field: 'occupation',
      reason: 'Keyboard mashing detected',
      match: 'keyboard_mash',
      originalValue: occupation,
    });
  }

  // Check for too generic occupations
  const genericOccupations = [
    'worker',
    'employee',
    'staff',
    'manager',
    'owner',
  ];
  if (genericOccupations.includes(lowerOccupation)) {
    result.flags.push({
      field: 'occupation',
      reason: 'Generic occupation may need clarification',
      match: 'generic',
      originalValue: occupation,
    });
  }

  return result;
}

/**
 * Validate employer field
 * @param {string} employer - Employer
 * @param {string} occupation - Occupation (for consistency checks)
 * @returns {Object} Validation result with normalized data and flags
 */
function validateEmployer(employer, occupation = '') {
  const result = {
    normalized: {
      employer: '',
    },
    flags: [],
  };

  if (!employer) {
    result.flags.push({
      match: 'missing',
      field: 'employer',
      reason: 'Missing required employer',
      originalValue: employer || 'Not provided',
    });
    return result;
  }

  const normalized = normalizeText(employer);
  result.normalized.employer = normalized;

  const lowerEmployer = normalized.toLowerCase();
  const lowerOccupation = occupation.toLowerCase();

  // Check for self-employment indicators
  if (SELF_EMPLOYMENT_INDICATORS.includes(lowerEmployer)) {
    result.normalized.employer = 'Self-employed';
  }

  // Check for standard "not employed" values
  if (STANDARD_EMPLOYERS[lowerEmployer]) {
    result.normalized.employer = STANDARD_EMPLOYERS[lowerEmployer];
  }

  // Check for placeholders/profanity
  if (containsKeywords(normalized, PLACEHOLDER_KEYWORDS)) {
    result.flags.push({
      field: 'employer',
      match: 'placeholder',
      originalValue: employer,
      reason: 'Placeholder or junk content detected',
    });
  }

  if (containsKeywords(normalized, PROFANITY_KEYWORDS)) {
    result.flags.push({
      field: 'employer',
      match: 'profanity',
      originalValue: employer,
      reason: 'Profanity or joke content detected',
    });
  }

  // Check for gibberish
  if (matchesPattern(normalized, /^(.)\1{3,}$/)) {
    result.flags.push({
      field: 'employer',
      match: 'repeated_chars',
      originalValue: employer,
      reason: 'Repeated characters detected',
    });
  }

  if (
    matchesPattern(normalized, /^(as?df|qwe?r?ty|zxcv|poiuy|lkjh){1,}$/)
  ) {
    result.flags.push({
      field: 'employer',
      match: 'keyboard_mash',
      originalValue: employer,
      reason: 'Keyboard mashing detected',
    });
  }

  // Check for too short employer names
  if (
    normalized.length <= 3 &&
    !['IBM', '3M', 'AT&T'].includes(normalized)
  ) {
    result.flags.push({
      field: 'employer',
      match: 'too_short',
      originalValue: employer,
      reason: 'Employer name may be too short',
    });
  }

  // Check for employment status inconsistencies
  if (
    NOT_EMPLOYED_CATEGORIES.includes(lowerOccupation) &&
    !['None', 'Self-employed'].includes(result.normalized.employer) &&
    !containsKeywords(normalized, PLACEHOLDER_KEYWORDS)
  ) {
    result.flags.push({
      field: 'employer',
      match: 'inconsistency',
      originalValue: employer,
      reason: 'Employment status inconsistency detected',
    });
  }

  return result;
}

/**
 * Main validation function for donor information
 * @param {Object} donorInfo - Donor information object
 * @param {string} compliance - Compliance tier ('guest' or 'compliant')
 * @returns {Object} Validation result with normalized data and flags
 */
function validateDonorInfo(donorInfo, compliance = 'guest') {
  const result = {
    normalized: {},
    flags: [],
    raw: { ...donorInfo },
  };

  try {
    // Validate name (required for Compliant tier)
    if (compliance === 'compliant') {
      const nameResult = validateName(
        donorInfo.firstName,
        donorInfo.lastName
      );
      result.normalized = {
        ...result.normalized,
        ...nameResult.normalized,
      };
      result.flags = [...result.flags, ...nameResult.flags];
    }

    // Validate address (required for Compliant tier)
    if (compliance === 'compliant') {
      const addressResult = validateAddress(
        donorInfo.address,
        donorInfo.city,
        donorInfo.state,
        donorInfo.zip
      );
      result.normalized = {
        ...result.normalized,
        ...addressResult.normalized,
      };
      result.flags = [...result.flags, ...addressResult.flags];
    }

    // Validate occupation and employer (required for Compliant tier)
    if (compliance === 'compliant') {
      const occupationResult = validateOccupation(donorInfo.occupation);
      result.normalized = {
        ...result.normalized,
        ...occupationResult.normalized,
      };
      result.flags = [...result.flags, ...occupationResult.flags];

      const employerResult = validateEmployer(
        donorInfo.employer,
        donorInfo.occupation
      );
      result.normalized = {
        ...result.normalized,
        ...employerResult.normalized,
      };
      result.flags = [...result.flags, ...employerResult.flags];
    }

    // Add compliance tier to normalized data
    result.normalized.compliance = compliance;

    logger.info('Donor validation completed', {
      compliance,
      flagCount: result.flags.length,
      isFlagged: result.flags.length > 0,
    });
  } catch (error) {
    logger.error('Error during donor validation:', error);
    result.flags.push({
      field: 'validation',
      match: 'error',
      originalValue: 'validation_error',
      reason: 'Validation error occurred',
    });
  }

  return result;
}

/**
 * Get summary statistics for validation results
 * @param {Object} validationResult - Result from validateDonorInfo
 * @returns {Object} Summary statistics
 */
function getValidationSummary(validationResult) {
  const fieldFlags = {};
  validationResult.flags.forEach((flag) => {
    if (!fieldFlags[flag.field]) {
      fieldFlags[flag.field] = 0;
    }
    fieldFlags[flag.field]++;
  });

  return {
    totalFlags: validationResult.flags.length,
    isFlagged: validationResult.flags.length > 0,
    fieldFlags,
  };
}

module.exports = {
  validateName,
  normalizeText,
  matchesPattern,
  validateAddress,
  containsKeywords,
  validateEmployer,
  validateDonorInfo,
  validateOccupation,
  getValidationSummary,
};
