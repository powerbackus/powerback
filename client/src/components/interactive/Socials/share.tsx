import React, { useCallback } from 'react';
import { Button } from 'react-bootstrap';

export interface SocialNetworkShareButtonProps {
  /** height of the popup in px */
  popupHeight?: number;
  /** width of the popup in px */
  popupWidth?: number;
  /** Optional additional class name */
  className?: string;
  /** Custom icon or JSX (e.g., an <img> or SVG component) */
  children?: React.ReactNode;
  /** Make the button round (default: true) */
  round?: boolean;
  /** Icon size in pixels (default: 32) */
  size?: number;
  /** The base endpoint for your network's share URL, e.g., https://real-network.com/share */
  endpoint: string;
  /** Optional quote or text snippet to include */
  quote?: string;
  /** The URL to share (e.g., current page URL) */
  url: string;
}

/**
 * Manual share button wrapper for networks that React-Share doesn't export.
 * Mimics React-Share's size/padding/borderRadius conventions.
 */
const SocialNetworkShareButton = ({
  popupHeight = 400, // <- sensible default
  popupWidth = 600, // <- sensible default
  round = true,
  size = 32,
  className,
  endpoint,
  children,
  quote,
  url,
}: SocialNetworkShareButtonProps) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedQuote = quote ? `&text=${encodeURIComponent(quote)}` : '';
  const shareUrl = `${endpoint}?url=${encodedUrl}${encodedQuote}`;

  const handleClick = useCallback(() => {
    const specs =
        `width=${popupWidth},height=${popupHeight}` +
        `,toolbar=0,menubar=0,location=0`,
      popup = window.open(shareUrl, '_blank', specs);

    if (popup) popup.focus();
  }, [popupHeight, popupWidth, shareUrl]);

  const dimension = size + 16,
    borderRadius = round ? dimension / 2 : 4;

  return (
    <Button
      onClick={handleClick}
      className={['react-share__ShareButton', 'social-network', className]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderRadius,
      }}
    >
      {children
        ? React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement, {
              style: {
                verticalAlign: 'middle',
                marginLeft: '-5px',
                marginTop: '-2px',
                height: size,
                width: size,
              },
            })
          : children
        : null}
    </Button>
  );
};

/**
 * Mastodon share: instance share page uses ?text= only (full toot content).
 * Builds text as quote + url so the pre-filled toot is copy-paste friendly.
 */
export interface MastodonShareButtonProps {
  children?: React.ReactNode;
  popupHeight?: number;
  popupWidth?: number;
  className?: string;
  endpoint: string;
  round?: boolean;
  quote?: string;
  size?: number;
  url: string;
}

const MastodonShareButton = ({
  popupHeight = 500,
  popupWidth = 600,
  round = true,
  size = 32,
  className,
  endpoint,
  children,
  quote,
  url,
}: MastodonShareButtonProps) => {
  const fullText = [quote, url].filter(Boolean).join('\n\n');
  const shareUrl = `${endpoint}?text=${encodeURIComponent(fullText)}`;

  const handleClick = useCallback(() => {
    const specs =
        `width=${popupWidth},height=${popupHeight}` +
        `,toolbar=0,menubar=0,location=0`,
      popup = window.open(shareUrl, '_blank', specs);
    if (popup) popup.focus();
  }, [popupHeight, popupWidth, shareUrl]);

  const dimension = size + 16,
    borderRadius = round ? dimension / 2 : 4;

  return (
    <Button
      onClick={handleClick}
      className={['react-share__ShareButton', 'social-network', className]
        .filter(Boolean)
        .join(' ')}
      style={{ borderRadius }}
    >
      {children
        ? React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement, {
              style: {
                verticalAlign: 'middle',
                height: size,
                width: size,
              },
            })
          : children
        : null}
    </Button>
  );
};

export { MastodonShareButton };
export default React.memo(SocialNetworkShareButton);
