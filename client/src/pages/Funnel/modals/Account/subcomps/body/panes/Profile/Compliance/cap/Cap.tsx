import React, { useMemo, useCallback } from 'react';
import accounting from 'accounting';

/**
 * Bootstrap ArrowUpRight icon component
 * Used to indicate promotion/upgrade opportunities
 */
const ArrowUpRight: React.FC<{ className: string }> = ({ className }) => (
  <i className={`bi bi-arrow-up-right ${className}`} />
);

/**
 * Cap component props
 * @interface CapProps
 * @property {string} label - Human-readable label for the limit (e.g., "Annual Cap")
 * @property {number} currentValue - Current tier's value for this limit
 * @property {number} nextValue - Next tier's value for this limit (if promotion available)
 * @property {boolean} [showPromotion=false] - Whether to show promotion indicators
 * @property {boolean} [isPromotable=false] - Whether this value will increase with promotion
 */
type CapProps = {
  label: string;
  nextValue: number;
  currentValue: number;
  showPromotion?: boolean;
  isPromotable?: boolean;
  isCompliant?: boolean;
};

/**
 * Cap component
 *
 * Displays FEC compliance limits with proper formatting and promotion indicators.
 * Handles tier-based styling where Compliant tier shows success colors and guest tier
 * shows warning colors. Supports promotion indicators for users who can upgrade.
 *
 * Key features:
 * - Currency formatting with accounting library
 * - Tier-based color coding (success for Compliant, warning for Guest)
 * - Promotion indicators with arrow and tooltip
 * - Conditional rendering based on valid values
 * - FEC compliance limit display
 *
 * @param label - Human-readable label for the limit
 * @param nextValue - Next tier's value for this limit (if promotion available)
 * @param currentValue - Current tier's value for this limit
 * @param isPromotable - Whether this value will increase with promotion
 * @param showPromotion - Whether to show promotion indicators
 * @returns JSX element displaying the compliance limit or null if no valid values
 */
const Cap = ({
  label,
  nextValue,
  currentValue,
  isPromotable = false,
  showPromotion = false,
  isCompliant = false,
}: CapProps) => {
  // Determine if there's a difference between current and next values
  // Used to decide whether to show promotion indicators
  const hasValueChange = useMemo(
    () => nextValue !== currentValue,
    [nextValue, currentValue]
  );

  // Determine if we should show the promotion indicator
  // Only shows if promotion is enabled, values differ, and user can promote
  const shouldShowPromotion = useMemo(
    () => showPromotion && hasValueChange && isPromotable,
    [showPromotion, hasValueChange, isPromotable]
  );

  /**
   * Get appropriate CSS class for current value styling
   * Compliant tier (same current/next values) gets success color
   * Guest tier gets warning color to encourage upgrades
   */
  const getDollarLimitClassName = useCallback(() => {
    // If current and next values are the same (Compliant tier case), use success color
    if (isCompliant
    ) {
      return 'dollar-limit'; // Success color for Compliant tier
    }
    return 'warning-limit'; // Current values show warning color for Guest
  }, [isCompliant]);

  // Don't render if we don't have valid values
  // Prevents empty or zero-value displays
  if (currentValue === 0 && nextValue === 0) return null;

  return (
    <>
      {/* Definition term - the label */}
      <dt>{`${label}:`}</dt>

      {/* Definition description - the formatted value */}
      <dd>
        {/* Current value display with tier-appropriate styling */}
        <span className={getDollarLimitClassName()}>
          &nbsp;&nbsp;
          {accounting.formatMoney(currentValue, '$', 0)}
        </span>

        {/* Promotion indicator with arrow and next tier value */}
        {shouldShowPromotion && (
          <>
            {' '}
            <ArrowUpRight className='dollar-limit' />{' '}
            <span
              className='promotion-indicator dollar-limit'
              title={`Will increase to ${accounting.formatMoney(
                nextValue,
                '$',
                0
              )}`}>
              {accounting.formatMoney(nextValue, '$', 0)}
            </span>
          </>
        )}
      </dd>
    </>
  );
};

export default React.memo(Cap);
