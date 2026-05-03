/**
 * Donation funnel with tabs (Lobby, TipAsk, Payment, Confirmation).
 * @module Funnel
 */
import React, {
  useRef,
  useMemo,
  Suspense,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  useLayoutEffect,
  type SetStateAction,
} from 'react';
import type { Celebration, CelebrationRejection, NavigationProp } from '@Types';
import { Button, Container, TabContainer } from 'react-bootstrap';
import { logError, trackGoogleAnalyticsEvent } from '@Utils';
import Joyride, { type CallBackProps } from 'react-joyride';
import { useRoute, routes } from '../../router';
import { useIsDemoMode } from '../../demoMode';
import { WE_THE_PEOPLE } from '@CONSTANTS';
import type { Bill } from '@Interfaces';
import TabContents from './TabContents';
import type { Route } from 'type-route';
import { useParade } from '@Hooks';
import {
  useFunnelNavigationSync,
  useInitialPolsOnParade,
  useFunnelTours,
} from './hooks';
import {
  useAuth,
  useDevice,
  useDialogue,
  useNavigation,
  useDonationState,
  useDonationLimits,
  useComplianceTier,
  type FunnelView,
  type ShowAlert,
  type ShowModal,
} from '@Contexts';
import './style.css';

/**
 * Custom tooltip for Celebration tour: matches default Joyride structure so
 * existing .react-joyride__tooltip CSS applies. On mobile only, adds an
 * "Open Account" button so the user can open the sidebar Account from the tour.
 * Root must spread tooltipProps (including ref) for react-joyride.
 */
function CelebrationTooltip({
  openAccount,
  primaryProps,
  tooltipProps,
  isDesktop,
  isDemo,
  index,
  step,
}: {
  step: {
    styles?: Record<string, React.CSSProperties>;
    content: React.ReactNode;
    [key: string]: unknown;
  };
  primaryProps: Record<string, unknown>;
  tooltipProps: Record<string, unknown>;
  openAccount: () => void;
  isDesktop: boolean;
  isDemo?: boolean;
  index: number;
}) {
  const styles = step.styles ?? {};
  const showOpenAccount = index === 0 && !isDesktop && !isDemo;

  return (
    <div
      className={'react-joyride__tooltip'}
      style={styles.tooltip}
      {...tooltipProps}
    >
      <div style={styles.tooltipContainer}>
        <div style={styles.tooltipContent}>
          {step.content}
          {showOpenAccount && (
            <div className='mt-2'>
              <Button
                variant={'outline-secondary'}
                onClick={openAccount}
                type={'button'}
                size={'sm'}
              >
                Open Account
              </Button>
            </div>
          )}
        </div>
      </div>
      <div style={styles.tooltipFooter}>
        <div style={styles.tooltipFooterSpacer} />
        <button
          type='button'
          style={styles.buttonNext}
          {...primaryProps}
        />
      </div>
    </div>
  );
}

/**
 * Lazy-loaded modal components to reduce initial bundle size
 */
const ContributingModal = React.lazy(() => import('./modals/Contributing')),
  AccountModal = React.lazy(() => import('./modals/Account')),
  LimitModal = React.lazy(() => import('./modals/Limit'));

/**
 * Main funnel page component that orchestrates the donation and tip flow
 *
 * This component serves as the central hub for the funnel experience,
 * managing user interactions, modal states, tour functionality, and navigation
 * between different tabs (donations, tips, confirmation). It coordinates data
 * fetching, state management, and user interface rendering.
 *
 * @component
 * @param {FunnelProps} props - Component props passed from parent
 *
 * @example
 * ```tsx
 * <Funnel
 *   // Props are spread from parent component
 * />
 * ```
 */

type FunnelProps = {
  bill?: Bill;
  restorePolsOnParade?: () => void;
  setLimitMessage?: Dispatch<SetStateAction<string>>;
} & NavigationProp;

const JOYRIDE_GA_EVENTS = {
  STEP_VIEWED: 'joyride_step_viewed',
  INTERACTED: 'joyride_interacted',
  FINISHED: 'joyride_finished',
  SKIPPED: 'joyride_skipped',
  STARTED: 'joyride_started',
} as const;

type JoyrideGAEvent =
  (typeof JOYRIDE_GA_EVENTS)[keyof typeof JOYRIDE_GA_EVENTS];

const JOYRIDE_ACTIONS = [
  'beacon_clicked',
  'next',
  'prev',
  'skip',
  'close',
] as const;

type JoyrideAction = (typeof JOYRIDE_ACTIONS)[number];

const isJoyrideAction = (value: string): value is JoyrideAction =>
  JOYRIDE_ACTIONS.includes(value as JoyrideAction);

type JoyrideTrackingParams = {
  tour_final_step_index?: number;
  joyride_action?: JoyrideAction;
  joyride_lifecycle?: string;
  tour_step_target?: string;
  tour_step_title?: string;
  tour_step_index?: number;
  joyride_type?: string;
  tour_name: string;
};

const trackJoyrideGAEvent = (
  eventName: JoyrideGAEvent,
  params: JoyrideTrackingParams
) => {
  trackGoogleAnalyticsEvent(eventName, params);
};

const Funnel = ({ setActiveKey, ...props }: FunnelProps) => {
  /**
   * Funnel steps in order
   */
  const FUNNEL: FunnelView[] = useMemo(
    () => ['pol-donation', 'payment', 'tips', 'confirmation'],
    []
  );

  /**
   * Parade state and actions for managing politician data
   * Provides search, filtering, and restoration capabilities
   */
  const [
    polsOnParade,
    {
      setPolsOnParade,
      searchPolsByName,
      searchPolsByState,
      restorePolsOnParade,
      searchPolsByLocation,
    },
  ] = useParade();

  useInitialPolsOnParade(polsOnParade, setPolsOnParade);
  const isDemoMode = useIsDemoMode();

  /**
   * Bill data for the current celebration context
   * Currently hardcoded to WE_THE_PEOPLE (hjres54)
   */
  const [bill] = useState<Bill>(WE_THE_PEOPLE);

  /**
   * Context hooks for managing application state and user interactions
   */
  const { showModal, showOverlay, setShowAlert, setShowModal } = useDialogue(),
    { isDesktop } = useDevice(),
    { funnel: tabKey, navContext, navigateToFunnel } = useNavigation(),
    {
      wouldExceedLimits,
      effectiveLimits,
      openDonationLimitModal,
      getRemainingDonationLimit,
    } = useDonationLimits(),
    { donation, selectedPol, setDonation } = useDonationState(),
    { userCompliance } = useComplianceTier(),
    {
      userData: { id: userId, donations },
      isLoggedIn,
    } = useAuth();

  /**
   * Track previous login state to detect login completion
   * Used to trigger post-login validation and navigation
   */
  const prevIsLoggedInRef = useRef(isLoggedIn);

  /**
   * Handles post-login validation and navigation
   * Validates donation limits when user logs in with a pending donation selection
   * Auto-adjusts donation amount if over limit, or navigates to payment if valid
   */
  useEffect(() => {
    const justLoggedIn = !prevIsLoggedInRef.current && isLoggedIn;
    prevIsLoggedInRef.current = isLoggedIn;

    // Check if user just logged in and has a pending celebration selection
    const hasPendingCelebration =
      justLoggedIn &&
      donation &&
      selectedPol &&
      navContext === 'funnel' &&
      tabKey === 'pol-donation';

    if (hasPendingCelebration) {
      // Calculate current totals from donations for accurate limit checking
      // For guest: calculate annual total
      // For compliant: calculate election total for selected candidate
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      let currentAnnualTotal = 0;
      let currentElectionTotal = 0;

      if (userCompliance === 'guest') {
        // Calculate annual total from donations this year
        const donationsThisYear = (donations || []).filter((d: Celebration) => {
          if (d.defunct || d.paused) return false;
          const donationDate = new Date(d.createdAt as unknown as string);
          return donationDate >= startOfYear && donationDate <= endOfYear;
        });
        currentAnnualTotal = donationsThisYear.reduce(
          (sum: number, d: Celebration) => sum + (d.donation || 0),
          0
        );
      } else if (userCompliance === 'compliant' && selectedPol) {
        // Calculate election total for selected candidate
        const donationsToThisCandidate = (donations || []).filter(
          (d: Celebration) => {
            if (d.defunct || d.paused) return false;
            if (d.pol_id !== selectedPol) return false;
            return true;
          }
        );
        currentElectionTotal = donationsToThisCandidate.reduce(
          (sum: number, d: Celebration) => sum + (d.donation || 0),
          0
        );
      }

      const exceedsLimits = wouldExceedLimits(
        donation as number,
        currentAnnualTotal,
        currentElectionTotal
      );

      if (exceedsLimits) {
        const remainingLimit = getRemainingDonationLimit(
          currentAnnualTotal,
          currentElectionTotal
        );

        // If remaining limit is 0, show limit modal immediately
        if (remainingLimit <= 0) {
          openDonationLimitModal();
          // Stay on Lobby (don't navigate)
        } else {
          // Auto-adjust donation to maximum allowed amount
          // Do NOT show limit modal - user can try to increase amount again later
          // The modal will only appear if user manually tries to increase the amount
          // Explicitly ensure modal is NOT shown when auto-adjusting
          setShowModal((s) => ({
            ...s,
            limit: false,
          }));
          setDonation(remainingLimit);
          // Stay on Lobby (don't navigate to payment)
          // Limit modal will only show if user tries to increase amount again
        }
      } else {
        // Donation is valid, proceed to payment
        navigateToFunnel('payment');
      }
    }
  }, [
    tabKey,
    donation,
    donations,
    isLoggedIn,
    navContext,
    selectedPol,
    userCompliance,
    effectiveLimits,
    setDonation,
    setShowModal,
    navigateToFunnel,
    wouldExceedLimits,
    openDonationLimitModal,
    getRemainingDonationLimit,
  ]);

  useFunnelNavigationSync(tabKey, navContext, navigateToFunnel, FUNNEL);

  /**
   * State management for donation rejection handling
   * Tracks current and previous rejection reasons to trigger alerts
   */
  const [rejectedDonationReasons, setRejectedDonationReasons] =
    useState<CelebrationRejection>(null);
  const prevRejectedDonationReasonsRef = useRef<CelebrationRejection>(null);

  /**
   * Triggers rejection alert when donation is rejected
   */
  useLayoutEffect(() => {
    if (prevRejectedDonationReasonsRef.current !== rejectedDonationReasons) {
      prevRejectedDonationReasonsRef.current = rejectedDonationReasons;
      setShowAlert((s: ShowAlert) => ({ ...s, rejected: true }));
    }
  }, [rejectedDonationReasons, setShowAlert]);

  /**
   * State management for payment error handling
   * Tracks current and previous payment errors to trigger rejection alerts
   */
  const [paymentError, setPaymentError] = useState<Error | null>(
    null as unknown as Error
  );
  const prevPaymentErrorRef = useRef<Error | null>(null);

  /**
   * Converts payment errors to rejection alerts
   */
  useLayoutEffect(() => {
    if (prevPaymentErrorRef.current !== paymentError) {
      prevPaymentErrorRef.current = paymentError;
      if (paymentError) {
        logError('Payment error', paymentError);
        setRejectedDonationReasons({
          message: paymentError?.message,
          variant: 'danger',
        });
      }
    }
  }, [paymentError, setRejectedDonationReasons]);

  /**
   * Joyride tour state and callbacks
   */
  const {
    tour,
    stopTourLoop,
    joyrideCallback,
    openAccountFromTour: rawOpenAccountFromTour,
  } = useFunnelTours<ShowModal>({
    showResetPassOverlay: !!showOverlay.resetPass,
    showCredentialsModal: !!showModal.credentials,
    selectedPol: selectedPol ?? null,
    donation: donation ?? 0,
    setShowModal,
    isLoggedIn,
    donations,
    isDesktop,
    tabKey,
    userId,
  });

  const joyrideViewedStepsRef = useRef<Set<string>>(new Set());
  const joyrideBeaconStepsRef = useRef<Set<string>>(new Set()),
    joyrideBeaconClickedStepsRef = useRef<Set<string>>(new Set());

  const trackedJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, lifecycle, status, type, step } = data;

      const tourName = String(tour.tourName ?? 'funnel_tour');
      const lifecycleName = String(lifecycle ?? '');
      const actionName = String(action ?? '');
      const statusName = String(status ?? '');
      const typeName = String(type ?? '');

      const stepTarget =
        typeof step?.target === 'string' ? step.target : 'element';

      const stepTitle = typeof step?.title === 'string' ? step.title : '';

      const stepKey = `${tourName}:${index}`;

      if (typeName === 'tour:start') {
        trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.STARTED, {
          joyride_type: typeName,
          tour_name: tourName,
        });
      }

      // Beacon appeared on screen.
      if (typeName === 'beacon' && lifecycleName === 'beacon') {
        joyrideBeaconStepsRef.current.add(stepKey);
      }

      // Beacon was clicked/resumed into tooltip.
      if (
        typeName === 'tooltip' &&
        lifecycleName === 'tooltip' &&
        joyrideBeaconStepsRef.current.has(stepKey) &&
        !joyrideBeaconClickedStepsRef.current.has(stepKey)
      ) {
        joyrideBeaconClickedStepsRef.current.add(stepKey);

        trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.INTERACTED, {
          joyride_action: 'beacon_clicked',
          joyride_lifecycle: lifecycleName,
          tour_step_target: stepTarget,
          joyride_type: typeName,
          tour_step_index: index,
          tour_name: tourName,
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Joyride callback', {
          lifecycle: lifecycleName,
          action: actionName,
          status: statusName,
          type: typeName,
          stepTarget,
          stepTitle,
          index,
        });
      }

      // Step exposure: this includes the automatic first step.
      if (lifecycleName === 'tooltip' || typeName === 'tooltip') {
        const stepKey = `${tourName}:${index}`;

        if (!joyrideViewedStepsRef.current.has(stepKey)) {
          joyrideViewedStepsRef.current.add(stepKey);

          trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.STEP_VIEWED, {
            tour_step_target: stepTarget,
            tour_step_title: stepTitle,
            tour_step_index: index,
            tour_name: tourName,
          });
        }
      }

      // User interaction with the tour controls.
      if (isJoyrideAction(actionName) && actionName !== 'beacon_clicked') {
        trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.INTERACTED, {
          tour_step_target: stepTarget,
          joyride_action: actionName,
          tour_step_index: index,
          tour_name: tourName,
        });
      }

      if (statusName === 'finished') {
        trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.FINISHED, {
          tour_final_step_index: index,
          tour_name: tourName,
        });
      }

      if (statusName === 'skipped') {
        trackJoyrideGAEvent(JOYRIDE_GA_EVENTS.SKIPPED, {
          tour_final_step_index: index,
          tour_name: tourName,
        });
      }

      joyrideCallback(data);
    },
    [joyrideCallback, tour.tourName]
  );

  // Open account from tour is disabled in demo mode
  const openAccountFromTour = useMemo(() => {
    if (isDemoMode) return () => {};
    return rawOpenAccountFromTour;
  }, [rawOpenAccountFromTour, isDemoMode]);

  /**
   * Custom tooltip for Celebration tour. Mobile only: show "Open Account" button.
   */
  const celebrationTooltipComponent = useCallback(
    (renderProps: Record<string, unknown>) => (
      <CelebrationTooltip
        {...(renderProps as Parameters<typeof CelebrationTooltip>[0])}
        openAccount={openAccountFromTour}
        isDesktop={isDesktop ?? false}
        isDemo={isDemoMode}
      />
    ),
    [openAccountFromTour, isDesktop, isDemoMode]
  );

  /**
   * Current route information for conditional rendering
   */
  const route = useRoute();

  /**
   * State for modal message content
   * Used to display dynamic messages in the LimitModal
   */
  const [limitMessage, setLimitMessage] = useState('');

  /**
   * Renders the complete celebration page with modals, tours, and tab content
   * Conditionally renders components based on user state and device type
   */
  return (
    <>
      {/* User-specific modals - only render when user is logged in */}
      {userId && (
        <>
          {' '}
          <AccountModal
            key={userId + '-account-modal'}
            polsOnParade={polsOnParade}
            setActiveKey={setActiveKey}
            isLoggedIn={isLoggedIn}
            stopTour={stopTourLoop}
            {...props}
          />
          <LimitModal
            key={`${userId}-limit-modal-${tabKey}`}
            isPACLimit={tabKey === 'tips'}
            message={limitMessage}
            route={route}
            {...props}
          />
        </>
      )}

      {/* Contributing inquiry modal - open from Confirmation tab PatronAsk */}
      <Suspense fallback={null}>
        <ContributingModal />
      </Suspense>

      {/* Main page content with lazy loading */}
      <Suspense fallback={null}>
        <Container
          fluid
          id={'funnel--page'}
          className={'d-flex align-items-center'}
        >
          {/* User onboarding tour (runs in demo so try-it users see the walkthrough) */}
          <Joyride
            {...tour}
            tooltipComponent={
              tour.tourName === 'Celebration'
                ? celebrationTooltipComponent
                : undefined
            }
            callback={trackedJoyrideCallback}
            disableOverlay={true}
            spotlightClicks
            showSkipButton
            showProgress
            continuous
          />

          {/* Tab container for main navigation - only render on main route */}
          {(route as Route<typeof routes>).name === 'main' && (
            <TabContainer
              key={userId + '-TabContainer_key'}
              defaultActiveKey={'pol-donation'}
              id={'celebrate-tab-container'}
              onSelect={(key) =>
                navigateToFunnel(
                  key as FunnelView,
                  FUNNEL.indexOf(key as FunnelView)
                )
              }
              activeKey={tabKey}
            >
              <TabContents
                setRejectedDonationReasons={setRejectedDonationReasons}
                searchPolsByLocation={searchPolsByLocation}
                restorePolsOnParade={restorePolsOnParade}
                searchPolsByState={searchPolsByState}
                searchPolsByName={searchPolsByName}
                setLimitMessage={setLimitMessage}
                setPaymentError={setPaymentError}
                paymentError={paymentError}
                polsOnParade={polsOnParade}
                isDemoMode={isDemoMode}
                bill={bill}
                {...props}
              />
            </TabContainer>
          )}
        </Container>
      </Suspense>
    </>
  );
};

/**
 * Memoized export to prevent unnecessary re-renders
 * Only re-renders when props or internal state changes
 */
export default React.memo(Funnel);
