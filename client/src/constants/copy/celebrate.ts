/**
 * Copy registry for Celebrate flow components
 * Centralized source of truth for UX strings and tooltips
 */

import { FEC } from '../constants';
import accounting from 'accounting';

interface CelebrateCopy {
  DONATION_PROMPT: {
    body: string;
  };
  DONATION_INPUT: {
    helper: (remaining: string) => string;
    clampTooltip: string;
    placeholder: string;
    placeholderMobile: string;
  };
  LIMIT_MODAL: {
    donation: {
      subtitle: string;
      bodyInsert: string;
      ctaHelper: string;
    };
    tip: {
      title: string;
      subtitle: string;
      disclaimer: string;
      explanation: () => string;
      ctaHelper: string;
    };
  };
  PAYMENT: {
    title: string;
    helper: string;
  };
  TIP_ASK: {
    helper: () => string;
    formInfo: [string, string];
  };
  POL_CAROUSEL: {
    escrowTooltip: [string, string];
  };
  CONTINUE_BTN: {
    disabledHover: string;
  };
  AMOUNT: {
    guest: string;
    reached: string;
    exceeds: [string, string];
  };
  CHECKOUT: {
    statement: string;
  };
  CELEBRATION_SCREEN_LOAD_HEADER: string;
}

export const CELEBRATE_COPY: CelebrateCopy = {
  DONATION_PROMPT: {
    body: 'Celebrations are stockpiled instantly and count toward your limit immediately, even while pending.',
  },
  DONATION_INPUT: {
    helper: (remaining: string) =>
      `Your remaining limit for this election is ${remaining}. Any existing celebrations (even pending) already count toward this limit.`,
    clampTooltip:
      'We set your amount to your remaining limit. Celebrations are stockpiled instantly and count immediately. This prevents over-pledging.',
    placeholder: 'Enter amount',
    placeholderMobile: '00.00',
  },
  LIMIT_MODAL: {
    donation: {
      subtitle: 'Stockpiling applies immediately',
      bodyInsert:
        'Because we stockpile user Celebrations together, they count toward your limit the moment you pledge - even while pending. Your remaining limit is ',
      ctaHelper: `Complete your profile to donate up to ${accounting.formatMoney(FEC.COMPLIANCE_TIERS.compliant.perDonationLimit(), '$', 0)}.`,
    },
    tip: {
      title: 'PAC Contribution Limit Reached',
      subtitle: 'Annual PAC limit applies to tips',
      disclaimer: 'Tips count toward this limit immediately.',
      explanation: () =>
        `Under FEC rules, tips are considered PAC contributions subject to a ${accounting.formatMoney(
          FEC.PAC_ANNUAL_LIMIT,
          '$',
          0
        )} annual limit. This prevents over-contribution.`,
      ctaHelper: 'Tips support our operations and are not tax deductible.',
    },
  },
  PAYMENT: {
    title: 'What happens next',
    helper:
      'After payment, your Celebration is immediately added to the donation stockpile withheld for this candidate, which is automatically deployed to their campaign if and only if the Condition is fulfilled.',
  },
  TIP_ASK: {
    helper: () =>
      `Tips support POWERBACK.us and are subject to a ${accounting.formatMoney(
        FEC.PAC_ANNUAL_LIMIT,
        '$',
        0
      )} annual PAC contribution limit.`,
    formInfo: ['Tips made directly to', 'are not tax deductible.'],
  },
  POL_CAROUSEL: {
    escrowTooltip: [
      ' total value of Celebrations in-waiting across the community.',
      'Individual limits still apply, and your stockpiled Celebration counts immediately.',
    ],
  },
  CONTINUE_BTN: {
    disabledHover:
      'Choose a member and an amount that fits within your remaining limit.',
  },
  AMOUNT: {
    guest:
      'Anonymous donors face strict FEC limits with an annual limit across all candidates. Complete your Account profile to unlock per-candidate limits and maximize your political impact.',
    reached:
      'You have already reached your personal limit for giving to this candidate. However, you are free to choose another candidate.',
    exceeds: [
      "The amount you've chosen exceeds your remaining personal limit (",
      ') for this candidate during this campaign cycle.',
    ],
  },
  CHECKOUT: {
    statement:
      ' is the only independent campaign donation platform that demands urgent change backed by millions of Americans.',
  },
  CELEBRATION_SCREEN_LOAD_HEADER:
    'START A CELEBRATION BY CHOOSING A REPRESENTATIVE AND CASH AMOUNT.',
};
