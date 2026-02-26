/**
 * Copy registry for Support components
 * Centralized source of truth for support-related messaging and user guidance
 */

import { PolData } from '@Contexts';

export interface CelebrationOutcome {
  description: string;
  label: string;
  icon: string;
}

interface ConfirmationCopy {
  CONTRIBUTING_MODAL: {
    title: string;
    submit: string;
    success: string;
    labelName: string;
    labelEmail: string;
    description: string;
    labelGitHub: string;
    labelMessage: string;
  };

  CONGRATULATIONS: {
    success: string;
    withoutName: string;
    withName: (displayName: string) => string;
  };

  CELEBRATION_ANNOUNCEMENT: (donation: number, pol: PolData) => string;
  CELEBRATION_ANNOUNCEMENT_MOBILE: (donation: number, pol: PolData) => string;
  CELEBRATION_ANNOUNCEMENT_DEMO: (donation: number, pol: PolData) => string;

  SOCIALS: {
    taunt: (bill: string) => string;
    singleSponsor: string;
  };

  ESCROW_TOTAL: (amount: string) => string;
  ESCROW_TOTAL_SHARE: (amount: string) => string;

  TIP_TITLE: {
    consider: string;
    thankYou: string;
  };

  WHAT_HAPPENS_NOW: {
    trigger: (isDemoMode: boolean, bill: string) => string;
    next: string;
    status: CelebrationOutcome[];
  };

  HELP_ASK: {
    roles: string;
    lifeblood: string;
    contribute: string;
  };

  CONTACT_US: {
    contact: string;
    details: string;
  };

  PAC_LIMIT_INFO: {
    body: string;
    title: string;
    resetInfo: string;
  };
}

export const CONFIRMATION_COPY: ConfirmationCopy = {
  CONTRIBUTING_MODAL: {
    submit: 'Send',
    title: 'Become A Contributor',
    labelName: 'Name',
    labelEmail: 'Email',
    labelGitHub: 'GitHub profile or repo link',
    labelMessage: 'Message (optional)',
    success: "Thanks. We'll be in touch.",
    description:
      'Share your name, email, and GitHub so we can get back to you.',
  },

  CELEBRATION_ANNOUNCEMENT: (donation: number, pol: PolData) =>
    pol.chamber
      ? `Share your $${donation} Celebration with ${pol.chamber === 'House' ? 'Rep. ' : 'Sen. '} ${pol?.last_name} of ${pol?.state} to spread the word!`
      : `Share your ${donation ? `$${donation} ` : ''}Celebration to spread the word!`,

  CELEBRATION_ANNOUNCEMENT_MOBILE: (donation: number, pol: PolData) =>
    pol.chamber
      ? `${donation ? `$${donation} ` : ''}· ${
          pol.chamber === 'House' ? 'Rep. ' : 'Sen. '
        }${pol?.last_name} (${pol?.state})`
      : donation
        ? `$${donation} Celebration`
        : 'Your Celebration',

  CELEBRATION_ANNOUNCEMENT_DEMO: (donation: number, pol: PolData) =>
    pol?.last_name && pol?.state
      ? `Preview: You'd see a $${donation} celebration with ${pol?.chamber === 'House' ? 'Rep. ' : 'Sen. '} ${pol.last_name} of ${pol.state}.`
      : `Preview: Here's what you'd see after a real donation.`,

  CONGRATULATIONS: {
    withName: (displayName: string) => `Congratulations, ${displayName}!`,
    withoutName: 'Congratulations!',
    success: 'Your Celebration is stockpiled!',
  },

  SOCIALS: {
    taunt: (bill: string) =>
      ` I just made a campaign donation that you can't cash until action is taken on ${bill}! Learn how at @powerbackapp`,
    singleSponsor: '@jayapal.house.gov',
  },

  ESCROW_TOTAL: (amount: string) => `Their stockpiled total: ${amount}`,

  ESCROW_TOTAL_SHARE: (amount: string) =>
    ` They now have ${amount} in Celebrations in-waiting from the community.`,

  TIP_TITLE: {
    thankYou: 'Thanks for tipping',
    consider: 'How you can help',
  },

  WHAT_HAPPENS_NOW: {
    trigger: (isDemoMode: boolean, bill: string) =>
      isDemoMode
        ? `Your Celebration would be escrowed and withheld until the ${bill} is brought to the House floor for a vote.`
        : `Your Celebration is escrowed and withheld until the ${bill} is brought to the House floor for a vote.`,
    next: 'There can be three possible outcomes:',
    status: [
      {
        icon: 'check-circle-fill',
        label: 'delivered',
        description:
          'Victory! The bill is brought to the House floor for a vote, and your Celebration is delivered to the candidate.',
      },
      {
        icon: 'pause-fill text-warning',
        label: 'paused',
        description:
          'Something happens that takes your candidate off the ballot for the foreseeable future. Your Celebration is blocked until they are back on the campaign ballot.',
      },
      {
        icon: 'x-circle-fill text-light',
        label: 'expired',
        description:
          'Congress runs out of time and the session ends. Your condition was not met, and your Celebration is converted to a POWERBACK donation to help us continue our work.',
      },
    ],
  },

  HELP_ASK: {
    lifeblood: 'User support is the lifeblood of our service.',
    contribute: 'contribute',
    roles:
      'to the project as a developer, designer, or other professional. We also accept Bitcoin donations.',
  },

  CONTACT_US: {
    contact: 'Questions or billing issues? Email',
    details: 'with your name, billing ZIP code, and your time of donation.',
  },

  PAC_LIMIT_INFO: {
    title: 'PAC Contribution Limit Reached',
    body: 'You have reached your annual PAC contribution limit for this year. PAC contributions include tips and platform fees retained by',
    resetInfo:
      'Your annual PAC contribution limit will reset on January 1st of the next calendar year.',
  },
};
