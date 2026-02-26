import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { DonationStateProp } from '@Types';
import { Button } from 'react-bootstrap';
import './style.css';

type DonationBtnProps = DonationStateProp & {
  setAmount: (amount: number) => void;
  size: 'sm' | 'lg';
  donation: number;
  amount: number;
  value: number;
  isTip: boolean;
};

const DonationBtn = ({
  isTip,
  value,
  amount,
  donation,
  setAmount,
  size = 'lg',
}: DonationBtnProps) => {
  /**
   * Lazy initializer: only this button starts "clicked" when it matches the
   * current selection (donation amount or tip amount), so active state survives
   * refresh. Donation: amount === value; Tip: amount === value * donation.
   */
  const [buttonClicked, setButtonClicked] = useState(() => {
    if (donation <= 0) return false;
    if (isTip) {
      const calculatedTipAmount = Number((value * donation).toFixed(2));
      return amount === calculatedTipAmount;
    }
    return amount === value;
  });

  // Calculate if this button should be active
  // Active when: button was clicked AND current amount matches this button's value
  const isActive = useMemo(() => {
    if (!buttonClicked) return false;

    if (isTip) {
      // For tips: check if the calculated tip amount matches
      const calculatedTipAmount = Number((value * donation).toFixed(2));
      return calculatedTipAmount === amount;
    } else {
      // For donations: check if the button value matches the current amount
      return value === amount && amount !== 0;
    }
  }, [buttonClicked, isTip, value, amount, donation]);

  // Sync button clicked state with amount: active when amount matches this button (typed or clicked)
  useEffect(() => {
    if (isTip) {
      const calculatedTipAmount = Number((value * donation).toFixed(2));
      setButtonClicked(amount === calculatedTipAmount);
    } else {
      setButtonClicked(amount === value);
    }
  }, [amount, value, donation, isTip]);

  const handleHideCheckmarks = useMemo(
      () => !(isActive && !isTip),
      [isTip, isActive]
    ),
    handleValue = useMemo(
      () => (isTip && Number((value * donation).toFixed(2))) || value,
      [value, isTip, donation]
    ),
    handleDisplayValue = useMemo(
      () =>
        (value && ((isTip && `${value * 100}% tip`) || `$${value}`)) ||
        'Zero tip',
      [value, isTip]
    ),
    handleClick = useCallback(() => {
      // Mark this button as clicked
      setButtonClicked(true);
      // Set the amount
      setAmount(handleValue);
    }, [setAmount, handleValue]);

  return (
    <Button
      size={size}
      active={isActive}
      onClick={handleClick}
      variant={'secondary'}
      className={'donation-amt-btn'}
    >
      <i
        className={'bi bi-check donation-check'}
        // tip grid doesn't show the checkmark
        hidden={handleHideCheckmarks}
      />
      {/* donation and tip btns display values differently */}
      {handleDisplayValue}
    </Button>
  );
};

export default React.memo(DonationBtn);
