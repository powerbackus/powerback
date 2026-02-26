/**
 * @fileoverview UI Hooks Module
 *
 * This module provides custom hooks for UI state management and user interface
 * interactions. These hooks handle display logic, animations, tours, and other
 * UI-related state management.
 *
 * KEY HOOKS
 *
 * useTour(isDesktop)
 * - Interactive tour management with react-joyride
 * - Responsive step configuration
 * - Tour persistence via localStorage
 *
 * useSpinner()
 * - Loading spinner state management
 * - Simple on/off toggle
 *
 * useMontyHall(doors)
 * - Exclusive state management (only one option active)
 * - Used for mutually exclusive UI states
 *
 * useDisplayName({ first, middle, last })
 * - Progressive name formatting based on available space
 * - Responsive font size and position calculations
 *
 * useButtonErrorSwapper()
 * - Button error state management
 * - Auto-reversion after timeout
 * - HTTP status code to error message mapping
 *
 * DEPENDENCIES
 * - ./useBtnErrorSwapper: Button error state
 * - ./useDisplayName: Name formatting
 * - ./useMontyHall: Exclusive state
 * - ./useSpinner: Spinner state
 * - ./useTour: Tour management
 *
 * @module hooks/ui
 * @requires ./useBtnErrorSwapper
 * @requires ./useDisplayName
 * @requires ./useMontyHall
 * @requires ./useSpinner
 * @requires ./useTour
 */

export { default as useButtonErrorSwapper } from './useBtnErrorSwapper';
export { default as useDisplayName } from './useDisplayName';
export { default as useMontyHall } from './useMontyHall';
export { default as useSpinner } from './useSpinner';
export { default as useTour } from './useTour';
