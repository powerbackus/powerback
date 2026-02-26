import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
  type RefObject,
  type MutableRefObject,
  type StyleHTMLAttributes,
} from 'react';
import type { Bill, DisplayName, PolsOnParade } from '@Interfaces';
import type { DeviceProp, DonationStateProp } from '@Types';
import { type PolData, useDonationState } from '@Contexts';
import { Col, Row, type ColProps } from 'react-bootstrap';
import { getScrollBehavior, handleKeyDown } from '@Utils';
import { Headshot, Subheading, EscrowDisplay } from '.';
import { DISPLAY_NAME_LEN } from '@CONSTANTS';
import { useDisplayName } from '@Hooks';
import './style.css';

type PolSelectionProps = DonationStateProp &
  DeviceProp & {
    tallyDonations: (id: string) => void;
    polDonationsInEscrow: number;
    polsOnParade?: PolsOnParade;
    polDonationTally: number;
    description?: PolData;
    middleName?: string;
    district?: string;
    firstName: string;
    lastName: string;
    chamber: string;
    state?: string;
    index: number;
    info: PolData;
    name: string;
    bill?: Bill;
    id: string;
    [key: string]: unknown;
  };

// donee/Pol unit
const PolSelection = ({
  polDonationsInEscrow,
  polDonationTally,
  tallyDonations,
  polsOnParade,
  description,
  middleName,
  firstName,
  lastName,
  isMobile,
  index,
  info,
  name,
  id,
  ...props
}: PolSelectionProps) => {
  const [displayName, { setDisplayName }] = useDisplayName({
    middle: middleName ?? '',
    first: firstName,
    last: lastName,
  });

  useLayoutEffect(() => setDisplayName(DISPLAY_NAME_LEN), [setDisplayName]);

  useLayoutEffect(() => tallyDonations(id), [id, tallyDonations]);

  // ref handles activation of pol selection, scrolling and focus
  const selectedPolRef = useRef<MutableRefObject<null>>();
  // When focus comes from a pointer click, the first click often only moves focus; select on focus so one interaction selects
  const focusFromPointerRef = useRef(false);

  const isDifferentPol = useMemo(
    () =>
      (id && description && id !== (description as PolData).id) ||
      !id ||
      !description,
    [id, description]
  );
  const scrollInlineValue = useMemo(
    () => (isMobile ? 'start' : 'center'),
    [isMobile]
  );

  // triggered by Politician selection
  useLayoutEffect(() => {
    if (isDifferentPol) {
      return;
    } else {
      (
        (selectedPolRef as RefObject<MutableRefObject<null>>)
          .current as ColProps
      ).scrollIntoView({
        behavior: getScrollBehavior(),
        inline: scrollInlineValue,
        block: 'nearest',
      });
    }
  }, [isDifferentPol, scrollInlineValue]);

  const [selectionClassName, setSelectionClassName] = useState<string>(''); // img border effect
  // keyboard method of choosing pol feeds into Select handler

  const { selectPol, selectedPol } = useDonationState(),
    handleSelect = useCallback(() => {
      if (isDifferentPol) (selectPol as (pol: PolData) => void)({ ...info });

      // slap on a border to visually indicate selection
      (
        (
          (selectedPolRef as RefObject<MutableRefObject<null>>)
            .current as ColProps
        ).style as StyleHTMLAttributes<ColProps>
      ).className = 'pol-headshot-selected';
      const el = selectedPolRef.current as unknown as {
        style: { className: string };
        focus: () => void;
      } | null;
      if (el?.style?.className) setSelectionClassName(el.style.className);
      el?.focus();
    }, [isDifferentPol, selectPol, info]);

  const nail = useMemo(
    () => ({
      tabIndex: (polsOnParade as PolsOnParade).applied.length === 1 ? -1 : 0,
      styles:
        (polsOnParade as PolsOnParade).applied.length === 1
          ? { height: '357px !important' } // it's magic..
          : {},
    }),
    [polsOnParade]
  );

  const isExpanded = useMemo(() => selectedPol !== null, [selectedPol]),
    isSelected = useMemo(() => !isDifferentPol, [isDifferentPol]);

  const handleFocusFromPointer = useCallback(() => {
    if (focusFromPointerRef.current) {
      focusFromPointerRef.current = false;
      handleSelect();
    }
  }, [handleSelect]);

  const handleSkipToDonation = useCallback(() => {
    const donationSection = document.getElementById('donation-section');
    if (donationSection) {
      donationSection.scrollIntoView({
        behavior: getScrollBehavior(),
        block: 'start',
      });
      // Focus the first focusable element in the donation section
      const firstFocusable = donationSection.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, []);

  return (
    <Col
      ref={selectedPolRef}
      className={'pol-wrapper'}
    >
      <Row>
        <Col
          id={id}
          style={nail.styles}
          onClick={handleSelect}
          tabIndex={nail.tabIndex}
          aria-expanded={isExpanded}
          className={'pol-selection-col'}
          onFocus={handleFocusFromPointer}
          onPointerDown={() => {
            focusFromPointerRef.current = true;
          }}
          onKeyDown={(e) => handleKeyDown(e, handleSelect)}
        >
          <EscrowDisplay
            {...(displayName as DisplayName)}
            donations={polDonationsInEscrow}
            isMobile={isMobile as boolean}
            highlight={!isDifferentPol}
            tally={polDonationTally}
            index={index}
            id={id}
          />

          <Headshot
            {...props}
            id={description ? (description as PolData).id : ''}
            cls={selectionClassName}
            name={name}
            src={id}
          />

          <Subheading
            district={props.district ?? ''}
            highlight={!isDifferentPol}
            state={props.state ?? ''}
            {...props}
          />
        </Col>
      </Row>
      {isSelected && (
        <button
          aria-label={'Skip to donation section'}
          onClick={handleSkipToDonation}
          className={'skip-link'}
          type={'button'}
          tabIndex={0}
        >
          Skip to donation section
        </button>
      )}
    </Col>
  );
};

export default React.memo(PolSelection);
