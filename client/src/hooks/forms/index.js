/**
 * @fileoverview Form Management Hooks Module
 *
 * This module provides custom hooks for form state management, validation,
 * and account operations. These hooks handle the complete form lifecycle
 * from initialization to submission and update operations.
 *
 * KEY HOOKS
 *
 * FORM STATE MANAGEMENT
 * - useEntryForm: User entry form state (login/registration/password change)
 * - useContactInfo: Contact information form state
 * - useFormValidation: Form field validation state tracking
 *
 * ACCOUNT OPERATIONS
 * - useAccountUpdate: Account update operations with OCD ID lookup
 * - useAccountTabs: Account modal tab management
 * - useAccountModalLifecycle: Account modal lifecycle events
 *
 * COMPLIANCE & FIELD MANAGEMENT
 * - useFormCompliance: Form compliance tier calculation
 * - useFieldList: Field list generation based on active tab and device
 *
 * BUSINESS LOGIC
 *
 * FORM LIFECYCLE
 * - Initialization: Load data from user object
 * - Validation: Track field-level validation state
 * - Update: Detect changes and save to server
 * - Cleanup: Reset state on modal close
 *
 * ACCOUNT UPDATE FLOW
 * - Detects changes between current and form data
 * - Validates employment information completeness
 * - Fetches OCD ID for address changes
 * - Saves updates to server
 *
 * DEPENDENCIES
 * - ./useEntryForm: Entry form state
 * - ./useFieldList: Field list generation
 * - ./useAccountTabs: Tab management
 * - ./useAccountUpdate: Account updates
 * - ./useFormCompliance: Compliance calculation
 * - ./useFormValidation: Validation state
 * - ./useAccountModalLifecycle: Modal lifecycle
 *
 * @module hooks/forms
 * @requires ./useEntryForm
 * @requires ./useFieldList
 * @requires ./useAccountTabs
 * @requires ./useAccountUpdate
 * @requires ./useFormCompliance
 * @requires ./useFormValidation
 * @requires ./useAccountModalLifecycle
 */

export { default as useEntryForm } from './useEntryForm';
export { default as useFieldList } from './useFieldList';
export { default as useAccountTabs } from './useAccountTabs';
export { default as useAccountUpdate } from './useAccountUpdate';
export { default as useFormCompliance } from './useFormCompliance';
export { default as useFormValidation } from './useFormValidation';
export { default as useAccountModalLifecycle } from './useAccountModalLifecycle';
