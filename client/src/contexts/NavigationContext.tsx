/**
 * Navigation context. Splash/funnel views, history, navigateToFunnel/goBack.
 * @module NavigationContext
 */
import {
  useRef,
  useMemo,
  useState,
  useContext,
  useCallback,
  createContext,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import {
  type NavigationState,
  SPLASH_NAV_GRAPH,
  BASE_FUNNEL_STEPS,
  createPopstateHandler,
  getInitialState as getInitialNavState,
} from './navigationHistory';
import { logWarn } from '@Utils';
import type { LandingNavView, CredentialsFormView, FunnelView } from './types';

export type { NavigationState };

/**
 * Navigation actions interface providing methods to control navigation
 * @interface NavigationActions
 * @property {() => void} goBack - Go back in navigation history
 * @property {() => void} goForward - Go forward in navigation history
 * @property {() => NavigationState} getCurrentState - Get current navigation state
 * @property {(view: LandingNavView | CredentialsFormView) => void} navigateToSplash - Navigate to a landing/credentials view
 * @property {(direction: 'back' | 'forward') => boolean} canNavigate - Check if navigation is possible
 * @property {(step: FunnelView, stepIndex?: number) => void} navigateToFunnel - Navigate to a funnel step
 */
interface NavigationActions {
  /** Go back in navigation history */
  goBack: () => void;
  /** Go forward in navigation history */
  goForward: () => void;
  /** Get current funnel steps (may exclude TipAsk if PAC limit reached) */
  getFunnelSteps: () => FunnelView[];
  /** Get current navigation state */
  getCurrentState: () => NavigationState;
  /** Check if navigation is possible */
  canNavigate: (direction: 'back' | 'forward') => boolean;
  /** Navigate to a funnel step */
  navigateToFunnel: (step: FunnelView, stepIndex?: number) => void;
  /** Navigate to a landing/credentials view (raw history; use navigateToSplashView for Tour -> funnel) */
  navigateToSplash: (view: LandingNavView | CredentialsFormView) => void;
  /** Navigate to landing/credentials view; Tour enters funnel at pol-donation */
  navigateToSplashView: (view: LandingNavView | CredentialsFormView) => void;
}

/**
 * Props for NavigationProvider component
 * @interface NavigationProviderProps
 * @property {ReactNode} children - Child components to be wrapped by the provider
 * @property {boolean} isDesktop - Whether the current device is desktop
 */
interface NavigationProviderProps {
  validateNavigation?: (state: NavigationState) => boolean;
  shouldSkipTipAsk?: boolean;
  children: ReactNode;
  isDesktop: boolean;
}

/**
 * Navigation Context providing unified navigation state and actions
 */
const NavigationContext = createContext<NavigationState & NavigationActions>({
  goForward: () => logWarn('goForward called outside provider'),
  getCurrentState: () => ({ navContext: 'splash', splash: '' }),
  goBack: () => logWarn('goBack called outside provider'),
  navigateToFunnel: () => logWarn('navigateToFunnel called outside provider'),
  navigateToSplash: () => logWarn('navigateToSplash called outside provider'),
  navigateToSplashView: () =>
    logWarn('navigateToSplashView called outside provider'),
  getFunnelSteps: () => BASE_FUNNEL_STEPS,
  canNavigate: () => false,
  navContext: 'splash',
  canGoForward: false,
  canGoBack: false,
  splash: '',
});

/**
 * Navigation Provider Component
 * Manages unified navigation state and browser history coordination
 *
 * This provider handles:
 * - Browser history synchronization
 * - Navigation state management
 * - Splash screen transitions
 * - Funnel step navigation
 * - Back/forward navigation support
 *
 * @param {NavigationProviderProps} props - Component props
 * @param {boolean} props.validateNavigation - Whether to validate navigation
 * @param {boolean} props.shouldSkipTipAsk - Whether to skip TipAsk
 * @param {boolean} props.isDesktop - Whether current device is desktop
 * @param {ReactNode} props.children - Child components
 */
export function NavigationProvider({
  validateNavigation,
  shouldSkipTipAsk = false,
  isDesktop,
  children,
}: NavigationProviderProps) {
  const getInitialState = useCallback((): NavigationState => {
    return getInitialNavState();
  }, []);

  const [navigationState, setNavigationState] =
    useState<NavigationState>(getInitialState);

  const [historyStack, setHistoryStack] = useState<NavigationState[]>([
    getInitialState(),
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use refs to ensure popstate handler always has latest values
  const navigationStateRef = useRef(navigationState);
  const historyStackRef = useRef(historyStack);
  const currentIndexRef = useRef(currentIndex);

  // Keep refs in sync with state
  useLayoutEffect(() => {
    navigationStateRef.current = navigationState;
    historyStackRef.current = historyStack;
    currentIndexRef.current = currentIndex;
  }, [navigationState, historyStack, currentIndex]);

  // Suppress the very next popstate that would bounce back to splash after a legitimate funnel entry
  // Suppress a funnel->splash popstate only when it fires right after we pushed (spurious); clear after a short window so user back is not suppressed
  const suppressNextPopRef = useRef(false);
  const suppressClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Initialize browser history on first render if needed
  useLayoutEffect(() => {
    const initial = getInitialState();
    const current = window.history.state as NavigationState;
    const isSplashWithSubscreen =
      current?.navContext === 'splash' && (current.splash ?? '') !== '';
    if ((!current?.navContext || isSplashWithSubscreen) && !isDesktop) {
      window.history.replaceState(initial, '');
    } else if (!window.history.state) {
      window.history.replaceState(getInitialState(), '');
    }
  }, [getInitialState, isDesktop]);

  /**
   * Update browser history with new navigation state
   * @param {NavigationState} state - New navigation state to set
   * @param {'push' | 'replace'} [action='replace'] - History action type
   */
  const updateHistory = useCallback(
    (state: NavigationState, action: 'push' | 'replace' = 'replace') => {
      if (action === 'push') {
        window.history.pushState(state, '');
        setHistoryStack((prev) => [...prev.slice(0, currentIndex + 1), state]);
        setCurrentIndex((prev) => prev + 1);
      } else {
        window.history.replaceState(state, '');
        setHistoryStack((prev) => [...prev.slice(0, currentIndex), state]);
      }
    },
    [currentIndex]
  );

  /**
   * Navigate to a splash view with proper history management
   * @param {LandingNavView | CredentialsFormView} view - Target landing/credentials view to navigate to
   */
  // Ref to capture current navContext value to avoid dependency issues
  const navContextRef = useRef(navigationState.navContext);
  navContextRef.current = navigationState.navContext;

  const navigateToSplash = useCallback(
    (view: LandingNavView | CredentialsFormView) => {
      const currentSplash = navigationState.splash || '';
      let action = SPLASH_NAV_GRAPH[currentSplash]?.[view];

      // Special case: if we're transitioning from funnel to splash (guest reset), use replace
      if (!action && navContextRef.current === 'funnel') {
        action = 'replace';
      }

      // On mobile, block navigation if not explicitly allowed
      if (!action && !isDesktop) {
        return;
      }

      const newState: NavigationState = {
        canGoForward: currentIndex < historyStack.length - 1,
        canGoBack: currentIndex > 0,
        navContext: 'splash',
        splash: view,
      };

      setNavigationState(newState);
      updateHistory(newState, action);
    },
    [
      isDesktop,
      currentIndex,
      updateHistory,
      historyStack.length,
      navigationState.splash,
    ]
  );

  /**
   * Get current funnel steps based on PAC limit status
   * @returns {FunnelView[]} Array of funnel steps, excluding 'tips' if PAC limit reached
   */
  const getFunnelSteps = useCallback((): FunnelView[] => {
    if (shouldSkipTipAsk) {
      return ['pol-donation', 'payment', 'confirmation'];
    }
    return BASE_FUNNEL_STEPS;
  }, [shouldSkipTipAsk]);

  /**
   * Navigate to a funnel step with proper state management
   * @param {FunnelView} stepName - Target funnel step to navigate to
   * @param {number} [explicitStepIndex] - Optional explicit step index (defaults to getFunnelSteps().indexOf(stepName))
   */
  const navigateToFunnel = useCallback(
    (stepName: FunnelView, explicitStepIndex?: number) => {
      const currentFunnelSteps = getFunnelSteps();
      const calculatedStepIndex =
        explicitStepIndex ?? currentFunnelSteps.indexOf(stepName);

      const newState: NavigationState = {
        canGoBack: currentIndex > 0 || calculatedStepIndex > 0,
        canGoForward: currentIndex < historyStack.length - 1,
        step: calculatedStepIndex,
        navContext: 'funnel',
        funnel: stepName,
      };

      // Guard: only suppress a pop to splash that fires immediately after this push (spurious); clear after short window so real user back is not suppressed
      if (suppressClearTimeoutRef.current) {
        clearTimeout(suppressClearTimeoutRef.current);
        suppressClearTimeoutRef.current = null;
      }
      suppressNextPopRef.current = true;
      suppressClearTimeoutRef.current = setTimeout(() => {
        suppressNextPopRef.current = false;
        suppressClearTimeoutRef.current = null;
      }, 100);

      setNavigationState(newState);

      // Always push new history entry for funnel navigation to enable back button
      updateHistory(newState, 'push');
    },
    [currentIndex, historyStack.length, updateHistory, getFunnelSteps]
  );

  /**
   * Navigate to a splash view; Tour transitions to funnel at pol-donation (guest flow).
   */
  const navigateToSplashView = useCallback(
    (view: LandingNavView | CredentialsFormView) => {
      if (view === 'Tour') {
        window.dispatchEvent(new CustomEvent('guestAccessGranted'));
        navigateToFunnel('pol-donation', 0);
        return;
      }
      navigateToSplash(view);
    },
    [navigateToFunnel, navigateToSplash]
  );

  /**
   * Go back in navigation history with fallback logic
   * Handles browser history back, funnel step back, and funnel exit
   */
  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      const prevState = historyStack[currentIndex - 1];
      setNavigationState(prevState);
      setCurrentIndex((prev) => prev - 1);
      // Update browser history to match our state
      // Use replaceState to avoid triggering another popstate event
      window.history.replaceState(prevState, '');
    } else if (
      navigationState.navContext === 'funnel' &&
      navigationState.step !== undefined &&
      navigationState.step > 0
    ) {
      // Go back within funnel
      const currentFunnelSteps = getFunnelSteps();
      const prevStep = currentFunnelSteps[navigationState.step - 1];
      navigateToFunnel(prevStep, navigationState.step - 1);
    } else if (navigationState.navContext === 'funnel') {
      // Exit funnel back to splash
      navigateToSplash('Tour');
    }
  }, [
    currentIndex,
    historyStack,
    getFunnelSteps,
    navigationState,
    navigateToFunnel,
    navigateToSplash,
  ]);

  /**
   * Go forward in navigation history
   * Only works if there are forward states available
   */
  const goForward = useCallback(() => {
    if (currentIndex < historyStack.length - 1) {
      const nextState = historyStack[currentIndex + 1];
      setNavigationState(nextState);
      setCurrentIndex((prev) => prev + 1);
      window.history.forward();
    }
  }, [currentIndex, historyStack]);

  /**
   * Check if navigation is possible in the specified direction
   * @param {'back' | 'forward'} direction - Navigation direction to check
   * @returns {boolean} Whether navigation is possible
   */
  const canNavigate = useCallback(
    (direction: 'back' | 'forward'): boolean => {
      if (direction === 'back') {
        return (
          currentIndex > 0 ||
          (navigationState.navContext === 'funnel' &&
            navigationState.step !== undefined &&
            navigationState.step > 0)
        );
      }
      return currentIndex < historyStack.length - 1;
    },
    [currentIndex, historyStack.length, navigationState]
  );

  /**
   * Get current navigation state
   * @returns {NavigationState} Current navigation state
   */
  const getCurrentState = useCallback(() => navigationState, [navigationState]);

  useLayoutEffect(() => {
    const onPop = createPopstateHandler({
      navigationStateRef,
      suppressNextPopRef,
      historyStackRef,
      currentIndexRef,
      setNavigationState,
      validateNavigation,
      navigateToFunnel,
      navigateToSplash,
      setCurrentIndex,
      setHistoryStack,
      getFunnelSteps,
    });

    const handleBrowserBack = () => {
      if (
        navigationState.navContext === 'funnel' &&
        navigationState.step !== undefined &&
        navigationState.step > 0
      ) {
        // Go back within funnel
        const currentFunnelSteps = getFunnelSteps();
        const prevStep = currentFunnelSteps[navigationState.step - 1];
        navigateToFunnel(prevStep, navigationState.step - 1);
        return true; // Prevent default browser behavior
      }
      return false; // Allow default browser behavior
    };

    // Add event listener for browser back button
    window.addEventListener('popstate', onPop);

    // Add a custom event listener that triggers on browser back button
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it's the browser back button (Alt+Left)
      if (e.altKey && e.key === 'ArrowLeft') {
        if (handleBrowserBack()) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', handleKeyDown);
    };
    // Use refs in dependencies to avoid recreating handler unnecessarily
    // The handler uses refs internally, so it doesn't need these as dependencies
  }, [
    currentIndex,
    getFunnelSteps,
    navigateToFunnel,
    navigateToSplash,
    validateNavigation,
    navigationState.step,
    navigationState.navContext,
  ]);

  return (
    <NavigationContext.Provider
      value={useMemo(
        () => ({
          goBack,
          goForward,
          canNavigate,
          getFunnelSteps,
          getCurrentState,
          navigateToFunnel,
          navigateToSplash,
          navigateToSplashView,
          ...navigationState,
        }),
        [
          goBack,
          goForward,
          canNavigate,
          getFunnelSteps,
          getCurrentState,
          navigationState,
          navigateToFunnel,
          navigateToSplash,
          navigateToSplashView,
        ]
      )}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access navigation context
 * Provides navigation state and actions to consuming components
 * @throws {Error} When used outside of NavigationProvider
 */
export function useNavigation() {
  return useContext(NavigationContext);
}
