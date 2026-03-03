/**
 * @fileoverview Account Modal Tabs Management Hook
 *
 * This hook manages account modal tab state and handles tab change events.
 * It triggers account updates when tabs change and manages the active profile
 * tab state (contact, compliance, etc.).
 *
 * KEY FEATURES
 *
 * TAB STATE MANAGEMENT
 * - Tracks active profile tab (default: 'contact')
 * - Tracks previous tab for change detection
 * - Provides setter for tab changes
 *
 * TAB CHANGE DETECTION
 * - Detects when profile tab changes
 * - Automatically triggers account update on tab change
 * - Ensures unsaved changes are saved before switching tabs
 *
 * TAB SELECTION HANDLERS
 * - handleOnSelect: Main tab selection handler
 * - Triggers account update
 * - Closes security curtain
 * - Optionally updates main modal active key
 *
 * BUSINESS LOGIC
 *
 * AUTOMATIC UPDATE ON TAB CHANGE
 * - Compares prevActiveProfileTab with activeProfileTab
 * - If different: Triggers handleAccountUpdate()
 * - Updates prevActiveProfileTab to current
 * - Ensures data is saved when user switches tabs
 *
 * SECURITY CURTAIN
 * - Closes security curtain when tabs change
 * - Security curtain is UI element for password confirmation
 * - Closed automatically on tab switch
 *
 * DEPENDENCIES
 * - react: useState, useCallback, Dispatch, SetStateAction
 *
 * @module hooks/forms/useAccountTabs
 * @requires react
 */

import {
  useRef,
  useState,
  useCallback,
  type Dispatch,
  SetStateAction,
  useLayoutEffect,
} from 'react';

import { type AccountTab } from '@CONSTANTS';

export default function useAccountTabs(
  handleAccountUpdate: () => void,
  closeSecurityCurtain: () => void,
  setActiveKey?: Dispatch<SetStateAction<AccountTab>>
) {
  /** Current active profile tab state */
  const [activeProfileTab, setActiveProfileTab] = useState('contact');

  const prevActiveProfileTabRef = useRef(activeProfileTab);

  useLayoutEffect(() => {
    if (prevActiveProfileTabRef.current !== activeProfileTab) {
      prevActiveProfileTabRef.current = activeProfileTab;
      handleAccountUpdate();
    }
  }, [activeProfileTab, handleAccountUpdate]);

  /**
   * Handler for tab selection events
   * Triggers account update and closes security theater when switching tabs
   */
  const handleOnSelect = useCallback(
    (e: AccountTab) => {
      handleAccountUpdate();
      closeSecurityCurtain();
      if (setActiveKey) {
        setActiveKey(e);
      }
    },
    [setActiveKey, handleAccountUpdate, closeSecurityCurtain]
  );

  /**
   * Handler for profile tab changes
   */
  const handleProfileTabChange = useCallback(
    (value: string | ((prevState: string) => string)) => {
      const newTab =
        typeof value === 'function' ? value(activeProfileTab) : value;
      setActiveProfileTab(newTab);
    },
    [activeProfileTab]
  );

  return {
    setActiveProfileTab: handleProfileTabChange,
    activeProfileTab,
    handleOnSelect,
  };
}
