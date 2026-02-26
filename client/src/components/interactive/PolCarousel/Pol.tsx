import React, { CSSProperties, useCallback, useState } from 'react';
import { PolData, useDevice, useDonationState } from '@Contexts';
import { PolSelection } from '@Components/interactive';
import { HouseMember, PolsOnParade } from '@Interfaces';
import { transformPolData } from '@Utils';
import { PolDonations } from '@API';

export interface PolSilage {
  index: number; // index of this cell
  data: HouseMember[]; // array of representatives
  style: CSSProperties; // inline position/style provided by windowing
  polsOnParade: PolsOnParade | undefined;
  totalCelebrations: PolDonations[] | PolDonations;
}

const Pol = ({
  data,
  index,
  style,
  polsOnParade,
  totalCelebrations,
  ...props
}: PolSilage) => {
  const { polData } = useDonationState();
  const { isMobile } = useDevice();
  const [polDonationsInEscrow, setPolDonationsInEscrow] = useState(0);
  const [polDonationTally, setPolDonationTally] = useState(0);

  const tallyDonations = useCallback(
    (id: string) => {
      let [polDonations] = (totalCelebrations as PolDonations[]).filter(
        (c) => c.pol_id === id
      );
      if (!polDonations) {
        return;
      }
      setPolDonationTally(polDonations.count);
      setPolDonationsInEscrow(polDonations.donation);
    },
    [totalCelebrations]
  );

  const choice = data[index];
  return (
    <div
      style={style}
      className='pol-w-card'
      key={choice.id}
    >
      <PolSelection
        {...props}
        {...choice}
        id={choice.id}
        index={index}
        polData={polData}
        isMobile={isMobile}
        polsOnParade={polsOnParade}
        info={transformPolData(choice)}
        description={polData as PolData}
        polDonationTally={polDonationTally}
        polDonationsInEscrow={polDonationsInEscrow}
        lastName={choice.last_name}
        state={choice.roles[0].state}
        firstName={choice.first_name}
        middleName={choice.middle_name}
        tallyDonations={tallyDonations}
        bluesky={choice.bluesky_account}
        twitter={choice.twitter_account}
        youtube={choice.youtube_account}
        chamber={choice.roles[0].chamber}
        facebook={choice.facebook_account}
        mastodon={choice.mastodon_account}
        district={choice.roles[0].district}
        instagram={choice.instagram_account}
        FEC_id={choice.roles[0].fec_candidate_id}
        truth_social={choice.truth_social_account}
        name={`${choice.first_name} ${choice.last_name}`}
      />
    </div>
  );
};

export default React.memo(Pol);
