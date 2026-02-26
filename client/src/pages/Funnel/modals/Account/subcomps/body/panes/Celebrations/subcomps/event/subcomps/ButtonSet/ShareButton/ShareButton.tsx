import React, { useRef, useEffect, useCallback } from 'react';
import SocialNetworkShareButton from '@Components/interactive/Socials/share';
import { APP, SHARED_DOMAIN } from '@CONSTANTS';
import { Dropdown } from 'react-bootstrap';
import {
  XIcon,
  BlueskyIcon,
  ThreadsIcon,
  FacebookIcon,
  LinkedinIcon,
  TelegramIcon,
  BlueskyShareButton,
  ThreadsShareButton,
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  FacebookMessengerIcon,
  FacebookMessengerShareButton,
} from 'react-share';
import './style.css';

type Platform = {
  name: string;
  IconComponent?: React.ComponentType<Record<string, unknown>> | null;
  ShareComponent: React.ComponentType<Record<string, unknown>>;
  props: Record<string, unknown> & {
    endpoint?: string;
    appId?: string;
    url: string;
  };
  customIcon?: React.ReactNode;
};

const socialPlatforms = [
  {
    name: 'X',
    IconComponent: XIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: TwitterShareButton,
  },
  {
    name: 'Threads',
    IconComponent: ThreadsIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: ThreadsShareButton,
  },
  {
    name: 'Bluesky',
    IconComponent: BlueskyIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: BlueskyShareButton,
  },
  {
    name: 'Telegram',
    IconComponent: TelegramIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: TelegramShareButton,
  },
  {
    name: 'LinkedIn',
    IconComponent: LinkedinIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: LinkedinShareButton,
  },
  {
    name: 'Facebook',
    IconComponent: FacebookIcon,
    props: { url: SHARED_DOMAIN },
    ShareComponent: FacebookShareButton,
  },
  {
    name: 'Messenger',
    props: {
      url: SHARED_DOMAIN,
      appId: APP.SOCIALS.buttons.facebookMessenger.appid,
    },
    ShareComponent: FacebookMessengerShareButton,
    IconComponent: FacebookMessengerIcon,
  },
  {
    name: 'Truth Social',
    IconComponent: null,
    ShareComponent: SocialNetworkShareButton,
    props: {
      endpoint: APP.SOCIALS.buttons.truthSocial.endpoint,
      url: SHARED_DOMAIN,
    },
    customIcon: (
      <img
        src={`../${APP.SOCIALS.buttons.truthSocial.icon}`}
        alt={'Truth Social'}
        height={24}
        width={24}
      />
    ),
  },
] as unknown as Platform[];

const ShareButton = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleMenuWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const getFocusableButtons = useCallback((): HTMLElement[] => {
    const root = menuRef.current ?? dropdownRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        '.share-button-menu .share-button-social'
      )
    );
  }, []);

  const focusByDelta = useCallback(
    (delta: number) => {
      const items = getFocusableButtons();
      if (!items.length) return;

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? items.indexOf(active) : -1;

      let nextIndex = currentIndex + delta;

      // If nothing in the list is focused yet, start at first/last.
      if (currentIndex === -1) nextIndex = delta > 0 ? 0 : items.length - 1;

      // Clamp
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= items.length) nextIndex = items.length - 1;

      items[nextIndex]?.focus();
    },
    [getFocusableButtons]
  );

  const handleMenuKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        focusByDelta(+1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        focusByDelta(-1);
        return;
      }

      // Optional: close on Escape
      // (React-Bootstrap usually handles this, but keeping it is fine.)
      if (e.key === 'Escape') {
        e.stopPropagation();
      }
    },
    [focusByDelta]
  );

  // Calculate available viewport space for the dropdown when menu appears
  useEffect(() => {
    const calculateMaxHeight = () => {
      const menuElement = document.querySelector(
        '.share-button-menu'
      ) as HTMLElement | null;
      if (!menuElement) return;

      menuRef.current = menuElement as HTMLDivElement;

      const rect = menuElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - rect.top;
      const spaceAbove = rect.top;

      const availableSpace = Math.max(spaceBelow, spaceAbove) - 20;
      const calculatedHeight = Math.min(Math.max(availableSpace, 200), 400);

      menuElement.style.maxHeight = `${calculatedHeight}px`;
    };

    let timeoutId: NodeJS.Timeout | undefined;

    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateMaxHeight, 50);
    });

    if (dropdownRef.current) {
      observer.observe(dropdownRef.current, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    let resizeTimeout: NodeJS.Timeout | undefined;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateMaxHeight, 100);
    };

    window.addEventListener('resize', handleResize);

    const initialTimer = setTimeout(calculateMaxHeight, 100);

    return () => {
      clearTimeout(initialTimer);
      if (timeoutId) clearTimeout(timeoutId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const popperConfig = {
    strategy: 'fixed' as const,
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport',
          altAxis: true,
          padding: 8,
        },
      },
      {
        name: 'flip',
        options: {
          fallbackPlacements: [
            'bottom-start',
            'top-start',
            'bottom-end',
            'top-end',
          ],
        },
      },
    ],
  };

  return (
    <div ref={dropdownRef}>
      <Dropdown
        align='start'
        autoClose='outside'
        className='share-button-dropdown'
      >
        <Dropdown.Toggle
          size='sm'
          variant='outline-secondary'
          className='share-button-toggle'
        >
          <i className='bi bi-share' />
          <span className='share-button-label'>Share</span>
        </Dropdown.Toggle>

        <Dropdown.Menu
          onWheel={handleMenuWheel}
          popperConfig={popperConfig}
          className='share-button-menu'
          onKeyDownCapture={handleMenuKeyDownCapture}
        >
          {socialPlatforms.map((platform, idx) => {
            const { ShareComponent, IconComponent, customIcon, props, name } =
              platform;

            const shareProps = {
              ...props,
              className: 'share-button-social',
              endpoint: props.endpoint ?? '',
            };

            const extraProps =
              platform.name === 'Messenger' ? { appId: props.appId ?? '' } : {};

            return (
              <React.Fragment key={`${platform.name}-share-button-item`}>
                <Dropdown.Item
                  as='div'
                  className='share-button-item'
                >
                  <ShareComponent
                    {...shareProps}
                    {...extraProps}
                  >
                    <div className='share-button-icon'>
                      {customIcon ||
                        (IconComponent && (
                          <IconComponent
                            size={24}
                            round
                          />
                        ))}
                    </div>
                    <span className='share-button-platform-name'>{name}</span>
                  </ShareComponent>
                </Dropdown.Item>

                {idx < socialPlatforms.length - 1 && <Dropdown.Divider />}
              </React.Fragment>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default React.memo(ShareButton);
