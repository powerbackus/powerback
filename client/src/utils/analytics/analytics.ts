declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const trackGoogleAnalyticsEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};
