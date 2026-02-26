import { Celebration } from '@Types';
import { SHARED_DOMAIN } from '@CONSTANTS';

const TWITTER_CTA = '! Find out at @PowerbackApp',
  BILL_SHORT_TITLE_CHAR_LIMIT = 30,
  PB_TCO_URI = `https://${SHARED_DOMAIN}`,
  TWITTER_URI = process.env.REACT_APP_TWITTER_INTENT_BASE_URL,
  TWITTER_HASHTAGS = process.env.REACT_APP_TWITTER_HASHTAGS,
  TWITTER_TEXT =
    "I just made a campaign donation that you can't cash until action is taken on ",
  EXT_URI_SETTINGS =
    'toolbar=yes,location=yes,status=no,menubar=yes,scrollbars=yes,resizable=yes,width=420,height=420';

type Props = {
  bill: string;
  short_title: string;
};

export const tweetDonation = (
  { bill, short_title }: Props,
  celebration: Celebration
) => {
  return window.open(
    TWITTER_URI +
      '&hashtags=' +
      TWITTER_HASHTAGS +
      (celebration.twitter && celebration.twitter !== ''
        ? '&screen_name=' + celebration.twitter
        : '') +
      '&text=' +
      TWITTER_TEXT +
      bill +
      ((short_title.length <= BILL_SHORT_TITLE_CHAR_LIMIT &&
        ', ' + short_title) ||
        '') +
      TWITTER_CTA +
      '&url=' +
      PB_TCO_URI,
    '__blank',
    EXT_URI_SETTINGS
  );
};
