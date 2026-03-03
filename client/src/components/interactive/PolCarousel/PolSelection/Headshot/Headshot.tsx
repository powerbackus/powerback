/**
 * @fileoverview Headshot – politician profile image with fallback and selection styling
 *
 * Renders a Congressional headshot from local pfp assets or backup URL. Supports
 * selected/unselected styling (pol-headshot-selected, pol-selector-img) and falls back
 * to a placeholder when src is empty to avoid invalid image requests.
 *
 * @module components/interactive/PolCarousel/PolSelection/Headshot
 * @requires react
 * @requires react-bootstrap/Image
 * @requires @CONSTANTS (BACKUP_IMG)
 * @requires @API
 */

import React, {
  useMemo,
  useReducer,
  useCallback,
  type ReactEventHandler,
} from 'react';
import { Image } from 'react-bootstrap';
import { BACKUP_IMG } from '@CONSTANTS';
import { logError } from '@Utils';
import API from '@API';
import './style.css';

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
};

/**
 * Headshot – politician profile image with fallback and error reporting
 *
 * @param {HeadshotProps} props - Component props
 * @param {string} props.name - Politician display name
 * @param {string} props.cls - Optional class modifier
 * @param {string} props.src - Politician id for image path (empty => placeholder)
 * @param {string} props.id - Current selection id for selected state
 *
 * @example
 * ```tsx
 * <Headshot name="Rep. Smith" cls="pol-selector-img" src="abc123" id={selectedId} />
 * ```
 */
const Headshot = ({ name, cls, src, id }: HeadshotProps) => {
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

  const [backup, setBackup] = useReducer(() => true, false);

  /**
   * Image URL: local pfp when available, backup URL after onError, undefined when src empty
   */
  const IMG_SRC: string | undefined = useMemo(() => {
    if (!src) return undefined;
    return backup ? BACKUP_IMG + src + '.jpg' : `../pfp/${src}.webp`;
  }, [src, backup]);

  /**
   * On image load error: switch to backup URL and notify API
   * @param {React.SyntheticEvent<HTMLImageElement, Event>} e - Image error event
   */
  const handleError = useCallback<ReactEventHandler<HTMLImageElement>>((e) => {
    setBackup();
    const src =
      (e.target as HTMLImageElement).getAttribute('src') ??
      (e.target as HTMLImageElement).attributes.getNamedItem('src')?.value ??
      '';
    API.notifyImgErr(src).catch((err) =>
      logError('Image error notification failed', err)
    );
  }, []);

  console.log('dynamicClass.. fart!', dynamicClass);

  return (
    <div className={'headshot-container'}>
      {IMG_SRC !== undefined ? (
        <Image
          alt={`The official Congressional headshot of ${name}.`}
          aria-label={'Politician profile picture'}
          className={`${dynamicClass} headshot`}
          title={`Representative ${name}`}
          onError={handleError}
          src={IMG_SRC}
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
