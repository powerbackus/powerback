/**
 * Context types. Settings, ServerConstants, modal/dialogue, navigation.
 * @module contexts/types
 */
import type { Celebration } from '@Types';
import type { Payment } from '@Interfaces';
import type { HttpStatusCode } from 'axios';

export type EmailTopic =
  | 'districtUpdates'
  | 'electionUpdates'
  | 'celebrationUpdates';

/**
 * User settings/preferences interface
 * Controls user experience and notification preferences
 */
export interface Settings {
  /** Whether to send email receipts for donations */
  emailReceipts: boolean;
  /** Whether to show helpful tooltips in the UI */
  showToolTips: boolean;
  /** Whether to automatically post to Twitter/X after donations */
  autoTweet: boolean;
  /** Whether to unsubscribe from email topics */
  unsubscribedFrom: EmailTopic[];
}

/**
 * FEC (Federal Election Commission) configuration and compliance system with election cycle resets
 */
type FEC = {
  /**
   * PAC contribution limits
   */
  PAC_ANNUAL_LIMIT: number;
  /**
   * Compliance tier definitions with proper validation functions
   */
  COMPLIANCE_TIERS: {
    guest: {
      perDonationLimit: () => number;
      annualCap: () => number;
      description: string;
      resetType: string;
      resetTime: string;
      scope: string;
    };
    compliant: {
      perDonationLimit: () => number;
      perElectionLimit: () => number;
      description: string;
      resetType: string;
      resetTime: string;
      scope: string;
    };
  };
};

/**
 * Application configuration from server
 * Contains default settings and app-wide constants
 */
type APP = {
  /** Default user settings applied to new users */
  SETTINGS: Settings;
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: number;
  /** Patreon URL for donations */
  PATREON_URL?: string;
  /** Discord invite URL */
  DISCORD_INVITE?: string;
};

/**
 * Stripe payment processing configuration
 */
type STRIPE = {
  /** Fee structure for payment processing */
  FEES: {
    /** Percentage fee (e.g., 0.03 for 3%) */
    PERCENTAGE: number;
    /** Fixed fee in dollars (e.g., 0.3 for 30 cents) */
    ADDEND: number;
  };
};

/**
 * Server constants interface
 * Configuration values loaded from server on app initialization
 */
export interface ServerConstants {
  /** Federal Election Commission rules and limits */
  FEC: FEC;
  /** Application-level configuration */
  APP: APP;
  /** Stripe payment processing configuration */
  STRIPE: STRIPE;
}

/**
 * User authentication form data
 * Used for login/registration operations
 */
export interface UserEntryResponse {
  /** HTTP status code from authentication attempt */
  err: HttpStatusCode;
  /** User's chosen username or email */
  username: string;
  /** User's password */
  password: string;
}

/**
 * Complete user data interface
 * Represents a fully authenticated user with all profile information
 */
export interface UserData {
  /** Unique user identifier */
  id: string;
  /** User's donation/Celebration history */
  donations: Celebration[];
  /** User's preference settings */
  settings: Settings;
  /** Payment method information */
  payment: Payment;
  /** User's compliance status and requirements */
  compliance: string;
  /** Whether user understands terms and compliance requirements */
  understands: boolean;
  /** Whether user is currently employed */
  isEmployed: boolean;
  /** User's phone number */
  phoneNumber: string;
  /** User's occupation/job title */
  occupation: string;
  /** User's first name */
  firstName: string;
  /** User's employer name */
  employer: string;
  /** User's last name */
  lastName: string;
  /** Passport or ID number (for compliance) */
  passport: string;
  /** Username for login */
  username: string;
  /** Mailing address */
  address: string;
  /** Country of residence */
  country: string;
  /** Whether user has hit PAC limit and cannot give more tips */
  tipLimitReached: boolean;
  /** Google Civics response code for congressional district mapping */
  ocd_id: string;
  /** Email address */
  email: string;
  /** State/province */
  state: string;
  /** City */
  city: string;
  /** ZIP/postal code */
  zip: string;
}

/**
 * Donation funnel step types
 * Defines the possible steps in the donation flow
 */
export type FunnelView =
  | 'pol-donation' // Select politician and donation amount
  | 'payment' // Enter payment information
  | 'tips' // Optional platform tip
  | 'confirmation'; // Confirmation and sharing

/**
 * Landing/navigation view: where we are on the splash/landing flow (no credentials form).
 */
export type LandingNavView = '' | 'Tour';

/**
 * Credentials form view: which credentials modal form is shown (registration vs login).
 */
export type CredentialsFormView = 'Join Now' | 'Sign In';

/**
 * Politician/candidate data interface
 * Client-side information about a political candidate
 */
export interface PolData {
  /** Truth Social profile URL (optional) */
  truth_social?: string;
  /** Middle name (optional) */
  middle_name?: string;
  /** First name */
  first_name: string;
  /** Instagram profile URL (optional) */
  instagram?: string;
  /** Facebook profile URL (optional) */
  facebook?: string;
  /** Mastodon profile URL (optional) */
  mastodon?: string;
  /** Last name */
  last_name: string;
  /** Bluesky profile URL (optional) */
  bluesky?: string;
  /** Electoral district */
  district: string;
  /** Twitter/X profile URL (optional) */
  twitter?: string;
  /** YouTube channel URL (optional) */
  youtube?: string;
  /** Legislative chamber (House/Senate) */
  chamber: string;
  /** Federal Election Commission ID */
  FEC_id: string;
  /** Open Civic Data ID */
  ocd_id: string;
  /** State abbreviation */
  state: string;
  /** Full display name */
  name: string;
  /** Unique identifier */
  id: string;
}

/**
 * Alert notification states
 * Controls visibility of various alert/notification messages
 */
export interface ShowAlert {
  /** Account activation success alert */
  activate: boolean;
  /** Password reset link sent alert */
  linkSent: boolean;
  /** Donation rejected/failed alert */
  rejected: boolean;
  /** Account deletion confirmation alert */
  delete: boolean;
  /** Logout confirmation alert */
  logout: boolean;
  /** Profile update success alert */
  update: boolean;
  /** Login prompt/required alert */
  login: boolean;
  /** Registration/join prompt alert */
  join: boolean;
  /** Generic error alert */
  err: boolean;
}

/**
 * PAC limit data for modal display
 */
export interface PACLimitModalData {
  /** Amount user attempted to tip */
  attemptedAmount: number;
  /** Current PAC total for the year */
  currentPACTotal: number;
  /** PAC annual limit */
  pacLimit: number;
  /** Remaining PAC limit */
  remainingPACLimit: number;
  /** Error message from backend */
  message: string;
}

/**
 * Modal dialog states
 * Controls visibility of various modal dialogs
 */
export interface ShowModal {
  /** Login/registration credentials modal */
  credentials: boolean;
  /** Eligibility verification modal */
  eligibility: boolean;
  /** Feature explainer modal */
  explainer: boolean;
  /** User account management modal */
  account: boolean;
  /** Terms of service modal */
  terms: boolean;
  /** Privacy policy modal */
  privacy: boolean;
  /** Donation limit information modal */
  limit: boolean;
  /** PAC limit confirmation modal */
  pacLimit: boolean;
  /** Frequently asked questions modal */
  FAQ: boolean;
  /** Contributing inquiry form modal */
  contributing: boolean;
}

/**
 * Donation limit data passed from opener so Limit modal is presentational only
 */
export interface DonationLimitModalData {
  limitType: 'per-election' | 'annual-cap' | 'per-donation';
  effectiveLimit: number;
  remainingLimit: number;
  scope: string;
}

/**
 * Modal data storage
 * Stores data to be passed to modals when they are shown
 */
export interface ModalData {
  /** PAC limit modal data */
  pacLimit?: PACLimitModalData | null;
  /** Donation limit data (set by opener when opening limit modal) */
  donationLimit?: DonationLimitModalData | null;
}

/**
 * Overlay screen states
 * Controls visibility of full-screen or overlay content
 */
export interface ShowOverlay {
  /** Password reset form overlay */
  resetPass: boolean;
}

/**
 * User compliance requirements tracking
 */
export interface ComplianceRequirements {
  /** Basic form completion */
  basicForm: boolean;
  /** Employment info provided (if employed) */
  employmentInfo: boolean;
  /** Single donation over bronze tier limit ($50+) */
  hasSingleDonationOverBronzeLimit: boolean;
  /** Total donations over silver tier limit ($200+) */
  hasTotalDonationsOverSilverLimit: boolean;
}
