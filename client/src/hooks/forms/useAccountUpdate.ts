/**
 * @fileoverview Account Update Management Hook
 *
 * This hook handles account update operations including change detection,
 * address validation with ocd_id lookup, employment information validation,
 * and API calls for user updates. It manages the complete account update
 * flow with proper validation and error handling.
 *
 * KEY FEATURES
 *
 * CHANGE DETECTION
 * - Compares current user data with form contact info
 * - Detects address changes (address, state, city, zip)
 * - Determines if update is necessary
 * - Prevents unnecessary API calls
 *
 * ADDRESS VALIDATION
 * - Detects when address information changes
 * - Automatically fetches ocd_id for congressional district mapping
 * - Uses Google Civics API via getPolsByLocation endpoint
 * - Handles API errors gracefully (sets ocd_id to empty string)
 *
 * EMPLOYMENT VALIDATION
 * - Checks if employment information is complete
 * - If employed: requires both occupation and employer
 * - Excludes incomplete employment data from updates
 * - Prevents partial employment data from being saved
 *
 * UPDATE FLOW
 * 1. Check if changes exist and form is valid
 * 2. Check if employment info is complete (if employed)
 * 3. Start updating spinner
 * 4. If address changed: Fetch new ocd_id
 * 5. Prepare update info (exclude incomplete employment if needed)
 * 6. Call handleUpdateUser to save changes
 *
 * BUSINESS LOGIC
 *
 * EARLY RETURNS
 * - No update if no changes detected
 * - No update if form has validation errors
 * - No update if employment info incomplete (and user is employed)
 * - Prevents unnecessary API calls and data corruption
 *
 * EMPLOYMENT DATA HANDLING
 * - If employment incomplete: Excludes isEmployed, occupation, employer
 * - If employment complete: Includes all employment fields
 * - Ensures data integrity in database
 *
 * ocd_id LOOKUP
 * - Only performed when address changes
 * - Combines address, city, state, zip into single string
 * - Uses getPolsByLocation API endpoint
 * - Falls back to empty string on error
 *
 * DEPENDENCIES
 * - react: useCallback, useMemo
 * - @Interfaces: ContactInfo, UpdatedInfo interfaces
 * - @Contexts: useAuth, UserData type
 * - @Utils: updateUser utility
 * - @API: API client
 *
 * @module hooks/forms/useAccountUpdate
 * @requires react
 * @requires @Interfaces
 * @requires @Contexts
 * @requires @Utils
 * @requires @API
 */

import { useCallback, useMemo } from 'react';
import type { ContactInfo, UpdatedInfo } from '@Interfaces';
import { useAuth, type UserData } from '@Contexts';
import { logError, updateUser } from '@Utils';
import API from '@API';

export default function useAccountUpdate(
  startUpdatingSpinner: () => void,
  stopUpdatingSpinner: () => void,
  contactInfo: ContactInfo,
  formIsInvalid: boolean,
  updating: boolean
) {
  const { userData, setUserData } = useAuth();

  /**
   * Check if employment information is incomplete when user is employed
   */
  const employmentIncomplete = useMemo(
    () =>
      contactInfo
        ? contactInfo.isEmployed &&
          (contactInfo.occupation === '' || contactInfo.employer === '')
        : true,
    [contactInfo]
  );

  /**
   * Check if there are no changes between current and previous user data
   */
  const noUserChanges = useMemo(
    () =>
      contactInfo
        ? Object.keys(contactInfo).every(
            (k) =>
              // Loose equality so server (number, null/undefined) and form (string, '') compare as unchanged
              // eslint-disable-next-line eqeqeq
              (userData as UserData)[k as keyof UserData] ==
              (contactInfo as ContactInfo)[k as keyof ContactInfo]
          )
        : true,
    [userData, contactInfo]
  );

  /**
   * Handler to update user data with new information
   */
  const handleUpdateUser = useCallback(
    (user: UserData, info: UpdatedInfo | keyof ContactInfo) =>
      updateUser(user, setUserData, info, stopUpdatingSpinner),
    [setUserData, stopUpdatingSpinner]
  );

  /**
   * Main account update handler that processes form changes and saves to server
   * Handles address changes with automatic ocd_id lookup for congressional district mapping
   */
  const handleAccountUpdate = useCallback(async () => {
    if (updating) return;

    const {
        isEmployed,
        occupation,
        employer,
        passport,
        address,
        country,
        state,
        city,
        zip,
        ...rest
      } = contactInfo,
      user = userData as UserData,
      /** Check if address information has changed */
      addressChanged =
        user.address !== address ||
        user.state !== state ||
        user.city !== city ||
        user.zip !== zip,
      /** Check if address information is domestic and complete for ocd_id lookup*/
      addressIsDomesticAndComplete =
        address !== '' &&
        city !== '' &&
        state !== '' &&
        country === 'United States' &&
        zip !== '';

    /** Early return if no changes, form is invalid, or employment info is incomplete */
    if (
      (noUserChanges && !addressChanged) ||
      formIsInvalid ||
      (employmentIncomplete && !(userData as UserData).isEmployed)
    ) {
      return;
    }

    startUpdatingSpinner();

    /** Prepare update info, excluding employment data if incomplete */
    type AccountUpdatePayload = ContactInfo & { ocd_id?: string };
    let updatedInfo: AccountUpdatePayload = employmentIncomplete
      ? contactInfo
      : {
          isEmployed,
          occupation,
          employer,
          passport,
          address,
          country,
          state,
          city,
          zip,
          ...rest,
        };

    /** If address changed, fetch new ocd_id for congressional district mapping */
    if (addressChanged && addressIsDomesticAndComplete) {
      try {
        const { data } = await API.getPolsByLocation(
          `${address} ${city} ${state} ${zip}`
        );
        updatedInfo = { ...updatedInfo, ocd_id: data };
      } catch (err) {
        logError('Failed to fetch new ocd_id', err);
        updatedInfo.ocd_id = '';
      }
    }

    handleUpdateUser(user, updatedInfo as UpdatedInfo);
  }, [
    updating,
    userData,
    contactInfo,
    noUserChanges,
    formIsInvalid,
    handleUpdateUser,
    employmentIncomplete,
    startUpdatingSpinner,
  ]);

  return {
    handleUpdateUser,
    handleAccountUpdate,
    employmentIncomplete,
    noUserChanges,
  };
}
