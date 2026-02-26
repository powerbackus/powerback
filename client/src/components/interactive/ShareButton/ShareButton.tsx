/**
 * ShareButton – dropdown of social share actions.
 * Optional bill + accounts enable politician-specific share copy (Confirmation).
 *
 * @module ShareButton
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import SocialNetworkShareButton, {
  MastodonShareButton,
} from '@Components/interactive/Socials/share';
import { Dropdown } from 'react-bootstrap';
import { APP, CONFIRMATION_COPY } from '@CONSTANTS';
import type { Bill } from '@Interfaces';
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
} from 'react-share';
import './style.css';

const SHARED_URL = process.env.REACT_APP_SHARED_DOMAIN || 'powerback.us';
const TWITTER_HASHTAGS = 'NoDonationWithoutRepresentation,TakeThePowerback';

export interface SocialAccounts {
  truthSocial?: string;
  facebook?: string;
  mastodon?: string;
  twitter?: string;
  youtube?: string;
  bluesky?: string;
}

type Platform = {
  name: string;
  IconComponent?: React.ComponentType<any> | null;
  ShareComponent: React.ComponentType<any>;
  props: Record<string, unknown>;
  customIcon?: React.ReactNode;
};

export interface ShareButtonProps {
  bill?: Bill;
  accounts?: SocialAccounts;
  /** Optional suffix appended to the share taunt (e.g. escrow total for Confirmation). */
  shareExtras?: string;
}

const truthSocialIcon = (
  <img
    src={`${process.env.PUBLIC_URL || ''}/${APP.SOCIALS.buttons.truthSocial.icon}`}
    alt={APP.SOCIALS.buttons.truthSocial.alt}
    height={24}
    width={24}
  />
);

const mastodonIcon = (
  <img
    src={`${process.env.PUBLIC_URL || ''}/${APP.SOCIALS.buttons.mastodon.icon}`}
    alt={APP.SOCIALS.buttons.mastodon.alt}
    height={24}
    width={24}
  />
);

const basePlatforms: Platform[] = [
  {
    name: 'X',
    IconComponent: XIcon,
    props: { url: SHARED_URL },
    ShareComponent: TwitterShareButton,
  },
  {
    name: 'Threads',
    IconComponent: ThreadsIcon,
    props: { url: SHARED_URL },
    ShareComponent: ThreadsShareButton,
  },
  {
    name: 'Bluesky',
    IconComponent: BlueskyIcon,
    props: { url: SHARED_URL },
    ShareComponent: BlueskyShareButton,
  },
  {
    name: 'Mastodon',
    IconComponent: null,
    ShareComponent: MastodonShareButton,
    props: {
      endpoint: APP.SOCIALS.buttons.mastodon.endpoint,
      url: SHARED_URL,
    },
    customIcon: mastodonIcon,
  },
  {
    name: 'Telegram',
    IconComponent: TelegramIcon,
    props: { url: SHARED_URL },
    ShareComponent: TelegramShareButton,
  },
  {
    name: 'LinkedIn',
    IconComponent: LinkedinIcon,
    props: { url: SHARED_URL },
    ShareComponent: LinkedinShareButton,
  },
  {
    name: 'Facebook',
    IconComponent: FacebookIcon,
    props: { url: SHARED_URL },
    ShareComponent: FacebookShareButton,
  },
  {
    name: 'Truth Social',
    IconComponent: null,
    ShareComponent: SocialNetworkShareButton,
    props: {
      endpoint: APP.SOCIALS.buttons.truthSocial.endpoint,
      url: SHARED_URL,
    },
    customIcon: truthSocialIcon,
  },
];

const ShareButton = ({ bill, accounts, shareExtras }: ShareButtonProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const taunt = useMemo(
    () => (bill ? CONFIRMATION_COPY.SOCIALS.taunt(bill.bill) : ''),
    [bill]
  );

  const effectiveTaunt = useMemo(
    () => taunt + (shareExtras ?? ''),
    [taunt, shareExtras]
  );

  const platforms = useMemo(() => {
    if (!bill || !accounts) return basePlatforms;

    return basePlatforms.map((p) => {
      const base = { ...p, props: { ...p.props } };
      if (p.name === 'X') {
        base.props = {
          ...base.props,
          title: accounts.twitter
            ? `@${accounts.twitter} ${effectiveTaunt}`
            : effectiveTaunt,
          hashtags: TWITTER_HASHTAGS.split(','),
        };
      }
      if (p.name === 'Bluesky') {
        base.props = {
          ...base.props,
          title:
            (accounts.bluesky
              ? `@${accounts.bluesky}`
              : CONFIRMATION_COPY.SOCIALS.singleSponsor) + effectiveTaunt,
        };
      }
      if (p.name === 'Truth Social') {
        base.props = {
          ...base.props,
          quote:
            (accounts.truthSocial
              ? `@${accounts.truthSocial}`
              : '@realDonaldTrump') + effectiveTaunt,
        };
      }
      if (p.name === 'Mastodon') {
        base.props = {
          ...base.props,
          quote:
            (accounts.mastodon ? `@${accounts.mastodon} ` : '') +
            effectiveTaunt,
        };
      }
      if (p.name === 'Facebook') {
        base.props = {
          ...base.props,
          hashtag: accounts.facebook
            ? `${accounts.facebook} <--(this is the Represenstative's page name but you need to '@' them manually)`
            : '#TakeThePowerback',
        };
      }
      return base;
    });
  }, [bill, accounts, effectiveTaunt]);

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

      if (currentIndex === -1) nextIndex = delta > 0 ? 0 : items.length - 1;

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

      if (e.key === 'Escape') {
        e.stopPropagation();
      }
    },
    [focusByDelta]
  );

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
          {platforms.map((platform, idx) => {
            const { ShareComponent, IconComponent, customIcon, props, name } =
              platform;

            const shareProps = {
              ...props,
              className: 'share-button-social',
              endpoint: (props as Record<string, unknown>).endpoint ?? '',
            };

            const extraProps =
              platform.name === 'Messenger'
                ? { appId: (props as Record<string, unknown>).appId ?? '' }
                : {};

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

                {idx < platforms.length - 1 && <Dropdown.Divider />}
              </React.Fragment>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default React.memo(ShareButton);
