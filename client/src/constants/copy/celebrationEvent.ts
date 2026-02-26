/**
 * Copy registry for Celebration Event components
 * Centralized source of truth for celebration status messages and tooltips
 */

interface CelebrationEventCopy {
  STATUS: {
    TOOLTIPS: {
      DEFUNCT: string;
      PAUSED: string;
      RESOLVED: string;
    };
    ICONS: {
      DEFUNCT: string;
      PAUSED: string;
      RESOLVED: string;
    };
  };
  LABELS: {
    DATE: string;
    TIME: string;
    ID: string;
    BILL_ID: string;
    DONATION_AMOUNT: string;
  };
}

export const CELEBRATION_EVENT_COPY: CelebrationEventCopy = {
  STATUS: {
    TOOLTIPS: {
      DEFUNCT:
        'The Congressional session for this Celebration ended before the contingency was resolved.',
      PAUSED:
        "This politician used to have serious challenger(s) running against them, but the seat has since become safe. Everyone's Celebrations for them have been paused until they have a challenger again.",
      RESOLVED: 'This celebration has been Resolved! Time to Celebrate!',
    },
    ICONS: {
      DEFUNCT: 'x-circle',
      PAUSED: 'pause',
      RESOLVED: 'check-circle',
    },
  },
  LABELS: {
    DATE: 'date',
    TIME: 'time',
    ID: 'id',
    BILL_ID: 'Bill ID',
    DONATION_AMOUNT: 'Donation Amount',
  },
};
