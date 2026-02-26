# POWERBACK.us Accessibility Guide

POWERBACK.us is committed to making political donation accessible to everyone. We aim to meet [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa) standards. This document outlines our current accessibility features and areas where we welcome expert contributions.

## Current Accessibility Features

### Skip Link and Main Landmark

- **Skip to main content**: A skip link is the first focusable element in the app (first tab stop). It is visually hidden until focused and targets `#main-content` on the `<main>` element so keyboard users can jump past navigation to the main content.
- **Main landmark**: The main content wrapper has `id="main-content"` so the skip link and assistive tech can target it.

### Modal Close and Focus Visibility

- **Modal close label**: Modal close button uses the label "Hide" for consistency with other overlays (e.g. "Hide sidenav", "hide forgot password prompt").
- **Focus visibility**: Where outline was previously removed, visible focus rings have been added so keyboard focus is clear: ShareButton social links, Preferences donation filter switch, Compliance button, ChangePass set-password button, and Security continue button use a 2px focus ring (e.g. `box-shadow: 0 0 0 2px var(--primary)` or equivalent outline).

### Profile Form Error Association

- **Validation and screen readers**: When a Profile form field is invalid, the input has `aria-invalid="true"` and `aria-describedby` pointing to the feedback element's id (`profile-form-error-` + field name). The invalid feedback element has the matching `id` so screen readers associate the error message with the field.

### Keyboard Navigation

POWERBACK.us supports full keyboard navigation throughout the application:

- **Tab Navigation**: All interactive elements are keyboard accessible via Tab/Shift+Tab
- **Enter Key Support**: Interactive elements respond to Enter key presses
- **Keyboard Shortcuts**: Browser navigation shortcuts (Alt+Left for back) are supported
- **Focus Management**: Focus is properly managed in modals and dynamic content
- **Skip Navigation**: Focus indicators are visible and meaningful

**Implementation Examples:**

- Form fields support tab navigation with visible focus indicators
- Modal dialogs trap focus and can be closed with Escape key
- Interactive buttons and links respond to keyboard events
- Tab navigation in complex components like the politician search

### ARIA (Accessible Rich Internet Applications) Support

We use ARIA attributes to enhance screen reader compatibility:

- **ARIA Labels**: Form inputs, buttons, and interactive elements have descriptive labels
  - Example: `aria-label="politician search bar"` on search components
  - Example: `aria-label="home address"` on address form fields
- **ARIA Roles**: Semantic roles are applied where needed
  - `role="status"` for dynamic status announcements
  - `role="alert"` for error messages and important notifications
  - `role="button"` for custom interactive elements
  - `role="tab"` for tab navigation components
  - `role="img"` for decorative images with descriptions
- **ARIA Attributes**: Additional attributes enhance accessibility
  - `aria-autocomplete="none"` on search inputs
  - `aria-label` on modal dialogs
  - `tabIndex` attributes for keyboard navigation

**Component Examples:**

- `PolCombobox`: Full ARIA support for politician search
- `StyledModal`: ARIA labels and keyboard navigation
- Form inputs: Comprehensive ARIA labeling for address, contact, and payment fields

### Screen Reader Support

- **Status Announcements**: Dynamic content changes announced via `role="status"` (e.g., celebration status updates, search results)
- **Error Announcements**: Form validation uses `role="alert"` for immediate feedback
- **Alt Text**: Images include descriptive alt text (e.g., "American flag" on Confirmation page)

### Focus Management

Proper focus management ensures keyboard users can navigate efficiently:

- **Focus Transitions**: Focus is managed during tab changes and dynamic content updates
- **Modal Focus Trapping**: Modals trap focus within the dialog
- **Focus Restoration**: Focus returns to triggering element when modals close
- **Jump-to-Field**: Users can jump directly to form fields from field lists

**Implementation:**

- `FieldList` component uses React transitions to manage focus without blocking UI
- Modals restore focus to the element that opened them
- Dynamic content updates preserve focus context

### Form Accessibility

- **ARIA Labels**: Address fields (`aria-label="home address"`, `aria-label="zip/postal code"`, etc.)
- **Field Navigation**: `FieldList` component allows jumping directly to form fields via keyboard
- **Error Messaging**: Payment form includes accessible error announcements

### Color Contrast

- Primary text: `#cccccc` on dark backgrounds
- Form text: `#20cf9d` (bright green) for high visibility
- Error states: `#ff9a98` for clear error indication

See [Design System](./design-system.md) for full color palette.

### Reduced Motion

We respect the `prefers-reduced-motion` media query for scroll behavior. When the user has "Reduce motion" (or equivalent) enabled in OS or browser settings, all programmatic scrolling is instant (`behavior: 'auto'`) instead of smooth. This helps users with vestibular disorders or motion sensitivity.

**Implementation:**

- Utility `getScrollBehavior()` in `client/src/utils/scrollBehavior.ts` returns `'auto'` when `matchMedia('(prefers-reduced-motion: reduce)').matches`, otherwise `'smooth'`.
- Used for: PolCombobox scroll-to-candidate, PolCarousel scroll-to-selection and skip-to-donation, and App skip-to-main-content.

## Areas for Improvement

While we've implemented many accessibility features, we recognize there's always room for improvement. We welcome expert contributions in the following areas:

### High Priority

1. **Comprehensive ARIA Testing**: Full audit of ARIA implementation across all components
2. **Screen Reader Testing**: Real-world testing with NVDA, JAWS, and VoiceOver
3. **Keyboard Navigation Audit**: Complete keyboard navigation flow testing
4. **Focus Indicator Enhancement**: Ensure all focus indicators meet contrast requirements (partially addressed: skip link, ShareButton, Preferences switch, Compliance, ChangePass, Security buttons now have visible focus rings)
5. **Form Error Association**: Improve association of error messages with form fields (addressed for Profile form: `aria-invalid` and `aria-describedby` link inputs to feedback)

### Medium Priority

1. **Skip Links**: Add skip navigation links for main content areas (addressed: Skip to main content link targets `#main-content` on `<main>`)
2. **Landmark Regions**: Implement ARIA landmark regions for better navigation (addressed: main content has `id="main-content"` for skip target)
3. **Live Regions**: Enhance live region usage for dynamic content updates
4. **Alternative Text**: Audit and improve alt text for all images
5. **Document Structure**: Improve heading hierarchy and document structure

### Future Enhancements

1. **Text Scaling**: Ensure all content scales properly up to 200%
2. **Voice Navigation**: Support for voice navigation tools
3. **Cognitive Load**: Simplify complex flows for users with cognitive disabilities

## Contributing

We welcome contributions from accessibility experts and users with disabilities.

### Reporting Issues

Open a [GitHub issue](https://github.com/powerbackus/powerback) with the `accessibility` label. Include:

- Description of the barrier
- Steps to reproduce
- Assistive technology used (if applicable)
- Browser and OS information

### Contributing Code

When contributing improvements:

- Test with keyboard navigation and screen readers
- Update this document when adding new features
- See [Frontend UI Spec](../specs/frontend-ui.md) for accessibility requirements

### Expert Review

We're particularly interested in:

- Accessibility audits of our implementation
- Real-world testing with NVDA, JAWS, and VoiceOver
- Best practices specific to our codebase

## Implementation Examples

**PolCombobox** (`client/src/components/search/PolCombobox/PolCombobox.tsx`):

- `aria-label="politician search bar"` on search input
- `aria-label="Clear search"` on clear button
- `role="status"` for search result announcements
- `tabIndex={0}` for keyboard navigation

**StyledModal** (`client/src/components/modals/StyledModal.tsx`):

- `aria-label` on modal dialogs
- Keyboard event handlers for Escape key
- Focus management on open/close

**Form Fields** (`client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/subpane/form/controls/address.js`):

- `aria-label` on all address fields
- Proper label association

**Section landmarks** (Splash, Lobby):

- Splash and Lobby use `<section>` elements with accessible names (`aria-label` or `aria-labelledby`) so assistive tech can list and jump between regions (e.g. mission, explainer video, choose politicians, set donation amount).

See [Frontend UI Spec](../specs/frontend-ui.md) for accessibility requirements in new components.

## Contact

- **GitHub**: Open an issue with the `accessibility` label
- **Email**: [support@powerback.us](mailto:support@powerback.us)
- **Discord**: [powerback.us/discord](https://powerback.us/discord)
