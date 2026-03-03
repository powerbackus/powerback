# POWERBACK Design System

## Overview

This document defines the complete visual design system for POWERBACK, including color schemes, typography, component patterns, and implementation guidelines. This system ensures consistent branding across all interfaces while maintaining the app's distinctive dark, technical aesthetic.

## 🎨 Color Palette

All colors are available as CSS custom properties. Use `var(--variable-name)` to reference them in stylesheets.

### Primary Brand Colors

- **Primary Orange**: `var(--primary)` (`#ffcc99`) - Main brand color for highlights, brand elements, and primary actions
- **Secondary Pink**: `var(--secondary)` (`#ff99cc`) - Complementary brand color for gradients and secondary highlights
- **Attention Yellow**: `var(--attention)` (`#ffc107`) - Warning/attention states
- **Contrast Green**: `var(--contrast)` (`#ccff99`) - High contrast highlights

### Background & Surface Colors

- **Main Background**: `var(--bg)` (`#1b1b1b`) - Primary dark background
- **Contrast Black**: `var(--contrast-black)` (`#080808`) - Deepest black for contrast elements and borders
- **Mobile Background**: `var(--mobile-bg)` (`#171b1e`) - Background for mobile portrait
- **Semi-Dark**: `var(--semi-dark)` (`#2e2e2e`) - Semi-transparent dark backgrounds
- **Modal**: `var(--modal)` (`#2a2b27`) - Modal background
- **Surface**: `var(--surface)` (`#1c1c1c`) - Elevated surface backgrounds
- **Elevated**: `var(--elevated)` (`#1c1a21`) - Elevated component backgrounds

### Text Colors

- **Primary Text**: `var(--text)` (`#cccccc`) - Light gray for main text content
- **Text Contrast**: `var(--text-contrast)` (`#dddddd`) - Higher contrast text
- **Form Text**: `var(--success)` (`#20cf9d`) - Bright green for form input text
- **Placeholder Text**: `var(--text-placeholder)` (`#aba5a0`) - Muted gray for placeholder text

### Interactive Colors

- **Link**: `var(--link)` (`#99ccff`) - Primary link color
- **Link Hover**: `var(--link-hover)` (`#6da7f9`) - Link hover state
- **Link Active**: `var(--link-active)` (`#8bbbfd`) - Link active state
- **Button**: `var(--btn)` (`#cc99ff`) - Primary button background
- **Button Hover**: `var(--btn-hover)` (`#c48aff`) - Button hover state
- **Button Active**: `var(--btn-active)` (`#d1a3ff`) - Button active/pressed state

### Status Colors

- **Success**: `var(--success)` (`#20cf9d`) - Success states and validations
- **Error**: `var(--error)` (`#ff9a98`) - Error states and warnings
- **Validation Error**: `var(--validation-error)` (`#990000`) - Form validation errors
- **Validation Feedback**: `var(--validation-feedback)` (`#ff99b0`) - Form validation feedback text
- **Info**: `var(--info)` (`#75e6c8`) - Informational states
- **Alert**: `var(--alert)` (`#6a2a83`) - Alert text color
- **Danger**: `var(--danger)` (`#930000`) - Danger/warning states

## 🔤 Typography System

### Font Hierarchy

1. **Oswald** - Primary brand font for headings and POWERBACK branding
2. **Inconsolata** - Monospace font for technical content, forms, and UI elements
3. **Inter** - Modern sans-serif for specific UI components
4. **Red Hat Text** - Secondary sans-serif for terms and legal content
5. **Century Gothic** - Fallback font

### Font Usage Rules

- **Brand Elements**: Always use Oswald for POWERBACK logo and main headings
- **Forms & Inputs**: Use Inconsolata for all form elements and technical data
- **Navigation**: Use Inconsolata for navigation links and menu items
- **Body Text**: Default to Inconsolata with Oswald for headings
- **Legal Content**: Use Red Hat Text for terms, privacy policy, etc.

## 🎯 Visual Style Patterns

### Border & Shadow System

- **Border Radius**:
  - Small elements: `4px` (buttons, inputs)
  - Medium elements: `5px` (cards, modals)
  - Large elements: `8px` (sections, containers)
  - Circular elements: `50%` (avatars, icons)

- **Box Shadows**:
  - Subtle shadows: `0 0 7px rgb(from var(--link) r g b / 50%)` (modals)
  - Button shadows: `-1px 2px 0px var(--text)` (default), `0px 1px 1px var(--text)` (hover)
  - Email shadows: `4px 6px 0px var(--contrast-black)` (3D button effect)
  - Inset shadows: `inset 0 0 5px var(--contrast)` (form inputs)

### Border Patterns

- **Primary Borders**: `2px solid var(--accent)` (navigation, sections)
- **Form Borders**: `1px solid var(--btn)` (inputs), `2px solid var(--border-gray)` (search)
- **Modal Borders**: Headers and body use `var(--attention-muted)` color
- **Button Borders**: `2px solid var(--contrast-black)` (default), `1px solid var(--primary)` (checked states)

### Gradient Patterns

- **Background Gradients**: `linear-gradient(135deg, var(--bg) 0%, var(--contrast-black) 100%)`
- **Brand Gradients**: `linear-gradient(90deg, var(--primary), var(--secondary))` (dividers, highlights)
- **Logo Gradients**: `linear-gradient(0deg, var(--primary) 0%, var(--secondary) 100%)`

## 📱 Responsive Design Patterns

### Breakpoint System

**Single source of truth:** `client/src/constants/breakpoints.js`. Exposed as `APP.BREAKPOINTS` (width) and `APP.HEIGHT` (height) via `@CONSTANTS`. CSS custom properties (e.g. `--bp-sm`, `--height-tall-portrait`) are generated by `scripts/build/build-breakpoints-css.js` (run on prestart/prebuild) and imported in `App.css`. Use these tokens in JS; use the same numeric values in CSS.

**CSS @media:** Do not use `var(--bp-*)` or `var(--height-*)` inside `@media` conditions—browser support is unreliable. Use literal pixel values that match `breakpoints.js`. When you change a breakpoint there, run `node scripts/build/build-breakpoints-css.js` and update the same value in all `@media` rules (search for the old px value in `client/src/**/*.css`).

**Naming note:** "Tablet landscape" in media queries is a misnomer—it denotes **wide layout / desktop-style** (min-width 900px), not literal tablet targeting.

**Width (`APP.BREAKPOINTS`):**

- **xs** (379px) – Mobile portrait small, max-width
- **sm** (599px) – Mobile portrait, max-width
- **md** (600px) – Tablet portrait, min-width
- **lg** (900px) – Wide layout (desktop-style), min-width
- **xl** (1200px) – Desktop, min-width
- **xxl** (2000px) – Big screen, min-width
- **wide** (1680px) – Wide layout variant (e.g. Funnel)
- **xwide** (1800px) – Extra wide (e.g. Confirmation, PolCombobox)

**Height (`APP.HEIGHT`):**

- **shortLandscape** (450px) – Short landscape, max-height (nav, footer, modals)
- **tallPortrait** (800px) – Tall portrait, min-height (main, headshot, splash)
- **tallPortraitLow** (740px) – Carousel gap low band start
- **tallPortraitHigh** (869px) – Carousel gap high band start
- **landscapeShort** (820px) – PolCombobox short landscape, max-height
- **paymentPortrait** (936px) – Payment portrait, max-height
- **paymentLandscape** (900px) – Payment landscape, min-height

### Layout Patterns

- **Mobile**: Fixed positioning, centered content, minimal padding
- **Tablet**: Flexbox layouts, increased spacing, side-by-side elements
- **Desktop**: Full-width layouts, maximum content area, enhanced spacing

## 🎨 Component-Specific Patterns

### Button Styling

- **Default State**: `background: var(--btn)`, `color: #000000`, `border: 2px solid var(--contrast-black)`
- **Hover State**: `background: var(--btn-hover)`, reduced shadow, slight margin adjustment
- **Active State**: `background: var(--btn-active)`, inset border style
- **Focus State**: `box-shadow: 0 0 0 0.25rem rgb(from var(--primary) r g b / 25%)`

### Form Styling

- **Input Background**: `var(--contrast-black)` (dark)
- **Input Border**: `1px solid var(--btn)` (default)
- **Input Valid**: `border-color: var(--input-valid)`
- **Input Invalid**: `color: var(--validation-error)`, `border-color: var(--input-invalid)`
- **Validation Feedback**: `color: var(--validation-feedback)`

### Modal Styling

- **Background**: `var(--bg)` with `rgb(from var(--link) r g b / 50%)` shadow
- **Header**: Border with `var(--attention-muted)` color
- **Body**: Border with `var(--attention-muted)` color, `5px` border radius

## 🎭 Interactive States

### Hover Effects

- **Links**: Color transition to `var(--link-hover)`, underline removal
- **Buttons**: Background changes to `var(--btn-hover)`, shadow reduction, margin adjustment
- **Images**: `filter: brightness(90%) contrast(106%)` with `0.15s ease-in` transition

### Focus States

- **Form Elements**: `box-shadow: inset 1px 1px 2px 1px rgb(from var(--btn) r g b / 15%)`
- **Navigation**: `box-shadow: 0 0 0 0.25rem rgb(from var(--primary) r g b / 25%)`
- **Buttons**: Maintained styling with enhanced contrast

### Active States

- **Buttons**: Background changes to `var(--btn-active)`, inset border style, immediate transition (`quikpress`)
- **Images**: `padding: 2px` for pressed effect
- **Links**: Color change to `var(--secondary)` with inset border

## 🔧 Technical Implementation

### CSS Custom Properties

All colors are defined as CSS custom properties in `client/src/App.css`. Variable names follow a function-based naming convention (omitting redundant "color" suffixes).

#### Primary/Secondary Colors

```css
--primary: #ffcc99;
--secondary: #ff99cc;
--attention: #ffc107;
--contrast: #ccff99;
```

#### Background Colors

```css
--bg: #1b1b1b;
--mobile-bg: #171b1e;
--semi-dark: #2e2e2e;
--bg-fade: #1b1b1bdd;
--modal: #2a2b27;
--modal-blend: #252522;
--slate: #1f1f1f;
--surface: #1c1c1c;
--elevated: #1c1a21;
--contrast-black: #080808;
--checkout-header: #3e3e3e;
```

#### Text Colors

```css
--text: #cccccc;
--text-contrast: #dddddd;
--text-placeholder: #aba5a0;
--danger: #930000;
--alert: #6a2a83;
--alert-dark: #373833;
--info: #75e6c8;
```

#### Accent Colors

```css
--accent: #9bad97;
--contrast: #ccffcc;
--attention-muted: #9f8879;
--positive-indicator: #adebcb;
--highlight: rgb(from var(--attention) r g b / 50%);
--highlight-muted: rgb(from var(--attention) r g b / 20%);
```

#### Status Colors

```css
--error: #ff9a98;
--success: #20cf9d;
--success-theme: #99ffcc;
```

#### Link Colors

```css
--link: #99ccff;
--link-hover: #6da7f9;
--link-active: #8bbbfd;
--link-active: #8bb9f2;
--link-sent: #525252;
```

#### Button Colors

```css
--btn: #cc99ff;
--btn-hover: #c48aff;
--btn-active: #d1a3ff;
--btn-border: #6f42c1;
--cancel-btn: #7f8c8d;
--success-btn: #27ae60;
--cancel-btn-hover: #95a5a6;
--success-btn-hover: #229954;
--delete-account-btn: #b02a37;
--delete-account-btn-hover: #a51d2b;
--delete-account-btn-active: #a52834;
--delete-account-btn-gradient: #dc3545;
--continue-btn-hover: #181f23;
--continue-btn-active: #a9c9a2;
--continue-btn-active-border: #73578f80;
--donation-btn: #2d3e3c;
--tour-btn: #001f3b;
```

#### Form Colors

```css
--input: #00ff00;
--input-group: #99cc9927;
--input-valid: #00d300;
--input-disabled: #a9a9a9;
--input-secondary: #2e362ebb;
--validation-error: #990000;
--input-invalid: #ff00ff;
--validation-feedback: #ff99b0;
--form-label: #a6a6a6;
--slate: #1f1f1f;
--form-btn: #beafa0;
```

#### Shadow & Border Colors

```css
--shadow: #2b2b2b;
--shadow-dark: #1e1e1e;
--border-gray: #333333;
--border: #222222;
--border-gray: #3c3c3b;
--border-alert: #087990;
--border-disabled: #330066;
```

#### Navigation Colors

```css
--nav-link-hover: #d9b3ff;
--nav-link-active: #bf80ff;
--side-pills-hover: #bddeff;
--side-pills-active: #80bfff;
```

#### Other Colors

```css
--scrollbar-thumb-hover: #86a789;
--odd: #201820;
--even: #182018;
--selected: #101010;
--switch-on: #226622;
--text-switch-on: #eeeeff;
--text-switch-off: #bbbbdd;
```

### Browser Compatibility Notes

**CSS Relative Color Syntax (`rgb(from ...)`)**: The `rgb(from ...)` syntax is used for creating semi-transparent variants of existing colors. This feature has limited browser support:

- **Chrome/Edge**: 120+ (December 2025)
- **Safari**: 16.4+ (March 2025)
- **Firefox**: 127+ (June 2026)

For older browsers, these will fall back to the base color or may not render the transparency effect. Consider using `@supports` queries for fallbacks if broader compatibility is required.

### Font Loading

```html
<link
  href="https://fonts.googleapis.com/css2?family=Oswald&family=Inconsolata&family=Red+Hat+Text&family=Inter&display=block"
  rel="stylesheet"
/>
```

## 📋 Implementation Guidelines

### Do's

- ✅ Use CSS custom properties for colors and maintain consistency
- ✅ Follow the established font hierarchy for different content types
- ✅ Implement responsive breakpoints consistently
- ✅ Use the defined border radius and shadow patterns
- ✅ Maintain the dark technical aesthetic with vibrant accents
- ✅ Test interactive states (hover, focus, active) across devices

### Don'ts

- ❌ Don't introduce new colors without updating the design system
- ❌ Don't use fonts outside the established hierarchy
- ❌ Don't create custom border radius or shadow patterns
- ❌ Don't hardcode breakpoint values; use `APP.BREAKPOINTS` and `APP.HEIGHT` from `breakpoints.js`
- ❌ Don't use light backgrounds or bright colors that break the dark theme

## 🔄 Maintenance & Updates

### When to Update This Document

- New color additions or changes
- Typography system modifications
- Component pattern updates
- Responsive breakpoint changes
- Interactive state modifications

### Review Process

- Update this document before implementing design changes
- Ensure all team members have access to current version
- Validate changes against existing components
- Test across all responsive breakpoints

## Related Documentation

- [CSS Organization](./css-organization.md) - CSS file structure and organization
- [CSS Important Usage](./css-important-usage.md) - When and how to use !important
- [React Contexts](./contexts.md) - Context system for state management
- [Custom Hooks](./hooks.md) - Reusable React hooks
- [Common Props](./common-props.md) - Reusable prop slice types for components
- Frontend UI Spec: `specs/frontend-ui.md`
- Email Template System: `controller/comms/emails/template.js`
- Component Library: Various component CSS files
- App Styles: `client/src/App.css`

---

_This design system ensures consistent branding across all POWERBACK interfaces while maintaining the app's distinctive dark, technical aesthetic with vibrant accent colors._
