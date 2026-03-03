import React, { type ChangeEvent, useCallback, useMemo } from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';
import { useDevice, useDialogue } from '@Contexts';
import { CELEBRATE_COPY } from '@CONSTANTS';
import './style.css';

const INPUT_LIMIT = 9999,
  SIGFIGS = 8;

type DonationInputProps = {
  setAmount: (amount: number) => void;
  // Lobby only
  onOpenLimitModal?: () => void;
  remainingDonationLimit?: number;
  // TipAsk only
  remainingPACLimit?: number;
  formValue: number | '';
  amount: number | '';
  isTip: boolean;
};

const DonationInput = ({
  remainingDonationLimit,
  remainingPACLimit,
  onOpenLimitModal,
  formValue,
  setAmount,
  amount,
  isTip,
}: DonationInputProps) => {
  const { setShowModal } = useDialogue();
  const { isMobile } = useDevice();

  const calcValue = useCallback((e: ChangeEvent) => {
    let v = Number((e.target as HTMLInputElement).value);
    if (v < 0) v = 0;
    if (v < 1 && v > 0) v = 1;
    if (new RegExp('^\\d+\\.\\d{3,}$').test(String(v)))
      v = Number(
        (e.target as HTMLInputElement).value.substring(
          0,
          (e.target as HTMLInputElement).value.indexOf('.') + 3
        )
      );
    // max 6-figures w/o decimals
    if (String(v).length > SIGFIGS || v > INPUT_LIMIT)
      v = Number(String(v).slice(0, String(v).length - 1));
    (e.target as HTMLInputElement).value = String(v);
    return v;
  }, []);

  // Memoize limit selection and check for performance
  const currentLimit = useMemo(
    () => (isTip ? remainingPACLimit : remainingDonationLimit),
    [isTip, remainingPACLimit, remainingDonationLimit]
  );

  const handleChange = useCallback(
    (e: ChangeEvent) => {
      let v = calcValue(e);

      // Check limits using memoized value
      if (currentLimit !== undefined && v > currentLimit) {
        // Prefer opener callback so modal gets data (presentational); else open modal only
        if (!isTip && onOpenLimitModal) {
          onOpenLimitModal();
        } else {
          setShowModal((s) => ({ ...s, limit: true }));
        }
        return;
      }

      setAmount(v);
    },
    [calcValue, setAmount, setShowModal, currentLimit, isTip, onOpenLimitModal]
  );

  const makePlaceholder = useMemo(() => {
    if (isTip) return '0';
    if (amount) return String(amount);
    return isMobile
      ? CELEBRATE_COPY.DONATION_INPUT.placeholderMobile
      : CELEBRATE_COPY.DONATION_INPUT.placeholder;
  }, [isTip, amount, isMobile]);

  return (
    <InputGroup
      id={'donation-input'}
      className={'donation-input'}
    >
      <InputGroup.Text>
        <span className={'fs-5'}>$</span>
      </InputGroup.Text>
      <FormControl
        aria-label={'Input for donation or tip amount in dollars'}
        className={'donation-input-field fs-6 fs-4'}
        aria-describedby={'donation-input'}
        placeholder={makePlaceholder}
        name={'donation-input'}
        onChange={handleChange}
        onKeyDown={() => true}
        value={formValue}
        type={'number'}
      />
    </InputGroup>
  );
};

export default React.memo(DonationInput);
