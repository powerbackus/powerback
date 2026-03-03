/**
 * @fileoverview Form Validation State Management Hook
 *
 * This hook manages form field validation state, tracking which fields have
 * validation errors. It provides handlers for validating individual fields
 * and resetting all validation states.
 *
 * KEY FEATURES
 *
 * FIELD VALIDATION TRACKING
 * - Tracks validation state for all form fields
 * - Boolean flag per field (true = has error, false = valid)
 * - Fields: phoneNumber, employment, occupation, firstName, employer, lastName,
 *   passport, address, country, email, state, city, zip
 *
 * VALIDATION LOGIC
 * - Uses HTML5 constraint validation API (checkValidity())
 * - Only validates 'text' and 'select-one' input types
 * - Sets field error state to inverse of validity (invalid = true)
 *
 * RESET FUNCTIONALITY
 * - Resets all validation states to false
 * - Used when form is submitted or reset
 * - Restores initial validation state
 *
 * BUSINESS LOGIC
 *
 * VALIDATION TRIGGER
 * - validateField called on field change events
 * - Checks input type before validating
 * - Uses native HTML5 validation
 * - Updates state with validation result
 *
 * FIELD TYPES
 * - Only validates 'text' and 'select-one' types
 * - Other types (checkbox, radio, etc.) skipped
 * - Prevents unnecessary validation on non-text inputs
 *
 * DEPENDENCIES
 * - react: ChangeEvent, useState, useMemo
 * - @Interfaces: ValidatingFields interface
 *
 * @module hooks/forms/useFormValidation
 * @requires react
 * @requires @Interfaces
 */

import { ChangeEvent, useState, useMemo } from 'react';
import { ValidatingFields } from '@Interfaces';

interface Handlers {
  validateField: (e: ChangeEvent<HTMLInputElement>) => void;
  resetValidation: () => void;
}

/**
 * Custom hook for managing form field validation state
 *
 * This hook tracks which form fields have validation errors and provides
 * handlers for validating individual fields and resetting all validation states.
 *
 * @returns Tuple of [validation state, handlers]
 * @returns {ValidatingFields} validation state - Object with boolean flags for each field
 * @returns {Handlers} handlers - Object with validateField and resetValidation functions
 *
 * @example
 * ```typescript
 * const [validatingFields, { validateField, resetValidation }] = useFormValidation();
 *
 * // Validate a field on change
 * <input onChange={validateField} />
 *
 * // Reset all validation
 * resetValidation();
 * ```
 */
export default function useFormValidation(): [ValidatingFields, Handlers] {
  const initFields = useMemo<ValidatingFields>(() => {
    return {
      phoneNumber: false,
      employment: false,
      occupation: false,
      firstName: false,
      employer: false,
      lastName: false,
      passport: false,
      address: false,
      country: false,
      email: false,
      state: false,
      city: false,
      zip: false,
    };
  }, []);
  const [state, setState] = useState<ValidatingFields>(initFields);

  const handlers = useMemo<Handlers>(
    () => ({
      validateField: (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.type !== 'text' && e.target.type !== 'select-one') {
          return;
        } else
          setState((v: ValidatingFields) => ({
            ...v,
            [e.target.name]: !e.target.checkValidity(),
          }));
      },
      resetValidation: () => setState(initFields),
    }),
    [initFields]
  );

  return [state, handlers];
}
