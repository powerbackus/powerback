import constants from './constants';

// Import email topics from shared
// @ts-ignore - CommonJS module from shared directory; no types for @Shared
import { emailTopics } from '@Shared';

// Re-export the nested constants as named exports
export const APP = constants.APP;
export const FEC = constants.FEC;

export { WE_THE_PEOPLE } from './bill';
export { INIT, INITIAL_ALERTS } from './init';

export {
  SEARCH_COPY,
  SPLASH_COPY,
  ACCOUNT_COPY,
  BRAND_DISPLAY,
  CELEBRATE_COPY,
  CONFIRMATION_COPY,
  LIMIT_MESSAGE_COPY,
  COOKIE_CONSENT_COPY,
  CELEBRATION_EVENT_COPY,
} from './copy';

export {
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
  DISCORD_INVITE,
  DISPLAY_NAME_LEN,
  POSITION_PAPER_PATH,
  WE_THE_PEOPLE_BILL_URL,
  SHARED_DOMAIN,
} from './constants';

export {
  CELEBRATION_STATUSES,
  CELEBRATION_NON_ACTIVE_STATUSES,
} from './celebrationStatus';

export type {
  CelebrationStatus,
  CelebrationTargetStatus,
} from './celebrationStatus';

// Re-export email topics from shared
export { emailTopics };

export type { AccountTab, SearchLink, CelebrationOutcome } from './copy';
