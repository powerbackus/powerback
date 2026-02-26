# CSS !important Usage Documentation

## Overview

This document catalogs and explains all `!important` declarations across the POWERBACK CSS codebase. As of the last audit, there are **629 `!important` declarations across 84 files**.

> **📖 Related Documentation:**
> - [CSS Organization](./css-organization.md) - CSS file structure
> - [Design System](./design-system.md) - Design tokens and styling
> - [Linting & Formatting](./linting-formatting.md) - CSS linting rules

## Why So Many !important Declarations?

The high usage of `!important` is primarily due to:
1. **Bootstrap Overrides**: Overriding Bootstrap's default styles to match POWERBACK's dark theme
2. **Third-Party Library Overrides**: Forcing styles on components from libraries (react-joyride, downshift)
3. **Specificity Wars**: Legacy code where specificity conflicts were resolved with `!important` rather than refactoring
4. **Responsive Design**: Ensuring styles apply correctly across different breakpoints
5. **Browser Compatibility**: Overriding browser default styles (especially for form inputs)

## Categories of !important Usage

### 1. Bootstrap Component Overrides

**Purpose**: Override Bootstrap's default styles to match POWERBACK's dark theme and branding.

**Common Patterns**:
- Form controls (`.form-control`, `.form-check-input`)
- Buttons (`.btn`, `.btn-check`)
- Modals (`.modal`, `.modal-content`, `.modal-header`)
- Navigation (`.nav-link`)
- Input groups (`.input-group-text`)

**Examples**:
```css
/* App.css */
.form-control {
  color: var(--success) !important; /* Override Bootstrap's default text color */
}

input.form-check-input:checked {
  background-color: var(--secondary) !important;
  border: 1px solid var(--primary) !important;
}
```

**Files**: `App.css`, `components/modals/style.css`, `components/forms/**/*.css`

---

### 2. Font Family Overrides

**Purpose**: Ensure consistent typography across the application, overriding Bootstrap and browser defaults.

**Common Patterns**:
- Global font family for body/html
- Component-specific fonts (Inconsolata, Inter, Oswald)
- Form label fonts

**Examples**:
```css
/* App.css */
html, body {
  font-family: 'Oswald', 'Inconsolata', 'Century Gothic' !important;
}

label {
  font-family: 'Inconsolata' !important;
}

.inter {
  font-family: 'Inter' !important;
}
```

**Files**: `App.css`, `components/forms/**/*.css`, `components/search/style.css`

---

### 3. Third-Party Library Overrides

**Purpose**: Override styles from third-party libraries that don't provide sufficient customization options.

#### React Joyride (Tour System)
**Files**: `pages/Funnel/style.css`

```css
.react-joyride__tooltip {
  max-width: 90vw !important;
  width: auto !important;
  font-size: 0.9rem !important;
}

.react-joyride__tooltip>div>button {
  color: var(--tour-btn) !important;
}
```

#### Downshift (Search Combobox)
**Files**: `components/search/PolCombobox/style.css`

```css
[id^='downshift'][id$='-menu'] {
  position: fixed !important;
  z-index: 2000 !important;
  border-left: 5px ridge var(--btn) !important;
}
```

---

### 4. Layout and Positioning Fixes

**Purpose**: Ensure correct positioning, overflow, and z-index stacking in complex layouts.

**Common Patterns**:
- Fixed positioning for overlays and modals
- Overflow control (hidden/auto)
- Z-index management for layering
- Position overrides in responsive breakpoints

**Examples**:
```css
/* App.css */
.App {
  overflow: initial !important; /* Override default overflow */
}

/* Celebrations event */
.copy-notification {
  position: fixed !important;
  z-index: 1050;
}

/* Search combobox */
[id^='downshift'][id$='-menu'] {
  position: fixed !important;
  z-index: 2000 !important;
}
```

**Files**: `App.css`, `components/search/PolCombobox/style.css`, `pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/**/*.css`

---

### 5. Responsive Design Overrides

**Purpose**: Ensure styles apply correctly at specific breakpoints, overriding default or larger breakpoint styles.

**Common Patterns**:
- Mobile-specific positioning
- Responsive font sizes with `clamp()`
- Height/width constraints for small screens
- Overflow control in different orientations

**Examples**:
```css
/* Mobile portrait */
@media only screen and (max-width: 599px) and (orientation: portrait) {
  .App {
    position: relative !important; /* Override desktop fixed positioning */
  }
  
  .event-donee {
    font-size: clamp(0.9em, 4vw, 1.15em) !important;
  }
}

/* Tablet landscape */
@media only screen and (min-width: 900px) and (orientation: landscape) {
  .vertical-timeline-element {
    height: clamp(11rem, 23vh, 13rem) !important;
  }
}
```

**Files**: Most component CSS files with media queries

---

### 6. Interactive State Management

**Purpose**: Ensure hover, active, focus, and disabled states override default styles correctly.

**Common Patterns**:
- Button state overrides
- Link hover/active states
- Form input focus states
- Toggle switch states

**Examples**:
```css
/* Navigation links */
.nav-link:focus-visible {
  box-shadow: 0 0 0 0.25rem rgb(from var(--primary) r g b / 25%) !important;
}

/* Buttons */
.list-group-item.completed:hover {
  color: var(--bg) !important;
}

/* Toggle switches */
.toggle-switch.on {
  background: var(--switch-on) !important;
  color: var(--text-switch-on) !important;
}
```

**Files**: `App.css`, `components/buttons/**/*.css`, `components/interactive/**/*.css`, `pages/Funnel/modals/Account/subcomps/body/panes/Settings/Preferences/style.css`

---

### 7. Browser-Specific Fixes

**Purpose**: Override browser default styles, especially for form inputs and native UI elements.

**Common Patterns**:
- Webkit search cancel button hiding
- Appearance removal for native form controls
- Scrollbar styling

**Examples**:
```css
/* Hide native search clear button */
input.pol-search.pol-search-with-badge::-webkit-search-cancel-button {
  display: none !important;
  background-image: none !important;
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
```

**Files**: `components/search/PolCombobox/style.css`

---

### 8. Color and Background Overrides

**Purpose**: Ensure brand colors and backgrounds apply correctly, overriding Bootstrap defaults and ensuring consistency.

**Common Patterns**:
- Text color overrides
- Background color overrides
- Border color overrides
- Brand color enforcement

**Examples**:
```css
/* Brand elements */
.powerback {
  color: var(--primary) !important;
}

/* Form inputs */
.form-control {
  color: var(--success) !important;
}

/* Buttons */
.btn-primary {
  background-color: var(--btn) !important;
  border-color: var(--btn-border) !important;
}
```

**Files**: Throughout the codebase, especially in `App.css` and component-specific CSS files

---

### 9. Visual Effects and Animations

**Purpose**: Ensure visual effects (shadows, transforms, filters) apply correctly, especially for interactive elements.

**Common Patterns**:
- Box shadows for depth
- Transforms for animations
- Filters for image effects
- Text shadows

**Examples**:
```css
/* User button press effect */
.user-button:active {
  box-shadow: 4px 2px var(--accent) !important;
  transform: translate(9px, -1px) !important;
  transition: all 0.06s ease-out !important;
}

/* Social icons */
.social-icon {
  filter: invert(1) !important;
}
```

**Files**: `components/page/navs/sections/user/style.css`, `components/interactive/Socials/style.css`, `pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/style.css`

---

### 10. Spacing and Sizing Overrides

**Purpose**: Fine-tune spacing and sizing, especially in responsive contexts where default values don't work.

**Common Patterns**:
- Margin/padding overrides in media queries
- Height/width constraints
- Font size adjustments

**Examples**:
```css
/* Responsive spacing */
@media only screen and (max-width: 599px) {
  .form-group {
    margin-top: 0 !important;
    margin-bottom: calc(3vw - 1vh) !important;
  }
}

/* Height constraints */
.celebration-list {
  min-height: calc(25vw + 12vh) !important;
  height: auto !important;
}
```

**Files**: Component CSS files with responsive design

---

## Files with Highest !important Usage

1. **`components/search/PolCombobox/style.css`** - ~30 instances
   - Downshift library overrides
   - Browser-specific form input fixes
   - Z-index management

2. **`pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/event/subcomps/ButtonSet/ShareButton/style.css`** - ~40 instances
   - Complex modal overlay system
   - Z-index layering
   - Interactive state management

3. **`pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/style.css`** - ~25 instances
   - Interactive button press effects
   - Responsive sizing
   - Visual state management

4. **`pages/Funnel/TabContents/Confirmation/style.css`** - ~15 instances
   - Responsive layout fixes
   - Fixed positioning
   - Height constraints

5. **`App.css`** - ~15 instances
   - Global Bootstrap overrides
   - Font family enforcement
   - Layout fixes

---

## Recommendations

### When Adding New !important Declarations

1. **Try specificity first**: Use more specific selectors before resorting to `!important`
2. **Document the reason**: Add a comment explaining why `!important` is necessary
3. **Consider refactoring**: If you find yourself adding many `!important` declarations, consider refactoring the CSS architecture

### Future Refactoring Opportunities

1. **Bootstrap Customization**: Use Bootstrap's Sass variables and customization system instead of overriding with `!important`
2. **CSS Modules**: Consider migrating to CSS Modules for better style isolation
3. **Specificity Refactoring**: Gradually refactor high-specificity selectors to reduce `!important` dependency
4. **Design System**: Create a more comprehensive design system with utility classes to reduce the need for overrides

### Files to Prioritize for Refactoring

1. `components/search/PolCombobox/style.css` - High usage, could benefit from CSS Modules
2. `pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/event/subcomps/ButtonSet/ShareButton/style.css` - Complex component, could be simplified
3. `App.css` - Global overrides could be moved to Bootstrap customization

---

## Maintenance Notes

- **Last Updated**: 2026-01-25
- **Total !important Declarations**: 629
- **Files Affected**: 84
- **Primary Reason**: Bootstrap and third-party library overrides

When modifying CSS, be aware that many `!important` declarations exist for valid reasons (Bootstrap overrides, library compatibility). Removing them without understanding the context can break the UI.
