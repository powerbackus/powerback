# React Contexts Documentation

This document provides a comprehensive overview of all React contexts used in the POWERBACK.us application. Contexts provide centralized state management and avoid prop drilling throughout the component tree.

> **📖 Related Documentation:**
>
> - [Custom Hooks](./hooks.md) - Hooks that work with contexts
> - [Common Props](./common-props.md) - Reusable prop slice types for components
> - [Design System](./design-system.md) - UI components and styling

## Context Hierarchy

The application uses a carefully orchestrated context hierarchy to manage dependencies and state flow:

```
AuthProvider (outermost)
├── DeviceProvider
│   └── DialogueProvider
│       └── ProfileProvider (with auth dependency)
│           └── NavigationProvider (with device/donation-limits dependency)
│               └── DonationStateProvider (with multi-context dependencies)
│                   └── SearchProvider (innermost)
```

### Logging conventions

Frontend contexts avoid writing raw errors or API responses directly to the browser console in production. Instead they use the shared client logging helper (`client/src/utils/clientLog.ts`, imported as `logError` / `logWarn` from `@Utils`):

- In **development**, contexts log full error objects and stacks to aid debugging.
- In **production**, they log only high-level messages (no `error.response`, payloads, or stack traces), and most warnings are suppressed to keep consoles clean.
- Default "called outside provider" handlers (e.g. `setSettings`, `setDonationLimit`, `recalculateCycle`, `setFormCompliance`) use `logWarn` so they are visible while developing but quiet in production.

## Core Contexts

### AuthContext (`client/src/contexts/AuthContext.tsx`)

**Purpose**: Manages user authentication state, login/logout operations, and JWT token handling.

**Key Features**:

- JWT token management with axios interceptors
- Automatic token refresh on app initialization
- User Celebration/donation data loading
- Persistent authentication state

**State**:

```typescript
interface AuthState {
  isLoggingIn: boolean; // Login attempt in progress
  isLoggedIn: boolean; // User authentication status
  userData: UserData; // Complete user profile and donations
}
```

**Actions**:

```typescript
interface AuthActions {
  setUserData: Dispatch<SetStateAction<UserData>>;
  authIn: (credentials: UserEntryForm) => Promise<boolean>;
  authOut: () => void;
}
```

**Usage**:

```typescript
const { userData, isLoggedIn, authIn, authOut } = useAuth();
```

### DeviceContext (`client/src/contexts/DeviceContext.tsx`)

**Purpose**: Provides responsive breakpoint detection and device information for adaptive UI.

**Key Features**:

- Granular device type detection (xs, sm, md, lg, xl, xxl)
- Orientation-aware breakpoints
- Real-time viewport dimensions
- Performance-optimized with deferred updates

**State**:

```typescript
interface DeviceContext {
  // Modern responsive breakpoints
  isMobileHorizontal: boolean;
  isMobilePortraitSmall: boolean;
  isMobilePortrait: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  isDesktop: boolean;
  isBigScreen: boolean;

  // Legacy properties
  isMobile: boolean;
  isShortMobile: boolean;
  orientation: 'portrait' | 'landscape';
  deviceType: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  height: number;
  width: number;
}
```

**Usage**:

```typescript
const { isDesktop, isMobile, deviceType, width, height } = useDevice();
```

### DialogueContext (`client/src/contexts/DialogueContext.tsx`)

**Purpose**: Centralized state management for all UI dialogue components (modals, alerts, overlays).

**Key Features**:

- Alert notification states (success, error, info messages)
- Modal dialog states (credentials, account, terms, etc.)
- Side navigation panel visibility
- Overlay states (password reset, loading screens)

**State**:

```typescript
interface DialogueState {
  showAlert: ShowAlert; // Alert notification states
  showModal: ShowModal; // Modal dialog states
  showSideNav: boolean; // Side navigation visibility
  showOverlay: ShowOverlay; // Overlay screen states
}
```

**Actions**:

```typescript
interface DialogueActions {
  setShowAlert: Dispatch<SetStateAction<ShowAlert>>;
  setShowModal: Dispatch<SetStateAction<ShowModal>>;
  setShowSideNav: Dispatch<SetStateAction<boolean>>;
  setShowOverlay: Dispatch<SetStateAction<ShowOverlay>>;
}
```

**Usage**:

```typescript
const { showModal, setShowModal, showAlert, setShowAlert } = useDialogue();
```

### ProfileContext (`client/src/contexts/ProfileContext.tsx`)

**Purpose**: Manages user settings and server configuration constants.

**Key Features**:

- User preference management (email receipts, tooltips, auto-tweet)
- Server configuration access (legal limits, default settings)
- Session storage persistence for settings
- Settings synchronization between server defaults and user preferences

**State**:

```typescript
interface ProfileValues {
  serverConstants: ServerConstants; // Server-side configuration
  settings: Settings; // User preferences
}
```

**Actions**:

```typescript
interface ProfileActions {
  setSettings: (settings: Settings) => void;
}
```

**Usage**:

```typescript
const { settings, serverConstants, setSettings } = useProfile();
```

## Navigation Contexts

### NavigationContext (`client/src/contexts/NavigationContext.tsx`)

**Purpose**: Single source for browser history and navigation for both splash and funnel. Manages splash view state and funnel step state, with back/forward and popstate handling.

**Key Features**:

- Browser history synchronization (push/replace, popstate handler in `contexts/navigationHistory.ts`)
- Navigation state: `navContext` ('splash' | 'funnel'), `splash`, `funnel`, `step`, `canGoBack`/`canGoForward`
- Splash view: landing (''), Tour, Join Now, Sign In
- Funnel steps: pol-donation, payment, tips, confirmation
- `navigateToSplashView`: high-level entry (e.g. Tour → funnel at pol-donation); `navigateToSplash`: raw history navigation

**State**:

```typescript
interface NavigationState {
  splash?: LandingNavView | CredentialsFormView;
  navContext: 'splash' | 'funnel';
  canGoForward?: boolean;
  canGoBack?: boolean;
  funnel?: FunnelView;
  step?: number;
}
```

**Actions**:

```typescript
interface NavigationActions {
  goBack: () => void;
  goForward: () => void;
  getCurrentState: () => NavigationState;
  canNavigate: (direction: 'back' | 'forward') => boolean;
  navigateToFunnel: (step: FunnelView, stepIndex?: number) => void;
  navigateToSplash: (view: LandingNavView | CredentialsFormView) => void;
  navigateToSplashView: (view: LandingNavView | CredentialsFormView) => void; // Tour → funnel at pol-donation when needed
}
```

**Usage**:

```typescript
const {
  splash,
  navigateToSplashView,
  navigateToFunnel,
  goBack,
  navContext,
  funnel,
} = useNavigation();
// Pass setSplash={navigateToSplashView} where components expect a setSplash prop.
```

### DonationStateContext (`client/src/contexts/DonationStateContext.tsx`)

**Purpose**: Manages core donation state and actions for the donation funnel.

**Key Features**:

- Essential donation state management (amount, politician, tip, payment method)
- Politician selection and data management
- Donation state reset functionality
- Donation package creation for payment processing
- Simplified state management without complex sync logic

**State**:

```typescript
interface DonationState {
  donation: number; // Current donation amount
  selectedPol: string | null; // Selected politician ID
  tip: number; // Platform tip amount
  paymentMethodId: string | null; // Stripe payment method ID
  polData: PolData; // Politician data
}
```

**Actions**:

```typescript
interface DonationActions {
  setDonation: (amount: number) => void;
  setSelectedPol: (polId: string | null) => void;
  setTip: (amount: number) => void;
  setPaymentMethodId: (id: string | null) => void;
  selectPol: (pol: PolData) => void;
  resetDonationState: () => void;
  createDonationPackage: (bill?: Bill, userId?: string) => Celebration;
}
```

**Usage**:

```typescript
const {
  donation,
  selectedPol,
  polData,
  setDonation,
  selectPol,
  resetDonationState,
  createDonationPackage,
} = useDonationState();
```

**Funnel tab behavior**: The Confirmation tab (funnel step `confirmation`) uses `mountOnEnter` and `unmountOnExit` (in TabContents) so it only mounts when selected. Tab components must not update parent context (e.g. ElectionCycleProvider, NavigationContext) during render; perform navigation or reset logic in `useEffect` and only when the current tab is active to avoid "Cannot update a component while rendering a different component" and unexpected navigation. Confirmation skips its donation-state navigation (reset + navigate to pol-donation) when the contributing modal is open (`showModal.contributing`), so opening the contributing inquiry from Confirmation does not kick the user back to the Lobby. Confirmation tab content (WhatHappensNext, HelpAsk, TipMessage, etc.) is split into `Support/content/` (folder name retained) with one subdirectory per component; the barrel `Support/content/index.ts` re-exports them.

### SearchContext (`client/src/contexts/SearchContext.tsx`)

**Purpose**: Manages search state and functionality for politician search.

**Key Features**:

- Centralized search operations for politicians
- Searching by name and state with real-time filtering
- District search via location-based API (no dropdown filtering)
- Filtering and sorting of results
- Utility functions for converting items to string representations

**State**:

```typescript
interface SearchState {
  searchQuery: string; // Current search query
  isSearching: boolean; // Search operation in progress
  showClearBtn: string; // Clear button state
  items: ComboboxItem[]; // Search results
  linksClass: LinksClass; // Active search option styling
  searchOption: SearchOption; // Current search category
  initialItems: HouseMember[]; // Initial unfiltered items
  selectedItem: ComboboxItem | null; // Currently selected item
}
```

**Actions**:

```typescript
interface SearchActions {
  resetSearch: () => void;
  searchByName: (query: string) => void;
  searchByState: (query: string) => void;
  setInitialItems: (items: HouseMember[]) => void;
  setLinksClass: (linksClass: LinksClass) => void;
  setShowClearBtn: (showClearBtn: string) => void;
  itemToString: (item: ComboboxItem | null) => string;
  setSearchOption: (searchOption: SearchOption) => void;
}
```

**Search Options**:

```typescript
type SearchOption = {
  label: 'Searching by name.' | 'Searching by state.' | 'Searching by address.';
  value: 'Name' | 'State' | 'District';
  name: 'NAME' | 'STATE' | 'DISTRICT';
};
```

**Usage**:

```typescript
const { searchQuery, items, searchByName, searchByState, resetSearch } =
  useSearch();
```

**Search Modes**:

- **NAME**: Real-time filtering of politicians by name with dropdown suggestions
- **STATE**: Real-time filtering of states with representatives with dropdown suggestions
- **DISTRICT**: Location-based search using "Find" button - no dropdown filtering

## Custom Hooks Integration

### usePaymentProcessing Hook

The `usePaymentProcessing` hook works alongside the context system to provide reusable payment processing logic:

```typescript
// Custom hook for payment processing
const { handlePaymentSubmit } = usePaymentProcessing({
  stripe,
  setPaymentError,
  setShowModal,
  setRejectedDonationReasons,
  stopProcessingSpinner,
  startProcessingSpinner,
});

// Uses DonationStateContext for donation package creation
const { createDonationPackage } = useDonationState();
```

**Benefits**:

- **Reusability**: Can be used across TipAsk, Payment, and other components
- **Separation of Concerns**: UI logic vs business logic
- **Testability**: Payment logic can be tested independently
- **Performance**: Optimized with useMemo and useCallback

## Provider Composition

The contexts are composed using dependency injection to maintain clean separation of concerns:

### ProfileProviderWithProps

Injects user data from AuthContext into ProfileProvider.

### NavigationProviderWithProps

Injects device (isDesktop), auth (isLoggedIn), and donation-limits (shouldSkipTipAsk) into NavigationProvider and provides validateNavigation for popstate guards.

### DonationStateProviderWithProps

Injects dependencies from Auth, Profile, and Dialogue contexts into DonationStateProvider.

## Migration Notes

### FunnelContext Migration (Completed)

The complex `FunnelContext` has been successfully migrated to a simpler `DonationStateContext`:

**What was removed:**

- Complex sync logic between contexts
- Race conditions and timing issues
- Unnecessary memoization patterns
- Redundant state management

**What was kept:**

- Core donation state: `donation`, `selectedPol`, `tip`, `paymentMethodId`, `polData`
- Essential actions: `setDonation`, `setSelectedPol`, `setTip`, `setPaymentMethodId`, `selectPol`, `resetDonationState`

**What was moved to other contexts:**

- `tabKey` → `NavigationContext.funnel` (already existed)
- `suggestedDonations` → `DonationLimitsContext` (already existed)
- `remainingDonationLimit` → `DonationLimitsContext` (already existed)
- `credentialsPath` → Local state in relevant components
- `setShowModal` → `DialogueContext` (already existed)
- `userData` → `AuthContext` (already existed)
- `isMobile` → `DeviceContext` (already existed)

## Best Practices

1. **Dependency Order**: Contexts are ordered from outermost to innermost based on dependencies
2. **Dependency Injection**: Use wrapper components to inject dependencies rather than direct imports
3. **State Isolation**: Each context manages a specific domain of state
4. **Performance**: Use `useMemo` and `useCallback` to prevent unnecessary re-renders
5. **Type Safety**: All contexts are fully typed with TypeScript interfaces

## Error Handling

Contexts include error handling for:

- Missing providers (warnings when hooks used outside provider)
- Authentication failures
- Network errors during data loading
- Invalid state transitions

## Testing

Each context can be tested independently by:

- Mocking dependencies
- Testing state transitions
- Verifying action handlers
- Testing error conditions
