/**
 * Copy registry for Splash screen components
 */

/** Display name for the product (e.g. POWERBACK.us) */
export const BRAND_DISPLAY = 'POWERBACK.us';

interface SplashCopy {
  SPLASH: {
    SLOGAN: string;
    TAGLINE: string;
    COPY: {
      tour: string;
      intro: string;
      demand: string;
      explainer: string;
      disclaimer: string;
    };
  };
}

export const SPLASH_COPY: SplashCopy = {
  SPLASH: {
    SLOGAN: 'Make Congress Earn Your Support.', //'Concede Nothing Without A Demand!', //'Your Money, Your Mandate.', // 'No Donation Without Representation!',
    TAGLINE: process.env.REACT_APP_TAGLINE ?? '(donation capital)',
    COPY: {
      tour: 'OCCUPY THE LOBBY',
      demand: 'Concede nothing without a demand!',
      disclaimer: 'No payment or signup required to explore.',
      intro:
        'Stop giving Congress donations upfront. Make them earn your support through real legislative action.',
      explainer:
        'Click \xA0▶ \xA0below to watch a brief explainer video about how our service works',
    },
  },
};
