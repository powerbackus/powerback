/**
 * Auth context. Login state, user data, authIn/authOut.
 * @module AuthContext
 */
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { UserData, UserEntryResponse } from './types';
import { useSpinner, type UserEntryForm } from '@Hooks';
import type { Celebration } from '@Types';
import { AxiosError } from 'axios';
import { Jwt } from 'jsonwebtoken';
import { INIT } from '@CONSTANTS';
import API from '@API';
import {
  logWarn,
  logError,
  reportClientError,
  fetchAndCacheElectionDates,
} from '@Utils';

/**
 * Authentication state interface
 * Tracks login status and user authentication state
 */
interface AuthState {
  /** Complete user data object including profile and donations */
  userData: UserData;
  /** Whether a login attempt is currently in progress */
  isLoggingIn: boolean;
  /** Whether the user is currently authenticated */
  isLoggedIn: boolean;
  /** Whether authentication is being initialized (refresh token check) */
  isInitializing: boolean;
}

/**
 * Authentication actions interface
 * Provides methods for authentication operations
 */
interface AuthActions {
  /** Update user data state */
  setUserData: Dispatch<SetStateAction<UserData>>;
  /** Authenticate user with credentials - returns success boolean */
  authIn: (credentials: UserEntryForm) => Promise<boolean>;
  /** Log out current user and clear session */
  authOut: () => void;
  /** Refresh user privileges by checking understands flag */
  refreshUserPrivileges: () => Promise<void>;
  /** Refresh complete user data from server */
  refreshUserData: () => Promise<void>;
}

interface MaybeAxiosError {
  response?: {
    status?: number;
  };
}

/**
 * Authentication Context
 * Manages user authentication state, login/logout operations, and token handling
 * Provides centralized auth state for the entire application
 */
const AuthContext = createContext<AuthState & AuthActions>({
  authIn: async () => {
    logWarn('authIn called outside auth provider');
    return false;
  },
  authOut: () => logWarn('authOut called outside auth provider'),
  setUserData: () => logWarn('setUserData called outside auth provider'),
  refreshUserPrivileges: async () =>
    logWarn('refreshUserPrivileges called outside auth provider'),
  refreshUserData: async () =>
    logWarn('refreshUserData called outside auth provider'),
  userData: INIT.userData,
  isInitializing: true,
  isLoggingIn: false,
  isLoggedIn: false,
});

/**
 * Authentication Provider Component
 * Manages authentication state, handles login/logout, and provides auth context to children
 *
 * Features:
 * - JWT token management with axios interceptors
 * - Automatic token refresh on app initialization
 * - User celebration/donation data loading
 * - Persistent authentication state
 * - Election dates fetching after authentication
 *
 * @param children - Child components that need access to auth context
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData>(INIT.userData),
    [isInitializing, setIsInitializing] = useState(true),
    [isLoggingIn, { start, stop }] = useSpinner();

  const didInit = useRef(false); // Prevent double initialization in React StrictMode

  /**
   * Sets or clears the Authorization header for axios requests
   * @param token - JWT token to set, or empty string to clear
   */
  const setBearer = useCallback((token: Jwt | '') => {
    const { setBearerToken } = require('../api/axiosClient');
    setBearerToken(token as string);
  }, []);

  /**
   * Loads user's celebration/donation history
   * @param user - User object with id
   * @returns Promise resolving to array of celebrations
   */
  const loadUserCelebrations = useCallback(async (id: string) => {
    try {
      const celebrationsRes = await API.getCelebrationsByUserId(id);
      return celebrationsRes.data as Celebration[];
    } catch (error) {
      logError('loadUserCelebrations - API error', error);
      return []; // Return empty array on error
    }
  }, []);

  /**
   * Loads election dates after authentication (shared cache; server preferred over bundled).
   */
  const loadElectionDates = useCallback(async () => {
    try {
      await fetchAndCacheElectionDates();
    } catch (error) {
      logError('Failed to load election dates', error);
      reportClientError({
        message: 'Failed to load election dates',
        context: 'AuthContext.loadElectionDates',
      });
    }
  }, []);

  /**
   * Authenticates user with provided credentials
   * Performs login, sets auth token, loads user data and donations
   *
   * @param credentials - Login form data (username/password)
   * @returns Promise<boolean> - true if login successful
   * @throws Error with status property for HTTP errors
   */
  const authIn = useCallback(
    async (credentials: UserEntryForm): Promise<boolean> => {
      start(); // Show loading graphic
      try {
        // Authenticate user
        const { data: user } = await API.login(
          credentials as UserEntryResponse
        );
        // Set authorization header for future requests
        setBearer(user.accessToken as unknown as Jwt);
        // Load user's donation history
        const donations = await loadUserCelebrations(user.id);

        // Clean up response data and set user state (drop accessToken from userData)
        const { accessToken: _accessToken, ...userData } = user;
        void _accessToken;
        setUserData({ ...userData, donations });

        // Load election dates after successful authentication
        await loadElectionDates();

        return true;
      } catch (err) {
        const axiosErr = err as AxiosError;
        const status = axiosErr.status ?? 500;

        reportClientError({
          message: 'Login error',
          context: 'AuthContext.authIn',
          extra: {
            status,
          },
        });

        throw Object.assign(new Error(), { status });
      } finally {
        stop(); // Hide loading graphic
      }
    },
    [stop, start, setBearer, loadUserCelebrations, loadElectionDates]
  );

  /**
   * Logs out current user
   * Clears auth token, resets user data, and stops any loading states
   */
  const authOut = useCallback(() => {
    try {
      API.logout(); // Call logout endpoint
    } catch {
      // Ignore logout API errors - still clear local state
    }
    setUserData(INIT.userData); // Reset to initial state
    setBearer(''); // Clear auth header
    stop(); // Stop any loading states

    // Clear election dates cache and guest access on logout
    try {
      localStorage.removeItem('pb:billId');
      localStorage.removeItem('pb:donorId');
      localStorage.removeItem('pb:electionDates');
      localStorage.removeItem('pb:celebrationTour');

      sessionStorage.removeItem('pb:settings');
    } catch {
      // Ignore storage errors during logout
    }
  }, [stop, setBearer]);

  /**
   * Refresh user privileges by checking understands flag
   * Updates user data if privilege status has changed
   */
  const refreshUserPrivileges = useCallback(async () => {
    if (!userData.id) return;

    try {
      const { data: understands } = await API.checkPrivilege(userData.id);
      if (understands !== userData.understands) {
        setUserData((prev) => ({ ...prev, understands }));
      }
    } catch (error) {
      logError('Error checking privilege', error);
      reportClientError({
        message: 'Error checking privilege',
        context: 'AuthContext.refreshUserPrivileges',
        extra: {
          status: (error as MaybeAxiosError).response?.status,
        },
      });
    }
  }, [userData.id, userData.understands, setUserData]);

  /**
   * Refresh complete user data from server
   * Used after operations that might change user data (like setting tipLimitReached)
   */
  const refreshUserData = useCallback(async () => {
    if (!userData.id) return;

    try {
      // Fetch complete user data
      const { data: userObj } = await API.getUserData(userData.id);

      // Load user's celebrations/donations
      const donations = await loadUserCelebrations(userObj.id);

      // Update user data with fresh data from server
      setUserData({
        ...userObj,
        id: userObj.id,
        donations,
      });
    } catch (error) {
      logError('Error refreshing user data', error);
      reportClientError({
        message: 'Error refreshing user data',
        context: 'AuthContext.refreshUserData',
        extra: {
          status: (error as MaybeAxiosError).response?.status,
        },
      });
    }
  }, [userData.id, setUserData, loadUserCelebrations]);

  /**
   * Automatic token refresh effect
   * Runs once on app initialization to restore authentication state
   * Attempts to refresh expired tokens and reload user data
   */
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Safety timeout - ensure initialization always completes
    const safetyTimeout = setTimeout(() => {
      logWarn('[AuthContext] Initialization timeout - forcing completion');
      stop();
      setIsInitializing(false);
    }, 15000); // 15 second max

    const initAuth = async () => {
      start(); // Show loading state during initialization

      try {
        // Bootstrap CSRF token by making a request that doesn't require CSRF
        // The backend CSRF generator middleware will set the cookie in the response
        // We MUST wait for this to complete so the cookie is available
        try {
          await Promise.race([
            API.getConstants(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Bootstrap timeout')), 3000)
            ),
          ]);
        } catch (bootstrapError) {
          // Even if bootstrap fails, CSRF cookie should be set by middleware
          // Continue to refresh attempt - it will fail fast with 403 if no CSRF
        }

        // Attempt to refresh token from stored refresh token
        // Now we should have CSRF token cookie from the bootstrap request
        // 401 is expected if no valid refresh token exists - let it fail fast
        const { data: user } = await API.refreshToken();

        // Set new access token
        setBearer(user.accessToken as unknown as Jwt);

        // Fetch complete user data
        const { data: userObj } = await API.getUserData(user.id);

        // Load user's celebrations/donations
        const fullUser = await loadUserCelebrations(userObj.id);

        // Construct complete user data object
        let userDataSet = {
          ...userObj,
          id: userObj.id, // Normalize id field
          donations: fullUser,
        };
        // delete userDataSet.id; // Remove MongoDB _id field
        setUserData(userDataSet);

        // Load election dates after successful authentication
        await loadElectionDates();
      } catch (err: unknown) {
        // Handle all errors - both AxiosError and other errors
        const axiosErr = err as AxiosError;
        const status = axiosErr?.response?.status;

        // Log non-401/403 errors
        // 401 is expected for expired/missing tokens
        // 403 is expected for CSRF validation failures (no valid session)
        if (status !== 401 && status !== 403) {
          logError('Auth initialization error', err);
          reportClientError({
            message: 'Auth initialization error',
            context: 'AuthContext.initAuth',
            extra: {
              status,
            },
          });
        }
        // Clear any stale auth state on initialization failure
        setUserData(INIT.userData);
        setBearer('');
      } finally {
        // Always stop loading and mark initialization complete
        // This ensures the app doesn't hang on the loading screen
        clearTimeout(safetyTimeout); // Clear safety timeout
        stop(); // Hide loading state
        setIsInitializing(false); // Mark initialization as complete
      }
    };
    initAuth();
  }, [start, stop, setBearer, loadUserCelebrations, loadElectionDates]);

  return (
    <AuthContext.Provider
      value={useMemo(
        () => ({
          refreshUserPrivileges,
          refreshUserData,
          isInitializing,
          setUserData,
          isLoggingIn,
          isLoggedIn: !!userData.id, // Derive login status from user ID presence
          userData,
          authOut,
          authIn,
        }),
        [
          refreshUserPrivileges,
          refreshUserData,
          isInitializing,
          setUserData,
          isLoggingIn,
          userData,
          authOut,
          authIn,
        ]
      )}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 * Must be used within AuthProvider component tree
 *
 * @returns AuthState & AuthActions - Complete auth context with state and actions
 */
export const useAuth = () => useContext(AuthContext);
