import React from 'react';
import { InfoTooltip } from '@Components/modals';
import { PolName } from '@Components/displays';
import { Badge, Stack } from 'react-bootstrap';
import { CELEBRATE_COPY } from '@CONSTANTS';
import accounting from 'accounting';
import './style.css';

type EscrowDisplayProps = {
  highlight: boolean;
  donations: number;
  isMobile: boolean;
  index: number;
  value: string;
  tally: number;
  id: string;
  x: string;
  y: string;
};

const tooltipCopy = CELEBRATE_COPY.POL_CAROUSEL.escrowTooltip;

const EscrowDisplay = ({
  highlight,
  donations,
  isMobile,
  value,
  tally,
  id,
  x,
  y,
  index,
}: EscrowDisplayProps) => {
  // Determine tooltip placement based on position in carousel
  const tooltipPlacement =
    index === 0 ? 'bottom-end' : isMobile ? 'auto' : 'left';

  return (
    <Stack
      id={'escrow-display-' + id}
      direction={'horizontal'}
      style={donations > 0 ? { marginLeft: y } : {}}
      gap={0}
    >
      {donations > 0 && (
        <Badge
          className={'escrow-badge'}
          style={donations > 0 ? { marginRight: x } : {}}
        >
          <InfoTooltip
            message={
              <>
                <div className='small'>
                  <span className={'donation-popper'}>
                    {accounting.formatMoney(donations)}
                  </span>
                  <span>{tooltipCopy[0]}</span>
                  <br />
                  <span>{tooltipCopy[1]}</span>
                </div>
                <br />
                <span>Total # of Celebrations: {tally}</span>
                <br />
                <span>
                  Average Celebration:{' '}
                  {accounting.formatMoney(donations / tally)}
                </span>
              </>
            }
            toolTipId={id + '-donations-tooltip'}
            infoPlacement={tooltipPlacement}
            icon={'currency-dollar'}
            showToolTips={true}
          />
        </Badge>
      )}
      <PolName
        cls={'pol-selector' + (highlight ? ' highlight' : '')}
        name={value as string}
        headingSize={4}
      />
    </Stack>
  );
};

export default React.memo(EscrowDisplay);
