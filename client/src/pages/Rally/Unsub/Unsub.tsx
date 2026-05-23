/**
 * Rally movement email unsubscribe page (same MagicLink shell as account Unsub).
 * @module Rally/Unsub
 */
import React, { useCallback, useState } from 'react';
import { ContinueBtn, GenericBtn } from '@Components/buttons';
import { MagicLink } from '@Components/page';
import { RALLY_COPY } from '@CONSTANTS';
import API from '@API';
import '../../Unsub/style.css';

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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleUnsub = useCallback(async (token: string) => {
    try {
      const { data } = await API.unsubscribeRallySubscriber(token);
      setMessage(data.message);
      setSuccess(true);
    } catch {
      setError('Failed to unsubscribe. Please try again.');
    }
  }, []);

  return (
    <MagicLink
      routeType='rally-unsubscribe'
      tokenOnly
      containerId='rally-unsubscribe-container'
      homeLinkRedirect={homeLinkRedirect}
      shouldRedirect={() => false}
      cardBodyClassName='text-center'
    >
      {({ hash }) => {
        if (!hash) {
          return (
            <>
              <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.errorTitle}</h1>
              <p className='inconsolata'>{RALLY_COPY.UNSUB.errorBody}</p>
              <div className='p-5'>
                <ContinueBtn
                  size='sm'
                  variant='outline-primary'
                  handleClick={homeLinkRedirect}
                  label={RALLY_COPY.UNSUB.home}
                  type='button'
                />
              </div>
            </>
          );
        }

        if (success) {
          return (
            <>
              <h1 className='display-6 mb-3'>{RALLY_COPY.UNSUB.successTitle}</h1>
              <p className='inconsolata'>{message}</p>
              <div className='p-5'>
                <ContinueBtn
                  size='sm'
                  variant='outline-primary'
                  handleClick={homeLinkRedirect}
                  label={RALLY_COPY.UNSUB.home}
                  type='button'
                />
              </div>
            </>
          );
        }

        return (
          <>
            <h1 className='mt-lg-1 mb-lg-3 pb-lg-3 display-6'>
              {RALLY_COPY.UNSUB.title}
            </h1>
            <p className='mb-lg-3 pb-lg-1'>{RALLY_COPY.UNSUB.body}</p>
            <p className='pt-lg-2'>{RALLY_COPY.UNSUB.confirm}?</p>

            <div className='d-flex justify-content-center gap-3 mt-4'>
              <GenericBtn
                onPress={homeLinkRedirect}
                label={RALLY_COPY.UNSUB.cancel}
                cls='cancel-btn'
                size='sm'
              />
              <GenericBtn
                onPress={() => void handleUnsub(hash)}
                cls='unsubscribe-btn'
                label={RALLY_COPY.UNSUB.confirm}
                size='sm'
              />
            </div>
            {error && <span className='text-danger'>{error}</span>}
          </>
        );
      }}
    </MagicLink>
  );
};

export default React.memo(Unsub);
