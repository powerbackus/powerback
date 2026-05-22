/**
 * Copy registry for Rally page (share-first funnel).
 *
 * Strategic intent: PEOPLE, NOT MONEY; sharing primary; account/donations secondary.
 * @module constants/copy/rally
 */

import { SPLASH_COPY } from './splash';

export const RALLY_COPY = {
  HERO: {
    headline: 'PEOPLE, NOT MONEY.',
    subcopy:
      'POWERBACK needs reach and volunteers before donations. Sharing the app counts as participation.',
  },
  MANUAL_SHARE: {
    title: 'Share with people who may care',
    hint: 'Friends, local groups, or anyone who wants Congress to earn support—not give it upfront.',
    copySiteLink: 'Copy site link',
    copyMessage: 'Copy suggested message',
    nativeShare: 'Share…',
    messageTemplate:
      'Congress should earn your support through action, not take donations upfront. Learn how POWERBACK works:',
  },
  ANONYMOUS_LINK: {
    title: 'Anonymous share link',
    explain:
      'Create a link that counts how many people open it. You receive a private claim code once; we cannot recover it if you lose it.',
    generate: 'Generate anonymous share link',
    generating: 'Creating link…',
    rateLimit:
      'Too many links created from this network. Try again later or use the link you already have.',
    copyUrl: 'Copy share link',
    copyClaim: 'Copy claim code',
    revealClaim: 'Show claim code',
    hideClaim: 'Hide claim code',
    claimWarning:
      'Save your claim code now. POWERBACK cannot look it up or send it again.',
    visitCountLabel: 'Opens recorded for your link',
  },
  EMAIL: {
    title: 'Email updates',
    hint: 'Occasional news about the movement. No account required.',
    placeholder: 'Email address',
    submit: 'Notify me',
    todoNotice: 'Sign-up is not connected yet; your interest is noted locally only.',
  },
  CONTINUE: {
    label: 'Continue to Lobby',
    disclaimer: SPLASH_COPY.SPLASH.COPY.disclaimer,
  },
  ACCOUNT: {
    join: 'Create account',
    signIn: 'Sign in',
  },
} as const;
