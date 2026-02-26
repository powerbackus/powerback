import React, { useCallback, useReducer } from 'react';
import { GenericBtn } from '@Components/buttons';
import type { Celebration } from '@Types';
import { Stack } from 'react-bootstrap';
import ShareButton from './ShareButton';
import { useDevice } from '@Contexts';
import API from '@API';
import { logError } from '@Utils';
import './style.css';

const ButtonSet = ({ celebration }: { celebration: Celebration }) => {
  const [sentReceipt, setSentReceipt] = useReducer(() => true, false);

  const handleReceipt = useCallback(async () => {
    try {
      const response = await API.sendReceipt(celebration as Celebration);
      if (response.status === 200) setSentReceipt();
    } catch (error) {
      logError('Failed to send receipt', error);
    }
  }, [celebration, setSentReceipt]);

  const { isMobilePortraitSmall } = useDevice();

  const stackDirection = isMobilePortraitSmall ? 'vertical' : 'horizontal';

  return (
    <div className='donation-receipt-btn-group'>
      <Stack
        direction={stackDirection}
        gap={2}
        className='align-items-center'
      >
        {sentReceipt ? (
          <span className='msg-sent'>
            <i className='bi bi-send' />
            &nbsp;Sent
          </span>
        ) : (
          <span className='receipt-btn'>
            {' '}
            <GenericBtn
              label={'Email receipt'}
              onPress={handleReceipt}
              size={'sm'}
            />
          </span>
        )}
        <div className='share-button-wrapper'>
          <ShareButton />
        </div>
      </Stack>
    </div>
  );
};

export default React.memo(ButtonSet);
