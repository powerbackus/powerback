declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ALLOWED_HOSTNAMES = ['powerback.us', 'www.powerback.us'];

export const shouldEnableGoogleAnalytics = (): boolean =>
  typeof window !== 'undefined' &&
  GA_ALLOWED_HOSTNAMES.includes(window.location.hostname);

export const trackGoogleAnalyticsEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
): void => {
  if (!shouldEnableGoogleAnalytics() || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
};
