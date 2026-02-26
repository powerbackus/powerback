/**
 * Unsubscribe confirmation page for email topic opt-out.
 * @module Unsub
 */
import React, { useState, useMemo, useCallback } from 'react';
import { ContinueBtn, GenericBtn } from '@Components/buttons';
import { MagicLink } from '@Components/page';
import { ACCOUNT_COPY } from '@CONSTANTS';
import API from '@API';
import './style.css';

const Unsub = ({ homeLinkRedirect }: { homeLinkRedirect: () => void }) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTopic = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('topic');
  }, []);

  const TOPIC = useMemo(() => getTopic(), [getTopic]);

  const handleUnsub = useCallback(
    async (hash: string) => {
      const topic = TOPIC;

      if (!hash || !topic) {
        return;
      }

      try {
        await API.confirmUnsubscribe(hash, topic);
        setSuccess(true);
      } catch (err: unknown) {
        setError('Failed to unsubscribe. Please try again.');
      }
    },
    [TOPIC]
  );

  const topicName = useMemo(
    () =>
      TOPIC?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ||
      'these alerts',
    [TOPIC]
  );

  const { title, body, cta, buttons } =
    ACCOUNT_COPY.UNSUB.MAGIC_USER_INTERACTION;

  const renderBodyText = (
    content: string | ((topicName: string) => React.ReactNode)
  ) => {
    return typeof content === 'function' ? content(topicName) : content;
  };

  return (
    <MagicLink
      routeType='unsubscribe'
      verifyHash={(hash) => API.verifyUnsubscribeHash(hash)}
      homeLinkRedirect={homeLinkRedirect}
      containerId='unsubscribe-container'
      cardBodyClassName='text-center'
      shouldRedirect={({ isValid, isExpired }) => {
        // Also redirect if topic is missing (malformed URL)
        return !isValid || isExpired || !TOPIC;
      }}
    >
      {({ hash }) => {
        if (success) {
          return (
            <>
              <h1 className={'mb-4 display-6'}>Unsubscribed</h1>
              <p className={'text-center inconsolata'}>
                You have been successfully unsubscribed from {topicName}.
              </p>
              <div className={'p-5'}>
                <ContinueBtn
                  size={'sm'}
                  variant={'outline-primary'}
                  label={'Return to the Lobby'}
                  handleClick={homeLinkRedirect}
                />
              </div>
            </>
          );
        }

        return (
          <>
            <h1 className={'mt-lg-1 mb-lg-3 pb-lg-3 display-6'}>{title}</h1>
            {body.map((text) => (
              <p
                key={`${text}-body-text`}
                className={'mb-lg-3 pb-lg-1'}
              >
                {renderBodyText(text)}
              </p>
            ))}
            <p className={'pt-lg-2'}>{cta(topicName)}</p>

            <div className={'d-flex justify-content-center gap-3 mt-4'}>
              <GenericBtn
                onPress={homeLinkRedirect}
                label={buttons.cancel}
                cls={'cancel-btn'}
                size={'sm'}
              />
              <GenericBtn
                onPress={() => hash && handleUnsub(hash)}
                cls={'unsubscribe-btn'}
                label={buttons.confirm}
                size={'sm'}
              />
            </div>
            {error && <span className={'text-danger'}>{error}</span>}
          </>
        );
      }}
    </MagicLink>
  );
};

export default React.memo(Unsub);
