/**
 * Analytics registry
 * Centralized source of truth for GA event names, parameter names, and campaign path rules.
 */

interface AnalyticsCopy {
  EVENTS: {
    CAMPAIGN_PATH_SEEN: string;
  };
  PARAMS: {
    CAMPAIGN_PATH: string;
  };
  CAMPAIGN_PATH_PREFIXES: readonly string[];
}

export const ANALYTICS_COPY: AnalyticsCopy = {
  EVENTS: {
    CAMPAIGN_PATH_SEEN: 'campaign_path_seen',
  },
  PARAMS: {
    CAMPAIGN_PATH: 'campaign_path',
  },
  CAMPAIGN_PATH_PREFIXES: ['/r/', '/bsky/', '/x/', '/li/'],
};
