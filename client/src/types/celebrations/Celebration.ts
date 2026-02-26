export interface Celebration {
  _id?: string;
  donatedBy: string;
  idempotencyKey?: string;
  payment_intent?: string;
  payment_method?: string;
  defunct_reason?: string;
  defunct_date?: Date;
  resolved?: boolean;
  defunct?: boolean;
  paused?: boolean;
  twitter?: string;
  donation: number;
  pol_name: string;
  createdAt?: Date;
  updatedAt?: Date;
  bill_id: string;
  crp_id?: string;
  FEC_id: string;
  pol_id: string;
  fee?: number;
  tip?: number;
  // Donor information captured at time of donation for FEC compliance and audit trail
  donorInfo?: {
    // Basic identification (required for compliant tier)
    firstName: string;
    lastName: string;
    // Address information (required for compliant tier)
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    passport: string;
    // Employment information (required for compliant tier)
    isEmployed: boolean;
    occupation: string;
    employer: string;
    // Compliance tier at time of donation
    compliance: string;
    // Contact information for receipts
    email: string;
    username: string; // Username as email fallback
    phoneNumber: string;
    // Additional validation and audit fields
    ocd_id: string; // Congressional district mapping
    locked: boolean; // Account lock status at donation time
    understands: boolean; // Terms understanding at donation time

    // Validation flags captured at donation time
    validationFlags?: {
      // Simple boolean flag
      isFlagged: boolean;

      // Overall validation summary
      summary: {
        totalFlags: number;
      };

      // Detailed flag information (only populated if isFlagged is true)
      flags: Array<{
        field: string; // e.g., 'name', 'address', 'occupation'
        reason: string; // Human-readable reason for flag
        match: string; // Type of match (e.g., 'missing', 'placeholder', 'profanity')
        originalValue: string; // Original value that was flagged
      }>;

      // Validation metadata
      validatedAt: Date;
      validationVersion: string; // For future validation rule changes
    };
  };
  /** Server-side audit trail of status changes; present when loaded from API for export/display */
  status_ledger?: Array<{
    previous_status?: string;
    change_datetime?: string;
    new_status?: string;
    [key: string]: unknown;
  }>;
}
