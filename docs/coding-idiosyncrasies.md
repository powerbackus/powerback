# Coding Idiosyncrasies

This document outlines project-specific coding patterns and conventions that differ from standard practices. Understanding these patterns is essential for contributing effectively to POWERBACK.

## Table of Contents

- [Component Organization](#component-organization)
- [Import Path Aliases](#import-path-aliases)
- [Import and List Sorting](#import-and-list-sorting)
- [State Management Patterns](#state-management-patterns)
- [Backend Architecture](#backend-architecture)
- [File Naming Conventions](#file-naming-conventions)
- [CSS Organization](#css-organization)
- [CSS Class Naming (block--part-or-variant)](#css-class-naming-block--part-or-variant)
- [TypeScript Patterns](#typescript-patterns)

## Component Organization

### Co-located Files Pattern

**Idiosyncrasy**: Components include CSS, sub-components, and pure functions in the same directory structure.

**Structure**:

```
ComponentName/
  ComponentName.tsx       # Main component
  index.js               # Export file
  style.css              # Co-located styles
  subcomps/              # Sub-components (if complex)
    SubComponent.tsx
  fn/                    # Pure functions (if needed)
    utilityFunction.js
```

**Why**: Keeps related code together, improves discoverability, and maintains clear component boundaries.

**Example**:

```
components/
  alerts/
    StyledAlert/
      StyledAlert.tsx
      index.js
      style.css
```

### Sub-components Directory

**Idiosyncrasy**: Complex components use a `subcomps/` directory for child components rather than separate top-level components.

**Pattern**: When a component becomes complex enough to need child components, they go in `subcomps/` rather than being promoted to the main components directory.

**Why**: Maintains component hierarchy and prevents component directory bloat.

### Function Directory (`fn/`)

**Idiosyncrasy**: Pure utility functions used by a component are co-located in a `fn/` subdirectory.

**Pattern**: Extract pure functions that are component-specific into `fn/` rather than global utils.

**Why**: Keeps component logic self-contained and makes dependencies explicit.

## Import Path Aliases

### Absolute Import Pattern

**Idiosyncrasy**: Frontend uses `@/` prefix for absolute imports instead of relative paths.

**Pattern**:

```typescript
// Good: Absolute imports
import { useAuth } from '@Contexts';
import { API } from '@API';
import { UserData } from '@Interfaces';

// Avoid: Deep relative paths
import { useAuth } from '../../../contexts';
```

**Alias Mappings** (configured in `client/craco.config.js`):

- `@Contexts` → `client/src/contexts`
- `@API` → `client/src/api`
- `@Interfaces` → `client/src/interfaces`
- `@Hooks` → `client/src/hooks`
- `@Components` → `client/src/components`
- `@Constants` → `client/src/constants`
- `@Utils` → `client/src/utils`
- `@Tuples` → `client/src/tuples`

**Why**: Eliminates brittle relative path navigation and improves refactoring safety.

## Import and List Sorting

**Idiosyncrasy**: Imports and named lists are sorted by length, then alphabetically (A–Z).

**Pattern**:

1. **Named imports** (e.g. from a single module): sort by **length (short to long)**, then **A–Z** within the same length.  
   Example: `import { Col, Row, Tab, Stack, Button } from 'react-bootstrap';` (Col, Row, Tab length 3; then Stack 5; then Button 6).

2. **Import statements** (excluding the first line that imports from `'react'`): sort by **module path length (longest first)**, then **A–Z** by path.  
   Example: longer paths like `react-vertical-timeline-component` before `react-bootstrap`, then shorter paths in alphabetical order.

**Why**: Consistent, predictable order that is easy to scan and maintain.

**Tooling**: To reorder import statements in files, run `node scripts/reorder-imports.js <file1> [file2 ...]` from the project root.

**See also**: [Linting & Formatting](./linting-formatting.md) for ESLint import _group_ order (built-ins, external, internal, relative). That order is applied first; within groups and within a single import line, the length-then–A–Z rule above applies.

## State Management Patterns

### Context-First Architecture

**Idiosyncrasy**: POWERBACK uses React Context extensively for global state, more than typical React applications.

**Pattern**: Multiple context providers compose together:

- `AuthContext` - Authentication state
- `ComplianceContext` - FEC compliance tier
- `DeviceContext` - Device detection
- `NavigationContext` - Navigation state

**Why**: Avoids prop drilling and provides centralized state management without Redux overhead.

### Hook Organization by Domain

**Idiosyncrasy**: Hooks are organized by domain (compliance, data, forms, fn, ui) rather than by type.

**Structure**:

```
hooks/
  compliance/    # Compliance-related hooks
  data/          # Data fetching hooks
  forms/         # Form management hooks
  fn/            # Pure function utilities
  ui/            # UI interaction hooks
```

**Why**: Groups related functionality together, making it easier to find hooks for specific use cases.

### Reducer Pattern for Complex State

**Idiosyncrasy**: Complex state management uses `useReducer` with action creators wrapped in `useMemo`.

**Pattern**:

```typescript
const [state, dispatch] = useReducer(reducer, initialState);
const handlers = useMemo(
  () => ({
    action1: () => dispatch({ type: 'ACTION1' }),
    action2: () => dispatch({ type: 'ACTION2' }),
  }),
  []
);
```

**Why**: Provides predictable state updates and keeps action creators stable for memoization.

## Backend Architecture

### Service/Controller Separation

**Idiosyncrasy**: Business logic lives in services, controllers are thin request handlers.

**Pattern**:

- **Controllers** (`/controller`): Handle HTTP requests, validation, response formatting
- **Services** (`/services`): Contain business logic, database operations, external API calls

**Example**:

```javascript
// controller/celebrations/create.js - Thin controller
const CelebrationController = require('./create');
const OrchestrationService = require('../../services/celebration/orchestrationService');

router.post('/celebrations', async (req, res) => {
  const result = await OrchestrationService.createCelebration(req, res);
  // Controller just routes, service does the work
});
```

**Why**: Clear separation of concerns, testable business logic, reusable services.

### Domain-Based Organization

**Idiosyncrasy**: Both controllers and services are organized by business domain, not by technical layer.

**Structure**:

```
controller/
  celebrations/    # Celebration domain
  users/          # User domain
  congress/       # Congressional data domain
  payments/       # Payment domain

services/
  celebration/    # Celebration business logic
  user/           # User business logic
  congress/       # Congressional data logic
```

**Why**: Aligns code organization with business domains, making it easier to understand feature boundaries.

## File Naming Conventions

### Mixed Case Patterns

**Idiosyncrasy**: File naming uses different cases for different file types, even within the same directory.

**Patterns**:

- **Components**: PascalCase (`StyledAlert.tsx`)
- **Hooks**: camelCase with `use` prefix (`useFormValidation.ts`)
- **Utilities**: camelCase (`normalize.js`)
- **Models**: PascalCase (`User.js`)
- **Controllers**: camelCase (`create.js`)
- **Services**: camelCase (`dataService.js`)

**Why**: Visual distinction between file types helps developers quickly identify file purpose.

### Index Files for Clean Imports

**Idiosyncrasy**: Most directories have `index.js` files that re-export for clean imports.

**Pattern**:

```javascript
// hooks/forms/index.js
export { default as useEntryForm } from './useEntryForm';
export { default as useAccountUpdate } from './useAccountUpdate';
```

**Usage**:

```typescript
import { useEntryForm, useAccountUpdate } from '@Hooks/forms';
```

**Why**: Cleaner import statements and easier refactoring of internal file structure.

## CSS Organization

### Co-located Styles

**Idiosyncrasy**: CSS files are co-located with components, not in a global stylesheet.

**Pattern**: Each component has its own `style.css` file in the same directory.

**Why**: Scoped styles, easier maintenance, clear component boundaries.

### CSS Important Usage

**Idiosyncrasy**: POWERBACK uses `!important` more liberally than typical projects.

**Pattern**: See [CSS Important Usage](./css-important-usage.md) for detailed guidelines.

**Why**: Bootstrap integration and dynamic styling requirements necessitate override patterns.

## CSS Class Naming (block--part-or-variant)

**Idiosyncrasy**: Custom component classes use a single separator (`--`) for both "part of the component" and "variant/modifier," instead of strict BEM (`__` for elements, `--` for modifiers).

**Pattern**: `block-name--part-or-variant`

- **Block**: kebab-case name for the component or context (e.g. `account-logio`, `userpass`, `footer`, `pitch-info-item`).
- **After `--`**: Either a **part** (e.g. `row`, `field`, `btn`) or a **variant** (e.g. `featured`, `flexible`, `translucent`).

**Examples**:

- Parts: `account-logio--row`, `userpass--field`, `find-location--btn`, `sidenav-close--btn`, `tip-submit--btn-spinner`, `show-cont--btn`, `hide-cont--btn`
- Variants: `pitch-info-item--featured`, `input--translucent`

**Rules**:

- Use only `--` between block and part/variant; do not use `__` for elements.
- Block and part/variant are both kebab-case.
- These classes are often combined with Bootstrap or utility classes (e.g. `className='account-logio--row row'`).

**Why**: Early in the project this BEM-like pattern was adopted with one separator for simplicity. Usage was inconsistent; this document and the Cursor rule `24-css-class-naming.mdc` define the convention so new or touched code applies it consistently. No requirement to refactor existing classes to strict BEM.

**See also**: [24-css-class-naming.mdc](../.cursor/rules/24-css-class-naming.mdc), [15-naming-conventions.mdc](../.cursor/rules/15-naming-conventions.mdc).

## TypeScript Patterns

### Client-side logging helper

**Idiosyncrasy**: Frontend code uses a centralized logging helper instead of calling `console.error` / `console.warn` directly.

**Pattern**:

```typescript
// client/src/utils/clientLog.ts
import { logError, logWarn } from '@Utils';

logError('Settings update failed', error);
logWarn('setSettings called outside provider');
```

- In **development**, `logError` logs both the message and the full error object/stack; `logWarn` logs warnings.
- In **production**, `logError` logs only the high-level message (no `error.response`, request bodies, or stack traces), and `logWarn` is effectively a no-op to keep consoles clean and avoid leaking details.
- React contexts and hooks use `logWarn` for "called outside provider" defaults and `logError` for unexpected failures in auth, payment, limits, and election-cycle flows.
- The only remaining direct `console.error` in the React app is inside `ErrorBoundary`, and it's explicitly **guarded to run only in development**; production forwards errors to `/api/sys/errors/frontend` without duplicating them in the browser console.

**Why**: Centralizing logging makes it much harder to accidentally leak sensitive data (auth tokens, Stripe errors, API payloads) in production logs while preserving rich diagnostics in development.

### Interface Organization

**Idiosyncrasy**: TypeScript interfaces are in a dedicated `/interfaces` directory, not co-located with components.

**Structure**:

```
interfaces/
  UserData.ts
  ContactInfo.ts
  Celebration.ts
```

**Why**: Centralized type definitions improve discoverability and reuse.

### Tuple Directory

**Idiosyncrasy**: Fixed datasets (states, countries, errors) are in `/tuples` directory.

**Pattern**: Arrays of objects with specific structures (e.g., error tuples with status codes and messages).

**Why**: Distinguishes static data from dynamic data and utility functions.

### Gradual TypeScript Migration

**Idiosyncrasy**: Codebase mixes `.js` and `.ts`/`.tsx` files.

**Pattern**:

- New code uses TypeScript with concrete types (no `any` in new client code).
- Legacy code remains JavaScript, with targeted TS refactors where it provides clear benefit.
- Recent `fix/no-any` work removed remaining `any` usages from core client entry points (e.g. `API`, `ButtonSet`, `useMontyHall`, `StyledModal`, link tracking, cookie consent).

**Why**: Incremental migration strategy allows gradual adoption without full rewrite, while the "no-`any` for new TypeScript" rule keeps type safety strong in actively maintained areas.

### TSX string props in curly braces

**Idiosyncrasy**: String prop values in TSX are often written with curly braces (e.g. `className={'pol-wrapper'}`) instead of quote-only (e.g. `className="pol-wrapper"`). Not a strict rule—the same author may use quotes in some places and braces in others.

**Why (aesthetic)**: Purely a readability preference. The brace form can feel more contained and easier to scan; hard to explain—you either like the look or you don't. Both forms are valid; consistency with the surrounding file matters more than a global rule. A side effect: every prop value is syntactically an expression, so you don't switch between `prop="value"` and `prop={variable}` when a value later becomes dynamic.

- [Project Structure](./overview.md) - Overall architecture
- [Development Setup](./development.md) - Setup instructions
- [Design System](./design-system.md) - UI component patterns
- [CSS Organization](./css-organization.md) - CSS structure and conventions
- [Hooks Catalog](./hooks.md) - Custom hook patterns
- [Contexts](./contexts.md) - React Context usage
- [Common Props](./common-props.md) - Reusable prop slice types for components
