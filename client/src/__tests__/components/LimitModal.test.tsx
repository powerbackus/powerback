import React, { useEffect } from 'react';
import { render, screen, within } from '@testing-library/react';
import LimitModal from '../../pages/Funnel/modals/Limit/Limit';
import { ComplianceTierProvider } from '@Contexts/ComplianceTierContext';
import { DonationLimitsProvider } from '@Contexts/DonationLimitsContext';
import { DonationStateProvider } from '@Contexts/DonationStateContext';
import { DialogueProvider, useDialogue } from '@Contexts/DialogueContext';
import type { ShowModal } from '../../contexts/types';

/** Legacy test labels: only guest vs compliant exist in app compliance. */
const legacyTierToCompliance = (tier?: string): 'guest' | 'compliant' =>
  tier === 'gold' ? 'compliant' : 'guest';

jest.mock('../../contexts/ElectionCycleContext', () => {
  const actual = jest.requireActual('../../contexts/ElectionCycleContext');
  return {
    ...actual,
    useElectionCycle: () => ({
      currentCycle: {
        currentElectionType: null,
        isInElectionCycle: false,
        nextElectionDate: null,
        cycleStartDate: new Date('2026-01-01'),
        cycleEndDate: new Date('2026-12-31'),
      },
      isLoading: false,
      currentState: null,
      currentPolId: null,
      setElectionCyclePolitician: jest.fn(),
      recalculateCycle: jest.fn(),
    }),
  };
});

jest.mock('../../contexts/AuthContext', () => {
  const { INIT } = jest.requireActual('../../constants');
  const actual = jest.requireActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: jest.fn(() => ({
      userData: { ...INIT.userData, donations: [] },
      isLoggedIn: false,
      isInitializing: false,
      isLoggingIn: false,
      authIn: jest.fn(),
      authOut: jest.fn(),
      setUserData: jest.fn(),
      refreshUserData: jest.fn(async () => undefined),
      refreshUserPrivileges: jest.fn(async () => undefined),
    })),
  };
});

/** DialogueProvider initializes with INIT.modals (limit hidden); flip limit on mount. */
const OpenLimitModal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setShowModal } = useDialogue();
  useEffect(() => {
    setShowModal((prev: ShowModal) => ({ ...prev, limit: true }));
  }, [setShowModal]);
  return <>{children}</>;
};

// Extend real constants so INIT and other exports stay defined (Contexts load via barrels)
jest.mock('@CONSTANTS', () => {
  const actual = jest.requireActual('../../constants');
  const COMPLIANCE_TIERS_TEST = {
    bronze: {
      perDonationLimit: () => 50,
      annualCap: () => 200,
    },
    silver: {
      perDonationLimit: () => 200,
      annualCap: () => 200,
    },
    gold: {
      perDonationLimit: () => 3500,
      perElectionLimit: () => 3500,
    },
  };

  return {
    ...actual,
    FEC: {
      ...actual.FEC,
      COMPLIANCE_TIERS: {
        ...actual.FEC.COMPLIANCE_TIERS,
        ...COMPLIANCE_TIERS_TEST,
      },
      NAME: 'Federal Election Commission',
      LAW_UNDER: 'Federal Election Campaign Act',
      NOTICE_HEADING: 'FEC Notice',
      URI: ['https://www.fec.gov/example1', 'https://www.fec.gov/example2'],
    },
  };
});

// Mock accounting library
jest.mock('accounting', () => ({
  formatMoney: (amount: number) => `$${amount}`,
}));

/** Citations may omit URIs from fixtures — avoid addTrackingParams on undefined URLs */
jest.mock('../../utils/tracking/linkTracking', () => ({
  ...jest.requireActual('../../utils/tracking/linkTracking'),
  getTrackedLink: (
    uri: string | undefined,
    ..._rest: unknown[]
  ): {
    trackedUrl: string;
    onClick: (e?: { preventDefault: () => void }) => void;
  } => ({
    trackedUrl:
      uri && /^https?:\/\//u.test(uri) ? uri : 'https://www.fec.gov/example',
    onClick: (): void => undefined,
  }),
}));

const TestWrapper: React.FC<{
  children: React.ReactNode;
  complianceTier?: string;
}> = ({ children, complianceTier = 'bronze' }) => (
  <ComplianceTierProvider
    userCompliance={legacyTierToCompliance(complianceTier)}
  >
    <DonationLimitsProvider
      tipLimitReached={false}
      userDonations={[]}
    >
      <DonationStateProvider userDonations={[]}>
        <DialogueProvider>
          <OpenLimitModal>{children}</OpenLimitModal>
        </DialogueProvider>
      </DonationStateProvider>
    </DonationLimitsProvider>
  </ComplianceTierProvider>
);

describe('LimitModal', () => {
  const defaultProps = {
    message: 'Test limit message',
    attemptedAmount: 100,
    currentAnnualTotal: 0,
    currentElectionTotal: 0,
    isPACLimit: false,
  };

  beforeEach(() => {
    /** CRA jest resetMocks: true clears mockReturnValue unless reset each run */
    const { INIT } = jest.requireActual(
      '../../constants'
    ) as typeof import('../../constants');
    const AuthContext = jest.requireMock(
      '../../contexts/AuthContext'
    ) as typeof import('../../contexts/AuthContext');
    jest.mocked(AuthContext.useAuth).mockReturnValue({
      userData: { ...INIT.userData, donations: [] },
      isLoggedIn: false,
      isInitializing: false,
      isLoggingIn: false,
      authIn: jest.fn(),
      authOut: jest.fn(),
      setUserData: jest.fn(),
      refreshUserData: jest.fn(async () => undefined),
      refreshUserPrivileges: jest.fn(async () => undefined),
    });
  });

  describe('Bronze Tier Display', () => {
    it('should display guest donation limit copy (bronze maps to guest)', async () => {
      render(
        <TestWrapper complianceTier='bronze'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={250}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per donation/i);
      expect(dialog.textContent).toMatch(/Anonymous individuals/);
    });

    it('should reference total annual cap when guest annual aggregation exceeds cap', async () => {
      render(
        <TestWrapper complianceTier='bronze'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={50}
            currentAnnualTotal={160}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/total annual cap/)).toBeInTheDocument();
    });
  });

  describe('Silver Tier Display', () => {
    it('maps legacy silver label to guest (same compliance branch as bronze)', async () => {
      render(
        <TestWrapper complianceTier='silver'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={250}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per donation/i);
      expect(dialog.textContent).toMatch(/Anonymous individuals/);
    });
  });

  describe('Gold Tier Display', () => {
    it('should display compliant copy when hitting per-donation limit', async () => {
      render(
        <TestWrapper complianceTier='gold'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={4000}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per candidate per election/);
      expect(dialog.textContent).toMatch(/\$3500/);
    });

    it('should surface compliant messaging when cumulative election totals exceed cap', async () => {
      render(
        <TestWrapper complianceTier='gold'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={500}
            currentElectionTotal={3200}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per candidate per election/);
      expect(dialog.textContent).toMatch(/\$3500/);
    });

    it('handles high attempted amounts with compliant election totals', async () => {
      render(
        <TestWrapper complianceTier='gold'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={2501}
            currentElectionTotal={1000}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per candidate per election/);
      expect(dialog.textContent).toMatch(/\$3500/);
    });
  });

  describe('PAC Limit Display', () => {
    it('shows PAC-aware heading and FEC annual limit framing', async () => {
      render(
        <TestWrapper>
          <LimitModal
            {...defaultProps}
            isPACLimit={true}
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/PAC Contribution Limit Reached/);
      expect(dialog.textContent).toMatch(/Annual PAC limit applies to tips/);
      expect(dialog.textContent).toMatch(/\$5000/);
    });
  });

  describe('Compliance Tier Differences', () => {
    it('shows guest donation scope labels before compliant totals', async () => {
      const { rerender } = render(
        <TestWrapper complianceTier='bronze'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={75}
          />
        </TestWrapper>
      );

      let dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per donation/i);

      rerender(
        <TestWrapper complianceTier='gold'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={4000}
          />
        </TestWrapper>
      );

      dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/per candidate per election/);
    });

    it('shows guest profile CTA for limits that hide after compliance', async () => {
      const { rerender } = render(
        <TestWrapper complianceTier='bronze'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={75}
          />
        </TestWrapper>
      );

      let dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).toMatch(/Complete your/);
      expect(dialog.textContent).toMatch(/profile/);

      rerender(
        <TestWrapper complianceTier='gold'>
          <LimitModal
            {...defaultProps}
            attemptedAmount={4000}
          />
        </TestWrapper>
      );

      dialog = await screen.findByRole('dialog');
      expect(dialog.textContent).not.toMatch(/Complete your/);
    });
  });

  describe('Modal Interactions', () => {
    it('should render agree button', async () => {
      render(
        <TestWrapper>
          <LimitModal {...defaultProps} />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('button', { name: /^Agree$/i })
      ).toBeInTheDocument();
    });

    it('should display the custom message', async () => {
      render(
        <TestWrapper>
          <LimitModal
            {...defaultProps}
            message='Custom test message'
          />
        </TestWrapper>
      );

      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByText('Custom test message')
      ).toBeInTheDocument();
    });
  });
});
