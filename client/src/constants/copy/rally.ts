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
    subcopy: `Money runs America whether we like it or not. Campaigns, even at their best, need money upfront with no receipts. POWERBACK flips the script so you set the terms. Contributions stay locked until Congress turns your demand into real legislative action. But before you Celebrate, we the people must take the power back:`,
  },
  /** Platform selector + suggested post; no OAuth posting in v1 */
  MANUAL_SHARE: {
    title: 'Tell the People',
    pillDefinition: 'Copy a message to share on social media.',
    hint: 'Spread the message in your own words, or use a suggested post.',
    platformLabel: 'Platform',
    suggestedMessageLabel: 'Suggested message',
    copyMessage: 'Copy message',
    copyMessageSuccess: 'Message copied to clipboard!',
    copyUrlSuccess: 'Share link copied to clipboard!',
    copyClaimSuccess: 'Claim code copied to clipboard!',
    nativeShare: 'Share…',
    suggestedMessage:
      'Stop donating to politicians for nothing. Use POWERBACK to make political donations conditional: no action, no support.',
  },
  /** Explicit generate only; claim code shown once, not recoverable */
  ANONYMOUS_LINK: {
    title: 'Take the Lead',
    pillDefinition: 'Create a share link to build a network.',
    explain:
      'Create a share link that keeps track of the support you bring in. Send it to family, friends, or groups you care about. Post it anywhere, or save it for later. No account or donation required.',
    howItWorksTitle: 'How it works',
    howItWorksSteps: [
      'Create your link.',
      'Share it anywhere.',
      'Save your claim code to claim your link stats later.',
    ],
    readyTitle: 'Your share link is ready.',
    linkLabel: 'Share link',
    claimLabel: 'Claim code',
    generate: 'Create share link',
    generating: 'Creating link…',
    rateLimit:
      'Too many links created from this network. Try again later or use the link you already have.',
    copyUrl: 'Copy link',
    copyClaim: 'Copy code',
    claimHelper:
      'Save your claim code to claim your link stats later. POWERBACK cannot recover it if you lose it.',
    visitCountLabel: 'Opens recorded for your link',
  },
  EMAIL: {
    title: 'Keep Watch',
    pillDefinition: 'Get updates about the growing movement.',
    kicker: 'Best way to follow POWERBACK',
    hint: 'Watch POWERBACK grow. Get updates when user counts climb, donation totals rise, and major campaigns go live.',
    placeholder: 'Email address',
    submit: 'Get updates',
    submitting: 'Submitting…',
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
    label: 'Take me to the Lobby',
    disclaimer: SPLASH_COPY.SPLASH.COPY.disclaimer,
  },
  SOCIAL: {
    hoverBlurbs: {
      discord:
        'Join the Discord for updates, coordination, and early supporter status.',
      github:
        'View the public repo, inspect the code, and contribute to what POWERBACK is building.',
      patreon:
        'Help fund the infrastructure, compliance, and outreach behind POWERBACK.',
      x: 'Follow to see who people are backing in Congressand when new campaigns go live.',
    },
    discordLabel: 'Discord',
    githubLabel: 'GitHub',
    patreonLabel: 'Patreon',
    xLabel: 'Follow on X',
  },
  /** Landscape pills nav + stacked card section labels */
  SUPPORT_ACTIONS: {
    tabsAriaLabel: 'Ways to help on Rally',
    selectorLead: 'Start with one quick action.',
    selectorSub: 'No signup. No donation. No overthinking.',
  },
} as const;

export type RallySupportTab = 'tell' | 'lead' | 'watch';

/** Social footer link ids for hover blurb copy */
export type RallySocialLink = 'discord' | 'github' | 'patreon' | 'x';

/** Tab/pill metadata for Tell the People / Take the Lead / Keep Watch */
export const RALLY_SUPPORT_TABS: {
  key: RallySupportTab;
  title: string;
  definition: string;
}[] = [
  {
    key: 'tell',
    title: RALLY_COPY.MANUAL_SHARE.title,
    definition: RALLY_COPY.MANUAL_SHARE.pillDefinition,
  },
  {
    key: 'lead',
    title: RALLY_COPY.ANONYMOUS_LINK.title,
    definition: RALLY_COPY.ANONYMOUS_LINK.pillDefinition,
  },
  {
    key: 'watch',
    title: RALLY_COPY.EMAIL.title,
    definition: RALLY_COPY.EMAIL.pillDefinition,
  },
];
