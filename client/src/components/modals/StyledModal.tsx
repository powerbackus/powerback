/**
 * @fileoverview StyledModal – shared modal wrapper for app dialogs
 *
 * Wraps react-bootstrap Modal with DialogueContext (show/hide by type), consistent
 * header/body/footer layout, and optional focus trap for content-only footers.
 *
 * Behavior:
 * - Visibility is driven by DialogueContext.showModal[type]. Set showModal[type]=true to open.
 * - Default: footer is focusable (tabIdx) and closes modal on click or Enter/Space (handleKeyDown).
 * - When footerClosesOnClick=false: footer is content-only (e.g. citations), not in tab order,
 *   and a focus trap keeps Tab/Shift+Tab inside the modal; onHide only runs for Escape.
 *
 * @module components/modals/StyledModal
 * @requires react
 * @requires react-bootstrap/Modal
 * @requires Contexts (useDialogue, ShowModal)
 * @requires Utils (handleKeyDown)
 * @requires Types (HideEvent)
 */

import React, {
  useMemo,
  useCallback,
  EventHandler,
  ReactElement,
  KeyboardEvent,
  SyntheticEvent,
  MouseEventHandler,
  KeyboardEventHandler,
} from 'react';
import { Modal } from 'react-bootstrap';
import { ShowModal, useDialogue } from '@Contexts';
import { handleKeyDown } from '@Utils';
import { HideEvent } from '@Types';
import './style.css';

type ShowModalKey = keyof ShowModal;

/** Union type for onHide-style handlers (keyboard, mouse, synthetic). */
type HandleHide = KeyboardEventHandler<HTMLElement> &
  EventHandler<SyntheticEvent<any, CloseEvent>> &
  MouseEventHandler<HTMLElement> &
  ((node: HTMLElement) => any) &
  (() => void);

/**
 * Props for StyledModal
 *
 * @property {(e: HideEvent) => HideEvent | (() => void)} [overrideOnClick] - If set, called instead of closing modal on hide; can return no-op to block close
 * @property {(node: HTMLElement) => any} [onExited] - Called when modal has finished exiting (animation done)
 * @property {(node: HTMLElement) => any} [onExit] - Called when modal begins exiting
 * @property {ReactElement | string} heading - Header content (string or element)
 * @property {boolean | 'static'} [backdrop] - true = click backdrop closes; 'static' = backdrop does not close
 * @property {'sm' | 'lg' | 'xl'} [size] - Modal size (default 'lg')
 * @property {() => void} [onEnter] - Called when modal begins entering
 * @property {boolean} [closeButton] - Whether to show X close in header
 * @property {ReactElement} [footer] - Footer content (e.g. buttons or citation list)
 * @property {keyof ShowModal} type - Key in showModal that controls this modal's visibility (e.g. 'limit', 'account')
 * @property {0 | 1 | -1} [tabIdx] - tabIndex for footer when footerClosesOnClick is true (default 0)
 * @property {boolean} [footerClosesOnClick] - If false, footer is content-only: not focusable, no close on click/Enter/Space; focus trap runs (default true)
 * @property {ReactElement} body - Main body content
 */
type StyledModalProps = {
  overrideOnClick?: (e: HideEvent) => HideEvent | (() => void);
  onExited?: (node: HTMLElement) => any;
  onExit?: (node: HTMLElement) => any;
  heading: ReactElement | string;
  backdrop?: boolean | 'static';
  footer?: ReactElement | null;
  size?: 'sm' | 'lg' | 'xl';
  onEnter?: () => void;
  closeButton?: boolean;
  type: keyof ShowModal;
  tabIdx?: 0 | 1 | -1;
  body: ReactElement;
};

/**
 * StyledModal – shared modal wrapper keyed by DialogueContext.showModal[type]
 *
 * Renders a react-bootstrap Modal with header, body, and optional footer. Show/hide is
 * controlled by useDialogue().showModal[type]. When footerClosesOnClick is false (e.g. Limit
 * modal with citations), a focus trap wraps body+footer: Tab from last focusable wraps to
 * first, Shift+Tab from first wraps to last, and focusout refocuses first element so focus
 * never leaves. For that case, onHide is only honored for Escape; other hide triggers are ignored.
 *
 * @param {StyledModalProps} props - Component props
 * @returns {React.ReactElement} Modal element
 *
 * @example
 * // Modal that closes when footer is clicked or Enter/Space on footer (default)
 * <StyledModal type="eligibility" heading="Eligibility" body={<Body />} footer={<Footer />} />
 *
 * @example
 * // Content-only footer (citations); focus trap; only Escape closes
 * <StyledModal type="limit" footerClosesOnClick={false} heading="Limit" body={...} footer={<ListGroup>...</ListGroup>} />
 */
const StyledModal = ({
  overrideOnClick,
  closeButton,
  backdrop,
  onExited,
  heading,
  onEnter,
  footer,
  onExit,
  tabIdx = 0,
  body,
  size = 'lg',
  type,
}: StyledModalProps) => {
  const label = useMemo(() => type.toLowerCase() + '-modal', [type]);

  const { showModal, setShowModal } = useDialogue();

  /** Close this modal: run overrideOnClick if provided, else set showModal[type]=false. */
  const handleHide = useCallback(
    (e: HideEvent) => {
      if (overrideOnClick) return overrideOnClick(e);
      else
        setShowModal((s: ShowModal) => ({
          ...s,
          [type as keyof ShowModal]: false,
        }));
    },
    [type, setShowModal, overrideOnClick]
  );

  /** Invoke handleHide on Enter/Space (for footer close-via-keyboard). */
  const handleKeyboardHide = useCallback(
    (e: KeyboardEvent) => {
      return handleKeyDown(e, handleHide as HandleHide);
    },
    [handleHide]
  );

  const handleShow = useMemo(
    () => (showModal && type ? showModal[type as ShowModalKey] : false),
    [type, showModal]
  );

  return (
    <Modal
      centered
      id={label}
      size={size}
      onExit={onExit}
      onEnter={onEnter}
      onExited={onExited}
      backdrop={backdrop}
      aria-label={label}
      className={'styled-modal'}
      onHide={handleHide as HandleHide}
      show={handleShow}
    >
      {heading && (
        <Modal.Header
          closeButton={closeButton}
          closeVariant={'white'}
          closeLabel={'Hide'}
        >
          <Modal.Title>{heading}</Modal.Title>
        </Modal.Header>
      )}

      <Modal.Body tabIndex={-1}>
        {body}
        {footer && (
          <Modal.Footer
            onKeyDown={handleKeyboardHide}
            onClick={handleHide}
            tabIndex={tabIdx}
          >
            {footer}
          </Modal.Footer>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(StyledModal);
