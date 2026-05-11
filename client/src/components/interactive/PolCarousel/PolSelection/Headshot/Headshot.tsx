/**
 * @fileoverview Headshot – politician profile image with fallback and selection styling
 *
 * Renders a Congressional headshot from local pfp assets or backup URL. Supports
 * selected/unselected styling (pol-headshot-selected, pol-selector-img) and falls back
 * to a placeholder when src is empty or when local webp and Congress JPG both fail.
 *
 * @module components/interactive/PolCarousel/PolSelection/Headshot
 * @requires react
 * @requires react-bootstrap/Image
 * @requires @Utils (polHeadshot URLs, logging)
 * @requires @API
 */

import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactEventHandler,
} from 'react';
import { Image } from 'react-bootstrap';
import {
  logError,
  logWarn,
  polHeadshotCongressJpgSrc,
  polHeadshotLocalWebpSrc,
} from '@Utils';
import API from '@API';
import './style.css';

type HeadshotLoadPhase = 'webp' | 'backup' | 'failed';

/** Props for Headshot */
type HeadshotProps = {
  /** Politician display name (for alt/title) */
  name: string;
  /** Optional class modifier (e.g. 'checkout-headshot') */
  cls: string;
  /** Politician id for image path; empty skips image and shows placeholder */
  src: string;
  /** Current selection id; when src === id this headshot is selected */
  id: string;
  /** Extra classes on the img (e.g. card-img-top for checkout card layout) */
  imgClassName?: string;
};

/**
 * Headshot – politician profile image with fallback and error reporting
 *
 * @param {HeadshotProps} props - Component props
 * @param {string} props.name - Politician display name
 * @param {string} props.cls - Optional class modifier
 * @param {string} props.src - Politician id for image path (empty => placeholder)
 * @param {string} props.id - Current selection id for selected state
 * @param {string} [props.imgClassName] - Optional extra img classes (e.g. card-img-top)
 *
 * @example
 * ```tsx
 * <Headshot name="Rep. Smith" cls="pol-selector-img" src="abc123" id={selectedId} />
 * ```
 */
const Headshot = ({ name, cls, src, id, imgClassName = '' }: HeadshotProps) => {
  /**
   * Resolve selected vs unselected class during render so the dashed border
   * appears on first paint (fixes mobile where async setState could miss a frame).
   */
  const dynamicClass = useMemo(() => {
    if (src === id) {
      if (cls.length) return cls;
      return 'pol-headshot-selected';
    }
    if (cls === 'checkout-headshot') return cls;
    return 'pol-selector-img';
  }, [id, src, cls]);

  const [phase, setPhase] = useState<HeadshotLoadPhase>('webp');
  const reportedMissingWebpRef = useRef(false);
  const reportedNoUsableRef = useRef(false);

  useEffect(() => {
    setPhase('webp');
    reportedMissingWebpRef.current = false;
    reportedNoUsableRef.current = false;
  }, [src]);

  /**
   * Image URL: local webp, then Congress.gov JPG; undefined when no src or both failed.
   */
  const IMG_SRC: string | undefined = useMemo(() => {
    if (!src || phase === 'failed') return undefined;
    if (phase === 'backup') return polHeadshotCongressJpgSrc(src);
    return polHeadshotLocalWebpSrc(src);
  }, [src, phase]);

  /**
   * On image load error: notify when bundled webp fails (ops: add webp), then try JPG.
   * If JPG also fails, second-tier notify and show placeholder.
   */
  const handleError = useCallback<ReactEventHandler<HTMLImageElement>>(() => {
    if (phase === 'webp') {
      if (src && !reportedMissingWebpRef.current) {
        reportedMissingWebpRef.current = true;
        API.notifyImgErr(src, 'missing_local_webp').catch((err) =>
          logError('Image error notification failed', err)
        );
      }
      setPhase('backup');
      return;
    }
    if (phase === 'backup') {
      setPhase('failed');
      if (src && !reportedNoUsableRef.current) {
        reportedNoUsableRef.current = true;
        if (process.env.NODE_ENV !== 'production') {
          logWarn(
            `Pol headshot: local webp and Congress JPG failed for bioguideId=${src}`
          );
        }
        API.notifyImgErr(src, 'no_usable_image').catch((err) =>
          logError('Image error notification failed', err)
        );
      }
    }
  }, [phase, src]);

  const imageClassName = useMemo(
    () =>
      [dynamicClass, 'headshot', imgClassName].filter(Boolean).join(' ').trim(),
    [dynamicClass, imgClassName]
  );

  return (
    <div className={'headshot-container'}>
      {IMG_SRC !== undefined ? (
        <Image
          alt={`The official Congressional headshot of ${name}.`}
          aria-label={'Politician profile picture'}
          className={imageClassName}
          title={`Representative ${name}`}
          onError={handleError}
          src={IMG_SRC}
          loading={'lazy'}
        />
      ) : (
        <div
          aria-hidden
          className={`headshot headshot-placeholder`}
        />
      )}
    </div>
  );
};

export default React.memo(Headshot);
