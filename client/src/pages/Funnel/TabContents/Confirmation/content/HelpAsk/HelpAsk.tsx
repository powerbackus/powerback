/**
 * HelpAsk – CTA for patrons and contributors.
 *
 * Includes links to Patreon, Discord, and contact emails (tracked via getTrackedLink, medium 'support').
 * Displays on desktop in card footer, on mobile in carousel rotation.
 *
 * @module Confirmation/content/HelpAsk
 * @param isMobile - Mobile viewport flag
 * @returns Div with patron/contributor invitation and links
 */

import React, { useCallback } from 'react';
import { useProfile, useDialogue, type ShowModal } from '@Contexts';
import { CONFIRMATION_COPY } from '@CONSTANTS';
import { getTrackedLink } from '@Utils';
import type { DeviceProp } from '@Types';

const HelpAsk = ({ isMobile }: DeviceProp) => {
  const { serverConstants } = useProfile(),
    { setShowModal } = useDialogue();

  const openContributingModal = useCallback(() => {
    (setShowModal as React.Dispatch<React.SetStateAction<ShowModal>>)((s) => ({
      ...s,
      contributing: true,
    }));
  }, [setShowModal]);
  const patreonUrl =
    serverConstants?.APP?.PATREON_URL || 'https://www.patreon.com/powerback';
  const discordUrl =
    serverConstants?.APP?.DISCORD_INVITE || 'https://powerback.us/discord';

  const patreonLink = getTrackedLink(
    patreonUrl,
    { medium: 'support' },
    'patron'
  );
  const discordLink = getTrackedLink(
    discordUrl,
    { medium: 'support' },
    'Discord'
  );

  const handleContribute = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      openContributingModal();
    },
    [openContributingModal]
  );

  return (
    <div
      id={'help-ask'}
      className={'ps-lg-2'}
    >
      <p>
        {CONFIRMATION_COPY.HELP_ASK.lifeblood} Become a{' '}
        <a
          className={'natural-link'}
          href={patreonLink.trackedUrl}
          onClick={patreonLink.onClick}
        >
          patron
        </a>
        {', join our '}
        <a
          className={'natural-link'}
          href={discordLink.trackedUrl}
          onClick={discordLink.onClick}
        >
          Discord
        </a>
        , or&nbsp;
        <a
          href='/'
          className={'natural-link'}
          onClick={handleContribute}
        >
          {CONFIRMATION_COPY.HELP_ASK.contribute}
        </a>{' '}
        {CONFIRMATION_COPY.HELP_ASK.roles}
      </p>
      {isMobile ? null : <hr />}
    </div>
  );
};

export default React.memo(HelpAsk);
