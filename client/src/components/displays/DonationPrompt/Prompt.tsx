import React, { useMemo } from 'react';
import { AMOUNT_PROMPT, CELEBRATE_COPY } from '@CONSTANTS';
import { InfoTooltip } from '@Components/modals';
import { dollarsAndCents } from '@Utils';
import { useProfile } from '@Contexts';
import { RepState } from '@Interfaces';
import { POLSTATES } from '@Tuples';
import './style.css';
/**
 * Description interface for politician data
 * Contains the essential information needed to display the donation prompt
 */
interface Description {
  last_name: string; // Politician's last name
  chamber: string; // Legislative chamber (House/Senate)
  state: string; // State abbreviation (e.g., "CA", "NY")
}

/**
 * Props for the DonationPrompt component
 */
type Props = {
  description: Description; // Politician data (polData)
  promptClass: string; // CSS class for styling
  amount: number; // Selected donation amount
};

/**
 * DonationPrompt Component
 *
 * Displays contextual text above the donation amount selection grid.
 * Switches between two states:
 * 1. **Prompt state**: Shows "Choose a donation amount" when no amount is selected
 * 2. **Confirmation state**: Shows formatted text with amount, politician name, and state
 *
 * The component uses safe null checking and memoization to prevent unnecessary re-renders
 * and handle cases where politician data might be loading or incomplete.
 *
 * @param amount - Selected donation amount (0 when no amount selected)
 * @param promptClass - CSS class for styling the prompt
 * @param description - Politician data containing name, chamber, and state
 * @returns JSX element displaying the appropriate prompt text
 */
const DonationPrompt = ({ amount, promptClass, description }: Props) => {
  /**
   * Determine if we should show the confirmation text vs the default prompt
   * Returns true when we have all required data: amount, state, chamber, and last name
   * This prevents showing incomplete information during data loading
   */
  const isShowingPromptNotUserChoices = useMemo(
      () =>
        amount &&
        description?.state &&
        description?.chamber &&
        description?.last_name,
      [amount, description]
    ),
    /**
     * Convert state abbreviation to full state name
     * Uses POLSTATES array to look up the full name from abbreviation
     * Returns undefined if state abbreviation is not found
     */
    repStateName = useMemo(
      () =>
        description?.state &&
        POLSTATES.filter((st: RepState) => st.abbrev === description.state)[0]
          ?.full,
      [description]
    ),
    /**
     * Generate the final display text
     * Shows either:
     * - Confirmation text: "$25 for Rep. SMITH of California" (when amount selected)
     * - Default prompt: "Choose a donation amount" (when no amount selected)
     */
    displayedCopy = useMemo(
      () =>
        isShowingPromptNotUserChoices
          ? `${dollarsAndCents(amount)} for ${
              description.chamber === 'House' ? 'Rep. ' : 'Sen. '
            }
    ${description.last_name.toUpperCase()} of ${repStateName}`
          : AMOUNT_PROMPT,
      [amount, description, repStateName, isShowingPromptNotUserChoices]
    );

  // Get user settings for tooltip visibility
  const { settings } = useProfile();

  // Format stockpiling tooltip message
  const stockpilingTooltipMessage = useMemo(
    () => CELEBRATE_COPY.DONATION_PROMPT.body,
    []
  );

  return (
    <>
      {/* Floating info icon - absolutely positioned, doesn't affect layout */}
      <span className={'donation-prompt' + promptClass}>
        {!amount && (
          <InfoTooltip
            infoPlacement={'top'}
            icon={'question-circle'}
            message={stockpilingTooltipMessage}
            toolTipId={'stockpiling-info-tooltip'}
            showToolTips={settings?.showToolTips ?? true}
          />
        )}
        &nbsp;&nbsp;{displayedCopy}
      </span>
    </>
  );
};

export default React.memo(DonationPrompt);
