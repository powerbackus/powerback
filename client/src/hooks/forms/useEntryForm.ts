/**
 * @fileoverview User Entry Form State Management Hook
 *
 * This hook manages user entry form state for login, registration, and password
 * change operations. It provides a reducer-based system for handling form data,
 * validation state, and password feedback messages.
 *
 * STATE STRUCTURE
 *
 * - userEntryForm: Form data (username, password, or change password request)
 * - userFormValidated: Boolean flag indicating form validation status
 * - secureUserPassFeedback: Password strength/validation feedback message
 *
 * ACTIONS
 *
 * SET
 * - Updates userEntryForm with new data
 * - Supports direct value assignment
 * - Supports function-based updates (prev => new)
 * - Used for username/password updates
 *
 * FORM_VALIDATION
 * - Sets userFormValidated flag
 * - Indicates whether form passes validation
 * - Used to enable/disable submit buttons
 *
 * FEEDBACK
 * - Sets secureUserPassFeedback message
 * - Used for password strength indicators
 * - Provides user feedback on password requirements
 *
 * CLEAR_USER_ENTRY_FORM
 * - Resets form to initial state
 * - Clears all form fields
 * - Resets validation and feedback
 *
 * BUSINESS LOGIC
 *
 * FORM TYPES
 * - UserEntryForm: Login/registration (username, password)
 * - UserEntryResponse: Response from registration endpoint
 * - ChangePasswordRequest: Password change (currentPassword, newPassword, username?)
 *
 * FUNCTION-BASED UPDATES
 * - Supports functional updates: setUserEntryForm(prev => ({ ...prev, ... }))
 * - Allows atomic updates based on previous state
 * - Useful for complex form state updates
 *
 * DEPENDENCIES
 * - react: useMemo, useReducer
 * - @Contexts: UserEntryResponse type
 * - @CONSTANTS: INIT constant
 *
 * @module hooks/forms/useEntryForm
 * @requires react
 * @requires @Contexts
 * @requires @CONSTANTS
 */

import { useMemo, useReducer } from 'react';
import type { UserEntryResponse } from '@Contexts';
import { INIT } from '@CONSTANTS';

export interface UserEntryForm {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  username?: string;
}

interface UserEntry {
  userEntryForm: UserEntryForm | UserEntryResponse | ChangePasswordRequest;
  userFormValidated: boolean;
  secureUserPassFeedback: string;
}

type EntryFormAction = {
  type: string;
  payload?:
    | string
    | boolean
    | UserEntryForm
    | UserEntryResponse
    | ChangePasswordRequest
    | ((
        prev: UserEntryForm | UserEntryResponse | ChangePasswordRequest
      ) => UserEntryForm | UserEntryResponse | ChangePasswordRequest);
};

interface Handlers {
  clearUserEntryForm: () => void;
  setUserFormValidated: (isValid: boolean) => void;
  setSecureUserPassFeedback: (feedback: string) => void;
  setUserEntryForm: (
    entryForm:
      | UserEntryForm
      | UserEntryResponse
      | ChangePasswordRequest
      | ((
          prev: UserEntryForm | UserEntryResponse | ChangePasswordRequest
        ) => UserEntryForm | UserEntryResponse | ChangePasswordRequest)
  ) => void;
}

export default function useEntryForm(): [UserEntry, Handlers] {
  const reducer = (state: UserEntry, action: EntryFormAction) => {
    switch (action.type) {
      case 'FEEDBACK':
        return {
          ...state,
          secureUserPassFeedback: action.payload as string,
        };
      case 'SET':
        const payload = action.payload;
        if (typeof payload === 'function') {
          return {
            ...state,
            userEntryForm: payload(state.userEntryForm),
          };
        }
        return {
          ...state,
          userEntryForm: {
            ...(payload as
              | UserEntryForm
              | UserEntryResponse
              | ChangePasswordRequest),
          },
        };
      case 'FORM_VALIDATION':
        return {
          ...state,
          userFormValidated: action.payload as boolean,
        };
      case 'CLEAR_USER_ENTRY_FORM':
        return {
          ...state,
          userEntryForm: INIT.credentials,
        };
      default:
        return state;
    }
  };

  const initialArg = useMemo<UserEntry>(
    () => ({
      userEntryForm: INIT.credentials,
      secureUserPassFeedback: '',
      userFormValidated: false,
    }),
    []
  );

  const [state, dispatch] = useReducer(reducer, initialArg);

  const handlers = useMemo<Handlers>(
    () => ({
      setUserEntryForm: (
        entryForm:
          | UserEntryForm
          | UserEntryResponse
          | ChangePasswordRequest
          | ((
              prev:
                | UserEntryForm
                | UserEntryResponse
                | ChangePasswordRequest
            ) => UserEntryForm | UserEntryResponse | ChangePasswordRequest)
      ) => {
        dispatch({ type: 'SET', payload: entryForm });
      },
      setUserFormValidated: (isValid: boolean) => {
        dispatch({ type: 'FORM_VALIDATION', payload: isValid });
      },
      setSecureUserPassFeedback: (feedback: string) => {
        dispatch({ type: 'FEEDBACK', payload: feedback });
      },
      clearUserEntryForm: () => {
        dispatch({ type: 'CLEAR_USER_ENTRY_FORM' });
      },
    }),
    []
  );

  return [state, handlers];
}
