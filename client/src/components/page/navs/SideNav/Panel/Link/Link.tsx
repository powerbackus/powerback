import React, {
  useMemo,
  useCallback,
  ReactElement,
  MouseEventHandler,
  ChangeEventHandler,
  KeyboardEventHandler,
} from 'react';
import { NavItem, NavLink } from 'react-bootstrap';
import { getTrackedLink } from '@Utils';
import { ShowModal } from '@Contexts';
import './style.css';

interface SideLinkProps {
  openModal?: (modal: keyof ShowModal | string) => void;
  handler?:
    | KeyboardEventHandler<HTMLElement>
    | ChangeEventHandler<HTMLElement>
    | MouseEventHandler<HTMLElement>;
  label?: string | ReactElement;

  modal?: keyof ShowModal;
  href?: URL['href'];
  icon?: string;
  cls?: string;
  /** Tracking medium for external links (e.g., 'sidenav', 'footer') */
  trackingMedium?: string;
}

const SideLink = ({
  cls,
  href,
  icon,
  label,
  modal,
  handler,
  openModal,
  trackingMedium,
}: SideLinkProps) => {
  const linkLabel = useMemo(
      () => (
        <>
          &nbsp;
          {label
            ? label
            : modal &&
              (modal.charAt(0).toUpperCase() === ''
                ? modal.trim().charAt(0).toUpperCase() + modal.trim().slice(1)
                : modal.charAt(0).toUpperCase() + modal.slice(1))}
        </>
      ),
      [label, modal]
    ),
    modalType = useMemo(
      () =>
        modal && modal.charAt(1).toLowerCase() === modal.charAt(1)
          ? modal.toLowerCase()
          : modal,
      [modal]
    );

  const handleEvent = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
      if (typeof handler === 'function') {
        (handler as (e: React.MouseEvent<HTMLElement>) => void)(
          e as React.MouseEvent<HTMLElement>
        );
      } else if (typeof openModal === 'function' && modalType) {
        openModal(modalType);
      }
    },
    [handler, openModal, modalType]
  );

  // Get tracked link if href is external and tracking medium is provided
  const trackedLink = useMemo(() => {
    if (href && trackingMedium) {
      const linkText = typeof label === 'string' ? label : 'link';
      return getTrackedLink(href, { medium: trackingMedium }, linkText);
    }
    return null;
  }, [href, trackingMedium, label]);

  return href ? (
    <NavLink
      tabIndex={0}
      className={cls}
      onClick={trackedLink?.onClick}
      href={trackedLink?.trackedUrl || href}
    >
      {linkLabel}
      <i className={'icon-link iconic-pink bi-' + icon} />
    </NavLink>
  ) : (
    <NavItem
      as={'a'}
      role={'tab'}
      tabIndex={0}
      onClick={handleEvent}
      onKeyDown={handleEvent}
      className={cls + 'offcanvas nav-link'}
      {...(modal === 'account' ? { 'data-tour': 'account-open' } : {})}
    >
      <>
        {linkLabel}
        {icon && <i className={'icon-link iconic-pink bi-' + icon} />}
      </>
    </NavItem>
  );
};

export default React.memo(SideLink);
