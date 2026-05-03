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
    const isLocalDebug =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    window.gtag('event', eventName, {
      ...params,
      ...(isLocalDebug ? { debug_mode: true } : {}),
    });
  }
};
