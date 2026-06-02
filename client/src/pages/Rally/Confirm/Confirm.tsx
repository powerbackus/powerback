/**
 * Rally email confirmation page (double opt-in link from email).
 * @module Rally/Confirm
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import { ContinueBtn } from '@Components/buttons';
import { MagicLink } from '@Components/page';
import { RALLY_COPY } from '@CONSTANTS';
import API from '@API';
import './style.css';

type ConfirmState = 'loading' | 'success' | 'error';

type ConfirmProps = {
  homeLinkRedirect: () => void;
};

type ConfirmContentProps = {
  homeLinkRedirect: () => void;
  token: string;
};

const ConfirmActions = ({
  homeLinkRedirect,
}: {
  homeLinkRedirect: () => void;
}) => (
  <div className={'rally-confirm-actions'}>
    <ContinueBtn
      label={RALLY_COPY.CONFIRM.home}
      handleClick={homeLinkRedirect}
      variant={'outline-primary'}
      type={'button'}
      size={'sm'}
    />
  </div>
);

/**
 * Runs confirm API and renders success/error inside MagicLink card.
 */
const ConfirmContent = ({ token, homeLinkRedirect }: ConfirmContentProps) => {
  const [unsubscribeUrl, setUnsubscribeUrl] = useState<string | null>(null),
    [state, setState] = useState<ConfirmState>('loading'),
    [message, setMessage] = useState('');

  const runConfirm = useCallback(async () => {
    setState('loading');
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
  }, [token]);

  useEffect(() => {
    void runConfirm();
  }, [runConfirm]);

  if (state === 'loading') {
    return (
      <div className={'rally-confirm-content'}>
        <h1 className={'display-6'}>{RALLY_COPY.CONFIRM.loading}</h1>
        <div className={'rally-confirm-loading d-flex justify-content-center'}>
          <Spinner
            animation={'border'}
            variant={'light'}
          />
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={'rally-confirm-content'}>
        <h1 className={'display-6'}>{RALLY_COPY.CONFIRM.errorTitle}</h1>
        <p>{RALLY_COPY.CONFIRM.errorBody}</p>
        <ConfirmActions homeLinkRedirect={homeLinkRedirect} />
      </div>
    );
  }

  return (
    <div className={'rally-confirm-content'}>
      <h1 className={'display-6'}>{RALLY_COPY.CONFIRM.successTitle}</h1>
      <p>{message}</p>
      {unsubscribeUrl && (
        <p className={'rally-confirm-unsub-hint small'}>
          <a href={unsubscribeUrl}>Unsubscribe from POWERBACK updates</a>
        </p>
      )}
      <ConfirmActions homeLinkRedirect={homeLinkRedirect} />
    </div>
  );
};

const InvalidLink = ({
  homeLinkRedirect,
}: {
  homeLinkRedirect: () => void;
}) => (
  <div className={'rally-confirm-content'}>
    <h1 className={'display-6'}>{RALLY_COPY.CONFIRM.errorTitle}</h1>
    <p>{RALLY_COPY.CONFIRM.errorBody}</p>
    <ConfirmActions homeLinkRedirect={homeLinkRedirect} />
  </div>
);

/**
 * Confirms Rally email subscription via link in confirmation email.
 *
 * @param props - Page props
 * @param props.homeLinkRedirect - Navigate to main route
 */
const Confirm = ({ homeLinkRedirect }: ConfirmProps) => (
  <MagicLink
    containerId={'rally-confirm-container'}
    homeLinkRedirect={homeLinkRedirect}
    cardBodyClassName={'text-center'}
    shouldRedirect={() => false}
    routeType={'rally-confirm'}
    tokenOnly
  >
    {({ hash }) =>
      hash ? (
        <ConfirmContent
          token={hash}
          homeLinkRedirect={homeLinkRedirect}
        />
      ) : (
        <InvalidLink homeLinkRedirect={homeLinkRedirect} />
      )
    }
  </MagicLink>
);

export default React.memo(Confirm);
