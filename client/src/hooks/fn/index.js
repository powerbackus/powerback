/**
 * @fileoverview Form Utility Functions Module
 *
 * This module provides utility functions for form data processing and
 * normalization. These functions are used by form hooks and components
 * to handle data formatting and sanitization.
 *
 * KEY FUNCTIONS
 *
 * normalize(value, previousValue)
 * - Phone number formatting utility
 * - Formats as (XXX) XXX-XXXX
 * - Real-time formatting as user types
 *
 * prune(user)
 * - User data sanitization utility
 * - Removes sensitive and internal properties
 * - Returns safe contact info object
 *
 * DEPENDENCIES
 * - ./normalize: Phone number normalization
 * - ./prune: User data pruning
 *
 * @module hooks/fn
 * @requires ./normalize
 * @requires ./prune
 */

export { default as normalize } from './normalize';
export { default as prune } from './prune';
