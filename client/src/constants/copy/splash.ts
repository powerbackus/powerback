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
      cta: string;
      tour: string;
      intro: string;
      explainer: string;
    };
  };
}

export const SPLASH_COPY: SplashCopy = {
  SPLASH: {
    SLOGAN: 'Concede Nothing Without A Demand!', //'Your Money, Your Mandate.', // 'No Donation Without Representation!',
    TAGLINE: process.env.REACT_APP_TAGLINE ?? '(donation capital)',
    COPY: {
      cta: 'Take the power back.',
      tour: 'Occupy the lobby >>',
      intro:
        ' stockpiles small-dollar political campaign donations as united leverage to inspire real-world legislative action.',
      explainer:
        'Click \xA0▶ \xA0below to watch a brief explainer video about how our service works',
    },
  },
};
