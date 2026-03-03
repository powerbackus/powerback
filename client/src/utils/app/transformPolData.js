// converts the old ProPublica-based db schema to the React app state object shape

export const transformPolData = (choice) => {
  return {
    name: choice.first_name + ' ' + choice.last_name,
    truth_social: choice.truth_social_account ?? '',
    FEC_id: choice.roles[0].fec_candidate_id ?? '',
    instagram: choice.instagram_account ?? '',
    facebook: choice.facebook_account ?? '',
    mastodon: choice.mastodon_account ?? '',
    bluesky: choice.bluesky_account ?? '',
    middle_name: choice.middle_name ?? '',
    youtube: choice.youtube_account ?? '',
    district: choice.roles[0].district,
    chamber: choice.roles[0].chamber,
    twitter: choice.twitter_account,
    first_name: choice.first_name,
    state: choice.roles[0].state,
    last_name: choice.last_name,
    ocd_id: choice.ocd_id ?? '',
    id: choice.id,
  };
};
