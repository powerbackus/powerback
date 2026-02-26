# CSS File Organization

This document organizes all CSS files in the project into logical groups for easier navigation and maintenance.

> **📖 Related Documentation:**
>
> - [CSS Important Usage](./css-important-usage.md) - !important declarations
> - [Design System](./design-system.md) - Design tokens and styling
> - [Linting & Formatting](./linting-formatting.md) - CSS linting rules

## Global Styles

### Root/Application

- `client/src/App.css` - Global CSS variables, base styles, and responsive breakpoints

---

## Component Styles

### Buttons

- `client/src/components/buttons/Agree/style.css`
- `client/src/components/buttons/Continue/style.css`
- `client/src/components/buttons/Donation/style.css`
- `client/src/components/buttons/Generic/style.css`
- `client/src/components/buttons/InputGroup/style.css`
- `client/src/components/buttons/Submit/style.css`

### Forms

- `client/src/components/forms/Payment/style.css`
- `client/src/components/forms/UserPass/style.css`
- `client/src/components/forms/inputs/DonationInput/style.css`
- `client/src/components/forms/inputs/Password/style.css`
- `client/src/components/forms/inputs/ToggleSwitch/style.css`
- `client/src/components/forms/inputs/ToggleSwitch/label/style.css`
- `client/src/components/forms/inputs/Username/style.css`
- `client/src/components/forms/inputs/filter/style.css`

### Modals

- `client/src/components/modals/style.css` - Base modal styles
- `client/src/components/modals/Credentials/style.css`
- `client/src/components/modals/ForgotPassword/style.css`
- `client/src/components/modals/ForgotPassword/form/style.css`

### Alerts

- `client/src/components/alerts/style.css` - Base alert styles
- `client/src/components/alerts/account/Compliant/style.css`
- `client/src/components/alerts/CookieConsent/style.css`

### Displays

- `client/src/components/displays/DonationPrompt/style.css`
- `client/src/components/displays/LimitMessage/style.css`
- `client/src/components/displays/LimitMessage/Porthole/style.css`
- `client/src/components/displays/Constituency/style.css`
- `client/src/components/displays/LinkBadge/style.css`
- `client/src/components/displays/PolName/style.css`
- `client/src/components/displays/LimitMessage/CycleDates/style.css`
- `client/src/components/displays/LimitMessage/CycleInfo/style.css`
- `client/src/components/displays/LimitMessage/Heading/style.css`
- `client/src/components/displays/LimitMessage/LimitInfo/style.css`
- `client/src/components/displays/LimitMessage/ResetInfo/style.css`

### Interactive Components

- `client/src/components/interactive/Logio/style.css`
- `client/src/components/interactive/NavTabLinks/style.css`
- `client/src/components/interactive/PolCarousel/style.css`
- `client/src/components/interactive/PolCarousel/Loading/style.css`
- `client/src/components/interactive/PolCarousel/PolSelection/style.css`
- `client/src/components/interactive/PolCarousel/PolSelection/Headshot/style.css`
- `client/src/components/interactive/PolCarousel/PolSelection/Subheading/style.css`
- `client/src/components/interactive/Socials/style.css`
- `client/src/components/interactive/BtnGrid/style.css`
- `client/src/components/interactive/VideoPlayer/style.css`

### Search Components

- `client/src/components/search/style.css`
- `client/src/components/search/PolCombobox/style.css`

### Page Components

#### Navigation

- `client/src/components/page/navs/style.css`
- `client/src/components/page/navs/SideNav/style.css`
- `client/src/components/page/navs/SideNav/Panel/style.css`
- `client/src/components/page/navs/SideNav/Header/style.css`
- `client/src/components/page/navs/TabFlow/style.css`
- `client/src/components/page/navs/sections/user/style.css`

#### Navigation Modals

- `client/src/components/page/navs/modals/FAQ/subcomps/body/style.css`
- `client/src/components/page/navs/modals/FAQ/subcomps/body/QAccordian/style.css`
- `client/src/components/page/navs/modals/FAQ/subcomps/heading/style.css`
- `client/src/components/page/navs/modals/Eligibility/subcomps/body/style.css`
- `client/src/components/page/navs/modals/Eligibility/subcomps/heading/style.css`
- `client/src/components/page/navs/modals/Terms/style.css`

#### Other Page Components

- `client/src/components/page/Footer/style.css`
- `client/src/components/page/Wrapper/style.css`

---

## Page Styles

### Splash Page

- `client/src/pages/Splash/style.css`
- `client/src/pages/Splash/_Pitch/style.css`

### Funnel Page

- `client/src/pages/Funnel/style.css`

#### Funnel Tab Contents

- `client/src/pages/Funnel/TabContents/style.css`
- `client/src/pages/Funnel/TabContents/Lobby/style.css`
- `client/src/pages/Funnel/TabContents/Lobby/DonationSection/style.css`
- `client/src/pages/Funnel/TabContents/Payment/style.css`
- `client/src/pages/Funnel/TabContents/Payment/Checkout/style.css`
- `client/src/pages/Funnel/TabContents/Confirmation/style.css`
- `client/src/pages/Funnel/TabContents/TipAsk/style.css`

#### Funnel Modals

##### Account Modal

- `client/src/pages/Funnel/modals/Account/subcomps/heading/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/footer/style.css`

###### Account Modal - Profile Pane

- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/Compliance/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/sidenav/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/sidenav/FieldList/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/sidenav/FieldList/FieldGroup/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/subpane/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/subpane/form/style.css`

###### Account Modal - Settings Pane

- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/Preferences/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/Security/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/Security/ChangePass/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/Security/DeleteAcct/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/Security/Theater/style.css`

###### Account Modal - Celebrations Pane

- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/title/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/methods/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/methods/Sort/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/event/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/subcomps/event/subcomps/ButtonSet/style.css`
- `client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/Placeholder/style.css`

##### Other Funnel Modals

- `client/src/pages/Funnel/modals/Limit/style.css`

### Other Pages

- `client/src/pages/Reset/style.css`
- `client/src/pages/Unsubscribe/style.css`
- `client/src/pages/ErrorBoundary/style.css`
- `client/src/pages/Loading/style.module.css`

---

## Summary

**Total CSS Files: 113**

### By Category

- **Global Styles**: 1 file
- **Component Styles**: 68 files
  - Buttons: 6 files
  - Forms: 8 files
  - Modals: 4 files
  - Alerts: 3 files
  - Displays: 11 files
  - Interactive: 10 files
  - Search: 2 files
  - Page Components: 24 files
- **Page Styles**: 45 files
  - Funnel: 37 files
  - Other Pages: 8 files

### Organization Principles

1. **Co-location**: CSS files are co-located with their components/pages
2. **Hierarchical**: Follows the component/page directory structure
3. **Grouped by Function**: Related styles are grouped together
4. **Modular**: Each component/page has its own style file

---

## Layout Fundamentals: Grid vs Flexbox

### The Mental Model

#### CSS Grid = 2D Layout (Rows AND Columns)

Think of Grid like a **spreadsheet** or **table**:

- You define both rows AND columns
- Items can span multiple cells
- Perfect for: complex page layouts, card grids, dashboards

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* 3 columns */
  grid-template-rows: auto 1fr auto; /* 3 rows */
  gap: 20px;
}
```

#### Flexbox = 1D Layout (Row OR Column)

Think of Flexbox like a **line of items**:

- You define ONE direction (row or column)
- Items flow in that direction
- Perfect for: navigation bars, button groups, vertical stacks, centering

```css
.container {
  display: flex;
  flex-direction: column; /* OR row */
  gap: 20px;
}
```

### When to Use Each

#### Use **Grid** when:

- ✅ You need **both rows AND columns** (2D layout)
- ✅ Items need to **span multiple cells**
- ✅ You want **precise control** over both dimensions
- ✅ Examples: Dashboard, card grid, complex page layout

#### Use **Flexbox** when:

- ✅ You need **one direction** (row OR column)
- ✅ Items should **flow naturally** in that direction
- ✅ You want **simple alignment** (center, space-between, etc.)
- ✅ Examples: Navigation bar, button group, vertical stack

### Bootstrap's Grid System (What You're Using)

Bootstrap's `Row` and `Col` components **use Flexbox under the hood**, but they provide:

- Responsive breakpoints (xs, sm, md, lg, xl)
- Automatic column sizing
- Gutters (spacing between columns)
- Easy responsive behavior

#### Your Current Structure (CORRECT):

```tsx
<Container fluid>
  {' '}
  {/* Provides max-width & padding */}
  <Row className='flex-column'>
    {' '}
    {/* Flexbox container (vertical) */}
    <Col>Navigation</Col> {/* Flex item */}
    <Col>Page</Col> {/* Flex item */}
    <Col>Footer</Col> {/* Flex item */}
  </Row>
</Container>
```

This is **perfect** for a vertical stack (header → content → footer).

### Common Patterns in This Codebase

#### Pattern 1: Vertical Stack (Your App.tsx)

```tsx
<Row className='flex-column'>
  {' '}
  {/* Vertical flexbox */}
  <Col>Item 1</Col>
  <Col>Item 2</Col>
  <Col>Item 3</Col>
</Row>
```

**Why Flexbox?** You're stacking items vertically (one direction).

#### Pattern 2: Horizontal Layout (Navigation)

```tsx
<Row>
  {' '}
  {/* Horizontal flexbox (default) */}
  <Col lg={4}>Left</Col>
  <Col lg={2}></Col> {/* Spacer */}
  <Col lg={5}>Right</Col>
</Row>
```

**Why Flexbox?** Items flow horizontally (one direction).

#### Pattern 3: 2D Grid (Splash Page)

```css
.splash-grid {
  display: grid;
  grid-template-columns: 1fr clamp(20rem, 28vw, 32rem);
  grid-template-rows: auto 1fr;
  grid-template-areas: 'headline blank' 'copy video';
}
```

**Why Grid?** Need both rows AND columns, items span areas.

#### Pattern 4: Card Grid (Pitch Section)

```css
.pitch-info {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 columns */
  gap: 32px;
}
```

**Why Grid?** Need multiple columns with equal sizing.

### The Key Insight

**Bootstrap's Row/Col = Flexbox with training wheels**

- `Row` = `display: flex` (with extra Bootstrap magic)
- `Col` = `flex: 1` (with responsive breakpoints)
- `flex-column` = `flex-direction: column`

You're using Bootstrap correctly! The confusion comes from:

1. Bootstrap calls it a "grid" but it's actually flexbox
2. CSS Grid is a different, newer technology
3. Both solve layout problems, but differently

### Should You Switch to CSS Grid for App.tsx?

**No.** Your current structure is correct because:

- ✅ You're stacking vertically (one direction) → Flexbox is perfect
- ✅ Bootstrap handles responsive behavior
- ✅ Simple, maintainable structure
- ✅ Consistent with rest of codebase

**Only use CSS Grid if:**

- You need items to span multiple rows/columns
- You need precise 2D control
- You're building a complex dashboard-like layout

### Debugging Layout Issues

#### When things don't stack correctly:

1. **Check parent container:**

   ```css
   .parent {
     display: flex; /* Must be flex or grid */
     flex-direction: column; /* For vertical stacking */
   }
   ```

2. **Check child items:**

   ```css
   .child {
     flex-shrink: 0; /* Prevent shrinking if needed */
     min-height: 0; /* Allow flex items to shrink below content size */
   }
   ```

3. **Check for conflicting styles:**
   - `position: absolute` removes items from flow
   - `float` breaks flexbox/grid
   - `display: block` on flex children can cause issues

#### Common Mistakes:

❌ **Mixing display types:**

```css
.parent {
  display: grid;
}
.child {
  display: flex; /* OK - nested is fine */
}
```

❌ **Using Grid for simple stacks:**

```css
/* Overkill for vertical stack */
.container {
  display: grid;
  grid-template-rows: auto auto auto;
}
/* Better: */
.container {
  display: flex;
  flex-direction: column;
}
```

✅ **Using the right tool:**

```css
/* Simple vertical stack */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

### Quick Reference

| Need               | Tool              | Example                                         |
| ------------------ | ----------------- | ----------------------------------------------- |
| Vertical stack     | Flexbox           | Header → Content → Footer                       |
| Horizontal row     | Flexbox           | Navigation items                                |
| 2D layout          | Grid              | Dashboard, card grid                            |
| Centering          | Flexbox           | `justify-content: center; align-items: center;` |
| Responsive columns | Bootstrap Row/Col | Your current setup                              |
| Complex spanning   | Grid              | `grid-column: span 2;`                          |

### Your App.tsx Structure (Why It Works)

```tsx
<div className='App'>
  {' '}
  {/* Full-width wrapper */}
  <Container fluid>
    {' '}
    {/* Bootstrap container (max-width + padding) */}
    <Row className='flex-column'>
      {' '}
      {/* Flexbox: vertical direction */}
      <Col>Navigation</Col> {/* Flex item: auto height */}
      <Col>Page</Col> {/* Flex item: grows to fill space */}
      <Col>Footer</Col> {/* Flex item: auto height */}
    </Row>
  </Container>
</div>
```

**This is correct!** You're using:

- Bootstrap's Container for responsive width/padding
- Flexbox (via Row) for vertical stacking
- Col for consistent spacing

No need to change anything. If you're having specific layout issues, they're likely CSS conflicts, not structural problems.
