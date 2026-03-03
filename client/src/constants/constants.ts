/**
 * @fileoverview Client app constants.
 *
 * Merges root constants/app (PATREON_URL, DISCORD_INVITE, POSITION_PAPER_PATH,
 * EMAIL) with client-only config: breakpoints, SOCIALS, FEC, ALERT_TIMEOUT,
 * MEDIA_PATHS, etc. Re-exported via constants/index.ts.
 *
 * @module constants/constants
 * @requires ../../../constants/app (root APP for PATREON_URL, DISCORD_INVITE, EMAIL)
 * @requires ./breakpoints (BREAKPOINTS, HEIGHT)
 */

import { BREAKPOINTS, HEIGHT } from './breakpoints';

/**
 * Shape of APP from root constants/app.js (backend). Used only to type the
 * require and merge into client APP (STORE, SOCIALS, EMAIL, etc.).
 */
interface RootApp {
  PATREON_URL?: string;
  DISCORD_INVITE?: string;
  POSITION_PAPER_PATH?: string;
  EMAIL?: { SUPPORT?: string; CONTRIBUTE?: string };
}

const { APP: rootApp } = require('../../../constants/app') as { APP: RootApp };

/** Fallback dollar limits and caps for FEC compliance tiers (guest/compliant). */
const FEC_LIMIT_FALLBACKS = {
  COMPLIANT: 3500,
  ANNUAL: 200,
  GUEST: 50,
  PAC: 5000,
} as const;

/**
 * Config for a single share button (Truth Social, Mastodon): endpoint URL,
 * icon path, and alt text.
 */
export interface SocialButtonConfig {
  endpoint?: string;
  icon: string;
  alt: string;
}

/**
 * Config for all social share buttons: messenger appId, plus Truth Social and
 * Mastodon (endpoint, icon, alt).
 */
export interface SocialsButtonsConfig {
  facebookMessenger: { appid: string };
  truthSocial: SocialButtonConfig;
  mastodon: SocialButtonConfig;
}

/**
 * FEC compliance tier config (guest or compliant): limit getters, description,
 * reset timing, and scope copy for UI.
 */
export interface FecTierConfig {
  perDonationLimit: () => number;
  annualCap?: () => number;
  perElectionLimit?: () => number;
  description: string;
  fecUriIndex: number;
  resetTime: string;
  resetType: string;
  scope: string;
}

/** Single object of all client constants; default export and source of named exports. */
const constants = {
  /** NavBrand / logo dimensions. */
  LOGO_DIMS: {
    default: { width: 32, height: 32 },
  },
  /** Explainer video and cable logo paths. */
  MEDIA_PATHS: {
    EXPLAINER: {
      MP4: `../assets/explainer.mp4`,
      WEBM: `../assets/explainer.webm`,
    },
    CABLE_LOGO: process.env.REACT_APP_CABLE_LOGO_IMG_PATH || '/cable-nav.webp',
  },
  /** App config: store keys, breakpoints, nav, checkout, SOCIALS, EMAIL (merged with rootApp). */
  APP: {
    STORE: [
      'choicePol',
      'choiceAmt',
      'tipAmount',
      'billId',
      'donorId',
    ] as const,
    BREAKPOINTS,
    HEIGHT,
    BG_ARIA_LABEL:
      'a colorless hand passes a burning $100 bill to another hand sleeved in a suit, the image is distorted and appears to be in motion, laminous neon pinks and purples add a vibrant contrast',
    LOADING:
      process.env.REACT_APP_CAROUSEL_LOADING_MSG || 'Reticulating Shills...',
    POLMUG: { m: 166, d: 247 },
    NAV: {
      MODALS: ['FAQ', 'Eligibility', 'Terms'] as const,
      SIDENAV_TOUR: [
        { cls: 'pt-5 pb-3', label: 'Join Now', icon: 'person-add' },
        { cls: 'py-3', label: 'Sign In', icon: 'box-arrow-right' },
      ],
    },
    CHECKOUT: {
      BILL_DESCRIPTION_CHAR_LIMIT: { XS: 10, SM: 20, MD: 25, LG: 32 },
      CARD_SETUP_TIMEOUT_MS: 15000,
      SURCHARGE: {
        INFO: [
          'As a nonprofit we do not make any money off these surcharges and rely solely on ',
          'direct donations',
        ],
      },
    },
    SOCIALS: {
      buttonSet: { width: 39, height: 39, iconSize: 39 },
      buttons: {
        facebookMessenger: {
          appid:
            process.env.REACT_APP_FACEBOOK_MESSENGER_APP_ID ||
            '5829070090444460',
        },
        truthSocial: {
          endpoint:
            process.env.REACT_APP_TRUTH_SOCIAL_ENDPOINT ||
            'https://truthsocial.com/share',
          icon:
            process.env.REACT_APP_TRUTH_SOCIAL_ICON ||
            'assets/truth_social.svg',
          alt: 'Truth Social',
        },
        mastodon: {
          endpoint:
            process.env.REACT_APP_MASTODON_SHARE_ENDPOINT ||
            'https://mastodon.social/share',
          icon: process.env.REACT_APP_MASTODON_ICON || 'assets/mastodon.svg',
          alt: 'Mastodon',
        },
      },
    },
    EMAIL: {
      SUPPORT:
        rootApp.EMAIL?.SUPPORT || process.env.REACT_APP_EMAIL_SUPPORT_USER_USER,
      CONTRIBUTE:
        rootApp.EMAIL?.CONTRIBUTE ||
        process.env.REACT_APP_EMAIL_CONTRIBUTORS_USER,
    },
  },
  /** Splash page layout. */
  SPLASH: {
    IMG_HEIGHT: 42,
  },
  /** Citation URLs (e.g. GreenGeeks seal). */
  CITATIONS: {
    GG: {
      a:
        process.env.REACT_APP_GREENGEEKS_SEAL_URL ||
        'https://my.greengeeks.com/seal/',
      i:
        process.env.REACT_APP_GREENGEEKS_SEAL_IMG_PATH ||
        'https://static.greengeeks.com/ggseal/Green_14.png',
    },
  },
  /** Timeouts (ms) for alert auto-dismiss and copy notification. */
  ALERT_TIMEOUT: {
    btnErrSwapper: 4200,
    join: 0,
    login: 5000,
    logout: 7000,
    delete: 10000,
    update: 8500,
    activate: 7500,
    reset: 6000,
    rejected: 0,
    copy: 3000,
    celebrate: 3000,
  },
  DISPLAY_NAME_LEN: 20,
  AMOUNT_PROMPT: 'Choose Your Amount:',
  SHARED_DOMAIN: process.env.REACT_APP_SHARED_DOMAIN || 'powerback.us',
  /** GitHub repo URL. */
  GIT_REPO:
    process.env.REACT_APP_GIT_REPO ||
    'https://github.com/powerbackus/powerback',

  /** We The People bill (H.J.Res.54) Congress.gov URL. */
  WE_THE_PEOPLE_BILL_URL:
    process.env.REACT_APP_WE_THE_PEOPLE_BILL_URL ||
    'https://www.congress.gov/bill/119th-congress/house-joint-resolution/54',

  /** From root constants/app. */
  PATREON_URL: rootApp.PATREON_URL,
  DISCORD_INVITE: rootApp.DISCORD_INVITE,
  POSITION_PAPER_PATH: rootApp.POSITION_PAPER_PATH,

  TWITTER_URL:
    process.env.REACT_APP_TWITTER_URL || 'https://x.com/PowerbackApp',

  /** FEC compliance: limits, tiers (guest/compliant), URIs. */
  FEC: {
    PAC_ANNUAL_LIMIT: FEC_LIMIT_FALLBACKS.PAC,
    COMPLIANCE_TIERS: {
      NAMES: ['guest', 'compliant'] as const,
      guest: {
        perDonationLimit: () => FEC_LIMIT_FALLBACKS.GUEST,
        annualCap: () => FEC_LIMIT_FALLBACKS.ANNUAL,
        description: 'Anonymous users with basic account',
        fecUriIndex: 0,
        resetTime: 'midnight_est',
        resetType: 'annual',
        scope: `per donation, $${FEC_LIMIT_FALLBACKS.ANNUAL} total annual cap across all candidates`,
      },
      compliant: {
        perDonationLimit: () => FEC_LIMIT_FALLBACKS.COMPLIANT,
        perElectionLimit: () => FEC_LIMIT_FALLBACKS.COMPLIANT,
        description: 'Users with name, address, occupation, employer',
        fecUriIndex: 2,
        resetType: 'election_cycle',
        resetTime: 'election_date',
        scope:
          'per donation, per candidate per election (primary/general separate)',
      },
    },
    NAME: 'Federal Election Commission',
    NOTICE_HEADING: '52 U.S. Code § 30101',
    LAW_UNDER: 'Federal Election Campaign Act',
    URI: [
      'https://www.fec.gov/help-candidates-and-committees/keeping-records/recording-receipts/#identifying-contributors',
      'https://www.fec.gov/help-candidates-and-committees/filing-reports/individual-contributions/',
      'https://www.fec.gov/help-candidates-and-committees /candidate-taking-receipts/contribution-limits/',
      'https://www.fec.gov/updates/contribution-limits-for-2025-2026/',
    ],
  },
  /** Fallback base URL for rep headshots. */
  BACKUP_IMG:
    process.env.REACT_APP_POL_IMG_FALLBACK_URL ||
    'https://clerk.house.gov/images/members/',
  /** Tip suggestions and threshold. */
  RECOMMENDED: {
    TIPS: {
      LOW: 1,
      HIGH: 2,
      THRESHOLD: 20,
    },
  },
  /** Analytics (e.g. Google Tag ID). */
  TRACKING: {
    GTAG_ID: process.env.REACT_APP_GTAG_ID || 'G-3YYTWLY9HD',
  },
};

export default constants;

/** Named exports for barrel and direct imports (e.g. celebrate.ts, index.ts). */
export const {
  APP,
  FEC,
  SPLASH,
  GIT_REPO,
  TRACKING,
  CITATIONS,
  LOGO_DIMS,
  BACKUP_IMG,
  PATREON_URL,
  RECOMMENDED,
  TWITTER_URL,
  MEDIA_PATHS,
  ALERT_TIMEOUT,
  AMOUNT_PROMPT,
  SHARED_DOMAIN,
  DISCORD_INVITE,
  DISPLAY_NAME_LEN,
  POSITION_PAPER_PATH,
  WE_THE_PEOPLE_BILL_URL,
} = constants;
