/**
 * @fileoverview Field List Management Hook
 *
 * This hook generates a list of form fields that need to be displayed based on
 * the active tab and device type. It filters controls to show only required
 * fields or fields that are empty, with special handling for mobile devices.
 *
 * KEY FEATURES
 *
 * TAB FILTERING
 * - Filters out controls from the active tab
 * - Shows fields from other tabs that need attention
 * - Helps users see what fields need completion
 *
 * DEVICE-SPECIFIC LOGIC
 * - Mobile: Shows required fields + empty occupation/employer + isEmployed
 * - Desktop: Shows only required fields
 * - Adapts field list based on screen size
 *
 * FIELD FILTERING
 * - Required fields always shown
 * - Empty fields shown (if mobile or required)
 * - Occupation/employer shown if empty (mobile only)
 * - isEmployed shown if empty (mobile only)
 *
 * BUSINESS LOGIC
 *
 * MOBILE FIELD DISPLAY
 * - Shows required fields
 * - Shows empty occupation/employer fields
 * - Shows isEmployed if empty
 * - More comprehensive field list for smaller screens
 *
 * DESKTOP FIELD DISPLAY
 * - Shows only required fields
 * - Simpler field list for larger screens
 * - Focuses on essential fields
 *
 * FIELD EXCLUSION
 * - Excludes country, isEmployed, compliance from field list
 * - These are handled separately in the form
 * - Prevents duplicate field display
 *
 * DEPENDENCIES
 * - react: useMemo
 * - @Interfaces: ControlCategory interface
 * - @Types: FieldControl type
 * - @Contexts: UserData type, useDevice hook
 *
 * @module hooks/forms/useFieldList
 * @requires react
 * @requires @Interfaces
 * @requires @Contexts
 * @requires @Types
 */

import { useMemo } from 'react';
import type { ControlCategory } from '@Interfaces';
import { useDevice, type UserData } from '@Contexts';
import type { FieldControl } from '@Types';

type Handlers = {
  setFieldList: () => void;
};

/**
 * Custom hook for generating field list based on active tab and device
 *
 * This hook filters form controls to show only fields that need attention,
 * with different logic for mobile and desktop devices.
 *
 * @param CONTROLS - Array of control categories with form field definitions
 * @param activeTab - Currently active tab (excluded from field list)
 * @param userData - User data object (country, isEmployed, compliance excluded)
 * @returns Tuple of [field list, handlers]
 * @returns {FieldControl['name']} field list - Filtered list of fields to display
 * @returns {Handlers} handlers - Object with setFieldList function (no-op)
 *
 * @example
 * ```typescript
 * const [fieldList] = useFieldList(CONTROLS, 'contact', userData);
 * // Returns fields from other tabs that need completion
 * ```
 */
export default function useFieldList(
  CONTROLS: ControlCategory[],
  activeTab: FieldControl['name'],
  {
    isEmployed: _isEmployed,
    compliance: _compliance,
    country: _country,
    ...initialFields
  }: Partial<UserData>
  // { country, isEmployed, compliance, ...initialFields }: Partial<UserData>
): [FieldControl[], Handlers] {
  void _country;
  void _isEmployed;
  void _compliance;

  const { isMobile } = useDevice();

  const fieldList = useMemo<FieldControl[]>(() => {
    return CONTROLS.filter((subForm) => subForm.eventKey !== activeTab)
      .map((subForm) => subForm.controls)
      .flat()
      .filter((control) => {
        if (isMobile) {
          if (
            control.required ||
            control['name'] === 'occupation' ||
            control['name'] === 'employer'
          ) {
            return (
              ((initialFields as UserData)[
                control['name'] as keyof UserData
              ] as string) === '' || control['name'] === 'isEmployed'
            );
          } else return false;
        } else return control.required;
      });
  }, [CONTROLS, initialFields, activeTab, isMobile]);

  const handlers = useMemo<Handlers>(() => ({ setFieldList: () => {} }), []);

  return [fieldList, handlers];
}
