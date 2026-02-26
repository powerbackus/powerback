/**
 * Profile context. Settings and server constants.
 * @module ProfileContext
 */
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  type ReactNode,
} from 'react';
import { INIT } from '@CONSTANTS';
import { logWarn } from '@Utils';
import type { Settings, ServerConstants } from './types';

/**
 * Profile context values interface
 * Provides access to user settings and server configuration
 */
interface ProfileValues {
  /** Server-side configuration constants (legal limits, default settings) */
  serverConstants: ServerConstants;
  /** Current user settings (preferences, notifications, etc.) */
  settings: Settings;
}

/**
 * Profile context actions interface
 * Provides methods for updating profile-related state
 */
interface ProfileActions {
  /** Update user settings and persist to session storage */
  setSettings: (settings: Settings) => void;
}

/**
 * Props for ProfileProvider component
 */
interface ProfileProviderProps {
  /** Server constants passed from initial app load */
  initialConstants: ServerConstants;
  /** Current user data */
  userSettings: Settings;
  /** Child components */
  children: ReactNode;
}

/**
 * Profile Context
 * Manages user profile settings and server configuration constants
 *
 * Responsibilities:
 * - User preference management (email receipts, tooltips, auto-tweet)
 * - Server configuration access (legal limits, default settings)
 * - Session storage persistence for settings
 * - Settings synchronization between server defaults and user preferences
 *
 * Settings Priority:
 * 1. User's saved settings (if authenticated)
 * 2. Session storage settings (for anonymous users)
 * 3. Server default settings (fallback)
 */
const ProfileContext = createContext<ProfileValues & ProfileActions>({
  setSettings: () => logWarn('setSettings called outside provider'),
  settings: INIT.initialSettings,
  serverConstants: {
    APP: { SETTINGS: INIT.initialSettings, MIN_PASSWORD_LENGTH: 0 },
    FEC: {
      PAC_ANNUAL_LIMIT: 5000,
      COMPLIANCE_TIERS: {} as ServerConstants['FEC']['COMPLIANCE_TIERS'],
    },
    STRIPE: {
      FEES: {
        PERCENTAGE: 0.03,
        ADDEND: 0.3,
      },
    },
  },
});

/**
 * Profile Provider Component
 * Manages user settings state and server constants
 *
 * Features:
 * - Automatic settings loading from multiple sources
 * - Session storage persistence for anonymous users
 * - Settings synchronization when user logs in/out
 * - Server constants injection from initial page load
 *
 * Settings Loading Logic:
 * - For authenticated users: Load from userSettings
 * - For anonymous users: Load from sessionStorage or server defaults
 * - Always fallback to server defaults if no other source available
 *

 * @param children - Child components needing profile context
 * @param userSettings - Current user personal settings
 * @param initialConstants - Server configuration loaded on app initialization
 */
export const ProfileProvider = ({
  children,
  userSettings,
  initialConstants,
}: ProfileProviderProps) => {
  // Try to load existing settings from session storage
  const sessionStoredSettings = sessionStorage.getItem('pb:settings');

  const getInitialSettings = (): Settings => {
    if (!sessionStoredSettings) {
      return INIT.initialSettings;
    }
    try {
      return JSON.parse(sessionStoredSettings) as Settings;
    } catch {
      // Corrupted or non‑JSON value – clear and fall back to defaults
      sessionStorage.removeItem('pb:settings');
      return INIT.initialSettings;
    }
  };

  const [settings, setSettingsState] = useState<Settings>(getInitialSettings());

  /**
   * Update settings state and trigger session storage persistence
   * @param settings - New settings object to apply
   */
  const setSettings = useCallback((settings: Settings) => {
    setSettingsState(settings);
  }, []);

  // Server constants remain static after initial load
  const [serverConstants] = useState<ServerConstants>(initialConstants);

  // Use useRef to track previous userSettings to detect changes
  const prevUserSettings = useRef<Settings | undefined>(userSettings);

  /**
   * Settings loading effect
   * Loads appropriate settings based on user authentication status
   * Handles the priority order: user settings > session storage > server defaults
   */
  useEffect(() => {
    // Clear any existing session data on settings load
    sessionStorage.removeItem('pb:session');

    if (!userSettings) {
      // Anonymous user: use server defaults
      if (!serverConstants?.APP?.SETTINGS) {
        return; // Wait for server constants to load
      } else setSettingsState(serverConstants.APP.SETTINGS);
    } else {
      // Authenticated user: prioritize user settings
      // Only load from session storage on initial load (when prevUserSettings was undefined)
      if (!prevUserSettings.current && sessionStoredSettings) {
        try {
          const parsed = JSON.parse(sessionStoredSettings) as Settings;
          setSettingsState(parsed);
        } catch {
          // Bad value in sessionStorage; clear and stick with current settings
          sessionStorage.removeItem('pb:settings');
        }
      }
      // Always apply user's saved settings (highest priority)
      // Normalize settings to ensure unsubscribedFrom is always an array
      const normalizedSettings: Settings = {
        ...INIT.initialSettings,
        ...userSettings,
        unsubscribedFrom: userSettings.unsubscribedFrom || [],
      };
      setSettingsState(normalizedSettings);
    }

    // Update ref to track current userSettings
    prevUserSettings.current = userSettings;
  }, [userSettings, serverConstants, sessionStoredSettings]);

  // Use useRef to track if session storage has been fetched
  const hasFetchedSessionStorage = useRef(false);

  /**
   * Session storage persistence effect
   * Automatically saves settings to session storage when they change
   * Ensures settings persist across page reloads for anonymous users
   */
  useEffect(() => {
    if (hasFetchedSessionStorage.current) return;
    hasFetchedSessionStorage.current = true;

    // Only create initial session storage if it doesn't exist
    if (!sessionStorage.getItem('pb:settings')) {
      sessionStorage.setItem('pb:settings', JSON.stringify(settings));
    }
  }, [settings]);

  return (
    <ProfileContext.Provider
      value={useMemo(
        () => ({
          settings,
          setSettings,
          serverConstants,
        }),
        [settings, setSettings, serverConstants]
      )}
    >
      {children}
    </ProfileContext.Provider>
  );
};

/**
 * Hook to access profile context
 * Must be used within ProfileProvider component tree
 *
 * Provides access to:
 * - User settings (email preferences, UI preferences, etc.)
 * - Server configuration constants (legal limits, defaults)
 * - Settings update functions
 *
 * @returns ProfileValues & ProfileActions - Complete profile context
 */
export const useProfile = () => useContext(ProfileContext);
