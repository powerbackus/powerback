/**
 * @fileoverview Navigation history helpers: initial state, splash graph, normalization, popstate handler.
 * @module contexts/navigationHistory
 */

import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { FunnelView, LandingNavView, CredentialsFormView } from './types';

/**
 * Unified navigation state (splash/funnel, history stack index, canGoBack/Forward).
 */
export interface NavigationState {
  splash?: LandingNavView | CredentialsFormView;
  navContext: 'splash' | 'funnel';
  canGoForward?: boolean;
  canGoBack?: boolean;
  funnel?: FunnelView;
  step?: number;
}

/**
 * Navigation graph: valid splash transitions and history action (push/replace).
 * On mobile, splash is effectively landing ('') + Tour; Join Now/Sign In are replace-only.
 */
export const SPLASH_NAV_GRAPH: Record<
  LandingNavView | CredentialsFormView,
  Partial<Record<LandingNavView | CredentialsFormView, 'push' | 'replace'>>
> = {
  '': {
    Tour: 'push',
    'Join Now': 'replace',
    'Sign In': 'replace',
  },
  'Join Now': {
    '': 'replace',
    'Sign In': 'replace',
  },
  'Sign In': {
    '': 'replace',
    'Join Now': 'replace',
  },
  Tour: {
    '': 'replace',
  },
};

/** Base funnel steps (TipAsk may be omitted when PAC limit reached). */
export const BASE_FUNNEL_STEPS: FunnelView[] = [
  'pol-donation',
  'payment',
  'tips',
  'confirmation',
];

/**
 * Initial navigation state from browser history or default splash landing.
 * On full load with splash in history, always return landing (''); subscreen state is for in-session back/forward only.
 */
export function getInitialState(): NavigationState {
  const historyState = window.history.state as NavigationState;
  if (historyState?.navContext) {
    if (historyState.navContext === 'splash') {
      return { navContext: 'splash', splash: '' };
    }
    return historyState;
  }
  return { navContext: 'splash', splash: '' };
}

/** Normalized shape for comparing navigation states (navContext, splash, funnel). */
export function normalizeStateForComparison(s: NavigationState) {
  return {
    navContext: s.navContext,
    splash: s.splash || '',
    funnel: s.funnel,
  };
}

export type PopstateHandlerEnv = {
  navigationStateRef: MutableRefObject<NavigationState>;
  historyStackRef: MutableRefObject<NavigationState[]>;
  suppressNextPopRef: MutableRefObject<boolean>;
  currentIndexRef: MutableRefObject<number>;
  navigateToFunnel: (step: FunnelView, stepIndex?: number) => void;
  setNavigationState: Dispatch<SetStateAction<NavigationState>>;
  setHistoryStack: Dispatch<SetStateAction<NavigationState[]>>;
  validateNavigation?: (state: NavigationState) => boolean;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  navigateToSplash: (view: LandingNavView | CredentialsFormView) => void;
  getFunnelSteps: () => FunnelView[];
};

/**
 * Creates the popstate handler for browser back/forward. Uses refs and setters from env so the provider keeps a stable listener.
 */
export function createPopstateHandler(
  env: PopstateHandlerEnv
): (e: PopStateEvent) => void {
  const {
    navigationStateRef,
    suppressNextPopRef,
    currentIndexRef,
    historyStackRef,
    setNavigationState,
    validateNavigation,
    navigateToFunnel,
    setCurrentIndex,
    setHistoryStack,
    getFunnelSteps,
  } = env;

  return function onPop(e: PopStateEvent) {
    const currentNavState = navigationStateRef.current;
    const currentHistoryStack = historyStackRef.current;
    const currentIdx = currentIndexRef.current;

    const state = e.state as NavigationState | null;

    if (!state || !state.navContext) {
      if (currentNavState.navContext === 'splash' && currentIdx > 0) {
        const initialState: NavigationState = {
          navContext: 'splash',
          splash: '',
        };
        setNavigationState(initialState);
        setCurrentIndex(0);
        setHistoryStack((prev) => {
          if (prev[0]?.navContext !== 'splash' || prev[0]?.splash !== '') {
            return [initialState, ...prev.slice(1)];
          }
          return prev;
        });
        window.history.replaceState(initialState, '');
        return;
      }
    }

    if (state?.navContext) {
      if (
        suppressNextPopRef.current &&
        currentNavState.navContext === 'funnel' &&
        state.navContext === 'splash'
      ) {
        suppressNextPopRef.current = false;
        return;
      }

      const normalizedState = normalizeStateForComparison(state);
      const normalizedCurrent = normalizeStateForComparison(currentNavState);
      const stateMatchesCurrent =
        normalizedState.navContext === normalizedCurrent.navContext &&
        normalizedState.splash === normalizedCurrent.splash &&
        normalizedState.funnel === normalizedCurrent.funnel;

      const matchingIndex = currentHistoryStack.findIndex((s) => {
        const normalized = normalizeStateForComparison(s);
        return (
          normalized.navContext === normalizedState.navContext &&
          normalized.splash === normalizedState.splash &&
          normalized.funnel === normalizedState.funnel
        );
      });

      const normalizedBrowserState: NavigationState = {
        navContext: state.navContext,
        splash: state.splash ?? '',
        funnel: state.funnel,
        ...(state.step !== undefined && { step: state.step }),
        ...(state.canGoBack !== undefined && { canGoBack: state.canGoBack }),
        ...(state.canGoForward !== undefined && {
          canGoForward: state.canGoForward,
        }),
      };

      if (matchingIndex !== -1) {
        const isFunnelToSplashTransition =
          currentNavState.navContext === 'funnel' &&
          state.navContext === 'splash';
        if (
          stateMatchesCurrent &&
          matchingIndex === currentIdx &&
          matchingIndex > 0 &&
          currentHistoryStack.length > matchingIndex - 1 &&
          !isFunnelToSplashTransition
        ) {
          const previousState = currentHistoryStack[matchingIndex - 1];
          const normalizedPreviousState: NavigationState = {
            navContext: previousState.navContext,
            splash: previousState.splash ?? '',
            funnel: previousState.funnel,
            ...(previousState.step !== undefined && {
              step: previousState.step,
            }),
            canGoBack: matchingIndex - 1 > 0,
            canGoForward: true,
          };
          setNavigationState(() => normalizedPreviousState);
          setCurrentIndex(matchingIndex - 1);
          window.history.replaceState(normalizedPreviousState, '');
          return;
        }

        setNavigationState(() => normalizedBrowserState);
        setCurrentIndex(matchingIndex);
        setHistoryStack((prev) => {
          const updated = [...prev];
          updated[matchingIndex] = normalizedBrowserState;
          return updated;
        });
        return;
      }

      if (validateNavigation && !validateNavigation(state)) {
        const fallbackState: NavigationState = {
          navContext: 'funnel',
          funnel: 'pol-donation',
          step: 0,
        };
        setNavigationState(fallbackState);
        window.history.replaceState(fallbackState, '');
        return;
      }

      const newIndex = currentHistoryStack.findIndex((s) => {
        const normalized = normalizeStateForComparison(s);
        return (
          normalized.navContext === normalizedState.navContext &&
          normalized.splash === normalizedState.splash &&
          normalized.funnel === normalizedState.funnel
        );
      });

      setNavigationState(() => normalizedBrowserState);

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setHistoryStack((prev) => {
          const updated = [...prev];
          updated[newIndex] = normalizedBrowserState;
          return updated;
        });
      } else {
        if (
          state.navContext === 'splash' &&
          (state.splash === '' || !state.splash)
        ) {
          setCurrentIndex(0);
          setHistoryStack((prev) => {
            const updated = [...prev];
            updated[0] = normalizedBrowserState;
            return updated;
          });
          window.history.replaceState(normalizedBrowserState, '');
        } else if (currentIdx > 0) {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          setHistoryStack((prev) => {
            const exists = prev.some(
              (s) =>
                s.navContext === state.navContext &&
                s.splash === state.splash &&
                s.funnel === state.funnel
            );
            if (!exists) {
              return [
                ...prev.slice(0, currentIdx - 1),
                state,
                ...prev.slice(currentIdx - 1),
              ];
            }
            return prev;
          });
        } else {
          setHistoryStack((prev) => {
            const exists = prev.some(
              (s) =>
                s.navContext === state.navContext &&
                s.splash === state.splash &&
                s.funnel === state.funnel
            );
            if (!exists) {
              return [state, ...prev.slice(1)];
            }
            return prev;
          });
        }
      }
    } else {
      if (
        currentNavState.navContext === 'funnel' &&
        currentNavState.step !== undefined &&
        currentNavState.step > 0
      ) {
        const currentFunnelSteps = getFunnelSteps();
        const prevStep = currentFunnelSteps[currentNavState.step - 1];
        navigateToFunnel(prevStep, currentNavState.step - 1);
      } else {
        if (currentNavState.navContext === 'splash') {
          const fallbackState: NavigationState = {
            navContext: 'splash',
            splash: '',
          };
          setNavigationState(fallbackState);
          setCurrentIndex(0);
          window.history.replaceState(fallbackState, '');
        } else {
          const fallbackState: NavigationState = {
            navContext: 'splash',
            splash: '',
          };
          setNavigationState(fallbackState);
          setCurrentIndex(0);
        }
      }
    }
  };
}
