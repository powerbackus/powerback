import React from 'react';
import { GenericBtn } from '@Components/buttons';
import './style.css';

interface PortholeProps {
  promotionMessage: string | null;
  onButtonClick: () => void;
  buttonText: string;
  shouldShow: boolean;
}

const Porthole = ({
  promotionMessage,
  buttonText,
  shouldShow,
  onButtonClick
}: PortholeProps) =>
  shouldShow ? (
    <div className='limit-promotion'>
      {promotionMessage && (
        <p className='limit-promotion-text mb-2'>{promotionMessage}</p>
      )}
      <GenericBtn
        cls={'limit-upgrade-btn'}
        onPress={onButtonClick}
        label={buttonText}
        size={'sm'}
      />
    </div>
  ) : null;
export default React.memo(Porthole);
