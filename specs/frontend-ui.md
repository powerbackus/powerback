# Spec: Frontend UI & UX

## Purpose
Define UI patterns, accessibility, navigation/state, and styling conventions.

## Scope
- In-scope: API usage, contexts, UI gates, accessibility, styling
- Out-of-scope: Backend validation internals

## Requirements
- Route all HTTP via `client/src/api/API.ts`
- Co-locate CSS; CSS Modules for new work; globals only for tokens/resets
- Accessibility: keyboard nav, visible focus, ARIA roles; no hover-only
- Client UI gates enforce when data known; show notice when dates unavailable

## Component Architecture Patterns

### Lazy Loading Strategy
- **Route-level lazy loading**: Use for major page components (Celebrate, Account, Splash)
- **Modal lazy loading**: Perfect for rarely-used components (Eligibility, Terms, FAQ, ForgotPassword)
- **Avoid tab content lazy loading**: Tab components should load immediately for better UX
- **Avoid core functionality lazy loading**: Search, donation, and payment components should be eager-loaded

### Component Organization Structure
- **Feature-based grouping**: Components organized by domain/feature (alerts, buttons, displays, forms, interactive, modals, page, search)
- **Co-located files**: CSS, JS/TS, and index files in same directory
- **Shared components**: Reusable components in dedicated folders with clear interfaces
- **Index exports**: Clean import/export patterns for component libraries

### Component Hierarchy Patterns
```
App/
├── Navigation/           # Top navigation and side panel
├── Page/                # Main page content router
│   ├── Splash/          # Landing page
│   ├── Celebrate/       # Donation flow
│   ├── Account/         # User management
│   └── Search/          # Political data search
├── Footer/              # Site footer
└── Modals/              # Overlay dialogs
    ├── Eligibility/     # Legal compliance
    ├── FAQ/            # Help and information
    └── Terms/          # Legal terms
```

### Component Categories
- **Alerts**: User notifications and feedback (account, cookie consent, donation status)
- **Buttons**: Interactive elements (agree, continue, donation, generic, input groups)
- **Displays**: Information presentation (constituency, donation prompts, badges)
- **Forms**: User input and validation (donation, password, username, payment)
- **Interactive**: Complex interactions (carousels, navigation, search)
- **Modals**: Overlay dialogs (credentials, eligibility, FAQ, terms)
- **Page**: Page-level components (footer, navigation, wrapper)
- **Search**: Search functionality (combobox, link groups)

### Pure Function Extraction
- **Extract pure functions from components**: Move business logic to pure functions outside components
- **Single responsibility**: Functions should only care about their specific logic, not component state
- **Keep logic close to usage**: Place functions in the same file unless they need to be shared
- **Custom hooks for complex logic**: Extract complex business logic to custom hooks for reusability
- **Example pattern**:
```typescript
// Pure function - only cares about display logic
const shouldShowDonationPrompt = (isTip: boolean | undefined, polData: PolData | null): boolean => {
  return !isTip && !!polData?.id;
};

// Component uses the function
const handleUse = useCallback(
  () => shouldShowDonationPrompt(isTip, polData) ? <DonationPrompt /> : null,
  [isTip, polData]
);

// Custom hook for complex payment logic
const { handlePaymentSubmit } = usePaymentProcessing({
  stripe,
  setShowModal,
  setPaymentError,
  stopProcessingSpinner,
  startProcessingSpinner,
  setRejectedDonationReasons,
});
```

### Conditional Rendering Best Practices
- **Use Suspense for async components**: Wrap lazy-loaded components with Suspense boundaries
- **Add null checks for data dependencies**: Prevent crashes when data is still loading
- **Guard against undefined props**: Use optional chaining and null coalescing
- **Example pattern**:
```typescript
// Safe conditional rendering with guards
{shouldShowDonationPrompt(isTip, polData) && polData?.id && (
  <DonationPrompt description={polData} />
)}
```

## Design System
- **Color Palette**: Primary orange (#fc9), secondary pink (#f9c), accent green (#9bad97), dark backgrounds (#1b1b1b, #080808)
- **Typography**: Oswald for branding, Inconsolata for technical content, Inter for modern UI
- **Interactive Elements**: Purple buttons (#c9f), blue links (#6da7f9), consistent hover states
- **Border Radius**: 4px (small), 5px (medium), 8px (large), 50% (circular)
- **Shadows**: Consistent system with rgba(153, 204, 255, 0.5) for modals

## Bootstrap + Custom CSS Blending
- **Core Principle**: Use Bootstrap for structure and utilities, custom CSS for branding and interactions
- **Bootstrap Usage**: Layout (`row`, `col`, `d-flex`), spacing (`p-*`, `m-*`), responsive utilities (`d-none`, `d-lg-block`), component classes (`btn`, `form-control`, `modal-*`)
- **Custom CSS Usage**: Brand colors, custom interactions, component-specific styling, typography, responsive design beyond Bootstrap breakpoints
- **Implementation**: Combine Bootstrap classes for structure with custom CSS for branding; follow established patterns in existing components
- **Performance**: Bootstrap classes are optimized; custom CSS should be component-scoped; use CSS Modules for new components
- **Reference**: Complete patterns and examples in `.cursor/rules/29-bootstrap-css-blending.mdc`

## CSS Property Ordering
- **Standard**: Follow 9-category hierarchy (layout → flex/grid → spacing → visual → typography → colors → transforms → interactive → media)
- **Enforcement**: Group properties by category with comments, consistent spacing
- **Reference**: Complete standard in `docs/css-property-ordering.md`
- **Patterns**: Button, form, and modal component examples in `.cursor/rules/28-css-property-ordering.mdc`

## State Management
- Use React Context for global state (auth, compliance, device, navigation)
- Local state for component-specific data
- Avoid prop drilling; prefer context for shared state
- Navigation state: unified through NavigationContext with guest access control

## Navigation System Architecture

### Navigation Context Pattern
- **Unified State**: Single NavigationContext manages both splash and funnel navigation
- **Browser History Sync**: Automatic synchronization with browser history API
- **Guest Access Control**: Session storage flags for legitimate guest access tracking
- **Popstate Guards**: Block unauthorized browser back navigation

### Guest Access Flow
1. **Legitimate Access**: User clicks "Occupy the lobby" → sets sessionStorage flag → navigates to funnel
2. **Unauthorized Access**: Browser back navigation blocked unless guest access flag is set
3. **State Cleanup**: Flags cleared on login/logout to prevent stale access
4. **Session Persistence**: Guest access persists across page refreshes

### Navigation Decision Logic
```typescript
// Page.tsx - Navigation decision with guest access control
isLoggedIn || (navContext === 'funnel' && (hasGuestAccess.current || sessionStorage.getItem('pb:guestAccess') === 'true'))
```

### Popstate Security Guards
```typescript
// NavigationContext.tsx - Block unauthorized back navigation
if (navigationState.navContext === 'splash' && state?.navContext === 'funnel') {
  const guestAccessGranted = sessionStorage.getItem('pb:guestAccess') === 'true';
  if (!guestAccessGranted) {
    window.history.pushState(navigationState, '');
    return;
  }
}
```

## Responsive Design
- Mobile-first approach
- Breakpoints: 599px (mobile), 899px (tablet), 1200px (desktop)
- Touch-friendly interactions on mobile
- Consistent spacing and typography across devices

## Accessibility Standards
- Keyboard navigation for all interactive elements
- Visible focus indicators
- ARIA labels and roles where needed
- Color contrast compliance
- Screen reader friendly markup

## Performance
- Lazy load components when appropriate
- Optimize images and assets
- Minimize re-renders with proper React patterns
- Use CSS transforms for animations

## Testing
- Component tests for critical UI flows
- Accessibility testing with screen readers
- Cross-browser compatibility
- Mobile device testing

