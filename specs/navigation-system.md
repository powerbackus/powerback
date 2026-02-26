# Spec: Navigation System Architecture

## Purpose

Define the unified navigation system that manages both splash and funnel contexts with robust guest access control and security guards.

## Scope

- In-scope: Navigation state management, guest access control, browser history sync, popstate guards
- Out-of-scope: Backend navigation logic, third-party routing libraries

## Requirements

- Unified NavigationContext manages both splash and funnel navigation
- Guest access control through session storage flags
- Browser history synchronization with automatic state management
- Popstate guards to prevent unauthorized back navigation
- Clean state management with proper cleanup on login/logout

## Core Architecture

### Navigation Context Pattern

- **Single Source of Truth**: NavigationContext manages all navigation state (splash view, funnel step, history). Splash state and `navigateToSplashView` are provided by the same context; there is no separate SplashContext.
- **Browser History Sync**: Automatic synchronization with browser history API; popstate handler and helpers live in `contexts/navigationHistory.ts`.
- **Guest Access Control**: Session storage flags for legitimate access tracking
- **Security Guards**: Popstate guards block unauthorized navigation

### Guest Access Flow

1. **Legitimate Access**: User clicks "Occupy the lobby" → sets sessionStorage flag → navigates to funnel
2. **Unauthorized Access**: Browser back navigation blocked unless guest access flag is set
3. **State Cleanup**: Flags cleared on login/logout to prevent stale access
4. **Session Persistence**: Guest access persists across page refreshes

## Technical Implementation

### Navigation Context Structure

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

### Guest Access Tracking

```typescript
// NavigationContext (navigateToSplashView) - Set guest access when legitimate navigation occurs
if (next === 'Tour') {
  sessionStorage.setItem('pb:guestAccess', 'true');
  window.dispatchEvent(new CustomEvent('guestAccessGranted'));
  navigateToFunnel('pol-donation', 0);
  return;
}
```

### Funnel tab mounting

- The Support tab pane uses `mountOnEnter` and `unmountOnExit` so the Support component only mounts when that tab is selected. Tab components must not update parent context during render; run navigation or reset logic in `useEffect` and only when the tab is the current tab to avoid React warnings and spurious navigation (e.g. kick-back from TipAsk).

### Popstate Security Guards

```typescript
// NavigationContext.tsx - Block unauthorized back navigation
if (navigationState.navContext === 'splash' && state?.navContext === 'funnel') {
  const guestAccessGranted =
    sessionStorage.getItem('pb:guestAccess') === 'true';
  if (!guestAccessGranted) {
    console.debug(
      '[Navigation] Blocking unauthorized back navigation from splash to funnel'
    );
    window.history.pushState(navigationState, '');
    return;
  }
}
```

### Navigation Decision Logic

```typescript
// Page.tsx - Require explicit guest access for funnel navigation
isLoggedIn ||
  (navContext === 'funnel' &&
    (hasGuestAccess.current ||
      sessionStorage.getItem('pb:guestAccess') === 'true'));
```

### State Cleanup

```typescript
// AuthContext.tsx - Clear guest access on logout
sessionStorage.removeItem('pb:guestAccess');

// Page.tsx - Clear guest access on login
if (isLoggedIn) {
  hasGuestAccess.current = false;
  sessionStorage.removeItem('pb:guestAccess');
}
```

## Security Model

### Guest Access Control

- **Legitimate Access**: Only through "Occupy the lobby" button
- **Session Persistence**: Guest access persists across page refreshes
- **State Cleanup**: Flags cleared on login/logout
- **No Backdoor Access**: Browser navigation cannot bypass controls

### Popstate Guards

- **Unauthorized Back Navigation**: Blocked from splash to funnel
- **Legitimate Navigation**: Allowed when guest access flag is set
- **Browser History Protection**: Prevents navigation loops and unauthorized access
- **Graceful Handling**: Prevents browser retry mechanisms

## User Experience

### Legitimate User Flows

- **Logged-in Users**: Full access to funnel context, cannot access splash
- **Guests with Access**: Can navigate between splash and funnel freely
- **Guests without Access**: Redirected to splash, cannot access funnel

### Navigation Patterns

- **Forward Navigation**: Always allowed within valid contexts
- **Back Navigation**: Controlled by security guards and access flags
- **Browser Navigation**: Protected by popstate guards
- **State Transitions**: Clean transitions between contexts

## Integration Points

### With Authentication System

- **Login**: Clears guest access flags, transitions to funnel context
- **Logout**: Clears all access flags, returns to splash context
- **Session Management**: Integrates with JWT token refresh

### With Payment Processing

- **Funnel Navigation**: Payment flow within funnel context
- **Guest Access**: Payment processing for guests with legitimate access
- **State Persistence**: Payment state maintained across navigation

### With Compliance System

- **FEC Compliance**: Navigation respects compliance tier restrictions
- **Limit Enforcement**: Navigation blocked when limits exceeded
- **User Experience**: Clear feedback for navigation restrictions

## Error Handling

### Navigation Errors

- **Invalid States**: Graceful fallback to valid navigation states
- **Browser Errors**: Handle browser history API errors
- **State Corruption**: Reset to known good state
- **Access Violations**: Redirect to appropriate context

### Guest Access Errors

- **Missing Flags**: Default to splash context
- **Stale Flags**: Clear on state changes
- **Browser Storage**: Handle storage unavailable scenarios
- **Event Handling**: Graceful degradation for custom events

## Performance Considerations

### State Management

- **Minimal Re-renders**: Optimized context updates
- **Memory Usage**: Efficient state storage
- **Browser History**: Minimal history manipulation
- **Event Handling**: Efficient event listeners

### Security Performance

- **Guard Efficiency**: Fast popstate guard checks
- **Storage Access**: Efficient sessionStorage operations
- **State Updates**: Minimal state changes
- **Event Processing**: Optimized event handling

## Testing Strategy

### Unit Tests

- Navigation context state management
- Guest access flag handling
- Popstate guard logic
- State cleanup functions

### Integration Tests

- Browser history synchronization
- Authentication integration
- Payment flow navigation
- Error handling scenarios

### E2E Tests

- Complete user navigation flows
- Guest access scenarios
- Browser back button behavior
- Cross-browser compatibility

## Acceptance Criteria

### Functional Requirements

- Unified navigation state management
- Guest access control working correctly
- Browser history synchronization
- Popstate guards preventing unauthorized access
- Clean state management with proper cleanup

### Security Requirements

- No unauthorized access to funnel context
- Guest access only through legitimate means
- Browser navigation properly controlled
- State cleanup on authentication changes

### Performance Requirements

- Fast navigation state updates
- Efficient browser history handling
- Minimal memory usage
- Responsive user interface

## Links

- Rules: 43-navigation-security-simple-guards, 07-frontend-patterns
- Code: `client/src/contexts/NavigationContext.tsx`, `client/src/contexts/navigationHistory.ts`, `client/src/pages/Page.tsx`
- Related: specs/frontend-ui.md, specs/project-architecture.md
