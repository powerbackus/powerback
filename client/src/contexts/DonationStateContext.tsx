/**
 * Donation state context. Donation amount, selected pol, tip, payment method.
 * @module DonationStateContext
 */
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  type ReactNode,
} from 'react';
import {
  useAuth,
  type PolData,
  useElectionCycle,
  useComplianceTier,
} from '@Contexts';
import { nanoid } from 'nanoid';
import type { Bill } from '@Interfaces';
import type { Celebration } from '@Types';
import { INIT, APP, FEC } from '@CONSTANTS';
import { logWarn } from '@Utils';

export type CredentialsPath = 'Sign In' | 'Join Now' | '';

/**
 * Core donation state shared across components
 *
 * Structure-focused behavior:
 * - Persists `tip` to localStorage on change (`pb:tipAmount`) so refreshes can
 *   rehydrate UI quickly without visual jumps.
 * - `selectPol` now updates election cycle context and, for compliant users,
 *   clamps the current donation to the candidate's remaining per-election limit
 *   to prevent invalid UI states.
 */
interface DonationState {
  /** Platform tip amount */
  tip: number;
  /** Selected politician data */
  polData: PolData;
  /** Current condition for the celebration to fund */
  condition: string;
  /** Current donation amount */
  donation: number;
  /** Selected politician ID */
  selectedPol: string | null;
  /** Current credentials path (Sign In/Join Now) */
  credentialsPath: CredentialsPath;
  /** Stripe payment method ID for reuse */
  paymentMethodId: string | null;
  /** Whether payment form is disabled (card incomplete) */
  paymentFormDisabled: boolean;
}

/**
 * Actions for managing donation state
 */
interface DonationActions {
  /** Set platform tip */
  setTip: (amount: number) => void;
  /** Select politician and update data */
  selectPol: (pol: PolData) => void;
  /** Reset selected pol state */
  resetSelectedPol: () => void;
  /** Set donation amount */
  setDonation: (amount: number) => void;
  /** Set selected politician */
  setSelectedPol: (polId: string | null) => void;
  /** Reset donation state */
  resetDonationState: () => void;
  /** Set credentials path */
  setCredentialsPath: (path: CredentialsPath) => void;
  /** Set payment method ID */
  setPaymentMethodId: (id: string | null) => void;
  /** Set payment form disabled state */
  setPaymentFormDisabled: (disabled: boolean) => void;
  /** Set condition for the celebration to fund */
  setCondition: (condition: string) => void;
  /** Create donation package with external parameters */
  createDonationPackage: (bill?: Bill, userId?: string) => Celebration;
}

const DonationStateContext = createContext<DonationState & DonationActions>({
  // Default state
  tip: 0,
  donation: 0,
  selectedPol: null,
  credentialsPath: '',
  paymentMethodId: null,
  polData: INIT.honestPol,
  condition: INIT.condition,
  paymentFormDisabled: true,
  // Default actions
  setSelectedPol: () => logWarn('setSelectedPol called outside provider'),
  setCondition: () => logWarn('setCondition called outside provider'),
  setDonation: () => logWarn('setDonation called outside provider'),
  selectPol: () => logWarn('selectPol called outside provider'),
  setPaymentFormDisabled: () =>
    logWarn('setPaymentFormDisabled called outside provider'),
  setTip: () => logWarn('setTip called outside provider'),
  resetDonationState: () =>
    logWarn('resetDonationState called outside provider'),
  setCredentialsPath: () =>
    logWarn('setCredentialsPath called outside provider'),
  setPaymentMethodId: () =>
    logWarn('setPaymentMethodId called outside provider'),
  resetSelectedPol: () => logWarn('resetSelectedPol called outside provider'),
  createDonationPackage: () => ({}) as Celebration,
});

interface DonationStateProviderProps {
  userDonations?: Celebration[];
  children: ReactNode;
}

export function DonationStateProvider({
  userDonations = [],
  children,
}: DonationStateProviderProps) {
  /* State */
  const [condition, setCondition] = useState<string>(INIT.condition),
    [donation, setDonation] = useState(0),
    [tip, setTip] = useState(0);
  const prevTipRef = useRef(tip);

  useEffect(() => {
    if (prevTipRef.current !== tip) {
      prevTipRef.current = tip;
      localStorage.setItem('pb:tipAmount', tip.toString());
    }
  }, [tip]);

  /* Hooks */
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null),
    [paymentFormDisabled, setPaymentFormDisabled] = useState<boolean>(true),
    [credentialsPath, setCredentialsPath] = useState<CredentialsPath>(''),
    [selectedPol, setSelectedPol] = useState<string | null>(null),
    [polData, setPolData] = useState<PolData>(INIT.honestPol);

  /* Election Cycle Context */
  const electionCycleContext = useElectionCycle();
  const { setElectionCyclePolitician } = electionCycleContext;
  /* Compliance Tier Context */
  const { userCompliance } = useComplianceTier();

  const selectPol = useCallback(
    (pol: PolData) => {
      setPolData(pol);
      setSelectedPol(pol.id);
      // Update election cycle context with the selected politician
      setElectionCyclePolitician(pol);

      // For compliant tier, calculate remaining limit for this specific candidate
      if (userCompliance === 'compliant') {
        const perElectionLimit =
          FEC.COMPLIANCE_TIERS.compliant.perElectionLimit();

        // Calculate donations to this specific candidate
        const donationsToThisCandidate = (userDonations || []).filter(
          (d: Celebration) => {
            if (d.defunct || d.paused) return false;
            if (d.pol_id !== pol.id) return false;
            return true;
          }
        );

        const totalDonatedToThisCandidate = donationsToThisCandidate.reduce(
          (sum: number, d: Celebration) => sum + (d.donation || 0),
          0
        );

        const remainingLimit = Math.max(
          0,
          perElectionLimit - totalDonatedToThisCandidate
        );

        // Check if current donation amount exceeds the new candidate's remaining limit
        if (donation > remainingLimit) {
          setDonation(remainingLimit);
        }
      }
      // For the guest non-compliant tier, the limit is annual across all candidates
      // so we don't need to adjust when switching candidates
    },
    [
      donation,
      setPolData,
      setDonation,
      userDonations,
      setSelectedPol,
      userCompliance,
      setElectionCyclePolitician,
    ]
  );

  const {
    userData: { tipLimitReached },
  } = useAuth();

  /**
   * Creates the donation package for API calls
   *
   * Creates a complete celebration object with all necessary data
   * for payment processing and celebration creation.
   *
   * @param {Bill} [bill] - Bill object for the celebration
   * @param {string} [userId] - User ID for the donation
   * @returns {Celebration} Complete celebration object
   */
  const createDonationPackage = useCallback(
    (bill?: Bill, userId?: string) => {
      // Get user data to check PAC limit status
      const shouldSendTip = !tipLimitReached;

      return {
        pol_id: selectedPol ?? polData?.id ?? '',
        donatedBy: userId ?? 'donatedBy ?',
        tip: shouldSendTip ? (tip ?? 0) : 0, // Send 0 tip if PAC limit reached
        payment_method: paymentMethodId,
        pol_name:
          polData?.name ??
          `${polData?.first_name || ''} ${polData?.last_name || ''}`.trim(),
        bill_id: bill?.bill_id ?? '',
        idempotencyKey: nanoid(),
        donation: donation ?? 0,
        ...polData,
      } as Celebration;
    },
    [tip, polData, donation, selectedPol, paymentMethodId, tipLimitReached]
  );

  const resetSelectedPol = useCallback(() => {
    setElectionCyclePolitician(null); // null election cycle politician
    setCondition(INIT.condition); // 'To be brought to the floor of the House of Representatives for a roll call vote.'
    setPolData(INIT.honestPol); // honest polData
    setPaymentMethodId(null); // empty string payment method ID
    setPaymentFormDisabled(true); // reset payment form to disabled
    setCredentialsPath(''); // close credentials modal
    setSelectedPol(null); // null selected pol
  }, [
    setElectionCyclePolitician,
    setPaymentFormDisabled,
    setPaymentMethodId,
    setCredentialsPath,
    setSelectedPol,
    setCondition,
    setPolData,
  ]);

  const resetDonationState = useCallback(() => {
    resetSelectedPol();
    setDonation(0); // 0 donation
    setTip(0); // 0 tip

    // Clear localStorage items to keep state and storage in sync
    localStorage.removeItem('pb:' + APP.STORE[0]); // choicePol
    localStorage.removeItem('pb:' + APP.STORE[1]); // choiceAmt
    localStorage.removeItem('pb:' + APP.STORE[2]); // tipAmount
  }, [setTip, setDonation, resetSelectedPol]);

  return (
    <DonationStateContext.Provider
      value={useMemo(
        () => ({
          tip,
          polData,
          donation,
          condition,
          selectedPol,
          credentialsPath,
          paymentMethodId,
          paymentFormDisabled,
          setTip,
          selectPol,
          setDonation,
          setCondition,
          setSelectedPol,
          resetSelectedPol,
          resetDonationState,
          setCredentialsPath,
          setPaymentMethodId,
          createDonationPackage,
          setPaymentFormDisabled,
        }),
        [
          tip,
          polData,
          donation,
          condition,
          selectedPol,
          credentialsPath,
          paymentMethodId,
          paymentFormDisabled,
          setTip,
          selectPol,
          setDonation,
          setCondition,
          setSelectedPol,
          resetSelectedPol,
          resetDonationState,
          setCredentialsPath,
          setPaymentMethodId,
          createDonationPackage,
          setPaymentFormDisabled,
        ]
      )}
    >
      {children}
    </DonationStateContext.Provider>
  );
}

export function useDonationState() {
  return useContext(DonationStateContext);
}
