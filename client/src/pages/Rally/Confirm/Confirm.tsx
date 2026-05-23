/**
 * Rally email confirmation page (double opt-in link from email).
 * @module Rally/Confirm
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ContinueBtn } from '@Components/buttons';
import { Loading } from '@Pages';
import { RALLY_COPY } from '@CONSTANTS';
import API from '@API';
import { regexMatchURI } from '@Utils';
import './style.css';

type ConfirmState = 'loading' | 'success' | 'error';

type ConfirmProps = {
  homeLinkRedirect: () => void;
};

/**
 * Confirms Rally email subscription via link in confirmation email.
 *
 * @param props - Page props
 * @param props.homeLinkRedirect - Navigate to main route
 */
const Confirm = ({ homeLinkRedirect }: ConfirmProps) => {
  const [state, setState] = useState<ConfirmState>('loading');
  const [message, setMessage] = useState('');
  const [unsubscribeUrl, setUnsubscribeUrl] = useState<string | null>(null);

  const runConfirm = useCallback(async () => {
    const match = regexMatchURI('rally-confirm');
    const token = match?.[0];
    if (!token) {
      setState('error');
      return;
    }
    try {
      const { data } = await API.confirmRallySubscriber(token);
      setMessage(data.message);
      if (data.unsubscribeUrl) {
        setUnsubscribeUrl(data.unsubscribeUrl);
      }
      setState('success');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void runConfirm();
  }, [runConfirm]);

  if (state === 'loading') {
    return <Loading msg={RALLY_COPY.CONFIRM.loading} />;
  }

  if (state === 'error') {
    return (
      <div
        id='rally-confirm-page'
        className='rally-magic-page text-center'
      >
        <h1 className='display-6 mb-3'>{RALLY_COPY.CONFIRM.errorTitle}</h1>
        <p className='inconsolata'>{RALLY_COPY.CONFIRM.errorBody}</p>
        <div className='p-4'>
          <ContinueBtn
            size='sm'
            variant='outline-primary'
            handleClick={homeLinkRedirect}
            label={RALLY_COPY.CONFIRM.home}
            type='button'
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id='rally-confirm-page'
      className='rally-magic-page text-center'
    >
      <h1 className='display-6 mb-3'>{RALLY_COPY.CONFIRM.successTitle}</h1>
      <p className='inconsolata'>{message}</p>
      {unsubscribeUrl && (
        <p className='rally-confirm-unsub-hint small mt-3'>
          <a href={unsubscribeUrl}>Unsubscribe from movement updates</a>
        </p>
      )}
      <div className='p-4'>
        <ContinueBtn
          size='sm'
          variant='outline-primary'
          handleClick={homeLinkRedirect}
          label={RALLY_COPY.CONFIRM.home}
          type='button'
        />
      </div>
    </div>
  );
};

export default React.memo(Confirm);
