/**
 * Explainer modal. Video player with splash copy.
 * @module Explainer
 */
import React from 'react';
import { MEDIA_PATHS, SPLASH_COPY } from '@CONSTANTS';
import { VideoPlayer } from '@Components/interactive';
import { StyledModal } from '@Components/modals';
import './style.css';

const ExplainerModal = () => (
  <StyledModal
    heading={SPLASH_COPY.SPLASH.COPY.explainer}
    closeButton={true}
    type={'explainer'}
    body={
      <VideoPlayer
        altVideoPath={MEDIA_PATHS.EXPLAINER.MP4}
        videoPath={MEDIA_PATHS.EXPLAINER.WEBM}
        isInsideModal={true}
        isDesktop={true}
        light={true}
      />
    }
  />
);

export default React.memo(ExplainerModal);
