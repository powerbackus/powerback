/**
 * CelebrationAnnouncement – Donation amount and politician copy in card header.
 *
 * @module Confirmation/content/CelebrationAnnouncement
 * @param donation - Donation amount for the celebration
 * @param pol - Politician name
 * @returns Span with formatted celebration announcement
 */

import React from 'react';
import { CONFIRMATION_COPY } from '@CONSTANTS';
import { PolData, useDevice } from '@Contexts';

interface CelebrationAnnouncementProps {
  donation: number;
  pol: PolData;
}

const CelebrationAnnouncement = ({
  donation,
  pol,
}: CelebrationAnnouncementProps) => {
  const { isMobile } = useDevice();

  const text = isMobile
    ? CONFIRMATION_COPY.CELEBRATION_ANNOUNCEMENT_MOBILE(donation, pol)
    : CONFIRMATION_COPY.CELEBRATION_ANNOUNCEMENT(donation, pol);

  return <span className='celebration-announcement'>{text}</span>;
};

export default React.memo(CelebrationAnnouncement);
