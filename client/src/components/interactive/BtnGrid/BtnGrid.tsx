import React, { useMemo, useState, useCallback, useLayoutEffect } from 'react';
import { type PolData, useDonationState, useDonationLimits } from '@Contexts';
import { DonationPrompt } from '@Components/displays';
import { DonationInput } from '@Components/forms';
import { DonationBtn } from '@Components/buttons';
import {
  type DeviceProp,
  type UserDataProp,
  type DonationStateProp,
} from '@Types';
import './style.css';

type BtnGridProps = DonationStateProp &
  UserDataProp &
  DeviceProp & {
    setAmount: (amount: number) => void;
    remainingDonationLimit?: number;
    onOpenLimitModal?: () => void;
    value: number | number[];
    MESSAGE?: Array<string>;
    size: 'sm' | 'lg';
    amount: number;
    isTip: boolean;
  };

/**
 * BtnGrid component for donation/tip amount selection
 */
const BtnGrid = ({
  setAmount,
  donation,
  amount,
  isTip,
  value,
  size,
  ...props
}: BtnGridProps) => {
  const [promptClass, setPromptClass] = useState<string | undefined>(),
    makePromptClass = useMemo(() => (amount ? ' confirm' : ''), [amount]);

  const { polData } = useDonationState();

  /**
   * Wrapper function that sets the amount
   * PAC limit validation happens on submit, not on button click
   */
  const handleSetAmount = useCallback(
    (newAmount: number) => {
      setAmount(newAmount);
    },
    [setAmount]
  );

  const shouldShowDonationPrompt = useMemo(
    () => !isTip && !!polData?.id,
    [isTip, polData]
  );

  const handleUseClass = useMemo(
      () => (isTip ? ' tips-btn-grid' : ''),
      [isTip]
    ),
    handleUse = useCallback(
      () =>
        shouldShowDonationPrompt ? (
          <DonationPrompt
            promptClass={promptClass as string}
            description={polData as PolData}
            amount={amount}
            {...props}
          />
        ) : null,
      [props, shouldShowDonationPrompt, amount, polData, promptClass]
    );

  useLayoutEffect(() => setPromptClass(makePromptClass), [makePromptClass]);

  const { pacLimitData } = useDonationLimits();

  return (
    <div className='btn-container'>
      {handleUse()}

      <div className={`btn-grid${handleUseClass}`}>
        {Array.isArray(value)
          ? value.map((amt, i) => {
              return (
                <DonationBtn
                  {...props}
                  size={size}
                  value={amt}
                  isTip={isTip}
                  amount={amount}
                  setAmount={handleSetAmount}
                  donation={donation as number}
                  key={('#' + i + '-$' + amt).toString()}
                />
              );
            })
          : null}

        <DonationInput
          {...props}
          remainingPACLimit={isTip ? pacLimitData.remainingPACLimit : undefined}
          remainingDonationLimit={props.remainingDonationLimit}
          setAmount={handleSetAmount}
          formValue={amount || ''}
          amount={amount}
          isTip={isTip}
        />
      </div>
    </div>
  );
};

export default React.memo(BtnGrid);
