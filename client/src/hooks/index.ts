/**
 * @fileoverview Custom Hooks Module - Main Export
 *
 * This module serves as the central export point for all custom hooks in the
 * POWERBACK application. It consolidates hooks from all categories (UI, data,
 * forms, compliance) into a single importable interface.
 *
 * HOOK CATEGORIES
 *
 * UI HOOKS
 * - useTour: Interactive tour management
 * - useSpinner: Loading spinner state
 * - useMontyHall: Exclusive state management
 * - useDisplayName: Name formatting with responsive calculations
 * - useButtonErrorSwapper: Button error state management
 *
 * DATA HOOKS
 * - useCelebrationEvents: Celebration event filtering and sorting
 * - useComboboxItems: Combobox search and filtering
 * - useContactInfo: Contact information form state
 * - useParade: Politician parade display and search
 *
 * FORM HOOKS
 * - useEntryForm: User entry form state (login/registration)
 * - useFieldList: Field list generation for forms
 * - useAccountTabs: Account modal tab management
 * - useAccountUpdate: Account update operations
 * - useFormCompliance: Form compliance tier calculation
 * - useFormValidation: Form field validation state
 * - useAccountModalLifecycle: Account modal lifecycle events
 *
 * COMPLIANCE HOOKS
 * - useComplianceCaps: FEC compliance cap calculations
 * - usePACLimitData: PAC tip limit calculations
 *
 * PAYMENT & AUTH HOOKS
 * - usePaymentProcessing: Payment processing flow
 * - useHashVerification: Hash-based link verification
 *
 * USAGE
 * ```typescript
 * import { usePaymentProcessing, useFormValidation } from '@Hooks';
 * ```
 *
 * @module hooks
 * @requires ./ui
 * @requires ./data
 * @requires ./forms
 * @requires ./compliance
 * @requires ./usePaymentProcessing
 * @requires ./useHashVerification
 */

export { default as useHashVerification } from './useHashVerification';
export { usePaymentProcessing } from './usePaymentProcessing';

export {
  useTour,
  useSpinner,
  useMontyHall,
  useDisplayName,
  useButtonErrorSwapper,
} from './ui';

export {
  useParade,
  useContactInfo,
  useComboboxItems,
  useCelebrationEvents,
} from './data';

export {
  useEntryForm,
  useFieldList,
  useAccountTabs,
  useAccountUpdate,
  useFormCompliance,
  useFormValidation,
  useAccountModalLifecycle,
} from './forms';

export {
  usePACLimitData,
  useComplianceCaps,
  type ComplianceCap,
} from './compliance';

// these hooks include types
export * from './ui/useBtnErrorSwapper';
export * from './forms/useEntryForm';
export * from './ui/useTour';
