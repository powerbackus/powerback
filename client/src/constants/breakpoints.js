/**
 * @fileoverview Single source of truth for responsive breakpoint values (width and height).
 * Used by DeviceContext and media queries; keep in sync with CSS when migrating to tokens.
 * @module constants/breakpoints
 */

/** Width breakpoints (px). Orientation applied in usage (e.g. portrait vs landscape). */
const BREAKPOINTS = {
  /** Mobile, portrait (small) - max-width */
  xs: 379,
  /** Mobile, portrait - max-width */
  sm: 599,
  /** Tablet, portrait - min-width */
  md: 600,
  /** Wide layout (tablet landscape / desktop-style) - min-width */
  lg: 900,
  /** Desktop - min-width */
  xl: 1200,
  /** Big Screen - min-width */
  xxl: 2000,
  /** Wide layout variant - min-width (e.g. Funnel) */
  wide: 1680,
  /** Extra wide - min-width (e.g. Confirmation, PolCombobox) */
  xwide: 1800,
};

/** Height breakpoints (px). Used for short/tall portrait and landscape layout and component behavior. */
const HEIGHT = {
  /** Short landscape - max-height (nav, footer, modals) */
  shortLandscape: 450,
  /** Tall portrait - min-height (main, headshot, splash) */
  tallPortrait: 800,
  /** Carousel gap low band start - min-height */
  tallPortraitLow: 740,
  /** Carousel gap high band start - min-height */
  tallPortraitHigh: 869,
  /** PolCombobox short landscape - max-height */
  landscapeShort: 820,
  /** Payment portrait - max-height */
  paymentPortrait: 936,
  /** Payment landscape - min-height */
  paymentLandscape: 900,
};

module.exports = { BREAKPOINTS, HEIGHT };
