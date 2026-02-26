import React from 'react';
import { Constituency } from '@Components/displays';
import { HouseMember } from '@Interfaces';

type SubtitleProps = {
  donee: HouseMember;
};

const Subtitle = ({ donee }: SubtitleProps) => {
  return donee && Object.keys(donee).length ? (
    <Constituency
      {...donee.roles[0]}
      cls={'vertical-timeline-element-subtitle form-text'}
      title={`Celebration for District ${donee.roles[0].district} of ${donee.roles[0].state}`}
      headingSize={4}
    />
  ) : null;
};
export default React.memo(Subtitle);
