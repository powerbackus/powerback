import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { ShowModal, useDialogue } from '@Contexts';
import { StyledModal } from '@Components/modals';
import { AgreeBtn } from '@Components/buttons';
import { handleKeyDown } from '@Utils';
import { PRIVACY } from './tuples';
import './style.css';

const PrivacyModal = () => {
  const { setShowModal } = useDialogue();
  const handleClick = useCallback(() => {
    (setShowModal as Dispatch<SetStateAction<ShowModal>>)((s) => ({
      ...s,
      privacy: false,
    }));
  }, [setShowModal]);
  return (
    <StyledModal
      tabIdx={1}
      type={'privacy'}
      backdrop={true}
      closeButton={true}
      heading={<span className={'display-5'}>Privacy Policy</span>}
      body={
        <ul>
          {PRIVACY.map((item) => {
            return (
              <li
                className={'pb-3'}
                key={'privacy-policy-' + item.section}>
                <span className='display-6'>{item.section}</span>
                <p>{item.privacy}</p>
              </li>
            );
          })}
        </ul>
      }
      footer={<AgreeBtn handleClick={(e) => handleKeyDown(e, handleClick)} />}
    />
  );
};

export default React.memo(PrivacyModal);
