/**
 * Copy registry for Account components
 */

import React from 'react';

interface AccountCopy {
  APP: {
    LOADING: string;
    CREDENTIALS: {
      TO_START: [string, string];
      AGREE: { 1: string; 2: string };
      SWITCH: [string, string];
      FORGOT_PW: string;
      FEEDBACK: {
        u: {
          in: string;
          up: string;
        };
        p: {
          in: string;
          up: string;
        };
        t: string;
      };
    };
    PROMOTION_ALERT_COPY: string;
    COMPLIANCE_TOOLTIPS: {
      guest: string;
      compliant: string;
    };
    COMPLIANCE_CTA: [string, string];
    ACCOUNT_TABS: Array<{
      key: number;
      topic: string;
      icon: string;
    }>;
    SECURITY_BUTTONS: [string, string];
    DELETE_ACCOUNT_PATTERN: string;
  };
  FORGOT_PW_OVERLAY: {
    heading: string;
    prompt: string;
    hint: string;
  };
  RESET: {
    uLabel: string;
    pLabel: string;
    buttonText: string;
    title: string;
    pFeedback: string;
    uFeedback: string;
    feedback: { 1: string; 2: string };
    lockedOut: string;
  };
  COMPLIANCE: {
    increaseButton: string;
    reminder: string;
  };
  SERVER_DOWN: {
    heading: string;
    message: string;
    caption: string;
    action: string;
  };
  CHECKOUT: {
    pendingHeading: string;
    checkoutLabel: string;
    donationLabel: string;
    surchargeLabel: string;
    totalLabel: string;
    loadingBill: string;
  };
  SUB_TOOLTIPS: {
    districtUpdates: string;
    electionUpdates: string;
    celebrationUpdates: string;
    billUpdates: string;
  };
  UNSUB: {
    MAGIC_USER_INTERACTION: {
      title: string;
      body: Array<string | ((topicName: string) => React.ReactNode)>;
      cta: (topicName: string) => React.ReactNode;
      buttons: {
        cancel: string;
        confirm: string;
      };
    };
  };
}

const createUnsubParagraph = (topicName: string): React.ReactNode => (
  <>
    We send <b>{topicName}</b> alerts to keep you informed about important
    changes that may affect your donations and compliance with FEC regulations.
  </>
);

export type AccountTab = 'Profile' | 'Celebrations' | 'Settings';

export const ACCOUNT_COPY: AccountCopy = {
  APP: {
    LOADING: 'Loading your account...',
    CREDENTIALS: {
      TO_START: ['Enter your ', 'You need a '],
      AGREE: { 1: 'I agree to the ', 2: 'terms of use' },
      SWITCH: ['Need an Account? Join Now', 'Have an Account? Sign In'],
      FORGOT_PW: 'Forgot Password?',
      FEEDBACK: {
        u: {
          in: 'Please enter your username email.',
          up: 'Enter your email address for the username.',
        },
        p: {
          in: 'Please enter your password to login.',
          up: 'Please choose a password to secure your account.',
        },
        t: 'I agree to the ',
      },
    },
    PROMOTION_ALERT_COPY:
      'Your profile information is now compliant with FEC regulations. You can now donate up to ',
    COMPLIANCE_TOOLTIPS: {
      guest:
        'Please update your account profile. You have not provided enough information to be compliant with FEC regulations. You may only donate up to ',
      compliant:
        'You have provided enough information to be fully FEC-compliant. You can now donate to the maximum the law allows: ',
    },
    COMPLIANCE_CTA: [
      'YOUR PROFILE IS COMPLETE. RAISE YOUR DONATION LIMIT TO ',
      ' PER CANDIDATE, PER ELECTION.',
    ],
    ACCOUNT_TABS: [
      { key: 1, topic: 'Profile', icon: 'person-circle' },
      { key: 2, topic: 'Celebrations', icon: 'piggy-bank' },
      { key: 3, topic: 'Settings', icon: 'gear' },
    ],
    SECURITY_BUTTONS: ['Change Password', 'Delete Account'],
    DELETE_ACCOUNT_PATTERN: 'GIVEPOWERBACK',
  },
  FORGOT_PW_OVERLAY: {
    heading: 'Request to change password',
    prompt: "Enter your account's Profile email.",
    hint: '(This may be same as your username)',
  },
  RESET: {
    uLabel: 'username',
    pLabel: 'NEW password',
    buttonText: 'Reset password',
    title: 'Set Your New Password',
    pFeedback: 'Please enter a new password.',
    uFeedback: 'Please enter the email address you use to login.',
    feedback: {
      1: 'User not authorized.',
      2: 'User not authorized. One more attempt until account is locked.',
    },
    lockedOut: 'Your account has been locked.',
  },
  COMPLIANCE: {
    increaseButton: 'INCREASE MY LIMIT',
    reminder: 'Please keep your information current.',
  },
  SERVER_DOWN: {
    heading: 'God Bless America.',
    message: 'The servers are down.',
    caption: 'No need for mass panic. This happens sometimes.',
    action:
      'Maybe write a letter to your House Representative. Or refresh the page and try again.',
  },
  CHECKOUT: {
    pendingHeading: 'Your Pending Celebration',
    checkoutLabel: 'CHECKOUT',
    donationLabel: 'Donation',
    surchargeLabel: 'Surcharge fee',
    totalLabel: 'TOTAL',
    loadingBill: 'Loading Bill...',
  },
  SUB_TOOLTIPS: {
    districtUpdates:
      'Seat vacancies or new challengers in your district, and other updates that could impact your donation limits or timing.',
    electionUpdates:
      'Election date changes, and other updates that could impact your donation limits or timing.',
    celebrationUpdates:
      'Notifies you when your Celebrations are delivered (resolved), put on hold due to a lack of challengers or vacancy (paused), or expired due to Congress closing session (defunct).',
    billUpdates:
      'Updates when H.J.Res.54 (We The People Amendment) has new activity, such as status or committee changes.',
  },
  UNSUB: {
    MAGIC_USER_INTERACTION: {
      title: 'UNSUBSCRIBE?',
      body: [
        (topicName) => createUnsubParagraph(topicName),
        () =>
          'These notifications help you stay up to date on election date changes, district challengers, and other updates that could impact your donation limits or timing.',
        (topicName) => (
          <>
            If you Unsubscribe, you will stop receiving<b>{topicName}</b>{' '}
            alerts.You can manage your email preferences at any time from your
            Account settings.
          </>
        ),
      ],
      cta: (topicName: string) => (
        <>
          Unsubscribe from <b>{topicName}</b> alerts?
        </>
      ),
      buttons: {
        cancel: 'Stay Informed',
        confirm: 'Unsubscribe',
      },
    },
  },
};
