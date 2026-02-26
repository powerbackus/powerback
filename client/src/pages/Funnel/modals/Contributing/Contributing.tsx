/**
 * ContributingModal component
 *
 * Modal with a simple form for inquiring about contributing (name, email,
 * GitHub link, optional message). Submits to the backend and sends an email
 * to contributors. Matches app visual style (Bootstrap + dark theme).
 *
 * @module ContributingModal
 */

import React, { useState, useCallback, FormEvent } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useDialogue, type ShowModal } from '@Contexts';
import { StyledModal } from '@Components/modals';
import { CONFIRMATION_COPY } from '@CONSTANTS';
import { handleKeyDown } from '@Utils';
import { ERRORS } from '@Tuples';
import API from '@API';
import './style.css';

const COPY = CONFIRMATION_COPY.CONTRIBUTING_MODAL;

const ContributingModal = () => {
  const { setShowModal } = useDialogue();

  // Form state
  const [error, setError] = useState<string | null>(null),
    [submitting, setSubmitting] = useState(false),
    [githubUrl, setGithubUrl] = useState(''),
    [success, setSuccess] = useState(false),
    [message, setMessage] = useState(''),
    [email, setEmail] = useState(''),
    [name, setName] = useState('');

  const closeModal = useCallback(() => {
    setShowModal((s: ShowModal) => ({ ...s, contributing: false }));
  }, [setShowModal]);

  const errMsg =
    ERRORS.find((e) => e.status === 500)?.msg ||
    'Something went wrong. Please try again.';

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        await API.submitContributing({
          name: name.trim(),
          email: email.trim(),
          ...(githubUrl.trim() ? { githubUrl: githubUrl.trim() } : {}),
          ...(message.trim() ? { message: message.trim() } : {}),
        });
        setSuccess(true);
        setTimeout(closeModal, 2000);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (
                err as {
                  response?: { data?: { error?: { message?: string } } };
                }
              ).response?.data?.error?.message
            : errMsg;
        setError(msg || errMsg);
      } finally {
        setSubmitting(false);
      }
    },
    [name, email, errMsg, githubUrl, message, closeModal]
  );

  const body = success ? (
    <p className='contributing-modal-success text-info mb-0'>{COPY.success}</p>
  ) : (
    <Form
      onSubmit={handleSubmit}
      className={'contributing-form'}
    >
      <p className='text-muted small mb-3 contributing-description'>
        {COPY.description}
      </p>
      {error && (
        <div
          className={'alert alert-danger py-2 mb-3'}
          role={'alert'}
        >
          {error}
        </div>
      )}

      <Form.Group className='mb-3'>
        <Form.Label>
          {COPY.labelName} <span className='req-asterisk'>*</span>
        </Form.Label>
        <Form.Control
          onChange={(e) => setName(e.target.value)}
          className={'contributing-form-control'}
          aria-label={COPY.labelName}
          aria-required={true}
          autoComplete={'name'}
          maxLength={255}
          type={'text'}
          value={name}
          required
        />
      </Form.Group>
      <Form.Group className='mb-3'>
        <Form.Label>
          {COPY.labelEmail} <span className='req-asterisk'>*</span>
        </Form.Label>
        <Form.Control
          onChange={(e) => setEmail(e.target.value)}
          className={'contributing-form-control'}
          aria-label={COPY.labelEmail}
          autoComplete={'email'}
          aria-required={true}
          maxLength={255}
          type={'email'}
          value={email}
          required
        />
      </Form.Group>
      <Form.Group className='mb-3'>
        <Form.Label>{COPY.labelGitHub}</Form.Label>
        <Form.Control
          onChange={(e) => setGithubUrl(e.target.value)}
          className={'contributing-form-control'}
          placeholder={'https://github.com/...'}
          aria-label={COPY.labelGitHub}
          aria-required={false}
          autoComplete={'url'}
          value={githubUrl}
          maxLength={255}
          type={'url'}
        />
      </Form.Group>
      <Form.Group className='mb-3'>
        <Form.Label>{COPY.labelMessage}</Form.Label>
        <Form.Control
          onChange={(e) => setMessage(e.target.value)}
          className={'contributing-form-control'}
          aria-label={COPY.labelMessage}
          autoComplete={'message'}
          aria-required={false}
          maxLength={2000}
          as={'textarea'}
          value={message}
          rows={3}
        />
      </Form.Group>
      <div className='d-flex justify-content-end gap-2 mt-3'>
        <Button
          aria-label={'Close contributing inquiry modal'}
          onKeyDown={(e) => {
            handleKeyDown(e, closeModal, e);
          }}
          variant={'outline-light'}
          disabled={submitting}
          onClick={closeModal}
          type={'button'}
          role={'button'}
        >
          Close
        </Button>
        <Button
          aria-label={'Submit contributing inquiry'}
          className={'contributing-submit-btn'}
          disabled={submitting}
          role={'submit'}
          type={'submit'}
        >
          {submitting ? (
            <>
              <Spinner
                animation={'border'}
                className={'me-2'}
                aria-hidden
                size={'sm'}
              />
              <i className='bi bi-send' />
            </>
          ) : (
            COPY.submit
          )}
        </Button>
      </div>
    </Form>
  );

  return (
    <StyledModal
      type='contributing'
      heading={COPY.title}
      closeButton={true}
      size='sm'
      body={body}
    />
  );
};

export default React.memo(ContributingModal);
