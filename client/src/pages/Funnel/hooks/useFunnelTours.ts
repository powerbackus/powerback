/**
 * Funnel tour state and callbacks: User tour (pol-donation) and Celebration tour (support).
 * Manages run/stop, localStorage dismissal, and Joyride callback (sessionStorage for Account).
 *
 * @module pages/Funnel/hooks/useFunnelTours
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useIsDemoMode } from '../../../demoMode';
import type { FunnelView } from '@Contexts';
import type { Celebration } from '@Types';
import { EVENTS } from 'react-joyride';
import { useTour } from '@Hooks';
import { storage } from '@Utils';

export interface UseFunnelToursParams<
  S extends { account?: boolean } = { account?: boolean },
> {
  setShowModal: React.Dispatch<React.SetStateAction<S>>;
  donations: Celebration[] | undefined;
  isDesktop: boolean | undefined;
  tabKey: FunnelView | undefined;
  showCredentialsModal: boolean;
  showResetPassOverlay: boolean;
  selectedPol: string | null;
  userId: string | undefined;
  isLoggedIn: boolean;
  donation: number;
}

export interface UseFunnelToursResult {
  tour: ReturnType<typeof useTour>[0];
  joyrideCallback: (
    data: Parameters<ReturnType<typeof useTour>[0]['callback']>[0]
  ) => void;
  stopTourLoop: () => void;
  openAccountFromTour: () => void;
}

/**
 * Encapsulates funnel tour logic: when to run User vs Celebration tour,
 * stop handler, open Account from tour, and Joyride callback (sets sessionStorage for Celebrations).
 */
export default function useFunnelTours<
  S extends { account?: boolean } = { account?: boolean },
>({
  showCredentialsModal,
  showResetPassOverlay,
  setShowModal,
  selectedPol,
  isLoggedIn,
  donations,
  isDesktop,
  donation,
  userId,
  tabKey,
}: UseFunnelToursParams<S>): UseFunnelToursResult {
  const [tour, { runTour, stopTour }] = useTour(!!isDesktop);
  const isDemoMode = useIsDemoMode();

  const checkTourState = useMemo(
    () =>
      // In demo mode, allow the user tour even if auth state is unstable
      (!isLoggedIn || isDemoMode) &&
      !showCredentialsModal &&
      !showResetPassOverlay &&
      tabKey === 'pol-donation' &&
      !(donation !== 0 || selectedPol),
    [
      showResetPassOverlay,
      showCredentialsModal,
      selectedPol,
      isLoggedIn,
      isDemoMode,
      donation,
      tabKey,
    ]
  );

  /**
   * Determines if Celebration tour should run.
   * Celebration tour runs when user has exactly one donation (their first celebration).
   * Requires authenticated user (userId) and donations array to exist.
   */
  const checkCelebrationTourState = useMemo(
    () => (userId && donations ? donations.length === 1 : false),
    [userId, donations]
  );

  /**
   * Stable wrapper for runTour to prevent unnecessary re-renders.
   * Memoized to maintain referential stability across renders.
   */
  const stableRunTour = useCallback(
    (tourType: 'User' | 'Celebration', shouldRun: boolean) => {
      runTour(tourType, shouldRun);
    },
    [runTour]
  );

  /**
   * Stable wrapper for stopTour to prevent unnecessary re-renders.
   * Memoized to maintain referential stability across renders.
   */
  const stableStopTour = useCallback(
    (tourType: 'User' | 'Celebration') => stopTour(tourType),
    [stopTour]
  );

  /**
   * Effect: Manages tour lifecycle based on current tab and state.
   *
   * User tour (pol-donation tab):
   * - Checks if user has dismissed tour via localStorage ('userTour' === 'false')
   * - Runs if checkTourState is true AND tour hasn't been dismissed
   *
   * Celebration tour (confirmation tab):
   * - Runs if checkCelebrationTourState is true (user has exactly one donation)
   *
   * Other tabs:
   * - Stops User tour to prevent tour from running on intermediate tabs
   */
  useEffect(() => {
    if (tabKey === 'pol-donation') {
      const isDismissed = storage.local.getItem('userTour') === 'false';
      const shouldRun = checkTourState && !isDismissed;
      stableRunTour('User', shouldRun);
    } else if (tabKey === 'confirmation') {
      stableRunTour('Celebration', checkCelebrationTourState);
    } else {
      stableRunTour('User', false);
    }
  }, [tabKey, stableRunTour, checkTourState, checkCelebrationTourState]);

  /**
   * Stops the Celebration tour loop.
   * Used when user completes or dismisses the Celebration tour.
   */
  const stopTourLoop = useCallback(
    () => stableStopTour('Celebration'),
    [stableStopTour]
  );

  /**
   * Opens the Account modal from tour interactions.
   * Used by Celebration tour tooltip on mobile to open Account sidebar.
   */
  const openAccountFromTour = useCallback(() => {
    setShowModal((s) => ({ ...s, account: true }));
  }, [setShowModal]);

  /**
   * Joyride callback wrapper that handles Celebration tour start.
   * When Celebration tour starts, sets sessionStorage flag to open Account modal
   * to Celebrations tab (used on mobile when tour prompts user to view celebrations).
   * Then delegates to the underlying tour callback for standard Joyride event handling.
   */
  const joyrideCallback = useCallback(
    (data: Parameters<typeof tour.callback>[0]) => {
      if (tour.tourName === 'Celebration' && data.type === EVENTS.TOUR_START) {
        storage.session.setItem('openAccountToCelebrations', 'true');
      }
      tour.callback(data);
    },
    [tour]
  );

  return {
    openAccountFromTour,
    joyrideCallback,
    stopTourLoop,
    tour,
  };
}
