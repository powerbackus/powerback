/**
 * Copy registry for Rally page (share-first funnel).
 *
 * Strategic intent: PEOPLE, NOT MONEY; sharing primary; account/donations secondary.
 * @module constants/copy/rally
 */

import { SPLASH_COPY } from './splash';

export const RALLY_COPY = {
  /** Above-the-fold positioning; subcopy explains protest tool before money ask */
  HERO: {
    headline: 'PEOPLE, NOT MONEY.',
    subcopy: `Money runs America whether we like it or not. Campaigns, even at their best, need money upfront with no receipts. POWERBACK flips the script so you set the terms. Contributions stay locked until Congress turns your demand into real legislative action. Before you donate, we the people must become impossible to ignore. Here's how we take the power back:`,
  },
  /** Platform selector + suggested post; no OAuth posting in v1 */
  MANUAL_SHARE: {
    title: 'Tell the People',
    hint: 'Pick a platform, copy the suggested post message, and share it with anyone who wants Congress to earn support - not get it upfront.',
    platformLabel: 'Platform',
    suggestedMessageLabel: 'Suggested message',
    copyMessage: 'Copy suggested message',
    copyMessageSuccess: 'Suggested message copied to clipboard!',
    copyUrlSuccess: 'Share link copied to clipboard!',
    copyClaimSuccess: 'Claim code copied to clipboard!',
    nativeShare: 'Share…',
  },
  /** Explicit generate only; claim code shown once, not recoverable */
  ANONYMOUS_LINK: {
    title: 'Take the Lead',
    explain:
      'Create a link that counts how many people open it. You receive a private claim code once; we cannot recover it if you lose it.',
    generate: 'Generate anonymous share link',
    generating: 'Creating link…',
    rateLimit:
      'Too many links created from this network. Try again later or use the link you already have.',
    copyUrl: 'Copy share link',
    copyClaim: 'Copy claim code',
    claimWarning:
      'Save your claim code now. POWERBACK cannot look it up or send it again.',
    visitCountLabel: 'Opens recorded for your link',
  },
  EMAIL: {
    title: 'Stay on Top',
    hint: 'Get the latest news about the movement as it grows. No account required.',
    placeholder: 'Email address',
    submit: 'Subscribe',
    submitSuccess: 'Signed up for email updates',
    success: 'Check your email to confirm.',
    errorGeneric: 'Something went wrong. Please try again later.',
    rateLimit: 'Too many signup attempts. Please try again in about an hour.',
  },
  CONFIRM: {
    loading: 'Confirming your subscription…',
    successTitle: 'You are subscribed',
    errorTitle: 'Link not valid',
    errorBody:
      'This confirmation link is invalid or has expired. You can sign up again on the Rally page.',
    home: 'Go to POWERBACK',
  },
  UNSUB: {
    title: 'Unsubscribe',
    body: 'Stop receiving POWERBACK movement update emails from this address.',
    cancel: 'Stay subscribed',
    confirm: 'Unsubscribe',
    loading: 'Processing…',
    successTitle: 'Unsubscribed',
    errorTitle: 'Link not valid',
    errorBody: 'This unsubscribe link is invalid.',
    home: 'Go to POWERBACK',
  },
  CONTINUE: {
    label: 'Continue to Lobby',
    disclaimer: SPLASH_COPY.SPLASH.COPY.disclaimer,
  },
  SOCIAL: {
    discordBlurb:
      'Join the Discord for movement updates and volunteer coordination.',
    discordLabel: 'Discord',
    githubLabel: 'GitHub',
    patreonLabel: 'Patreon',
    xLabel: 'Follow on X',
  },
} as const;
