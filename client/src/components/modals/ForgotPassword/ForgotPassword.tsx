import React, { useState, useCallback } from 'react';
import { Stack, Overlay, Popover, CloseButton } from 'react-bootstrap';
import { useDialogue, type ShowOverlay } from '@Contexts';
import { ACCOUNT_COPY } from '@CONSTANTS';
import ForgotPasswordForm from './form';
import './style.css';

type ForgotPasswordProps = {
  forgotPwOverlayTarget: HTMLSpanElement | null;
};

const ForgotPasswordOverlay = ({
  forgotPwOverlayTarget = null,
}: ForgotPasswordProps) => {
  const { showModal, showOverlay, setShowAlert, setShowOverlay } =
    useDialogue();

  const [validated, setValidated] = useState(false),
    handleClose = useCallback(
      () => setShowOverlay((s: ShowOverlay) => ({ ...s, resetPass: false })),
      [setShowOverlay]
    ),
    handleExit = useCallback(() => setValidated(false), []);

  const exceptCredentialsModal = { ...showModal };
  delete (exceptCredentialsModal as Record<string, unknown>)['credentials'];

  return (
    <Overlay
      placement={'top'}
      onExiting={handleExit}
      target={forgotPwOverlayTarget}
      show={
        showOverlay.resetPass &&
        Object.values(exceptCredentialsModal).every((o) => !o)
      } // overlay otherwise covered by other modals
    >
      <Popover id={'forgot-pass-pop'}>
        <Popover.Header>
          <Stack direction={'horizontal'}>
            {ACCOUNT_COPY.FORGOT_PW_OVERLAY.heading}
            <CloseButton
              onClick={handleClose}
              aria-label={'hide forgot password prompt'}
            />
          </Stack>
        </Popover.Header>

        <Popover.Body>
          <div className={'form-prompt'}>
            {ACCOUNT_COPY.FORGOT_PW_OVERLAY.prompt}
            <br />
            {ACCOUNT_COPY.FORGOT_PW_OVERLAY.hint}
          </div>

          <ForgotPasswordForm
            setShowOverlay={setShowOverlay}
            setValidated={setValidated}
            setAlert={setShowAlert}
            validated={validated}
          />
        </Popover.Body>
      </Popover>
    </Overlay>
  );
};

export default React.memo(ForgotPasswordOverlay);
