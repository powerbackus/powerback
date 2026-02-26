/**
 * Link tracking utility for external links
 *
 * Provides UTM parameter injection and Google Analytics event tracking
 * for external links across the application. Helps track backlinks and
 * user engagement with external resources.
 *
 * @module utils/linkTracking
 */

import { TRACKING } from '@CONSTANTS';

// Extend window interface for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Check if user has consented to analytics tracking
 *
 * Verifies both localStorage consent choice and GA disable flag to ensure
 * tracking only occurs when user has explicitly consented.
 *
 * @returns true if user has consented, false otherwise
 */
const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check localStorage for explicit consent
  const cookieChoice = localStorage.getItem('pb:cookieConsent');
  if (cookieChoice !== 'accepted') return false;

  // Check GA disable flag as additional safeguard
  const gtagId = TRACKING.GTAG_ID;
  const disableKey = `ga-disable-${gtagId}`;
  if ((window as unknown as Record<string, boolean>)[disableKey] === true)
    return false;

  return true;
};

/**
 * UTM tracking parameters configuration
 */
export interface TrackingConfig {
  /** Source identifier (default: 'powerback') */
  source?: string;
  /** Medium identifier (e.g., 'faq', 'footer', 'support') */
  medium: string;
  /** Campaign identifier (default: 'backlink') */
  campaign?: string;
  /** Content identifier (optional, auto-generated from link text if not provided) */
  content?: string;
}

/**
 * Add UTM tracking parameters to external URLs
 *
 * Only adds tracking to external URLs (http/https), not relative paths.
 * Preserves existing query parameters and adds UTM parameters.
 *
 * @param url - The URL to add tracking to
 * @param config - Tracking configuration
 * @param linkText - Optional link text for content parameter
 * @returns URL with UTM parameters added
 *
 * @example
 * ```typescript
 * const trackedUrl = addTrackingParams(
 *   'https://github.com/powerbackus/powerback',
 *   { medium: 'faq' },
 *   'GitHub'
 * );
 * // Returns: 'https://github.com/powerbackus/powerback?utm_source=powerback&utm_medium=faq&utm_campaign=backlink&utm_content=github'
 * ```
 */
export const addTrackingParams = (
  url: string,
  config: TrackingConfig,
  linkText?: string
): string => {
  // Only add tracking to external URLs (not relative paths or mailto:)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const source = config.source || 'powerback';
    const campaign = config.campaign || 'backlink';

    // Add UTM parameters
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', config.medium);
    urlObj.searchParams.set('utm_campaign', campaign);

    // Add content parameter if provided or generate from link text
    if (config.content) {
      urlObj.searchParams.set('utm_content', config.content);
    } else if (linkText) {
      const contentParam = linkText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 50);
      urlObj.searchParams.set('utm_content', contentParam);
    }

    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return url;
  }
};

/**
 * Track link click with Google Analytics
 *
 * Sends a custom event to Google Analytics when an external link is clicked.
 * Only tracks if gtag is available and user has consented to analytics.
 *
 * @param url - The URL that was clicked
 * @param linkText - The text of the link
 * @param config - Tracking configuration for event metadata
 *
 * @example
 * ```typescript
 * trackLinkClick(
 *   'https://github.com/powerbackus/powerback',
 *   'GitHub',
 *   { medium: 'faq' }
 * );
 * ```
 */
export const trackLinkClick = (
  url: string,
  linkText: string,
  config: TrackingConfig
): void => {
  if (typeof window !== 'undefined' && window.gtag && hasAnalyticsConsent()) {
    window.gtag('event', 'external_link_click', {
      event_category: config.medium,
      event_label: linkText,
      link_url: url,
      transport_type: 'beacon',
    });
  }
};

/**
 * Create a tracked link handler
 *
 * Combines URL tracking and click tracking into a single handler function.
 * Useful for onClick handlers on link elements.
 *
 * @param url - The original URL
 * @param config - Tracking configuration
 * @param linkText - Optional link text
 * @returns Handler function for onClick events
 *
 * @example
 * ```typescript
 * <a
 *   href={trackedUrl}
 *   onClick={createTrackedLinkHandler(originalUrl, { medium: 'faq' }, 'GitHub')}
 * >
 *   GitHub
 * </a>
 * ```
 */
export const createTrackedLinkHandler = (
  url: string,
  config: TrackingConfig,
  linkText?: string
) => {
  return () => {
    if (linkText) {
      trackLinkClick(url, linkText, config);
    }
  };
};

/**
 * Get tracked URL and click handler
 *
 * Convenience function that returns both the tracked URL and click handler.
 * Useful when you need both the href and onClick for a link.
 *
 * @param url - The original URL
 * @param config - Tracking configuration
 * @param linkText - Optional link text
 * @returns Object with trackedUrl and onClick handler
 *
 * @example
 * ```typescript
 * const { trackedUrl, onClick } = getTrackedLink(url, { medium: 'faq' }, 'GitHub');
 * <a href={trackedUrl} onClick={onClick}>GitHub</a>
 * ```
 */
export const getTrackedLink = (
  url: string,
  config: TrackingConfig,
  linkText?: string
) => {
  return {
    trackedUrl: addTrackingParams(url, config, linkText),
    onClick: createTrackedLinkHandler(url, config, linkText),
  };
};
