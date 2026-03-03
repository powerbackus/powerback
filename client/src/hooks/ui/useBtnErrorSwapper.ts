/**
 * @fileoverview Button Error Swapper Hook
 *
 * This hook manages the state of buttons that can display error messages.
 * It swaps between normal button state and error state, automatically
 * reverting to button state after a timeout. Used for form submission
 * buttons that need to show error feedback.
 *
 * KEY FEATURES
 *
 * STATE SWAPPING
 * - Normal state: Shows button with default view
 * - Error state: Shows error icon and message
 * - Automatic reversion after timeout
 *
 * ERROR MAPPING
 * - Maps HTTP status codes to error messages
 * - Supported codes: 400, 401, 403, 409, 422, 500
 * - Error messages from ERRORS tuple
 * - Includes error icons for visual feedback
 *
 * AUTO-REVERSION
 * - Automatically reverts to button state after timeout
 * - Timeout duration from ALERT_TIMEOUT.btnErrSwapper
 * - Uses useLayoutEffect for synchronous updates
 * - Cleans up timeout on unmount
 *
 * BUSINESS LOGIC
 *
 * ERROR DISPLAY FLOW
 * 1. swapToError(errorCode) called with HTTP status code
 * 2. Error state set with icon and message from ERRORS tuple
 * 3. Timeout started for auto-reversion
 * 4. After timeout: Automatically reverts to button state
 * 5. Timeout cleared on component unmount
 *
 * ERROR CODE MAPPING
 * - Looks up matching HTTP status in ERRORS tuple
 * - Falls back to generic 500 error when status is not mapped
 * - Each error has icon and message
 *
 * DEPENDENCIES
 * - react: useLayoutEffect, useCallback, useReducer, useState, useMemo
 * - @CONSTANTS: ALERT_TIMEOUT constant
 * - axios: HttpStatusCode type
 * - @Tuples: ERRORS tuple with error messages
 *
 * @module hooks/ui/useBtnErrorSwapper
 * @requires react
 * @requires @Tuples
 * @requires @CONSTANTS
 * @requires axios
 */

import {
  useRef,
  useMemo,
  useReducer,
  useCallback,
  useLayoutEffect,
} from 'react';
import { ERRORS } from '@Tuples';
import { ALERT_TIMEOUT } from '@CONSTANTS';
import type { HttpStatusCode } from 'axios';

interface SwapperBtn {
  view: { icon: string; msg: string };
  showError: boolean;
}

export interface View {
  icon: string;
  msg: string;
}

const init: SwapperBtn = {
  view: { icon: '', msg: '' } as View,
  showError: false,
};

export interface SwapButtonError {
  showError: boolean;
  view: View;
}

type Action = { payload?: HttpStatusCode; type: string };

interface Handlers {
  swapToButton: () => void;
  swapToError: (errorCode: HttpStatusCode) => void;
}

export default function useButtonErrorSwapper(): [SwapperBtn, Handlers] {
  const reducer = useCallback(
    (buttonErrorSwapper: SwapperBtn, action: Action) => {
      switch (action.type) {
        case 'BTN': {
          return (buttonErrorSwapper = init);
        }
        case 'ERR': {
          const status = action.payload as HttpStatusCode;
          const errorView =
            ERRORS.find((e) => e.status === status) ||
            ERRORS.find((e) => e.status === 500);

          return {
            ...buttonErrorSwapper,
            showError: true,
            view: (errorView || { icon: '', msg: '' }) as View,
          };
        }
        default:
          throw new Error();
      }
    },
    []
  );

  const [buttonErrorSwapper, dispatch] = useReducer(reducer, init);

  function swapToButton() {
    dispatch({ type: 'BTN' } as Action);
  }

  const handleSwapSubmitStatus = useCallback(() => {
    const swapper = setTimeout(
      () => (swapToButton as () => void)(),
      ALERT_TIMEOUT.btnErrSwapper
    );
    return () => clearTimeout(swapper);
  }, []);

  const prevShowErrorRef = useRef(
    (buttonErrorSwapper as SwapButtonError).showError
  );

  useLayoutEffect(() => {
    const showError = (buttonErrorSwapper as SwapButtonError).showError;
    if (prevShowErrorRef.current !== showError) {
      prevShowErrorRef.current = showError;
      if (showError) handleSwapSubmitStatus();
    }
  }, [buttonErrorSwapper, handleSwapSubmitStatus]);

  const handlers = useMemo<Handlers>(
    () => ({
      swapToButton: swapToButton,
      swapToError: (errorCode: number) =>
        dispatch({ type: 'ERR', payload: errorCode } as Action),
    }),
    []
  );

  return [buttonErrorSwapper, handlers];
}
