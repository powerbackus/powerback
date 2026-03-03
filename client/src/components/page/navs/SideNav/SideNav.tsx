import React, {
  useRef,
  useCallback,
  useLayoutEffect,
  type Dispatch,
  type SetStateAction,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from 'react';
import { useAuth, useDialogue, type UserData, type ShowModal } from '@Contexts';
import type { AuthProp, DeviceProp, NavigationProp } from '@Types';
import { Col, Row, Container, Offcanvas } from 'react-bootstrap';
import SideNavHeader from './Header';
import SidePanel from './Panel';
import './style.css';

type SideNavProps = {
  handleClose: MouseEventHandler & KeyboardEventHandler;
} & NavigationProp &
  DeviceProp &
  AuthProp;

const SideNav = ({ handleLogOut, handleClose, isLoggedIn }: SideNavProps) => {
  const { setShowModal, showSideNav: show, setShowSideNav } = useDialogue(),
    { userData } = useAuth();

  const openModal = useCallback(
    (modal: keyof ShowModal | string) =>
      (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
        ...s,
        [modal.trim()]: true,
      })),
    [setShowModal]
  );

  // Track previous isLoggedIn state to determine if we need to close the sidenav
  const prevIsLoggedInRef = useRef(isLoggedIn);

  // If the user is logged in, close the side nav
  useLayoutEffect(() => {
    if (prevIsLoggedInRef.current !== isLoggedIn) {
      prevIsLoggedInRef.current = isLoggedIn;
      if (isLoggedIn) setShowSideNav(false);
    }
  }, [isLoggedIn, setShowSideNav]);

  return (
    <Offcanvas
      show={show}
      backdrop={true}
      autoFocus={false}
      role={'navigation'}
      enforceFocus={false}
      onHide={handleClose}
      aria-label={'Main menu'}
    >
      <Offcanvas.Body>
        <Container>
          <Row className={'flex-column justify-content-around'}>
            <Col>
              <SideNavHeader handleClose={handleClose} />
            </Col>
            <Col>
              <hr className={'sidebar-hline pb-3'} />
            </Col>
            <Col>
              <SidePanel
                username={userData ? (userData as UserData).username : ''}
                handleLogOut={handleLogOut}
                isLoggedIn={isLoggedIn}
                openModal={openModal}
              />
            </Col>
          </Row>
        </Container>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default React.memo(SideNav);
