# Donor Information Validation System

## Overview

The Donor Information Validation System implements FEC "best efforts" compliance requirements to help recipient committees meet federal election regulations. The system validates donor records and identifies entries that are **missing, incomplete, inconsistent, or obviously false** so that recipient committees can make informed decisions about accepting or rejecting contributions.

## POWERBACK's Role in FEC Compliance

POWERBACK operates as a conduit platform that:

1. **Accepts contributions** from donors through Stripe payment processing
2. **Holds funds in escrow** until donor contingency conditions are met
3. **Validates donor information** and flags any issues for recipient committee review
4. **Forwards funds + donor info** (with flags attached) to recipient committees when conditions are satisfied
5. **Executes refunds** when recipient committees reject flagged contributions

**Key Compliance Point**: The legal burden sits with the recipient committee (to decide and to report). The mechanical burden sits with POWERBACK (since only we can move money back to the donor via Stripe).

## FEC "Best Efforts" Requirements

### Required Fields by Compliance Tier

#### Guest Tier

- Basic account information only
- No additional donor information required beyond login
- Per-donation limit: $50
- Annual cap: $200 across all candidates

#### Compliant Tier

- **Name**: First name + last name
- **Mailing address**: Street (or PO Box), city, state/territory, ZIP/postal code
- **Occupation** and **Employer** (if truly not employed/retired/student/etc, handled per rules)
- Per-candidate per-election limit: $3,500

## System Implementation

### 1. Core Validation Service (`services/donorValidation.js`)

A comprehensive validation service that:

- **Normalizes** donor information while preserving original meaning
- **Flags issues** with hard/soft severity levels
- **Validates required fields** based on compliance tier (guest/compliant)
- **Detects problematic content** (placeholders, profanity, gibberish)
- **Handles employment status** inconsistencies
- **Validates address formats** and geography

**Key Features:**

- Text normalization (trim, title-case, standardize values)
- Comprehensive keyword detection for placeholders/profanity
- Regex pattern matching for gibberish detection
- Employment status consistency checking
- Address format validation with PO Box support
- State/territory code validation
- ZIP code format validation

### 2. API Endpoints (`routes/api/donorValidation.js`)

Three new API endpoints for donor validation:

- **`POST /api/donor-validation/validate`** - Single donor validation
- **`POST /api/donor-validation/batch`** - Batch validation (up to 100 donors)
- **`GET /api/donor-validation/health`** - Service health check

### 3. Database Schema Changes

The `Celebration` model now includes a `donorInfo` object that captures the user's information at the time of donation:

```javascript
donorInfo: {
  // Basic identification (required for compliant tier)
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },

  // Address information (required for compliant tier)
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  country: { type: String, default: 'United States' },
  passport: { type: String, default: '' },

  // Employment information (required for compliant tier)
  isEmployed: { type: Boolean, default: true },
  occupation: { type: String, default: '' },
  employer: { type: String, default: '' },

  // Compliance tier at time of donation
  compliance: { type: String, required: true },

  // Contact information for receipts
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },

  // Additional validation and audit fields
  ocd_id: { type: String, default: '' },
  locked: { type: Boolean, default: false },
  understands: { type: Boolean, default: false }
}
```

## Validation Features

### Normalization

The system normalizes donor information while preserving the original meaning:

- **Text Processing**: Trim spaces, collapse repeated whitespace, title-case names, uppercase state/territory codes
- **Standard Values**: Normalize common occupation and employer values
- **Preservation**: Store original user text in `raw` field, standardized value in `normalized` field

### Flag System

**Simple Boolean Flagging**: Donor information is either flagged or not flagged for recipient committee review.

**Flagged Issues Include:**

- Missing required fields
- Obscene/joke/gibberish content
- Impossible geography
- Profanity or insult content
- Keyboard mashing or repeated characters
- Ambiguous or inconsistent information
- Low-confidence data
- Generic occupations that may need clarification
- Employment status inconsistencies

**Important**: All flagged contributions are forwarded to recipient committees with flag information attached. POWERBACK does not block donations - recipient committees make the final decision to accept or reject flagged contributions.

## Validation Rules

### Name Validation

**Flagged Issues:**

- Single word name (unless recognized mononyms allowed)
- Initials only (e.g., "J. D.")
- Placeholder content (n/a, unknown, test, etc.)
- Profanity or joke content
- Gibberish patterns (repeated characters, keyboard mashing)

**Normalization:**

- Title-case names with special handling for prefixes (Mc, O', Van, Von, etc.)

### Address Validation

**Flagged Issues:**

- Missing required address fields
- Celestial/impossible places (Mars, Moon, Area 51, etc.)
- Placeholder content
- City containing only numbers
- ZIP code with all same digits
- Invalid state code (possible international address)
- Invalid ZIP code format
- Address format may be invalid (missing street type)

**Accepted Formats:**

- Street address: Requires digit and letters
- PO Box: `P.O. Box 123` format
- Valid USPS state/territory codes
- US ZIP formats: `12345` or `12345-6789`

### Occupation Validation

**Flagged Issues:**

- Missing required occupation at compliant tier
- Placeholder or junk content
- Profanity or joke content
- Gibberish patterns
- Generic occupations (Worker, Employee, Staff, Manager, Owner)

**Standard Values:**

- `Retired`, `Student`, `Homemaker`, `Not employed`, `Unemployed`, `Disabled`, `Self-employed`

### Employer Validation

**Flagged Issues:**

- Missing required employer at compliant tier
- Placeholder or junk content
- Profanity or joke content
- Gibberish patterns
- Too short employer name (unless known acronym like IBM, 3M)
- Employment status inconsistency

**Standard Values:**

- Not employed: `None`
- Self-employed: `Self-employed`

**Self-employment Indicators:**

- `self`, `myself`, `me`, `freelance`, `independent`, `sole proprietor`, `own business`, `consultant`

## API Usage

### Single Donor Validation

```javascript
POST /api/donor-validation/validate
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zip": "12345",
  "occupation": "Engineer",
  "employer": "Tech Corp",
  "compliance": "gold"
}
```

**Response:**

```json
{
  "success": true,
  "validation": {
    "normalized": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345",
      "occupation": "Engineer",
      "employer": "Tech Corp",
      "compliance": "gold"
    },
    "flags": [],
    "raw": { ... }
  },
  "summary": {
    "totalFlags": 0,
    "hardFlags": 0,
    "softFlags": 0,
    "isCompliant": true,
    "needsFollowUp": false
  }
}
```

### Batch Validation

```javascript
POST /api/donor-validation/batch
{
  "compliance": "gold",
  "donors": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345",
      "occupation": "Engineer",
      "employer": "Tech Corp"
    }
  ]
}
```

### Health Check

```javascript
GET / api / donor - validation / health;
```

## Integration Examples

### Frontend Integration

```javascript
// Validate donor information before submission
async function validateDonorInfo(donorData, compliance) {
  try {
    const response = await fetch('/api/donor-validation/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...donorData,
        compliance,
      }),
    });

    const result = await response.json();

    if (result.success) {
      const { validation, summary } = result;

      // Check for flags (for recipient committee review)
      if (summary.totalFlags > 0) {
        console.warn(
          'Validation flags found - flagged for recipient committee review:',
          validation.flags
        );
        return { isValid: true, isFlagged: true, flags: validation.flags };
      }

      return { isValid: true, normalizedData: validation.normalized };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, error: error.message };
  }
}
```

### Backend Integration

```javascript
// Validate donor information during donation processing
const {
  validateDonorInfo,
  getValidationSummary,
} = require('../services/donorValidation');

async function processDonation(donorInfo, compliance) {
  // Validate donor information
  const validationResult = validateDonorInfo(donorInfo, compliance);
  const summary = getValidationSummary(validationResult);

  // Log validation results
  logger.info('Donor validation completed', {
    compliance,
    flagCount: validationResult.flags.length,
    isFlagged: summary.totalFlags > 0,
  });

  // Handle validation flags - all donations proceed with flags attached
  if (summary.totalFlags > 0) {
    // Log flags for recipient committee review
    logger.warn(
      'Donation has validation flags - flagged for recipient committee review',
      {
        flagCount: summary.totalFlags,
        flags: validationResult.flags,
      }
    );
  }

  // Use normalized data for storage
  return validationResult.normalized;
}
```

## Testing

Run the test suite to verify validation functionality:

```bash
node scripts/tests/test-donor-validation.js
```

The test suite includes various scenarios:

- Valid donor information
- Missing required fields
- Placeholder content
- Profanity/joke content
- Employment inconsistencies
- Self-employment scenarios
- Edge cases and error conditions

## Configuration

### Keyword Lists

The system uses configurable keyword lists for detecting various types of problematic content:

- **Placeholder Keywords**: n/a, unknown, test, sample, etc.
- **Profanity Keywords**: god, jesus, santa, batman, etc.
- **Jokey Address Keywords**: mars, moon, area 51, etc.
- **Self-employment Indicators**: self, myself, freelance, etc.
- **Not Employed Categories**: retired, student, homemaker, etc.

### State/Territory Codes

Valid USPS state and territory codes are supported:

- All 50 states (AL, AK, AZ, ..., WY)
- District of Columbia (DC)
- Territories: PR, VI, GU, AS, MP

## Compliance Notes

### FEC Requirements

This system helps meet FEC "best efforts" requirements by:

1. **Identifying Missing Information**: Flags records missing required fields
2. **Detecting Invalid Content**: Identifies placeholder, joke, or profane content
3. **Normalizing Data**: Standardizes common values while preserving meaning
4. **Providing Audit Trail**: Maintains original and normalized data for compliance verification

### Best Practices

1. **Do Not Invent Data**: The system normalizes but never fabricates information
2. **Respectful Normalization**: Preserves user intent while standardizing formats
3. **Comprehensive Flagging**: Identifies both hard and soft issues for appropriate handling
4. **Audit Trail**: Maintains complete records for compliance verification

### Contribution Processing Workflow

1. **Donor submits contribution** through POWERBACK platform
2. **Stripe processes payment** and deposits funds into POWERBACK conduit account
3. **Donor information is validated** and flagged if issues are detected
4. **Contribution sits in escrow** until donor's contingency condition is met
5. **Funds + donor info (with flags)** are forwarded to recipient committee when condition is satisfied
6. **Recipient committee reviews** the contribution:
   - If they **accept** → they keep and report it
   - If they **reject** → they instruct POWERBACK to refund
7. **POWERBACK executes refund** via Stripe back to donor's original payment method
8. **Recipient committee reports** the refund on their FEC filings (because the contribution was legally "made" to them)

### Documentation Requirements

- **Maintain records** of all validation results and flags
- **Log all flagging decisions** for audit purposes
- **Track contribution status** (escrow → forwarded → accepted/rejected)
- **Regular review** of flagged records for patterns and improvements

## Related Documentation

- [FEC Compliance Guide](./fec-compliance-guide.md) - Comprehensive FEC compliance
- [Donation Limits](./donation-limits.md) - Compliance tier limits
- [Email System](./email-system.md) - Email notifications
- [API Documentation](./API.md) - API endpoints
- [User Management](./overview.md) - User model and management
- [Payment Processing](./payment-processing.md) - Payment flow integration
