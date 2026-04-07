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
    };
  };
}

export const SPLASH_COPY: SplashCopy = {
  SPLASH: {
    SLOGAN: 'Make Congress Work For Your Money.', //'Concede Nothing Without A Demand!', //'Your Money, Your Mandate.', // 'No Donation Without Representation!',
    TAGLINE: process.env.REACT_APP_TAGLINE ?? '(donation capital)',
    COPY: {
      demand: 'Concede nothing without a demand.',
      tour: 'Follow the money >>',
      intro:
        'Hold back your donations until Congress delivers real legislative action.',
      explainer:
        'Click \xA0▶ \xA0below to watch a brief explainer video about how our service works',
    },
  },
};
