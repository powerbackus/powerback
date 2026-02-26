/**
 * @fileoverview Form Compliance Tier Calculation Hook
 *
 * This hook calculates the potential compliance tier a user could achieve
 * based on their current form completion status, independent of their actual
 * stored compliance tier. It's used to show users what tier they would reach
 * if they complete their profile, providing motivation to complete additional
 * information for higher donation limits.
 *
 * KEY FEATURES
 *
 * COMPLIANCE TIER CALCULATION
 * - Guest: Basic account (no additional info required)
 * - Compliant: Name, address, valid zip code, citizenship/passport, and employment information
 *
 * FORM COMPLETION LOGIC
 * - Checks form field completeness
 * - Validates zip code format (5+ digits)
 * - Validates employment information (if employed)
 *
 * PERFORMANCE OPTIMIZATIONS
 * - Memoized calculations prevent unnecessary re-computations
 * - Uses entire contactInfo object for dependency tracking
 * - Avoids re-renders when unrelated userData properties change
 *
 * BUSINESS LOGIC
 *
 * COMPLIANT REQUIREMENTS
 * - Full name (first + last)
 * - Valid zip code (5+ digits)
 * - City, state, and address provided
 * - Either US citizen (country === 'United States') or passport provided
 * - Employment information complete:
 *   - If not employed: no additional info needed
 *   - If employed: both occupation and employer must be provided
 *
 * DEPENDENCIES
 * - react: useMemo
 * - @Contexts: ComplianceTier type
 * - @Interfaces: ContactInfo interface
 *
 * @module hooks/forms/useFormCompliance
 * @requires react
 * @requires @Contexts
 * @requires @Interfaces
 */

import { useMemo } from 'react';
import type { ComplianceTier } from '@Contexts';
import type { ContactInfo } from '@Interfaces';

/**
 * Handler functions for compliance operations
 */
interface Handlers {
  /**
   * No-op function kept for API compatibility
   * Compliance is automatically recalculated when contactInfo changes
   */
  setFormCompliance: () => void;
}

/**
 * Custom hook that calculates potential compliance tier based on form completion
 * according to FEC regulations.
 *
 * This hook determines what compliance level a user COULD achieve based on their
 * current form data, independent of their actual stored compliance tier.
 * It's used to show users what tier they would reach if they complete their profile.
 *
 * FEC compliance tier definitions and limits are documented in docs/DONATION_LIMITS.md
 *
 * Compliance levels are determined by form completion only:
 * - Guest: Basic account (no additional info required)
 * - Compliant: Name, address, zip code, and employment information provided
 *
 * This hook is separate from ComplianceTierContext which manages the user's
 * actual compliance tier. This hook only calculates potential compliance
 * based on current form state.
 *
 * Performance optimizations:
 * - Uses memoized calculations to prevent unnecessary re-computations
 * - Uses entire contactInfo object for dependency tracking (React shallow comparison)
 * - Avoids unnecessary re-renders when unrelated userData properties change
 *
 * @param contactInfo - User's contact information from the profile form
 * @param formIsInvalid - Whether any form fields have validation errors
 * @returns [ComplianceTier, Handlers] - Potential compliance level and handler functions
 *
 * @example
 * ```typescript
 * const [formCompliance, { setFormCompliance }] = useFormCompliance(
 *   contactInfo,
 *   formIsInvalid
 * );
 *
 * // formCompliance shows what tier user would achieve with current form data
 * console.log(formCompliance); // 'compliant' if all info is complete, 'guest' otherwise
 * ```
 */
export default function useFormCompliance(
  contactInfo: ContactInfo,
  formIsInvalid: boolean
): [ComplianceTier, Handlers] {
  /**
   * Checks if user has provided both first and last name
   * Required for all compliance levels
   */
  const userGaveFullName = useMemo(
    () => contactInfo.lastName !== '' && contactInfo.firstName !== '',
    [contactInfo.lastName, contactInfo.firstName]
  );

  /**
   * Checks if employment information is complete:
   * - If not employed: no additional info needed
   * - If employed: both occupation and employer must be provided
   */
  const userGaveEmploymentInfo = useMemo(
    () =>
      !contactInfo.isEmployed ||
      (contactInfo.occupation !== '' && contactInfo.employer !== ''),
    [contactInfo.isEmployed, contactInfo.occupation, contactInfo.employer]
  );

  /**
   * Checks if user meets compliant tier requirements:
   * - Full name (first + last)
   * - Valid zip code (5+ digits)
   * - City, state, and address provided
   * - Either US citizen (country === 'United States') or passport provided
   * - Employment information complete
   */
  const isCompliant = useMemo(
    () =>
      contactInfo.zip.length >= 5 &&
      contactInfo.city !== '' &&
      contactInfo.state !== '' &&
      contactInfo.address !== '' &&
      (contactInfo.country === 'United States' ||
        contactInfo.passport !== '') &&
      userGaveFullName &&
      userGaveEmploymentInfo,
    [
      contactInfo.zip,
      contactInfo.city,
      contactInfo.state,
      contactInfo.address,
      contactInfo.country,
      contactInfo.passport,
      userGaveFullName,
      userGaveEmploymentInfo,
    ]
  );

  /**
   * Derived compliance tier from current form state
   * Updates immediately when form data meets compliance requirements
   */
  const derivedTier = useMemo<ComplianceTier>(() => {
    // Guard: if contactInfo is empty-like or form is invalid
    if (
      !contactInfo ||
      formIsInvalid ||
      Object.values(contactInfo).every(
        (val) => val === '' || val === false
      )
    ) {
      return 'guest';
    }

    if (isCompliant) return 'compliant';
    return 'guest';
  }, [contactInfo, formIsInvalid, isCompliant]);

  /**
   * Handler functions for compliance operations
   * Note: setFormCompliance is a no-op since compliance is automatically
   * recalculated when contactInfo changes via useMemo dependencies
   */
  const handlers = useMemo<Handlers>(
    () => ({
      // No-op function kept for API compatibility
      // Compliance is automatically recalculated when contactInfo changes
      setFormCompliance: () => {},
    }),
    []
  );

  return [derivedTier, handlers];
}
