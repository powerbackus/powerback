import React, { type Dispatch, type SetStateAction } from 'react';
import type { UserDataProp, ProfileProp } from '@Types';
import { Col, Row, Container } from 'react-bootstrap';
import type { SecurityTheater } from '@Interfaces';
import type { UserData } from '@Contexts';
import ChangePass from '../ChangePass';
import DeleteAcct from '../DeleteAcct';
import './style.css';

type TheaterProps = UserDataProp & {
  setPasswordChanged: Dispatch<SetStateAction<boolean>>;
  closeSecurityCurtain: () => void;
  securityTheater: SecurityTheater;
  handleDeleteUser: () => void;
  passwordChanged: boolean;
} & ProfileProp;

const Theater = ({
  closeSecurityCurtain,
  setPasswordChanged,
  handleDeleteUser,
  passwordChanged,
  securityTheater,
  userData,
}: TheaterProps) => {
  return (
    <Container
      className={
        'pt-1 pt-lg-0' +
        ((securityTheater as SecurityTheater).deleteAccount ? ' delete' : '')
      }
    >
      <Row>
        <Col>
          {((!passwordChanged &&
            (securityTheater as SecurityTheater).changePassword) ||
            (passwordChanged &&
              !(securityTheater as SecurityTheater).changePassword &&
              !(securityTheater as SecurityTheater).deleteAccount)) && (
            <ChangePass
              key={(userData as UserData).id + '-change-password-pane'}
              closeSecurityCurtain={closeSecurityCurtain}
              setPasswordChanged={setPasswordChanged}
              passwordChanged={passwordChanged}
              securityTheater={securityTheater}
              userData={userData}
            />
          )}
          {(securityTheater as SecurityTheater).deleteAccount && (
            <DeleteAcct handleDeleteUser={handleDeleteUser} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default React.memo(Theater);
