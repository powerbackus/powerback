/**
 * Copy registry for Cookie consent banner
 */

interface CookieConsentCopy {
  BANNER: {
    message: string;
    essentialOnly: string;
    acceptAnalytics: string;
  };
}

export const COOKIE_CONSENT_COPY: CookieConsentCopy = {
  BANNER: {
    message:
      "We use a necessary authentication cookie to keep you signed in. With your consent, we'd also like to use Google Analytics to understand how our site is used to improve the service.",
    essentialOnly: 'Essential Cookies Only',
    acceptAnalytics: 'Accept Analytics',
  },
};
