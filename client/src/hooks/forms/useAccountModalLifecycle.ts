/**
 * @fileoverview Account Modal Lifecycle Management Hook
 *
 * This hook manages the account modal lifecycle events including enter/exit
 * handlers, spinner management, and tour management. It ensures proper cleanup
 * and state management when the modal opens or closes.
 *
 * KEY FEATURES
 *
 * MODAL ENTER HANDLER
 * - Resets to contact tab on modal open
 * - Stops any active tours
 * - Prepares modal for use
 *
 * MODAL EXIT HANDLER
 * - Stops updating spinner if active
 * - Triggers account update to save changes
 * - Closes security curtain
 * - Resets form validation
 * - Resets to contact tab
 * - Hides update alert
 *
 * SPINNER MANAGEMENT
 * - Stops updating spinner when user data changes
 * - Uses useLayoutEffect for synchronous updates
 * - Prevents spinner from staying active after data updates
 *
 * BUSINESS LOGIC
 *
 * CLEANUP ON EXIT
 * - Ensures all state is properly reset
 * - Saves any pending changes
 * - Closes security elements
 * - Resets form state
 * - Provides clean slate for next modal open
 *
 * TOUR MANAGEMENT
 * - Stops tours when modal opens
 * - Prevents tour interference with modal interactions
 * - Optional parameter (stopTour may be undefined)
 * - On desktop, if sessionStorage has pb:openAccountToCelebrations (set when
 *   Celebration tour starts), opens to Celebrations tab and clears the flag.
 *
 * DEPENDENCIES
 * - react: useCallback, useLayoutEffect
 * - @Contexts: useDialogue hook
 *
 * @module hooks/forms/useAccountModalLifecycle
 * @requires react
 * @requires @Contexts
 */

import { Dispatch, SetStateAction, useCallback, useLayoutEffect } from 'react';
import { useDialogue, type UserData } from '@Contexts';
import type { AccountTab } from '@CONSTANTS';

const OPEN_ACCOUNT_TO_CELEBRATIONS_KEY = 'pb:openAccountToCelebrations';

export default function useAccountModalLifecycle(
  handleAccountUpdate: () => void,
  closeSecurityCurtain: () => void,
  resetValidation: () => void,
  setActiveProfileTab: (tab: string) => void,
  stopUpdatingSpinner: () => void,
  updating: boolean,
  userData: UserData,
  stopTour?: (tourType: 'User' | 'Celebration') => void,
  isDesktop?: boolean,
  setActiveKey?: Dispatch<SetStateAction<AccountTab>>
) {
  const { setShowAlert } = useDialogue();
  /**
   * Handler called when modal enters/opens.
   * On desktop, if Celebration tour set the flag, open to Celebrations and clear it
   * (setActiveKey drives the modal tab; setActiveProfileTab keeps internal state in sync).
   * Otherwise reset to Profile/contact. Then stop any active tour.
   */
  const onEnter = useCallback(() => {
    if (isDesktop) {
      try {
        if (sessionStorage.getItem(OPEN_ACCOUNT_TO_CELEBRATIONS_KEY)) {
          sessionStorage.removeItem(OPEN_ACCOUNT_TO_CELEBRATIONS_KEY);
          // setActiveProfileTab('contact');
          setActiveKey?.('Celebrations');
        } else {
          setActiveProfileTab('contact');
          setActiveKey?.('Profile');
        }
      } catch {
        setActiveProfileTab('contact');
        setActiveKey?.('Profile');
      }
    } else {
      setActiveProfileTab('contact');
      setActiveKey?.('Profile');
    }
    if (stopTour) stopTour('User');
  }, [stopTour, setActiveProfileTab, setActiveKey, isDesktop]);

  /**
   * Handler called when modal exits/closes
   * Stops spinner, updates account, closes security theater, and resets validation
   */
  const onExit = useCallback(() => {
    if (updating) stopUpdatingSpinner();

    handleAccountUpdate();
    closeSecurityCurtain();
    resetValidation();
    setActiveProfileTab('contact');
    setShowAlert((s) => ({
      ...s,
      update: false,
    }));
  }, [
    closeSecurityCurtain,
    handleAccountUpdate,
    setActiveProfileTab,
    stopUpdatingSpinner,
    resetValidation,
    setShowAlert,
    updating,
  ]);

  /** Stop updating spinner when user data changes */
  useLayoutEffect(() => {
    stopUpdatingSpinner();
  }, [userData, stopUpdatingSpinner]);

  return {
    onEnter,
    onExit,
  };
}
