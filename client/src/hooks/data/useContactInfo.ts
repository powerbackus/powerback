/**
 * @fileoverview Contact Information Form State Management Hook
 *
 * This hook manages user contact information form state including validation,
 * normalization, and international address handling. It provides a reducer-based
 * system for handling form field updates with special handling for phone number
 * formatting and compliance data exclusion.
 *
 * KEY FEATURES
 *
 * PHONE NUMBER NORMALIZATION
 * - Automatically formats phone numbers as user types
 * - Format: (XXX) XXX-XXXX
 * - Uses normalize utility for consistent formatting
 * - Preserves previous value for proper formatting logic
 *
 * INTERNATIONAL ADDRESS SUPPORT
 * - Clears zip field when switching to international format
 * - Prevents format conflicts between US zip and postal codes
 * - Triggered by INTL action
 *
 * COMPLIANCE DATA EXCLUSION
 * - Removes compliance tier from contact info
 * - Uses prune utility to filter sensitive/internal data
 * - Ensures clean contact info object for form state
 *
 * ACTIONS
 *
 * LOAD
 * - Loads contact info from user data
 * - Excludes compliance data explicitly
 * - Uses prune utility for initial filtering
 * - Falls back to INIT.contactInfo if no user data
 *
 * SET
 * - Updates a specific form field
 * - Applies phone number normalization if field is 'phoneNumber'
 * - Other fields updated directly
 *
 * INTL
 * - Clears zip field when switching to international format
 * - Prevents US zip code from conflicting with postal code
 * - Used when user selects non-US country
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 * - @Interfaces: ContactInfo, Payload interfaces
 * - @Contexts: UserData type
 * - hooks/fn: prune, normalize utilities
 * - @CONSTANTS: INIT constant
 *
 * @module hooks/data/useContactInfo
 * @requires react
 * @requires @Interfaces
 * @requires @Contexts
 * @requires hooks/fn
 * @requires @CONSTANTS
 */
import { useCallback, useReducer, useMemo } from 'react';
import type { ContactInfo, Payload } from '@Interfaces';
import type { UserData } from '@Contexts';
import { prune, normalize } from '../fn';
import { INIT } from '@CONSTANTS';

interface Handlers {
  setContactInfo: ({ name, value }: Payload) => void;
  loadContactInfo: () => void;
  setIntl: () => void;
}
type ContactInfoKey = keyof ContactInfo;

type Action = {
  payload: Payload;
  type: string;
};

export default function useContactInfo(
  user: UserData
): [ContactInfo, Handlers] {
  const initialArg = useMemo<ContactInfo>(
    () => (prune(user) as ContactInfo) || INIT.contactInfo,
    [user]
  );
  const reducer = useCallback(
    (state: ContactInfo, action: Action) => {
      switch (action.type) {
        case 'LOAD':
          // compliance keeps returning to this object, despite prune(), so just hard delete here.
          let contactInfoOnly = initialArg;
          delete contactInfoOnly['compliance' as ContactInfoKey];
          return contactInfoOnly;
        case 'SET':
          return {
            ...state,
            [action.payload.name]:
              action.payload.name === 'phoneNumber'
                ? normalize(action.payload.value, state[action.payload.name])
                : action.payload.value,
          };
        // clears input field if 'Zip' changes to 'Postal Code'
        case 'INTL':
          return { ...state, zip: '' };
        default:
          throw new Error();
      }
    },
    [initialArg]
  );

  const [state, dispatch] = useReducer(reducer, initialArg);

  const handlers = useMemo<Handlers>(
    () => ({
      setContactInfo: ({ name, value }: Payload) => {
        dispatch({ type: 'SET', payload: { name, value } });
      },
      loadContactInfo: () => {
        dispatch({ type: 'LOAD' } as Action);
      },
      setIntl: () => {
        dispatch({ type: 'INTL' } as Action);
      },
    }),
    []
  );
  return [state, handlers];
}
