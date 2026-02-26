import React from 'react';
import { Stack, ButtonGroup } from 'react-bootstrap';
import { APP, CONFIRMATION_COPY } from '@CONSTANTS';
import SocialNetworkShareButton, { MastodonShareButton } from './share';
import type { Bill } from '@Interfaces';
import {
  XIcon,
  BlueskyIcon,
  ThreadsIcon,
  TelegramIcon,
  LinkedinIcon,
  FacebookIcon,
  BlueskyShareButton,
  TwitterShareButton,
  ThreadsShareButton,
  TelegramShareButton,
  LinkedinShareButton,
  FacebookShareButton,
} from 'react-share';
import './style.css';

const SHARED_PAGE = 'powerback.us';
const TWITTER_HASHTAGS = 'NoDonationWithoutRepresentation,TakeThePowerback';

const className = 'pt-lg-2 px-lg-2 pb-sm-0';

const iconSize = APP.SOCIALS.buttonSet.iconSize,
  buttonHeight = APP.SOCIALS.buttonSet.height,
  buttonWidth = APP.SOCIALS.buttonSet.width;

interface SocialAccounts {
  truthSocial?: string;
  facebook?: string;
  mastodon?: string;
  twitter?: string;
  youtube?: string;
  bluesky?: string;
}

type SocialsProps = {
  accounts: SocialAccounts;
  bill: Bill;
  /** Optional suffix appended to share message (e.g. escrow total). */
  shareExtras?: string;
};

const Socials = ({ bill, accounts, shareExtras }: SocialsProps) => {
  const taunt = CONFIRMATION_COPY.SOCIALS.taunt(bill.bill);
  const effectiveTaunt = taunt + (shareExtras ?? '');

  return (
    <Stack
      direction='vertical'
      gap={1}
    >
      <ButtonGroup
        size={'sm'}
        className={'pb-sm-3 pb-lg-2 social-btns'}
      >
        <FacebookShareButton
          className={className}
          hashtag={
            !!accounts.facebook
              ? `${accounts.facebook} <--(this is the Represenstative's page name but you need to '@' them manually)`
              : '#TakeThePowerback'
          }
          url={SHARED_PAGE}
        >
          <FacebookIcon
            size={iconSize}
            round
          />
        </FacebookShareButton>
        <LinkedinShareButton
          className={className}
          url={SHARED_PAGE}
        >
          <LinkedinIcon
            size={iconSize}
            round
          />
        </LinkedinShareButton>
        <TelegramShareButton
          className={className}
          url={SHARED_PAGE}
        >
          <TelegramIcon
            size={iconSize}
            round
          />
        </TelegramShareButton>
        <ThreadsShareButton
          className={className}
          url={SHARED_PAGE}
        >
          <ThreadsIcon
            size={iconSize}
            round
          />
        </ThreadsShareButton>
        <TwitterShareButton
          title={`@${accounts.twitter} ${effectiveTaunt}`}
          hashtags={TWITTER_HASHTAGS.split(',')}
          className={className}
          url={SHARED_PAGE}
        >
          <XIcon
            size={iconSize}
            round
          />
        </TwitterShareButton>
        <BlueskyShareButton
          title={
            (accounts.bluesky
              ? `@${accounts.bluesky}`
              : CONFIRMATION_COPY.SOCIALS.singleSponsor) + effectiveTaunt
          }
          className={className}
          url={SHARED_PAGE}
        >
          <BlueskyIcon
            size={iconSize}
            round
          />
        </BlueskyShareButton>
        <MastodonShareButton
          endpoint={APP.SOCIALS.buttons.mastodon.endpoint}
          quote={
            (accounts.mastodon ? `@${accounts.mastodon} ` : '') + effectiveTaunt
          }
          url={SHARED_PAGE}
          className={className}
        >
          <img
            src={`../${APP.SOCIALS.buttons.mastodon.icon}`}
            alt={APP.SOCIALS.buttons.mastodon.alt}
            height={buttonHeight}
            width={buttonWidth}
          />
        </MastodonShareButton>
        <SocialNetworkShareButton
          url={SHARED_PAGE}
          className={className + ' truth-social-share-button'}
          quote={
            (accounts.truthSocial
              ? `@${accounts.truthSocial}`
              : '@realDonaldTrump') + effectiveTaunt
          }
          endpoint={APP.SOCIALS.buttons.truthSocial.endpoint}
        >
          <img
            src={`../${APP.SOCIALS.buttons.truthSocial.icon}`}
            alt={APP.SOCIALS.buttons.truthSocial.alt}
            height={buttonHeight}
            width={buttonWidth}
          />
        </SocialNetworkShareButton>
      </ButtonGroup>
    </Stack>
  );
};

export default React.memo(Socials);
