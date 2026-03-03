import React, { useMemo, useState } from 'react';
import type { DeviceProp, NavigationProp } from '@Types';
import ReactPlayer from 'react-player/lazy';
import { useDevice } from '@Contexts';

import './style.css';

type VideoPlayerProps = NavigationProp &
  DeviceProp & {
    isInsideModal?: boolean;
    altVideoPath: string;
    videoPath: string;
    light?: boolean;
    height?: string;
    width?: string;
  };

const VideoPlayer = ({
  light = false,
  videoPath,
  altVideoPath,
  isInsideModal,
  width = '30vw',
  height = '34vh',
}: VideoPlayerProps) => {
  const [videoURLForBrowser, setVideoURLForBrowser] = useState(videoPath);

  const handleError = () => {
    if (videoURLForBrowser === altVideoPath) return;
    setVideoURLForBrowser(altVideoPath);
  };

  const { isDesktop } = useDevice();

  const heightStyle = useMemo(
      () => (isDesktop && isInsideModal ? { height: height } : {}),
      [height, isDesktop, isInsideModal]
    ),
    topStyle = useMemo(
      () =>
        isDesktop && isInsideModal
          ? { top: height.substring(0, height.length - 2) + '%' }
          : {},
      [height, isDesktop, isInsideModal]
    );

  return (
    <div
      className={'player-wrapper'}
      style={heightStyle}
    >
      <ReactPlayer
        height={isDesktop ? height : '100%'}
        width={isDesktop ? width : '100%'}
        className={'react-player'}
        url={videoURLForBrowser}
        onError={handleError}
        style={topStyle}
        light={light}
        playsinline
        controls
        playing
        muted
        loop
      />
    </div>
  );
};

export default React.memo(VideoPlayer);
