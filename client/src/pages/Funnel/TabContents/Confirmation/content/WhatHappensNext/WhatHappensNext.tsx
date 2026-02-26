/**
 * WhatHappensNext – Support tab content about outcomes and mission.
 *
 * Displays information about POWERBACK.us's operational needs and mission.
 * Used in both desktop and mobile views (mobile uses carousel).
 *
 * @module Confirmation/content/WhatHappensNext
 * @returns Intro copy plus row of outcome tooltips (resolved (delivered) / paused / defunct (expired))
 */

import React, { useReducer } from 'react';
import { CONFIRMATION_COPY, type CelebrationOutcome } from '@CONSTANTS';
import { InfoTooltip } from '@Components/modals';
import { Col, Row } from 'react-bootstrap';
import type { Bill } from '@Interfaces';
import './style.css';

type OutcomeAlias = 'delivered' | 'paused' | 'expired';

interface OutcomesProps {
  label: OutcomeAlias;
  description: string;
  icon: string;
}

/** Non-active celebration outcomes (labels derived from shared celebration statuses). */
const Outcomes = CONFIRMATION_COPY.WHAT_HAPPENS_NOW
  .status as CelebrationOutcome[];

/** Renders one outcome (resolved (delivered) / paused / defunct (expired)) with tooltip. */
const Outcome = ({ icon, label, description }: OutcomesProps) => {
  const [showBorder, setShowBorder] = useReducer((state) => !state, false);
  return (
    <Col
      aria-label={label + ' outcome description'}
      className={`d-flex justify-content-center text-center outcome
         ${showBorder ? 'outcome-border' : ''}`}
    >
      <InfoTooltip
        children={<span className={`${icon}`}>{label}</span>}
        toolTipId={`what-happens-next-${label}-tooltip`}
        onMouseLeave={setShowBorder}
        onMouseEnter={setShowBorder}
        infoPlacement={'top'}
        message={description}
        showToolTips={true}
        icon={icon}
        as={Col}
      />
    </Col>
  );
};

const WhatHappensNext = ({
  isDemoMode = false,
  bill,
}: {
  isDemoMode: boolean;
  bill: Bill;
}) => (
  <div
    id={'what-happens-next'}
    className={'pt-lg-2 px-lg-1'}
  >
    <p className='mb-3'>
      {CONFIRMATION_COPY.WHAT_HAPPENS_NOW.trigger(isDemoMode, bill.short_title)}
    </p>
    <p>{CONFIRMATION_COPY.WHAT_HAPPENS_NOW.next}</p>{' '}
    <Row className='outcomes-row mt-lg-3 mt-1 mb-2 mb-lg-0 px-lg-5 mx-lg-5'>
      {Outcomes.map((outcome) => (
        <Outcome
          key={'confirmation-outcomes-' + outcome.label}
          {...(outcome as OutcomesProps)}
        />
      ))}
    </Row>
  </div>
);

export default React.memo(WhatHappensNext);
