/**
 * @fileoverview Monty Hall Door State Management Hook
 *
 * This hook manages exclusive boolean state for multiple "doors" (options),
 * inspired by the Monty Hall problem. Only one door can be open at a time,
 * and opening a door automatically closes all others. Used for managing
 * mutually exclusive UI states like modal dialogs or confirmation prompts.
 *
 * KEY FEATURES
 *
 * EXCLUSIVE STATE MANAGEMENT
 * - Only one door (option) can be open at a time
 * - Opening a door closes all other doors
 * - Door names converted to camelCase keys (e.g., "Change Password" → "changePassword")
 *
 * DOOR NAMING
 * - Door names provided as array of strings
 * - Converted to camelCase object keys
 * - First character lowercase, spaces removed
 * - Example: ["Change Password", "Delete Account"] → { changePassword: false, deleteAccount: false }
 *
 * ACTIONS
 * - openDoor(type): Opens specified door, closes all others
 * - closeDoors(): Closes all doors (resets to initial state)
 *
 * BUSINESS LOGIC
 *
 * DOOR INITIALIZATION
 * - Creates object with all doors set to false
 * - Door names converted to camelCase keys
 * - Used as initial state for reducer
 *
 * DOOR OPENING
 * - Sets specified door to true
 * - Sets all other doors to false
 * - Ensures only one door open at a time
 *
 * USAGE
 * Used for managing mutually exclusive UI states such as:
 * - Password change vs account deletion modals
 * - Confirmation dialogs
 * - Tab panels
 * - Any exclusive selection state
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 *
 * @module hooks/ui/useMontyHall
 * @requires react
 */

import { useCallback, useReducer, useMemo } from 'react';

type Action = {
  type: string;
};

/** Door states: camelCase door names -> boolean (only one true at a time). */
type Which = Record<string, boolean>;

interface Handlers {
  openDoor: (type: string) => void;
  closeDoors: () => void;
}

/**
 * Custom hook for managing exclusive door states (Monty Hall pattern)
 *
 * This hook manages mutually exclusive boolean states where only one option
 * can be active at a time. Door names are converted to camelCase keys.
 *
 * @param doors - Array of door names (e.g., ["Change Password", "Delete Account"])
 * @returns Tuple of [door states, handlers]
 * @returns {Which} door states - Object with boolean flags for each door
 * @returns {Handlers} handlers - Object with openDoor and closeDoors functions
 *
 * @example
 * ```typescript
 * const [doors, { openDoor, closeDoors }] = useMontyHall(["Change Password", "Delete Account"]);
 *
 * // Open password change door (closes all others)
 * openDoor("Change Password");
 * // doors = { changePassword: true, deleteAccount: false }
 *
 * // Close all doors
 * closeDoors();
 * // doors = { changePassword: false, deleteAccount: false }
 * ```
 */
export default function useMontyHall(doors: string[]): [Which, Handlers] {
  const setInit = useCallback(() => {
    let newObj: Record<string, boolean> = {};
    for (let door of doors) {
      newObj = {
        ...newObj,
        [door.substring(0, 1).toLowerCase() + door.slice(1).replace(' ', '')]:
          false,
      };
    }
    return newObj;
  }, [doors]);

  const init: Which = useMemo(() => {
    return setInit();
  }, [setInit]);

  // what's behind door #2...
  const reducer = useCallback(
    (state: Which, action: Action) => {
      switch (action.type) {
        case action.type: {
          return (state = {
            ...init,
            [action.type.substring(0, 1).toLowerCase() +
            action.type.slice(1).replace(' ', '')]: true,
          });
        }
        case 'RESET': {
          return (state = init);
        }
        default:
          throw new Error();
      }
    },
    [init]
  );

  const [state, dispatch] = useReducer(reducer, init, setInit);

  const handlers = useMemo<Handlers>(
    () => ({
      openDoor: (type) => dispatch({ type: type }),
      closeDoors: () => dispatch({ type: 'RESET' }),
    }),
    []
  );

  return [state, handlers];
}
