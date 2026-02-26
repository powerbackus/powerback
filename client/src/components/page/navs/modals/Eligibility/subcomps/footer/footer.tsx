import React, {
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { AuthProp, DialogueProp, NavigationProp } from '@Types';
import { AgreeBtn } from '@Components/buttons';
import type { ShowModal } from '@Contexts';
import { BRAND_DISPLAY } from '@CONSTANTS';
import { Stack } from 'react-bootstrap';
import { handleKeyDown } from '@Utils';
import './style.css';

type FooterProps = DialogueProp &
  NavigationProp &
  AuthProp & {
    handleClick: () => void;
  };

const Footer = ({
  tabKey,
  isLoggedIn,
  handleClick,
  setShowModal,
}: FooterProps) => {
  const showTerms = useCallback(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      terms: true,
    }));
  }, [setShowModal]);

  const showPrivacy = useCallback(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      privacy: true,
    }));
  }, [setShowModal]);

  const showAgreement = useMemo(() => {
    return tabKey === 'payment' && isLoggedIn;
  }, [tabKey, isLoggedIn]);

  return (
    <Stack
      direction='vertical'
      className='pt-lg-1'
    >
      <AgreeBtn handleClick={(e) => handleKeyDown(e, handleClick)} />
      {showAgreement && (
        <p className={'implicit-agreement mt-3 mt-lg-2 mx-3 mx-lg-0'}>
          By proceeding with this transaction you agree to&nbsp;
          <span className='powerback'>{BRAND_DISPLAY}</span>'s&nbsp;
          <span
            onKeyDown={(e) => handleKeyDown(e, showTerms)}
            className={'natural-link'}
            onClick={showTerms}
            tabIndex={0}
          >
            terms of use
          </span>{' '}
          and{' '}
          <span
            onKeyDown={(e) => handleKeyDown(e, showPrivacy)}
            className={'natural-link'}
            onClick={showPrivacy}
            tabIndex={0}
          >
            privacy policy
          </span>
          .
        </p>
      )}
    </Stack>
  );
};

export default React.memo(Footer);
