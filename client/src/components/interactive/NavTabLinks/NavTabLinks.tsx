import React, {
  useCallback,
  type Dispatch,
  type MouseEvent,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import type { ShowModal } from '@Contexts';
import { handleKeyDown } from '@Utils';
import { Nav } from 'react-bootstrap';
import './style.css';

type NewTabLinksProps = {
  stateSetter: Dispatch<SetStateAction<ShowModal>>;
  LINK_LABELS: readonly string[];
};

const NavTabLinks = ({ LINK_LABELS, stateSetter }: NewTabLinksProps) => {
  const handleLinkEvent = useCallback(
    (
      e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
      linkLabel: string
    ) => {
      handleKeyDown(
        e,
        () =>
          stateSetter((s: ShowModal) => ({
            ...s,
            [linkLabel === linkLabel.toUpperCase() // special ALL-CAPS label
              ? linkLabel
              : linkLabel.toLowerCase()]: true,
          })),
        linkLabel
      );
    },
    [stateSetter]
  );

  if (LINK_LABELS.length === 0) return null;

  return (
    <Nav
      id={'nav-info'}
      className={'nav-links flex-row'}
    >
      {LINK_LABELS.map((linkLabel: string) => {
        return (
          <Nav.Link
            key={`NavLink-${linkLabel}`}
            onKeyDown={(e) => handleLinkEvent(e, linkLabel)}
            onClick={(e) => handleLinkEvent(e, linkLabel)}
            tabIndex={0}
            as={'span'}
          >
            {linkLabel}
          </Nav.Link>
        );
      })}
    </Nav>
  );
};

export default React.memo(NavTabLinks);
