/**
 * Election cycle context. Cycle dates, politician cycle, recalculate.
 * @module ElectionCycleContext
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
  getCachedElectionDates,
  fetchAndCacheElectionDates,
  logError,
  logWarn,
} from '@Utils';
import type { PolData } from './types';

/**
 * Election dates for a specific state and year
 */
interface ElectionDates {
  primary: string | null;
  general: string | null;
  special: string | null;
  runoff: string | null;
}

/**
 * Election cycle information
 */
interface ElectionCycle {
  currentElectionType: 'primary' | 'general' | 'special' | 'runoff' | null;
  isInElectionCycle: boolean;
  nextElectionDate: Date | null;
  cycleStartDate: Date | null;
  cycleEndDate: Date | null;
}

/**
 * Election cycle context values
 */
interface ElectionCycleValues {
  /** Current election cycle information */
  currentCycle: ElectionCycle;
  /** Whether election cycle data is loading */
  isLoading: boolean;
  /** Current politician's state */
  currentState: string | null;
  /** Current politician's ID */
  currentPolId: string | null;
}

/**
 * Election cycle context actions
 */
interface ElectionCycleActions {
  /** Update the current politician for election cycle calculations */
  setElectionCyclePolitician: (polData: PolData | null) => void;
  /** Recalculate election cycle data */
  recalculateCycle: () => void;
}

/**
 * Props for ElectionCycleProvider
 */
interface ElectionCycleProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * Election Cycle Context
 * Manages election date calculations and cycle information
 *
 * Responsibilities:
 * - Calculate election dates for specific states and years
 * - Determine current election cycle boundaries
 * - Track election cycle state for Compliant tier compliance
 * - Provide election cycle data to other contexts
 *
 * This separates political/geographic data from compliance logic
 */
const ElectionCycleContext = createContext<
  ElectionCycleValues & ElectionCycleActions
>({
  currentCycle: {
    currentElectionType: null,
    isInElectionCycle: false,
    nextElectionDate: null,
    cycleStartDate: null,
    cycleEndDate: null,
  },
  isLoading: false,
  currentState: null,
  currentPolId: null,
  recalculateCycle: () => logWarn('recalculateCycle called outside provider'),
  setElectionCyclePolitician: () =>
    logWarn('setElectionCyclePolitician called outside provider'),
});

/**
 * Election Cycle Provider Component
 * Manages election date calculations and cycle information
 *
 * Features:
 * - State-specific election date calculations
 * - Election cycle boundary determination
 * - Current election cycle status tracking
 * - Next election date prediction
 *
 * @param children - Child components needing election cycle context
 */
export const ElectionCycleProvider = ({
  children,
}: ElectionCycleProviderProps) => {
  // State for current politician
  const [currentPolData, setCurrentPolData] = useState<PolData | null>(null);

  /**
   * Fallback generic election dates when snapshot/cache has no data for the state.
   * Only used when server/bundled source is missing the state; server remains authoritative.
   */
  const getDefaultElectionDates = useCallback(
    (state: string, year: number): ElectionDates => ({
      primary: `${year}-06-01`,
      general: `${year}-11-05`,
      special: null,
      runoff: null,
    }),
    []
  );

  /**
   * Get the current election year (even years only)
   */
  const getCurrentElectionYear = useCallback((): number => {
    const currentYear = new Date().getFullYear();
    return currentYear % 2 === 0 ? currentYear : currentYear + 1;
  }, []);

  /**
   * Calculate election cycle information based on current date and election dates
   */
  const calculateElectionCycle = useCallback(
    (
      electionDates: ElectionDates,
      currentDate: Date,
      currentYear: number
    ): ElectionCycle => {
      const primaryDate = electionDates.primary
        ? new Date(electionDates.primary)
        : null;
      const generalDate = electionDates.general
        ? new Date(electionDates.general)
        : null;
      const runoffDate = electionDates.runoff
        ? new Date(electionDates.runoff)
        : null;
      const specialDate = electionDates.special
        ? new Date(electionDates.special)
        : null;

      let nextElectionDate: Date | null = null;
      let cycleStartDate: Date | null = null;
      let cycleEndDate: Date | null = null;
      let isInElectionCycle = false;
      let currentElectionType:
        | 'primary'
        | 'general'
        | 'special'
        | 'runoff'
        | null = null;

      // Determine current election cycle
      if (primaryDate && currentDate >= primaryDate) {
        cycleStartDate = primaryDate;
        cycleEndDate = generalDate
          ? new Date(generalDate.getTime() - 1)
          : new Date(currentYear + 2, 11, 31);
        isInElectionCycle = true;
        currentElectionType = 'primary';
      } else if (generalDate && currentDate >= generalDate) {
        cycleStartDate = generalDate;
        cycleEndDate = new Date(currentYear + 2, 11, 31);
        isInElectionCycle = true;
        currentElectionType = 'general';
      } else if (runoffDate && currentDate >= runoffDate) {
        cycleStartDate = runoffDate;
        cycleEndDate = new Date(currentYear + 2, 11, 31);
        isInElectionCycle = true;
        currentElectionType = 'runoff';
      } else if (specialDate && currentDate >= specialDate) {
        cycleStartDate = specialDate;
        cycleEndDate = new Date(currentYear + 2, 11, 31);
        isInElectionCycle = true;
        currentElectionType = 'special';
      } else {
        // Not in an election cycle, calculate next election
        const nextElection =
          primaryDate || generalDate || runoffDate || specialDate;
        if (nextElection) {
          nextElectionDate = nextElection;
          // Set cycle start to previous general election
          const prevElectionDates = getDefaultElectionDates(
            '',
            currentYear - 2
          );
          cycleStartDate = new Date(prevElectionDates.general as string);
          cycleEndDate = new Date(nextElection.getTime() - 1);
        }
      }

      return {
        currentElectionType,
        isInElectionCycle,
        nextElectionDate,
        cycleStartDate,
        cycleEndDate,
      };
    },
    [getDefaultElectionDates]
  );

  // State for election cycle data
  const [currentCycle, setCurrentCycle] = useState<ElectionCycle>({
    currentElectionType: null,
    isInElectionCycle: false,
    nextElectionDate: null,
    cycleStartDate: null,
    cycleEndDate: null,
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to track if cycle has been calculated
  const hasCalculatedCycle = useRef(false);

  /**
   * Update the current politician for election cycle calculations
   */
  const setElectionCyclePolitician = useCallback((polData: PolData | null) => {
    setCurrentPolData(polData);
    hasCalculatedCycle.current = false; // Reset calculation flag
  }, []);

  /**
   * Recalculate election cycle data
   */
  const recalculateCycle = useCallback(() => {
    hasCalculatedCycle.current = false;
  }, []);

  // Effect to calculate election cycle when politician changes
  useEffect(() => {
    if (!currentPolData?.state || !currentPolData?.id) {
      setCurrentCycle({
        currentElectionType: null,
        isInElectionCycle: false,
        nextElectionDate: null,
        cycleStartDate: null,
        cycleEndDate: null,
      });
      return;
    }

    if (hasCalculatedCycle.current) return;
    hasCalculatedCycle.current = true;

    setIsLoading(true);

    const calculateCycle = async () => {
      try {
        const year = getCurrentElectionYear();
        const stateKey = currentPolData.state;
        let result = getCachedElectionDates();
        if (!result) {
          result = await fetchAndCacheElectionDates();
        }
        let stateDates = result?.data?.[stateKey];
        // Handle legacy/cache shape: server may return data as a single date object (not keyed by state)
        if (
          !stateDates &&
          result?.data &&
          typeof result.data.primary === 'string' &&
          typeof result.data.general === 'string'
        ) {
          stateDates = result.data;
        }
        let electionDates: ElectionDates;
        if (stateDates) {
          electionDates = {
            primary: stateDates.primary ?? null,
            general: stateDates.general ?? null,
            special: stateDates.special ?? null,
            runoff: stateDates.runoff ?? null,
          };
        } else {
          logWarn(
            `Using generic election dates for state: ${stateKey} - server handles accurate dates`
          );
          electionDates = getDefaultElectionDates(stateKey, year);
        }
        const currentDate = new Date();

        const cycle = calculateElectionCycle(electionDates, currentDate, year);

        setCurrentCycle(cycle);
      } catch (error) {
        logError('Error calculating election cycle', error);
        setCurrentCycle({
          currentElectionType: null,
          isInElectionCycle: false,
          nextElectionDate: null,
          cycleStartDate: null,
          cycleEndDate: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateCycle();
  }, [
    currentPolData?.id,
    currentPolData?.state,
    calculateElectionCycle,
    getCurrentElectionYear,
    getDefaultElectionDates,
  ]);

  // Memoized values
  const currentState = useMemo(
    () => currentPolData?.state || null,
    [currentPolData?.state]
  );
  const currentPolId = useMemo(
    () => currentPolData?.id || null,
    [currentPolData?.id]
  );

  return (
    <ElectionCycleContext.Provider
      value={useMemo(
        (): ElectionCycleValues & ElectionCycleActions => ({
          isLoading,
          currentCycle,
          currentPolId,
          currentState,
          recalculateCycle,
          setElectionCyclePolitician,
        }),
        [
          isLoading,
          currentCycle,
          currentPolId,
          currentState,
          recalculateCycle,
          setElectionCyclePolitician,
        ]
      )}
    >
      {children}
    </ElectionCycleContext.Provider>
  );
};

/**
 * Hook to access election cycle context
 * Must be used within ElectionCycleProvider component tree
 *
 * Provides access to:
 * - Current election cycle information
 * - Election date calculations
 * - Politician management for election cycles
 * - Election cycle recalculation functions
 *
 * @returns ElectionCycleValues & ElectionCycleActions - Complete election cycle context
 */
export const useElectionCycle = () => useContext(ElectionCycleContext);
