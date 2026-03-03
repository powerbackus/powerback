# FEC Compliance Guide

## Overview

This comprehensive guide covers all Federal Election Commission (FEC) compliance requirements implemented in the POWERBACK platform, including donation limits, donor validation, email disclaimers, and audit requirements.

## Table of Contents

- [Donation Limits and Tiers](#donation-limits-and-tiers)
- [Donor Information Requirements](#donor-information-requirements)
- [Email Communication Compliance](#email-communication-compliance)
- [Audit Trail Requirements](#audit-trail-requirements)
- [Compliance Monitoring](#compliance-monitoring)

## Donation Limits and Tiers

### Compliance Tiers

#### Guest Tier

- **Per-donation limit**: $50
- **Annual cap**: $200 across all candidates
- **Required information**: Basic account information only
- **Use case**: Low-value contributions with minimal compliance requirements

#### Compliant Tier

- **Per-election limit (UI)**: $3,500 per candidate per election (used for client‑side gating and messaging)
- **Authoritative cap (server)**: $3,500 across all candidates per election (backend is the final gate for compliance)
- **Required information**:
  - Name (first + last)
  - Mailing address (street, city, state, ZIP)
  - Occupation and Employer
- **Use case**: High-value contributions requiring full compliance

### Limit Enforcement

The system enforces these limits in two layers:

- **Frontend (UI hints)**: Components and contexts (e.g. `DonationLimitsContext`, `ComplianceTierContext`) gate per-donation amounts and, for the Compliant tier, surface a **per-candidate per-election** $3,500 cap in the interface.
- **Backend (authoritative)**: Server‑side validation treats $3,500 as an **across‑all‑candidates per‑election** cap and is the final source of truth. If there is any disagreement between UI hints and backend validation, backend wins and the client surfaces the server error.

## Donor Information Requirements

### Required Fields by Tier

#### Guest Tier

- No additional donor information required beyond account setup

#### Compliant Tier

- **Name**: First name + last name
- **Mailing Address**: Complete address as above
- **Occupation**: Current job title or status
- **Employer**: Company name or "Self-employed" or "Not employed"

### Data Validation

The system validates donor information using comprehensive rules:

#### Name Validation

- **Required**: First and last name for Compliant tier
- **Format**: Title case with proper handling of prefixes (Mc, O', Van, Von)
- **Flags**: Single names, initials only, placeholder content, profanity

#### Address Validation

- **Required**: Complete mailing address for Compliant tier
- **Format**: Standard USPS format with valid state codes
- **Flags**: Missing fields, impossible locations, placeholder content

#### Employment Validation (Compliant Tier Only)

- **Occupation**: Current job title or status
- **Employer**: Company name or employment status
- **Flags**: Generic occupations, missing information, inconsistencies

### Data Capture and Storage

All donor information is captured at the time of donation and stored in the `Celebration` model:

```javascript
donorInfo: {
  // Basic identification
  firstName: String,
  lastName: String,

  // Address information
  address: String,
  city: String,
  state: String,
  zip: String,
  country: String,

  // Employment information (compliant tier)
  occupation: String,
  employer: String,
  isEmployed: Boolean,

  // Compliance tracking
  compliance: String, // 'guest', 'compliant'
  locked: Boolean,    // Prevents modification after donation
  understands: Boolean // User acknowledgment of requirements
}
```

## Email Communication Compliance

### FEC Disclaimer Requirements

All political communications must include the required disclaimer:

> "Paid for by POWERBACK. Not authorized by any candidate or candidate's committee."

### Implementation

The disclaimer is automatically added to all outgoing emails:

```javascript
// Email template with FEC disclaimer
const createFecDisclaimer = () => `
  <div style="
    background-color: #000000;
    border: 2px solid #007bff;
    border-radius: 4px;
    padding: 15px;
    margin: 20px 0;
    text-align: center;
    color: #ffffff;
    font-weight: bold;
    font-size: 14px;
  ">
    Paid for by POWERBACK. Not authorized by any candidate or candidate's committee.
  </div>
`;
```

### Compliance Rules

- **Visibility**: Disclaimer must be clearly visible in email body
- **Legibility**: Text must be easy to read and not obscured
- **Consistency**: Same text must appear in all communications
- **Automatic**: No manual intervention required

## Audit Trail Requirements

### Data Integrity

The system maintains complete audit trails for compliance verification:

1. **Historical Accuracy**: Donor information is captured at donation time
2. **Immutable Records**: Donation records cannot be modified after creation
3. **Complete Documentation**: All required information is stored permanently
4. **Compliance Tracking**: Tier and limit information is preserved

### Record Keeping

#### Required Records

- **Donation Amount**: Exact amount contributed
- **Donor Information**: All required fields based on tier
- **Timing**: Date and time of contribution
- **Recipient**: Which candidate/committee received the funds
- **Status**: Escrow, forwarded, accepted, or refunded

#### Retention Requirements

- **Duration**: 3 years from date of contribution
- **Format**: Electronic records with backup
- **Access**: Available for FEC audit upon request
- **Integrity**: Tamper-evident storage with version control

### Validation Audit Trail

All validation decisions are logged for audit purposes:

```javascript
// Example audit log entry
{
  timestamp: "2026-01-15T10:30:00Z",
  donationId: "don_123456789",
  donorInfo: { /* normalized donor data */ },
  validationResult: {
    flags: [],
    summary: {
      totalFlags: 0,
      isCompliant: true
    }
  },
  complianceTier: "compliant",
  auditor: "system"
}
```

## Compliance Monitoring

### Automated Checks

The system performs continuous compliance monitoring:

1. **Limit Enforcement**: Real-time checking against FEC limits
2. **Data Validation**: Automatic validation of donor information
3. **Tier Compliance**: Ensuring appropriate information is collected
4. **Audit Logging**: Comprehensive logging of all compliance decisions

### Reporting

#### Compliance Reports

- **Donation Summaries**: By tier, amount, and recipient
- **Validation Statistics**: Flag rates and compliance percentages
- **Limit Tracking**: Usage against annual and per-candidate limits
- **Audit Trails**: Complete transaction history

#### FEC Filing Support

The system provides data exports to support recipient committee FEC filings:

- **Donor Information**: Formatted for FEC reporting requirements
- **Contribution Details**: Amount, date, and recipient information
- **Compliance Status**: Validation results and flag information

### Best Practices

1. **Regular Review**: Monthly review of compliance statistics
2. **Data Quality**: Continuous monitoring of validation accuracy
3. **Limit Management**: Proactive tracking of approaching limits
4. **Audit Preparation**: Regular backup and verification of records

## FEC Resources

- [Remedying an excessive contribution](https://www.fec.gov/help-candidates-and-committees/candidate-taking-receipts/remedying-excessive-contribution/) – FEC guidance on refund, redesignation, and reattribution when a committee receives an excessive contribution; useful background on contributor-directed reassignment of intent and recordkeeping.

## Related Documentation

- [Donor Validation System](./donor-validation-comprehensive.md)
- [Donation Limits](./donation-limits.md)
- [Email System](./email-system.md)
- [API Documentation](./API.md)
- [Development Guide](./development.md)
