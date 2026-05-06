import { Role } from '@Types';

export interface HouseMember {
  _id: string;
  truth_social_account?: string;
  instagram_account?: string;
  facebook_account?: string;
  mastodon_account?: string;
  bluesky_account?: string;
  twitter_account?: string;
  youtube_account?: string;
  last_updated?: string;
  middle_name?: string;
  first_name: string;
  in_office: boolean;
  last_name: string;
  createdAt?: Date;
  updatedAt?: Date;
  suffix?: string;
  ocd_id: string;
  url?: string;
  id: string;
  /** Watcher-derived competitive race flag */
  has_stakes?: boolean;
  /** Policy exclusion; omitted or false when selectable */
  roster_excluded?: boolean;
  roster_exclusion_reason?: string;
  roster_exclusion_category?: string;
  roster_exclusion_updated_at?: string;
  roles: [Role];
}
