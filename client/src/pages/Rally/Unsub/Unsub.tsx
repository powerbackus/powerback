/**
 * Rally movement email unsubscribe page.
 * @module Rally/Unsub
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { ContinueBtn } from '@Components/buttons';
import { Loading } from '@Pages';
import { RALLY_COPY } from '@CONSTANTS';
import API from '@API';
import { regexMatchURI } from '@Utils';
import './style.css';

type UnsubProps = {
  homeLinkRedirect: () => void;
};

/**
 * One-click unsubscribe for Rally movement update emails.
 *
 * @param props - Page props
 * @param props.homeLinkRedirect - Navigate to main route
 */
const Unsub = ({ homeLinkRedirect }: UnsubProps) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const token = useMemo(() => {
    const match = regexMatchURI('rally-unsubscribe');
    return match?.[0] ?? null;
  }, []);

  const handleUnsub = useCallback(async () => {
    if (!token) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const { data } = await API.unsubscribeRallySubscriber(token);
      setMessage(data.message);
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  if (!token) {
    return (
      <div
        id='rally-unsub-page'
        className='rally-magic-page text-center'
      >
        <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.errorTitle}</h1>
        <p className='inconsolata'>{RALLY_COPY.UNSUB.errorBody}</p>
        <div className='p-4'>
          <ContinueBtn
            size='sm'
            variant='outline-primary'
            handleClick={homeLinkRedirect}
            label={RALLY_COPY.UNSUB.home}
            type='button'
          />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div
        id='rally-unsub-page'
        className='rally-magic-page text-center'
      >
        <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.successTitle}</h1>
        <p className='inconsolata'>{message}</p>
        <div className='p-4'>
          <ContinueBtn
            size='sm'
            variant='outline-primary'
            handleClick={homeLinkRedirect}
            label={RALLY_COPY.UNSUB.home}
            type='button'
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading msg={RALLY_COPY.UNSUB.loading} />;
  }

  if (error) {
    return (
      <div
        id='rally-unsub-page'
        className='rally-magic-page text-center'
      >
        <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.errorTitle}</h1>
        <p className='inconsolata'>{RALLY_COPY.UNSUB.errorBody}</p>
        <div className='p-4'>
          <ContinueBtn
            size='sm'
            variant='outline-primary'
            handleClick={homeLinkRedirect}
            label={RALLY_COPY.UNSUB.home}
            type='button'
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id='rally-unsub-page'
      className='rally-magic-page text-center'
    >
      <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.title}</h1>
      <p className='inconsolata'>{RALLY_COPY.UNSUB.body}</p>
      <div className='p-4 d-flex justify-content-center gap-2'>
        <Button
          variant='dark'
          type='button'
          onClick={() => void handleUnsub()}
        >
          {RALLY_COPY.UNSUB.confirm}
        </Button>
        <ContinueBtn
          size='sm'
          variant='outline-secondary'
          handleClick={homeLinkRedirect}
          label={RALLY_COPY.UNSUB.home}
          type='button'
        />
      </div>
    </div>
  );
};

export default React.memo(Unsub);
