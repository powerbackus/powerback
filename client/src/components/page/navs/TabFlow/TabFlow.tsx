import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigation, useDonationLimits, useDonationState } from '@Contexts';
import { dollarsAndCents } from '@Utils';
import './style.css';

interface Tabflow {
  donation: number;
  onSelect?: (eventKey: string | null) => void;
}

const TabFlow = ({ donation, onSelect }: Tabflow) => {
  const { shouldSkipTipAsk } = useDonationLimits(),
    { getFunnelSteps } = useNavigation(),
    { paymentMethodId } = useDonationState(),
    funnelSteps = getFunnelSteps();

  return (
    <Nav
      variant={'pills'}
      className={'flex-row tab-flow'}
      onSelect={onSelect}
    >
      <Nav.Item>
        <Nav.Link
          as='button'
          type='button'
          eventKey='pol-donation'
        >
          {'1. Celebration (' + (donation && dollarsAndCents(donation)) + ')'}
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          as='button'
          type='button'
          eventKey='payment'
        >
          2. Checkout
        </Nav.Link>
      </Nav.Item>
      {funnelSteps.includes('tips') && !shouldSkipTipAsk && (
        <Nav.Item>
          <Nav.Link
            as='button'
            type='button'
            disabled={!paymentMethodId}
            eventKey='tips'
          >
            3. Confirm
          </Nav.Link>
        </Nav.Item>
      )}
    </Nav>
  );
};

export default React.memo(TabFlow);
