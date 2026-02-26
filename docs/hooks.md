# Custom React Hooks Documentation

This document provides a comprehensive overview of all custom React hooks used in the POWERBACK application. These hooks encapsulate reusable logic and state management patterns.

> **📖 Related Documentation:**
>
> - [React Contexts](./contexts.md) - Context system that hooks use
> - [Common Props](./common-props.md) - Reusable prop slice types for components
> - [Design System](./design-system.md) - UI components
> - [Payment Processing](./payment-processing.md) - Payment hooks integration
>
> **Logging note**: Hooks that touch authentication, payments, or compliance (e.g. `usePaymentProcessing`, `useAccountUpdate`, `useFormCompliance`, `useInitialPolsOnParade`) use the shared client logging helper (`logError` / `logWarn` from `@Utils`) instead of raw `console.error` / `console.warn`. In development they log full error objects; in production they emit only high-level messages without leaking API responses or sensitive payloads.

## Hook Categories

### Authentication & User Management

#### useEntryForm (`client/src/hooks/useEntryForm.ts`)

**Purpose**: Manages user entry forms for login, registration, and password changes.

**Parameters**: None

**Returns**: `[UserEntry, Handlers]`

**State**:

```typescript
interface UserEntry {
  userEntryForm: UserEntryForm | UserEntryResponse | ChangePasswordRequest;
  userFormValidated: boolean;
  secureUserPassFeedback: string;
}
```

**Actions**:

```typescript
interface Handlers {
  clearUserEntryForm: () => void;
  setUserFormValidated: (isValid: boolean) => void;
  setSecureUserPassFeedback: (feedback: string) => void;
  setUserEntryForm: (
    entryForm:
      | UserEntryForm
      | UserEntryResponse
      | ChangePasswordRequest
      | ((prev) => UserEntryForm | UserEntryResponse | ChangePasswordRequest)
  ) => void;
}
```

**Usage**:

```typescript
const [userEntry, { setUserEntryForm, setUserFormValidated }] = useEntryForm();
```

#### useContactInfo (`client/src/hooks/useContactInfo.ts`)

**Purpose**: Manages user contact information with phone number normalization and international support.

**Parameters**: `user: UserData`

**Returns**: `[ContactInfo, Handlers]`

**Actions**:

```typescript
interface Handlers {
  setContactInfo: ({ name, value }: Payload) => void;
  loadContactInfo: () => void;
  setIntl: () => void;
}
```

**Features**:

- Phone number formatting with `normalize()` function
- International address support
- Automatic data pruning for sensitive information
- Form validation integration

**Usage**:

```typescript
const [contactInfo, { setContactInfo, loadContactInfo }] =
  useContactInfo(userData);
```

#### useDisplayName (`client/src/hooks/useDisplayName.ts`)

**Purpose**: Generates responsive display names with automatic truncation and mobile optimization.

**Parameters**: `{ first: string, middle?: string, last: string }`

**Returns**: `[DisplayName, Handlers]`

**Features**:

- Progressive name truncation (First M. Last → F. M. Last → F. Last → Last)
- Mobile-responsive font sizing
- Middle name handling
- Mathematical font scaling algorithms

**Usage**:

```typescript
const [displayName, { setDisplayName }] = useDisplayName({
  first: 'John',
  middle: 'Michael',
  last: 'Doe',
});
```

### Form Management

#### useFormValidation (`client/src/hooks/useFormValidation.ts`)

**Purpose**: Manages form field validation state and error handling.

**Parameters**: None

**Returns**: `[ValidatingFields, Handlers]`

**Actions**:

```typescript
interface Handlers {
  validateField: (e: ChangeEvent<HTMLInputElement>) => void;
  resetValidation: () => void;
}
```

**Usage**:

```typescript
const [validatingFields, { validateField, resetValidation }] =
  useFormValidation();
```

#### useFormCompliance (`client/src/hooks/useFormCompliance.ts`)

**Purpose**: Validates form compliance with legal requirements and user eligibility.

**Parameters**:

- `contactInfo: ContactInfo`
- `formIsInvalid: boolean`

**Returns**: `[boolean, Handlers]`

**Actions**:

```typescript
interface Handlers {
  setFormCompliance: () => void;
}
```

**Usage**:

```typescript
const [compliance, { setFormCompliance }] = useFormCompliance(
  contactInfo,
  formIsInvalid
);
```

#### useFieldList (`client/src/hooks/useFieldList.ts`)

**Purpose**: Manages dynamic field lists for forms based on active tabs and user data.

**Parameters**:

- `CONTROLS: ControlCategory[]`
- `activeTab: string`
- `user: UserData`

**Returns**: `[FieldControl[], Handlers]`

**Actions**:

```typescript
interface Handlers {
  setFieldList: () => void;
}
```

**Usage**:

```typescript
const [fieldList, { setFieldList }] = useFieldList(
  CONTROLS,
  activeTab,
  userData
);
```

### UI State Management

#### useSpinner (`client/src/hooks/useSpinner.ts`)

**Purpose**: Manages loading spinner state for async operations.

**Parameters**: None

**Returns**: `[boolean, Handlers]`

**Actions**:

```typescript
interface Handlers {
  start: () => void;
  stop: () => void;
}
```

**Usage**:

```typescript
const [isLoading, { start, stop }] = useSpinner();
```

#### useButtonErrorSwapper (`client/src/hooks/useBtnErrorSwapper.ts`)

**Purpose**: Manages button state transitions between normal and error states with automatic timeout.

**Parameters**: None

**Returns**: `[SwapperBtn, Handlers]`

**Features**:

- Automatic error state timeout
- HTTP status code mapping to error messages
- Smooth state transitions
- Configurable timeout durations

**Actions**:

```typescript
interface Handlers {
  swapToButton: () => void;
  swapToError: (errorCode: HttpStatusCode) => void;
}
```

**Usage**:

```typescript
const [buttonState, { swapToButton, swapToError }] = useButtonErrorSwapper();
```

#### useMontyHall (`client/src/hooks/useMontyHall.ts`)

**Purpose**: Manages modal door states for password change and account deletion flows.

**Parameters**: `doors: string[]`

**Returns**: `[Which, Handlers]`

**State**:

```typescript
type Which = {
  changePassword: boolean;
  deleteAccount: boolean;
};
```

**Actions**:

```typescript
interface Handlers {
  openDoor: (type: string) => void;
  closeDoors: () => void;
}
```

**Usage**:

```typescript
const [doors, { openDoor, closeDoors }] = useMontyHall([
  'changePassword',
  'deleteAccount',
]);
```

### Search & Data Management

#### useSearch (`client/src/contexts/SearchContext.tsx`)

**Purpose**: Manages politician search functionality with multiple search categories.

**Parameters**: None (uses SearchContext)

**Returns**: `SearchState & SearchActions`

**Features**:

- Name-based search with accent normalization and real-time dropdown filtering
- State-based search with representative filtering and real-time dropdown filtering
- District-based search via location API (no dropdown filtering, uses "Find" button)
- Real-time filtering and sorting for NAME and STATE modes

**Usage**:

```typescript
const { searchQuery, items, searchByName, searchByState, resetSearch } =
  useSearch();
```

**Note**: The `searchByDistrict` function was removed as DISTRICT mode now works differently - it only updates the input value without filtering items, and uses the "Find" button to trigger location-based searches.

#### useParade (`client/src/hooks/useParade.ts`)

**Purpose**: Manages politician parade/carousel state and search operations.

**Parameters**: None

**Returns**: `[PolsOnParade, Handlers]`

**Actions**:

```typescript
interface Handlers {
  setPolsOnParade: (houseMembers: HouseMember[]) => void;
  searchPolsByName: (selectedItem: HouseMember) => void;
  searchPolsByState: (selectedItem: RepState) => void;
  searchPolsByLocation: (ocd_id: string) => void;
  restorePolsOnParade: () => void;
}
```

**Usage**:

```typescript
const [parade, { setPolsOnParade, searchPolsByName }] = useParade();
```

#### useComboboxItems (`client/src/hooks/useComboboxItems.ts`)

**Purpose**: Manages combobox items for search interfaces with category-specific filtering.

**Parameters**:

- `itemToString: (item: ComboboxItem | null) => string`
- `init: HouseMember[]`
- `category: string`

**Returns**: `[ComboboxItem[], Handlers]`

**Features**:

- Category-specific search logic (NAME, STATE, DISTRICT)
- Accent-insensitive name search
- State filtering with representative validation
- Automatic sorting and filtering

**Usage**:

```typescript
const [items, { setInputItems, resetSearchBar }] = useComboboxItems(
  itemToString,
  initialPoliticians,
  'NAME'
);
```

### Donation & Business Logic

#### usePaymentProcessing (`client/src/hooks/usePaymentProcessing.ts`)

**Purpose**: Encapsulates payment processing logic for Stripe integration, celebration saving, and error handling.

**Parameters**: `uiDependencies: PaymentUIDependencies`

**Returns**: `{ processDonation, attemptPayment, handlePaymentSubmit }`

**Features**:

- Stripe payment confirmation and processing
- Celebration saving with donation package creation
- User data updates and navigation handling
- PAC limit validation and error handling
- Form submission management
- Comprehensive error handling for payment failures

**Interface**:

```typescript
interface PaymentUIDependencies {
  stripe: Stripe | null;
  setPaymentError: Dispatch<SetStateAction<Error | null>>;
  setShowModal: Dispatch<SetStateAction<ShowModal>>;
  setRejectedDonationReasons: Dispatch<SetStateAction<CelebrationRejection>>;
  stopProcessingSpinner: () => void;
  startProcessingSpinner: () => void;
}
```

**Actions**:

```typescript
interface PaymentProcessingActions {
  processDonation: (
    data: SentPayment,
    bill: any,
    userId: string
  ) => Promise<void>;
  attemptPayment: (donorId: string, bill: any, userId: string) => void;
  handlePaymentSubmit: (
    e: UserEvent,
    paymentError: Error | null,
    donorId: string,
    bill: any,
    userId: string
  ) => void;
}
```

**Usage**:

```typescript
const { handlePaymentSubmit } = usePaymentProcessing({
  stripe,
  setPaymentError,
  setShowModal,
  setRejectedDonationReasons,
  stopProcessingSpinner,
  startProcessingSpinner,
});

// In component
const handleSubmit = useCallback(
  (e) => {
    handlePaymentSubmit(e, paymentError || null, donorId, bill, userId);
  },
  [handlePaymentSubmit, paymentError, donorId, bill, userId]
);
```

#### Legacy limit hooks (removed)

Historically, client-side donation limit logic lived in `useLowerTierLimit` and `useHighestTierLimit`. As part of the guest/compliant refactor, that behavior was migrated into `DonationLimitsContext` (frontend) and election-cycle services (backend), and the legacy hooks were removed from the codebase. For historical reference you can inspect prior revisions in git history, but all new work should use `DonationLimitsContext` plus backend validation.

#### useCelebrationEvents (`client/src/hooks/useCelebrationEvents.ts`)

**Purpose**: Manages user Celebration/donation history with sorting and filtering.

**Parameters**: `userCelebrations: Celebration[]`

**Returns**: `[Celebrations, Handlers]`

**Features**:

- Multi-criteria sorting (date, amount)
- Name and state filtering
- Sort direction toggling
- Real-time filtering

**Actions**:

```typescript
interface Handlers {
  setCelebrationEvents: (action: Action) => void;
}
```

**Usage**:

```typescript
const [celebrations, { setCelebrationEvents }] =
  useCelebrationEvents(userDonations);
```

### Tour & Onboarding

#### useTour (`client/src/hooks/useTour.ts`)

**Purpose**: Manages interactive product tours with step-by-step guidance.

**Parameters**: `isDesktop: boolean`

**Returns**: `[Tourguide, Handlers]`

**Features**:

- Multiple tour types (User, Celebration)
- Responsive tour steps
- Callback handling
- Tour state management

**Actions**:

```typescript
interface Handlers {
  runTour: (tour: TourName, conditions: boolean) => void;
  stopTour: (tour: TourName) => void;
}
```

**Tour Types**:

```typescript
type TourName = 'User' | 'Celebration';
```

**Usage**:

```typescript
const [tour, { runTour, stopTour }] = useTour(isDesktop);
```

## Utility Functions

### normalize (`client/src/hooks/fn/normalize.js`)

**Purpose**: Formats phone number input with automatic formatting.

**Parameters**:

- `value: string` - Current input value
- `previousValue: string` - Previous input value

**Returns**: `string` - Formatted phone number

**Features**:

- Real-time phone number formatting
- Supports (XXX) XXX-XXXX format
- Handles backspace and forward input
- Validates numeric input only

**Usage**:

```typescript
const formattedPhone = normalize(currentValue, previousValue);
```

### prune (`client/src/hooks/fn/prune.js`)

**Purpose**: Removes sensitive and internal properties from user objects.

**Parameters**: `user: Object` - User object to sanitize

**Returns**: `Object | undefined` - Sanitized user object

**Removed Properties**:

- Authentication data (id, password, tokens)
- Internal flags (locked, understands)
- Timestamps (createdAt, updatedAt)
- Sensitive hashes and version keys

**Usage**:

```typescript
const sanitizedUser = prune(userData);
```

## Hook Patterns

### State Management Pattern

Most hooks follow a consistent pattern:

```typescript
const [state, handlers] = useHook(parameters);
```

### Reducer Pattern

Complex state management uses `useReducer`:

```typescript
const [state, dispatch] = useReducer(reducer, initialState);
const handlers = useMemo(
  () => ({
    /* action creators */
  }),
  []
);
```

### Memoization Pattern

Performance optimization with `useMemo` and `useCallback`:

```typescript
const memoizedValue = useMemo(() => expensiveCalculation(deps), [deps]);
const memoizedHandler = useCallback(() => action(), [deps]);
```

## Best Practices

1. **Single Responsibility**: Each hook manages one specific concern
2. **Type Safety**: All hooks are fully typed with TypeScript
3. **Performance**: Use memoization for expensive calculations
4. **Error Handling**: Include error states and validation
5. **Testing**: Hooks can be tested independently
6. **Documentation**: Clear parameter and return value documentation

## Testing Hooks

Hooks can be tested using React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook(initialProps));

act(() => {
  result.current.handler();
});

expect(result.current.state).toBe(expectedValue);
```

## Error Handling

Hooks include error handling for:

- Invalid parameters
- Network failures
- State validation errors
- Boundary conditions

## Performance Considerations

- Use `useMemo` for expensive calculations
- Use `useCallback` for function dependencies
- Avoid unnecessary re-renders
- Implement proper cleanup in `useEffect`
- Use `useDeferredValue` for performance-critical updates
