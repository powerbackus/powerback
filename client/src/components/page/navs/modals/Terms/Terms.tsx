import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { ShowModal, useDialogue } from '@Contexts';
import { StyledModal } from '@Components/modals';
import { AgreeBtn } from '@Components/buttons';
import { TERMS, type Term } from './tuples';
import { handleKeyDown } from '@Utils';
import './style.css';

const TermsModal = () => {
  const { setShowModal } = useDialogue();
  const handleClick = useCallback(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      terms: false,
    }));
  }, [setShowModal]);

  const showPrivacy = useCallback(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      terms: false,
      privacy: true,
    }));
  }, [setShowModal]);

  return (
    <StyledModal
      tabIdx={-1}
      type={'terms'}
      backdrop={true}
      closeButton={true}
      heading={<span className={'display-5'}>Terms of Use</span>}
      body={
        <ul>
          {TERMS.map((term: Term) => {
            return (
              <li
                className={'pb-3'}
                key={'terms-of-service-' + term.section}
              >
                <span className={'display-6'}>{term.section}</span>
                <p>{term.term}</p>
              </li>
            );
          })}
        </ul>
      }
      footer={
        <div className="d-flex flex-column">
          <p className={'mb-3 small'}>
            These Terms of Use, together with our{' '}
            <span
              onKeyDown={(e) => handleKeyDown(e, showPrivacy)}
              className={'natural-link'}
              onClick={showPrivacy}
              tabIndex={0}
            >
              Privacy Policy
            </span>
            , constitute the entire agreement.
          </p>

          <AgreeBtn handleClick={(e) => handleKeyDown(e, handleClick)} />
        </div>
      }
    />
  );
};

export default React.memo(TermsModal);
