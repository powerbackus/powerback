import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '@Contexts';
import { RouteProvider } from './router';
import App from './App';

// Avoid pulling react-bootstrap ESM through Navigation → Page subtree in Jest (no CRA transform whitelist)
jest.mock('@Components/page', () => ({
  Navigation: () => null,
  Footer: () => null,
}));

jest.mock('@Pages', () => ({
  ErrorBoundary: ({ children }) => <>{children}</>,
  Page: () => null,
}));

/**
 * Passed to AppProviders — must satisfy Profile / compliance bootstrap.
 */
/** Axios-shaped 401 for refresh bootstrap (CRA Jest resetMocks resets fn impls each test). */
const refreshUnauthorized = Object.assign(new Error('Unauthorized'), {
  response: { status: 401 },
  isAxiosError: true,
});

const testServerConstants = {
  APP: {
    SETTINGS: {
      unsubscribedFrom: [],
      emailReceipts: true,
      showToolTips: true,
      autoTweet: false,
    },
    MIN_PASSWORD_LENGTH: 8,
  },
  FEC: {
    PAC_ANNUAL_LIMIT: 5000,
    COMPLIANCE_TIERS: {
      guest: {
        perDonationLimit: () => 50,
        annualCap: () => 200,
        resetTime: 'midnight_est',
        resetType: 'annual',
      },
      compliant: {
        perDonationLimit: () => 3500,
        perElectionLimit: () => 3500,
        resetTime: 'election_date',
        resetType: 'election_cycle',
      },
    },
  },
  STRIPE: {
    FEES: {
      PERCENTAGE: 0.03,
      ADDEND: 0.3,
    },
  },
};

jest.mock('@API', () => {
  /* Same FEC shape as AppProviders prop (duplicate for Jest mock hoisting) */
  const constantsForBootstrap = {
    APP: {
      SETTINGS: {
        unsubscribedFrom: [],
        emailReceipts: true,
        showToolTips: true,
        autoTweet: false,
      },
      MIN_PASSWORD_LENGTH: 8,
    },
    FEC: {
      PAC_ANNUAL_LIMIT: 5000,
      COMPLIANCE_TIERS: {
        guest: {
          perDonationLimit: () => 50,
          annualCap: () => 200,
          resetTime: 'midnight_est',
          resetType: 'annual',
        },
        compliant: {
          perDonationLimit: () => 3500,
          perElectionLimit: () => 3500,
          resetTime: 'election_date',
          resetType: 'election_cycle',
        },
      },
    },
    STRIPE: {
      FEES: {
        PERCENTAGE: 0.03,
        ADDEND: 0.3,
      },
    },
  };

  const unauthorized = Object.assign(new Error('Unauthorized'), {
    response: { status: 401 },
    isAxiosError: true,
  });

  return {
    __esModule: true,
    default: {
      getConstants: jest.fn(() =>
        Promise.resolve({
          data: constantsForBootstrap,
        })
      ),
      refreshToken: jest.fn(() => Promise.reject(unauthorized)),
      login: jest.fn(() => Promise.reject(unauthorized)),
      logout: jest.fn(() => Promise.resolve()),
      getUserData: jest.fn(() => Promise.reject(unauthorized)),
      getCelebrationsByUserId: jest.fn(() => Promise.resolve({ data: [] })),
      checkPrivilege: jest.fn(() => Promise.resolve({ data: false })),
    },
  };
});

jest.mock('@Utils', () => {
  const actual = jest.requireActual('@Utils');
  return {
    ...actual,
    fetchAndCacheElectionDates: jest.fn(() => Promise.resolve()),
    trackGoogleAnalyticsEvent: jest.fn(),
  };
});

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    const API = require('@API').default;
    API.getConstants.mockResolvedValue({ data: testServerConstants });
    API.refreshToken.mockRejectedValue(refreshUnauthorized);
    API.login.mockRejectedValue(refreshUnauthorized);
    API.getUserData.mockRejectedValue(refreshUnauthorized);
    API.getCelebrationsByUserId.mockResolvedValue({ data: [] });
    API.checkPrivilege.mockResolvedValue({ data: false });
    API.logout.mockResolvedValue(undefined);
  });

  it('renders skip link after auth bootstrap (guest)', async () => {
    render(
      <RouteProvider>
        <AppProviders serverConstants={testServerConstants}>
          <App />
        </AppProviders>
      </RouteProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
    });
  });
});
