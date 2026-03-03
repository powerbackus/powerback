# Common Props (Type Slices)

This document describes the reusable prop slice types in `client/src/types/CommonProps.ts`. Components define their props by intersecting one or more of these slices with component-specific props instead of using a single monolithic props type.

## Overview

CommonProps provides **prop slices**: small, domain-focused interfaces that can be combined to type component props. Each slice groups related optional props (e.g. auth state, user data, donation flow). Components import the slices they need from `@Types` and define a local type, for example:

```typescript
import type { UserDataProp } from '@Types';

type DeleteAcctProps = UserDataProp & { handleDeleteUser: () => void };

const DeleteAcct = ({ handleDeleteUser }: DeleteAcctProps) => { ... };
```

All slice properties are optional so that parents can pass only what a component uses.

## Available Slices

### AuthProp

Auth state, logout, credentials path, and account activation.

| Prop                  | Type                                                              | Description                        |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| `handleLogOut`        | `ChangeEventHandler \| MouseEventHandler \| KeyboardEventHandler` | Logout handler                     |
| `setAccountActivated` | `Dispatch<SetStateAction<boolean>>`                               | Set account activated state        |
| `setCredentialsPath`  | `(path: CredentialsPath) => void`                                 | Set credentials path               |
| `credentialsPath`     | `CredentialsPath`                                                 | Current credentials path           |
| `accountActivated`    | `boolean`                                                         | Whether account was just activated |
| `isInitializing`      | `boolean`                                                         | Auth still loading                 |
| `isLoggingIn`         | `boolean`                                                         | Login in progress                  |
| `isLoggedIn`          | `boolean`                                                         | User is authenticated              |

Used by: Splash, Account, SideNav, Panel, Logio, Credentials, Eligibility footer, etc.

### UserDataProp

Current user data and setter.

| Prop          | Type                                 | Description   |
| ------------- | ------------------------------------ | ------------- |
| `setUserData` | `Dispatch<SetStateAction<UserData>>` | Set user data |
| `userData`    | `UserData`                           | Current user  |

Used by: Profile pane, Settings, Security, Celebrations, form components, etc.

### DonationStateProp

Donation flow: amount, tip, selected pol, limits, errors, bill.

| Prop                         | Type                                             | Description               |
| ---------------------------- | ------------------------------------------------ | ------------------------- |
| `setRejectedDonationReasons` | `Dispatch<SetStateAction<CelebrationRejection>>` | Set rejection reasons     |
| `setPaymentError`            | `Dispatch<SetStateAction<Error \| null>>`        | Set payment error         |
| `rejectedDonationReasons`    | `CelebrationRejection`                           | Current rejection reasons |
| `setDonation`                | `(amount: number) => void`                       | Set donation amount       |
| `setTip`                     | `(amount: number) => void`                       | Set tip amount            |
| `selectPol`                  | `(pol: PolData) => void`                         | Select politician         |
| `remainingDonationLimit`     | `number`                                         | Remaining limit           |
| `suggestedDonations`         | `number[]`                                       | Suggested amounts         |
| `paymentError`               | `Error \| null`                                  | Payment error             |
| `selectedPol`                | `string \| null`                                 | Selected pol id           |
| `polData`                    | `PolData`                                        | Selected pol data         |
| `donation`                   | `number`                                         | Donation amount           |
| `tip`                        | `number`                                         | Tip amount                |
| `bill`                       | `Bill`                                           | Bill context              |

Used by: Lobby, DonationSection, TipAsk, Payment, Checkout, PolCarousel, PolSelection, BtnGrid, Donation button, etc.

### ProfileProp

Settings, contact info, display name, server config, and profile update.

| Prop                   | Type                                          | Description                    |
| ---------------------- | --------------------------------------------- | ------------------------------ |
| `handleUpdateUser`     | `(user: UserData, info: UpdatedInfo) => void` | Update user profile            |
| `setSettings`          | `Dispatch<SetStateAction<Settings>>`          | Set settings                   |
| `setContactInfo`       | `(payload: Payload) => void`                  | Set contact info               |
| `setDisplayName`       | `(maxLen: number) => void`                    | Set display name               |
| `serverConstantsError` | `Error \| null`                               | Error loading server constants |
| `serverConstants`      | `ServerConstants`                             | Server config                  |
| `contactInfo`          | `ContactInfo`                                 | Contact/form data              |
| `displayName`          | `DisplayName`                                 | Display name                   |
| `settings`             | `Settings`                                    | User settings                  |

Used by: Account body, Profile pane, Settings pane, Celebrations pane, form/sidenav components, etc.

### FormValidationProp

Form validity and field-level validation.

| Prop                    | Type                                         | Description                |
| ----------------------- | -------------------------------------------- | -------------------------- |
| `validateField`         | `(e: ChangeEvent<HTMLInputElement>) => void` | Validate a field on change |
| `setUserIsAssumedValid` | `Dispatch<SetStateAction<boolean>>`          | Set assumed-valid state    |
| `setUserFormValidated`  | `(isValid: boolean) => void`                 | Set form validated state   |
| `isPendingValidation`   | `boolean`                                    | Validation in progress     |
| `isInvalid`             | `ValidatingFields`                           | Per-field invalid state    |
| `resetValidation`       | `() => void`                                 | Reset validation state     |
| `userIsAssumedValid`    | `boolean`                                    | User assumed valid         |
| `userFormValidated`     | `boolean`                                    | Form has been validated    |
| `formIsInvalid`         | `boolean`                                    | Form has errors            |

Used by: Splash, Reset, Profile form, Compliance, etc.

### NavigationProp

Route, splash view, tab key, active key, profile tab. Splash state and navigation come from `useNavigation()`; callers typically pass `splash` and `setSplash={navigateToSplashView}`.

| Prop                  | Type                                                    | Description                                                   |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `setActiveProfileTab` | `Dispatch<SetStateAction<string>>`                      | Set profile tab                                               |
| `setActiveKey`        | `Dispatch<SetStateAction<string>>`                      | Set active key                                                |
| `setTabKey`           | `(next: { step?: FunnelView }) => void`                 | Set tab key                                                   |
| `onSelect`            | `(key: FunnelView) => void`                             | Tab select handler                                            |
| `setSplash`           | `(next: LandingNavView \| CredentialsFormView) => void` | Set splash view (from `useNavigation().navigateToSplashView`) |
| `route`               | `Route<typeof routes>`                                  | Current route                                                 |
| `activeProfileTab`    | `string`                                                | Active profile tab                                            |
| `splash`              | `LandingNavView \| CredentialsFormView`                 | Splash view state (from `useNavigation().splash`)             |
| `activeKey`           | `string`                                                | Active key                                                    |
| `tabKey`              | `string`                                                | Tab key                                                       |

Used by: Navigation, SideNav, Funnel, TabContents, Limit modal, VideoPlayer, Credentials, etc.

### DialogueProp

Modals, alerts, overlays, side nav visibility.

| Prop             | Type                                    | Description      |
| ---------------- | --------------------------------------- | ---------------- |
| `showOverlay`    | `ShowOverlay`                           | Overlay state    |
| `setShowOverlay` | `Dispatch<SetStateAction<ShowOverlay>>` | Set overlay      |
| `showAlert`      | `ShowAlert`                             | Alert state      |
| `setShowAlert`   | `Dispatch<SetStateAction<ShowAlert>>`   | Set alert        |
| `showModal`      | `ShowModal`                             | Modal state      |
| `setShowModal`   | `Dispatch<SetStateAction<ShowModal>>`   | Set modal        |
| `showSideNav`    | `boolean`                               | Side nav visible |
| `setShowSideNav` | `Dispatch<SetStateAction<boolean>>`     | Set side nav     |

Used by: Account, User section, Eligibility footer, etc.

### DeviceProp

Device and responsive flags.

| Prop            | Type      | Description           |
| --------------- | --------- | --------------------- |
| `isShortMobile` | `boolean` | Short mobile viewport |
| `isDesktop`     | `boolean` | Desktop viewport      |
| `isMobile`      | `boolean` | Mobile viewport       |

Used by: Profile sidenav/FieldList/FieldGroup, Brand, User, form components, Celebrations, etc.

## Usage pattern

1. **Import slices** from `@Types` (they are re-exported from `client/src/types/index.ts`).
2. **Define a component props type** by intersecting the needed slices and a local object type for component-specific props.
3. **Use that type** as the component's props parameter type.

Example with multiple slices and local props:

```typescript
import type { AuthProp, NavigationProp, UserDataProp } from '@Types';

type AccountProps = AuthProp &
  NavigationProp & {
    stopTour?: () => void;
    polsOnParade?: PolsOnParade;
  };

const Account = ({ isLoggedIn, setActiveKey, ...props }: AccountProps) => { ... };
```

## Conventions

- **Optional**: Every slice property is optional so components only declare what they use.
- **Single source of truth**: Each slice is defined once in CommonProps; components do not redefine these shapes.
- **No behavior change**: Using slices is a type-only pattern; prop flow and behavior stay the same.

## Related documentation

- [React Contexts](./contexts.md) - Context system that provides many values passed as props
- [Custom Hooks](./hooks.md) - Hooks that return or consume prop-like values
- [Design System](./design-system.md) - UI components and styling
- [Coding Idiosyncrasies](./coding-idiosyncrasies.md) - Project-specific patterns
- [Project Overview](./overview.md) - File structure; [`client/src/types`](../client/src/types) contains CommonProps and other types
