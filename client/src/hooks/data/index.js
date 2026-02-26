/**
 * @fileoverview Data Management Hooks Module
 *
 * This module provides custom hooks for data state management, filtering,
 * and search operations. These hooks handle complex state management for
 * celebrations, politicians, and contact information using reducer patterns.
 *
 * KEY HOOKS
 *
 * useCelebrationEvents(userCelebrations)
 * - Celebration event filtering, sorting, and display
 * - Supports sorting by date or amount
 * - Supports filtering by politician name or state
 * - Direction control (ascending/descending)
 *
 * useComboboxItems(itemToString, init, category)
 * - Combobox search and filtering
 * - Accent-insensitive search
 * - State filtering with representative filtering
 * - Name-based filtering with sorting
 *
 * useContactInfo(user)
 * - Contact information form state management
 * - Phone number normalization
 * - International address support
 * - Compliance data exclusion
 *
 * useParade()
 * - Politician parade display and search
 * - Name, state, and district filtering
 * - Initial shuffle for variety
 * - District sorting with numeric collation
 *
 * BUSINESS LOGIC
 *
 * REDUCER PATTERN
 * - All hooks use useReducer for complex state
 * - Consistent [state, handlers] tuple return pattern
 * - Action-based state updates
 * - Memoized handlers for performance
 *
 * FILTERING & SORTING
 * - Real-time filtering as user types
 * - Multiple sort options (date, amount)
 * - Case-insensitive and accent-insensitive search
 * - Whitespace handling
 *
 * DEPENDENCIES
 * - ./useCelebrationEvents: Celebration event management
 * - ./useComboboxItems: Combobox filtering
 * - ./useContactInfo: Contact info state
 * - ./useParade: Politician parade
 *
 * @module hooks/data
 * @requires ./useCelebrationEvents
 * @requires ./useComboboxItems
 * @requires ./useContactInfo
 * @requires ./useParade
 */
export { default as useCelebrationEvents } from './useCelebrationEvents';
export { default as useComboboxItems } from './useComboboxItems';
export { default as useContactInfo } from './useContactInfo';
export { default as useParade } from './useParade';
