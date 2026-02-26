/**
 * @fileoverview Interactive Tour Management Hook
 *
 * This hook manages interactive tours using react-joyride, providing guided
 * walkthroughs for users. It handles tour state, step management, responsive
 * step configuration, and tour persistence via localStorage.
 *
 * KEY FEATURES
 *
 * TOUR MANAGEMENT
 * - Supports multiple tour types ('User', 'Celebration')
 * - Responsive step configuration (desktop vs mobile)
 * - Screen-specific step overrides (sm/lg)
 * - Tour persistence via localStorage
 *
 * RESPONSIVE CONFIGURATION
 * - Filters steps based on screen size (desktop vs mobile)
 * - Merges screen-specific overrides into base step config
 * - Adjusts tooltip width and overlay color for device
 * - Desktop: 18vw width, 0.5 overlay opacity
 * - Mobile: 85vw width, 0.68 overlay opacity
 *
 * TOUR PERSISTENCE
 * - Stores tour completion status in localStorage
 * - Format: 'pb:{tourName}Tour' = 'false' when completed/skipped
 * - Prevents re-showing completed tours
 * - Can be reset by clearing localStorage
 *
 * ACTIONS
 *
 * RUN
 * - Starts a tour with specified conditions
 * - Checks localStorage for tour completion status
 * - Only runs if conditions are true and tour not completed
 * - Sets responsive styles and steps
 *
 * CALLBACK
 * - Handles tour step navigation and completion
 * - Updates step index on step changes
 * - Saves completion status when tour finished/skipped
 * - Handles target not found errors
 *
 * STOP
 * - Stops active tour
 * - Saves completion status to localStorage
 * - Resets step index to 0
 *
 * BUSINESS LOGIC
 *
 * STEP FILTERING
 * - Desktop: Filters out steps with screen: 'sm'
 * - Mobile: Filters out steps with screen: 'lg'
 * - Steps without screen property shown on all devices
 *
 * STEP OVERRIDES
 * - Base step config from TOURS tuple
 * - Screen-specific overrides in step.sm or step.lg
 * - Merged into final step config
 * - Allows different positioning/content per device
 *
 * TOUR CONDITIONS
 * - Conditions parameter controls whether tour can run
 * - Combined with localStorage check
 * - Both must be true for tour to start
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useState, useMemo
 * - react-joyride: ACTIONS, EVENTS, STATUS, Locale, CallBackProps, StylesOptions
 * - @Tuples: TOURS tuple with tour step definitions
 *
 * @module hooks/ui/useTour
 * @requires react
 * @requires react-joyride
 * @requires @Tuples
 */

import { useCallback, useReducer, useState, useMemo } from 'react';
import {
  CallBackProps,
  StylesOptions,
  ACTIONS,
  EVENTS,
  STATUS,
  Locale,
} from 'react-joyride';
import { TOURS } from '@Tuples';

const LOCALE = {
  open: 'Open the dialog',
  skip: 'Skip Tour',
  last: 'Got it!',
  close: 'Close',
  back: 'Back',
  next: 'Next',
};

const OPTIONS = {
  User: {
    width: '',
    zIndex: 100,
    beaconSize: 36,
    arrowColor: 'var(--secondary)',
    primaryColor: 'var(--contrast)',
    textColor: 'var(--shadow-dark)',
    backgroundColor: 'var(--accent)',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
  },
  Celebration: {
    width: '',
    zIndex: 12000,
    beaconSize: 36,
    arrowColor: 'var(--secondary)',
    primaryColor: 'var(--contrast)',
    textColor: 'var(--shadow-dark)',
    backgroundColor: 'var(--accent)',
    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
  },
};

export type TourName = 'User' | 'Celebration';

interface Payload {
  tour?: TourName;
  data?: CallBackProps;
  conditions?: boolean;
}

type HookAction =
  | { type: 'RUN'; payload: Payload }
  | { type: 'STOP'; payload: Payload }
  | { type: 'CALLBACK'; payload: Payload };

interface StepData {
  tour?: TourName;
  screen?: 'sm' | 'lg';
}

interface Steps {
  target: string;
  content: string;
  data?: StepData;
  offset?: number;
  placement?:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'center'
    | 'auto'
    | 'top-start'
    | 'top-end'
    | 'right-start'
    | 'right-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end';
  disableBeacon?: boolean;
  sm?: Partial<Omit<Steps, 'sm' | 'lg' | 'data'>>;
  lg?: Partial<Omit<Steps, 'sm' | 'lg' | 'data'>>;
}

type TourSteps = {
  [tour: string]: Steps[];
};

interface Options {
  options: {
    zIndex?: number;
    arrowColor?: string;
    textColor?: string;
    beaconSize?: number;
    overlayColor?: string;
    primaryColor?: string;
    width?: string | number;
    backgroundColor?: string;
    spotlightShadow?: string;
  };
}

interface Tourguide {
  run: boolean;
  steps: Steps[];
  locale: Locale;
  styles?: Options;
  stepIndex: number;
  callback: (data: CallBackProps) => void;
  /** Current tour name when run is true ('User' | 'Celebration') */
  tourName: TourName | '';
}

interface Handlers {
  runTour: (tour: TourName, conditions: boolean) => void;
  stopTour: (tour: TourName) => void;
  closeTour: (tour: TourName) => void;
}

export default function useTour(isDesktop: boolean): [Tourguide, Handlers] {
  const responsiveTOUR_STEPS = useCallback(
      (tour: TourName) => {
        const screenSize = isDesktop ? 'lg' : 'sm';
        const filtered = isDesktop
          ? (TOURS as unknown as TourSteps)[tour].filter((ts) => {
              if (ts.data && ts.data.screen) {
                return (ts.data as StepData)['screen'] !== 'sm';
              } else return ts;
            })
          : (TOURS as unknown as TourSteps)[tour].filter((ts) => {
              if (ts.data && ts.data.screen) {
                return (ts.data as StepData)['screen'] !== 'lg';
              } else return ts;
            });

        // Merge screen-specific overrides into base step config
        return filtered.map((step) => {
          const screenOverrides = step[screenSize];
          if (screenOverrides) {
            const { sm: _sm, lg: _lg, ...baseStep } = step;
            void _sm;
            void _lg;
            return { ...baseStep, ...screenOverrides };
          }
          return step;
        });
      },
      [isDesktop]
    ),
    toolTipWidth = useMemo(() => (isDesktop ? '18vw' : '85vw'), [isDesktop]),
    toolTipOverlayColor = useMemo(
      () => (isDesktop ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.68)'),
      [isDesktop]
    );

  const [tourName, setTourName] = useState('');

  const reducer = useCallback(
    (state: Tourguide, hookAction: HookAction): Tourguide => {
      switch (hookAction.type) {
        case 'RUN': {
          if (!tourName.length) {
            setTourName(
              (('pb:' +
                (
                  hookAction.payload as Payload
                ).tour?.toLowerCase()) as TourName) + 'Tour'
            );
          }
          const tour = (hookAction.payload as Payload).tour as TourName;
          return (state = {
            ...state,
            tourName: tour,
            styles: {
              options: {
                ...OPTIONS[tour],
                width: toolTipWidth,
                overlayColor: toolTipOverlayColor,
              },
            } as Options,
            steps: responsiveTOUR_STEPS(tour) as Steps[],
            run:
              ((hookAction.payload as Payload).conditions as boolean) &&
              localStorage.getItem(
                (('pb:' + tour?.toLowerCase()) as TourName) + 'Tour'
              ) !== 'false',
          });
        }
        case 'CALLBACK': {
          const { type, index, status, action } = (
            hookAction.payload as Payload
          ).data as CallBackProps;
          const tourFromPayload = (hookAction.payload as Payload).tour;
          if (
            [STATUS.FINISHED, STATUS.SKIPPED].includes(
              status as 'skipped' | 'finished'
            )
          ) {
            const tourKey =
              tourFromPayload &&
              ['User', 'Celebration'].includes(tourFromPayload)
                ? `pb:${tourFromPayload.toLowerCase()}Tour`
                : tourName || '';
            if (tourKey) {
              localStorage.setItem(tourKey, 'false');
            }
            return (state = {
              ...state,
              stepIndex: 0,
              tourName: '',
              run: false,
            });
          } else if (
            [EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(
              type as 'step:after' | 'error:target_not_found'
            )
          ) {
            const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            return (state = {
              ...state,
              stepIndex: nextStepIndex,
            });
          } else return state;
        }
        case 'STOP': {
          const tourFromPayload = (hookAction.payload as Payload).tour;
          const tourKey =
            tourFromPayload && ['User', 'Celebration'].includes(tourFromPayload)
              ? `pb:${tourFromPayload.toLowerCase()}Tour`
              : tourName || '';
          if (tourKey) {
            localStorage.setItem(tourKey, 'false');
          }
          setTourName('');
          return (state = {
            ...state,
            run: false,
            stepIndex: 0,
            tourName: '',
          });
        }
        default:
          throw new Error('useTour failed');
      }
    },
    [tourName, toolTipWidth, toolTipOverlayColor, responsiveTOUR_STEPS]
  );

  const tourCallback = useCallback(
    (data: CallBackProps) => {
      dispatch({
        payload: { tour: tourName as TourName, data: data },
        type: 'CALLBACK',
      });
    },
    [tourName]
  );

  const [state, dispatch] = useReducer(reducer, {
    steps: (TOURS as unknown as TourSteps)['User'] as Steps[],
    options: OPTIONS['User'] as unknown as StylesOptions,
    callback: tourCallback,
    locale: LOCALE,
    stepIndex: 0,
    tourName: '',
    run: false,
  } as Tourguide);

  const handlers = useMemo<Handlers>(
    () => ({
      runTour: (tour: TourName, conditions: boolean) =>
        dispatch({
          type: 'RUN',
          payload: { tour, conditions },
        }),
      stopTour: (tour: TourName) =>
        dispatch({ type: 'STOP', payload: { tour } }),
      closeTour: (tour: TourName) =>
        dispatch({
          type: 'CALLBACK',
          payload: {
            tour,
            data: {
              step: {} as NonNullable<CallBackProps['step']>,
              status: STATUS.SKIPPED,
              action: ACTIONS.CLOSE,
              type: EVENTS.TOUR_END,
              controlled: false,
              lifecycle: 'init',
              index: 0,
              size: 0,
            } as CallBackProps,
          },
        }),
    }),
    []
  );
  return [state, handlers];
}
