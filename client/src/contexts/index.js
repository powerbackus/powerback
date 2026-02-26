/**
 * Context Providers
 *
 * This file provides all React contexts for the application:
 *
 * - AuthContext: User authentication and session management
 * - DeviceContext: Device type detection and responsive behavior
 * - ProfileContext: User profile and settings state management
 * - DialogueContext: Modal, alert, and overlay state management
 * - NavigationContext: Browser navigation, routing, splash view state, navigateToSplashView (Tour -> funnel)
 * - DonationStateContext: Multi-step form state and navigation
 * - ElectionCycleContext: Election cycle state management
 * - ComplianceTierContext: Compliance tier state management and FEC compliance info
 * - DonationLimitsContext: Donation limit calculations, validation, and PAC logic
 * - SearchContext: Search state management
 */

import { useEffect } from 'react';

// --- Core user/session/device contexts ---
import { AuthProvider, useAuth } from './AuthContext';
import { DeviceProvider, useDevice } from './DeviceContext';
import { ProfileProvider, useProfile } from './ProfileContext';

// --- UI state and modal/dialogue contexts ---
import { DialogueProvider } from './DialogueContext';
import { NavigationProvider } from './NavigationContext';

// --- Domain-specific state contexts ---
import {
  useDonationState,
  DonationStateProvider,
} from './DonationStateContext';
import {
  useDonationLimits,
  DonationLimitsProvider,
} from './DonationLimitsContext';
import { ElectionCycleProvider } from './ElectionCycleContext';
import { ComplianceTierProvider } from './ComplianceTierContext';

// --- Feature/utility contexts ---
import { SearchProvider } from './SearchContext';

import { fetchAndCacheElectionDates } from '@Utils';
import { INIT } from '@CONSTANTS';

/**
 * ProfileProvider with authentication dependency injection
 * Wraps ProfileProvider with userData from AuthContext
 *
 * This allows ProfileProvider to access current user data without
 * directly depending on AuthContext, maintaining loose coupling
 *
 * @param children - Child components
 * @uses initialConstants - Server constants from app initialization
 * @uses userSettings - User settings from AuthContext
 */
const ProfileProviderWithProps = ({ children, initialConstants }) => {
  const { userData } = useAuth();
  const userSettings = userData?.settings;

  return (
    <ProfileProvider
      initialConstants={initialConstants}
      userSettings={userSettings || INIT.initialSettings}
    >
      {children}
    </ProfileProvider>
  );
};

/**
 * NavigationProvider with device and donation limits dependency injection
 * Injects device information from DeviceContext and PAC limit status from DonationLimitsContext
 *
 * @param children - Child components
 * @uses isDesktop - Whether the device is a desktop
 * @uses shouldSkipTipAsk - Whether TipAsk should be skipped due to PAC limit
 */
const NavigationProviderWithProps = ({ children }) => {
  const { shouldSkipTipAsk } = useDonationLimits(),
    { isDesktop } = useDevice(),
    { isLoggedIn } = useAuth(),
    { selectedPol, donation, polData } = useDonationState();

  // Create a validation function that can access the funnel state
  const validateNavigation = (state) => {
    // Block access to inner funnel screens when user doesn't have valid celebration state
    if (
      state.navContext === 'funnel' &&
      state.funnel &&
      state.funnel !== 'pol-donation'
    ) {
      // Check if user has valid celebration state
      const hasValidCelebrationState =
        isLoggedIn && selectedPol && donation > 0 && polData !== INIT.honestPol;

      if (!hasValidCelebrationState) {
        return false; // Block navigation
      }
    }

    return true; // Allow navigation
  };

  return (
    <NavigationProvider
      validateNavigation={validateNavigation}
      shouldSkipTipAsk={shouldSkipTipAsk}
      isLoggedIn={isLoggedIn}
      isDesktop={isDesktop}
    >
      {children}
    </NavigationProvider>
  );
};

/**
 * ComplianceTierProvider with authentication and profile dependency injection
 * Wraps ComplianceTierProvider with userData from AuthContext and serverConstants from ProfileContext
 *
 * This allows ComplianceTierProvider to access current user data and server constants without
 * directly depending on AuthContext and ProfileContext, maintaining loose coupling
 *
 * @param children - Child components
 * @uses userCompliance - User compliance level
 * @uses serverConstants - Server constants from ProfileContext
 */
const ComplianceTierProviderWithProps = ({ children }) => {
  const {
    userData: { compliance: userCompliance },
  } = useAuth();
  const { serverConstants } = useProfile();

  return (
    <ComplianceTierProvider
      userCompliance={userCompliance || 'guest'}
      serverConstants={serverConstants}
    >
      {children}
    </ComplianceTierProvider>
  );
};

/**
 * DonationLimitsProvider with authentication and profile dependency injection
 * Wraps DonationLimitsProvider with userData from AuthContext and serverConstants from ProfileContext
 *
 * This allows DonationLimitsProvider to access current user data and server constants without
 * directly depending on AuthContext and ProfileContext, maintaining loose coupling
 *
 * @param children - Child components
 * @uses userDonations - User donations
 * @uses tipLimitReached - User tip limit reached
 */
const DonationLimitsProviderWithProps = ({ children }) => {
  const {
    userData: { donations: userDonations, tipLimitReached },
  } = useAuth();

  return (
    <DonationLimitsProvider
      userDonations={userDonations || []}
      tipLimitReached={tipLimitReached || false}
    >
      {children}
    </DonationLimitsProvider>
  );
};

/**
 * DonationStateProvider with authentication dependency injection
 * Wraps DonationStateProvider with userData from AuthContext
 *
 * This allows DonationStateProvider to access current user data without
 * directly depending on AuthContext, maintaining loose coupling
 *
 * @param children - Child components
 * @uses userDonations - User donations
 */
const DonationStateProviderWithProps = ({ children }) => {
  const {
    userData: { donations: userDonations },
  } = useAuth();

  return (
    <DonationStateProvider userDonations={userDonations || []}>
      {children}
    </DonationStateProvider>
  );
};

/**
 * Composite provider that wraps all context providers in the correct order
 * to ensure proper dependency injection and state management
 *
 * @param children - Child components
 * @param serverConstants - Server constants from app initialization
 */
export const AppProviders = ({ children, serverConstants }) => {
  // Preload election dates (bundled + server when available) so ElectionCycleContext and Auth share one source
  useEffect(() => {
    fetchAndCacheElectionDates();
  }, []);

  return (
    <AuthProvider>
      <ProfileProviderWithProps initialConstants={serverConstants}>
        <ComplianceTierProviderWithProps>
          <ElectionCycleProvider>
            <DonationStateProviderWithProps>
              <DeviceProvider>
                <DialogueProvider>
                  <DonationLimitsProviderWithProps>
                    <NavigationProviderWithProps>
                      <SearchProvider>{children}</SearchProvider>
                    </NavigationProviderWithProps>
                  </DonationLimitsProviderWithProps>
                </DialogueProvider>
              </DeviceProvider>
            </DonationStateProviderWithProps>
          </ElectionCycleProvider>
        </ComplianceTierProviderWithProps>
      </ProfileProviderWithProps>
    </AuthProvider>
  );
};

// Re-export all context providers and hooks for convenient importing
export * from './AuthContext';
export * from './DeviceContext';
export * from './SearchContext';
export * from './ProfileContext';
export * from './DialogueContext';
export * from './DonationStateContext';
export * from './ElectionCycleContext';
export * from './ComplianceTierContext';
export * from './DonationLimitsContext';

export { useNavigation } from './NavigationContext';

export * from './types';
