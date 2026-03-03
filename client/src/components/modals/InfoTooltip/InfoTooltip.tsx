import React, {
  type ReactNode,
  type ElementType,
  type ReactElement
} from 'react';
import type { Placement } from 'react-bootstrap/esm/types';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

const InfoTooltip = ({
  as,
  icon,
  message,
  children,
  toolTipId,
  showToolTips,
  infoPlacement = 'auto',
  onMouseEnter,
  onMouseLeave
}: {
  as?: ElementType;
  toolTipId: string;
  message: ReactNode;
  icon?: string | null;
  showToolTips: boolean;
  infoPlacement?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: ReactElement | null;
}) =>
  showToolTips ? (
    <OverlayTrigger
      overlay={<Tooltip id={toolTipId}>{message}</Tooltip>}
      placement={infoPlacement as Placement}
    >
      <span
        tabIndex={0}
        className='info-tooltip'
        style={{ cursor: 'help' }}
      >
        {(as &&
          React.createElement(
            as,
            {
              tabIndex: 0,
              onMouseEnter,
              onMouseLeave,
              className: 'info-tooltip'
            },
            <>
              {' '}
              {icon && <i className={`bi bi-${icon}`} />}{' '}
              {children && (children as ReactElement)}
            </>
          )) || (
          <>
            {' '}
            {icon && <i className={`bi bi-${icon}`} />}{' '}
            {children && (children as ReactElement)}
          </>
        )}
      </span>
    </OverlayTrigger>
  ) : null;

export default React.memo(InfoTooltip);
