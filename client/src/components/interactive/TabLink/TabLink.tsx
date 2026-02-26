import React, { ElementType } from 'react';
import { Nav } from 'react-bootstrap';

type TabLinkProps = {
  as?: ElementType<any>;
  ariaLabel?: string;
  eventKey?: string;
  active?: boolean;
  topic?: string;
};

const TabLink = ({
  as = 'span',
  ariaLabel,
  eventKey,
  active,
  topic,
}: TabLinkProps) => (
  <Nav.Link
    as={as}
    tabIndex={0}
    active={active}
    className={topic}
    eventKey={eventKey}
    aria-label={ariaLabel}
  >
    {topic}
  </Nav.Link>
);

export default React.memo(TabLink);
