import React, { useMemo, useCallback } from 'react';
import { useAuth, useProfile, useDialogue, useComplianceTier } from '@Contexts';
import { useComplianceCaps, useContactInfo, type ComplianceCap } from '@Hooks';
import { ContinueBtn } from '@Components/buttons';
import type { ComplianceTier } from '@Contexts';
import { FEC, ACCOUNT_COPY } from '@CONSTANTS';
import type { ContactInfo } from '@Interfaces';
import type { UserDataProp } from '@Types';
import accounting from 'accounting';
import Cap from './cap';
import API from '@API';
import { logError } from '@Utils';
import './style.css';

/**
 * Props interface for the Compliance component
 * @interface ComplianceProps
 * @property {ComplianceTier} formCompliance - Current form compliance level calculated by useFormCompliance hook
 * @property {ContactInfo} [contactInfo] - Current form data (optional)
 * @property {boolean} formIsInvalid - Whether the profile form has validation errors
 */
export type ComplianceProps = UserDataProp & {
  formCompliance: ComplianceTier;
  contactInfo?: ContactInfo;
  formIsInvalid: boolean;
};

/**
 * Compliance component that displays user's current FEC compliance tier and provides
 * promotion functionality to increase donation limits.
 *
 * This component shows a simple table with donation limits based on the user's compliance tier:
 * - Guest: $50 per donation, $200 annual cap
 * - Compliant: $3,500 per candidate per election (primary and general separate)
 *
 * The component uses FEC.COMPLIANCE_TIERS system to display accurate limit information
 * and provides a promotion button that allows users to upgrade their compliance tier,
 * which increases their donation limits according to FEC regulations.
 *
 * The component compares form compliance (what the user is about to achieve) with their
 * current compliance level and displays the higher of the two for limit calculations.
 *
 * @component
 * @param props - Component props
 * @param props.contactInfo - Current form data for promotion
 * @param props.formIsInvalid - Whether form has validation errors
 * @param props.formCompliance - Current compliance level from useFormCompliance hook
 *
 * @example
 * ```typescript
 * <Compliance
 *   contactInfo={contactInfo}
 *   formIsInvalid={formIsInvalid}
 *   formCompliance={formCompliance}
 * />
 * ```
 *
 * @returns Component displaying compliance status and promotion options
 */
const Compliance = ({
  contactInfo,
  formIsInvalid,
  formCompliance,
}: ComplianceProps) => {
  const { userCompliance, setFormCompliance } = useComplianceTier(),
    { setShowAlert } = useDialogue(),
    { userData, setUserData } = useAuth(),
    { serverConstants } = useProfile(),
    [, { loadContactInfo }] = useContactInfo(userData);

  // Sync form compliance with context
  React.useEffect(() => {
    setFormCompliance(formCompliance);
  }, [formCompliance, setFormCompliance]);

  // Fallback to 'guest' if tier doesn't exist (handles old tier names from database)
  const safeUserCompliance = useMemo(
    () =>
      userCompliance === 'guest' || userCompliance === 'compliant'
        ? userCompliance
        : 'guest',
    [userCompliance]
  );

  // Get compliance caps using the new hook
  const complianceCaps = useComplianceCaps(
    serverConstants,
    formCompliance,
    safeUserCompliance,
    contactInfo
  );

  /**
   * Contextual message displayed to users based on their current tier
   *
   * This message explains next steps and benefits
   * based on the user's effective compliance level.
   * It provides guidance on how to increase their donation limits and mentions FEC compliance.
   * Uses the structured FEC.COMPLIANCE_TIERS system for limit information.
   */
  const contextualMessage: JSX.Element = useMemo(
    () => (
      // Guest tier - explain current limits and upgrade benefits
      <span className='meets-compliance'>
        The <abbr title='Federal Election Commission'>FEC</abbr> limits
        anonymous donations to $50.{' '}
        <>
          Complete your profile to unlock{' '}
          <span className='dollar-limit'>
            {accounting.formatMoney(
              FEC.COMPLIANCE_TIERS.compliant.perElectionLimit?.() || 0,
              '$',
              0
            )}
          </span>{' '}
          per candidate per election.
        </>
      </span>
    ),
    []
  );

  /**
   * Handles the promotion of user's compliance level
   *
   * This function calls the API to update the user's compliance status and updates
   * the local state to reflect the change. It also shows a success alert to the user.
   *
   * The promotion process:
   * 1. Calls the backend API to update the user's compliance level using form data
   * 2. Updates the local user data with the complete updated user data from the backend response
   * 3. Refreshes the contact info form state to sync with the updated user data
   * 4. Shows a success alert to confirm the promotion
   * 5. Handles any errors that occur during the process
   *
   * The promotion uses the contactInfo from the form to determine the appropriate
   * compliance tier based on form completion (guest or compliant).
   *
   * @function
   * @returns void
   *
   * @example
   * ```typescript
   * // Called when user clicks "INCREASE YOUR LIMIT" button
   * handlePromoteAccount();
   * ```
   */
  const handlePromoteAccount = useCallback(() => {
    if (!userData) return;
    else {
      API.promoteDonor(userData.id, contactInfo)
        .then(({ data }) => {
          // Update local user data with the complete updated user data from backend
          if (data.promotion.updated) {
            setUserData((u) => ({
              ...u,
              ...data.updated, // Update with complete user data from server
              compliance: data.promotion.compliance as ComplianceTier,
            }));

            // Refresh contact info form state to sync with updated user data
            if (loadContactInfo) {
              loadContactInfo();
            }
          }
          setShowAlert((s) => ({ ...s, update: true }));
        })
        .catch((error) => {
          logError('API.promoteDonor error', error);
        });
    }
    // contactInfo omitted so callback identity is stable; avoid recreate on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCompliance, setShowAlert, setUserData, userData, loadContactInfo]);

  /**
   * Determines if the user is eligible for a limit increase promotion
   *
   * This checks multiple conditions to determine if the promotion button should be shown:
   * - Form compliance must be compliant tier
   * - User must not already be at compliant tier
   * - Form must be valid (no validation errors)
   * - Employment information must be complete if user is employed
   *
   * @returns {boolean} True if user can promote to increase their limits
   */
  const isUserCompliantForLimitIncrease = useMemo(() => {
    // Check if employment information is complete
    // If user is employed, both occupation and employer must be provided
    const isEmploymentComplete = !contactInfo
      ? false
      : !contactInfo.isEmployed ||
        (contactInfo.occupation !== '' && contactInfo.employer !== '');

    const result =
      formCompliance === 'compliant' &&
      safeUserCompliance !== 'compliant' &&
      !formIsInvalid &&
      isEmploymentComplete;

    return result;
  }, [contactInfo, formIsInvalid, formCompliance, safeUserCompliance]);

  /** Determine if user is at compliant tier for display logic (using actual user compliance tier) */
  const isCompliant: boolean = safeUserCompliance === 'compliant';

  const compliantCTA = useCallback(() => {
    // Promoting to compliant: show compliant limit with per-election text
    const compliantTierInfo = FEC.COMPLIANCE_TIERS.compliant;
    const limit = compliantTierInfo.perElectionLimit?.() || 0;
    const suffix = ACCOUNT_COPY.APP.COMPLIANCE_CTA[1];
    const limitCopy =
      ACCOUNT_COPY.APP.COMPLIANCE_CTA[0] || 'Complete your profile to unlock';

    return (
      <>
        {limitCopy}
        <span className={'dollar-limit'}>
          {accounting.formatMoney(limit, '$', 0)}
        </span>
        {suffix}
      </>
    );
  }, []);

  return (
    userData && (
      <div className={'profile-form-ask px-lg-4 mt-lg-1 mb-lg-5'}>
        {/* Display compliance table - hidden when compliant CTA+button is visible */}
        {isCompliant || !isUserCompliantForLimitIncrease ? (
          <dl className={'compliance-table d-flex flex-row'}>
            {complianceCaps.map((cap: ComplianceCap, index: number) => (
              <React.Fragment key={`cap-${index}-${userData.id}`}>
                <Cap
                  showPromotion={isUserCompliantForLimitIncrease as boolean}
                  isPromotable={cap.isPromotable}
                  currentValue={cap.currentValue}
                  nextValue={cap.nextValue}
                  isCompliant={isCompliant}
                  label={cap.label}
                />
                {/* visual separator */}
                {index < complianceCaps.length - 1 && (
                  <span>|&nbsp;&nbsp;&nbsp;</span>
                )}
              </React.Fragment>
            ))}
          </dl>
        ) : null}

        {/* Show promotion button if:
            - Form compliance is compliant tier
            - User hasn't already achieved compliant tier
            - Form is valid
            - User is eligible for promotion (ratchet: button disappears after promotion) */}
        {(!isCompliant &&
          (isUserCompliantForLimitIncrease ? (
            <>
              {/* CTA explainer text for Compliant tier promotion */}
              {formCompliance === 'compliant' &&
              safeUserCompliance !== 'compliant' ? (
                <p className='cta-explainer form-text'>{compliantCTA()}</p>
              ) : null}
              <ContinueBtn
                classProp={'submit-btn compliance mt-lg-3'}
                handleClick={handlePromoteAccount}
                label={ACCOUNT_COPY.COMPLIANCE.increaseButton}
                type={'button'}
                size={'sm'}
              />
            </>
          ) : (
            <>
              {' '}
              {/* Display contextual message about next steps and FEC compliance */}
              <p>{contextualMessage}</p>
            </>
          ))) || <p className='reminder'>{ACCOUNT_COPY.COMPLIANCE.reminder}</p>}
      </div>
    )
  );
};

export default React.memo(Compliance);
