/**
 * @fileoverview Loading Spinner State Management Hook
 *
 * This hook provides simple state management for loading spinners. It tracks
 * whether a spinner should be displayed and provides handlers to start and
 * stop the spinner.
 *
 * KEY FEATURES
 *
 * SPINNER STATE
 * - Boolean state: true = spinner visible, false = spinner hidden
 * - Simple on/off toggle functionality
 * - Memoized handlers for performance
 *
 * HANDLERS
 * - start: Sets spinner state to true (shows spinner)
 * - stop: Sets spinner state to false (hides spinner)
 *
 * USAGE
 * Used throughout the application to manage loading states during async
 * operations like API calls, form submissions, and data fetching.
 *
 * DEPENDENCIES
 * - react: useState, useMemo
 *
 * @module hooks/ui/useSpinner
 * @requires react
 */

import { useState, useMemo } from 'react';

interface Handlers {
  start: () => void;
  stop: () => void;
}

/**
 * Custom hook for managing loading spinner state
 *
 * This hook provides simple state management for loading spinners with
 * start and stop handlers.
 *
 * @returns Tuple of [spinner state, handlers]
 * @returns {boolean} spinner state - True if spinner should be visible
 * @returns {Handlers} handlers - Object with start and stop functions
 *
 * @example
 * ```typescript
 * const [isSpinning, { start, stop }] = useSpinner();
 *
 * // Show spinner
 * start();
 *
 * // Hide spinner
 * stop();
 * ```
 */
export default function useSpinner(): [boolean, Handlers] {
  const [state, setState] = useState<boolean>(false);

  const handlers = useMemo<Handlers>(
    () => ({
      start: () => setState(true),
      stop: () => setState(false),
    }),
    []
  );

  return [state, handlers];
}
