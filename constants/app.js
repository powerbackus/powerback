module.exports = {
  APP: {
    PATREON_URL:
      process.env.REACT_APP_PATREON_URL || 'https://www.patreon.com/powerback',
    DISCORD_INVITE:
      process.env.REACT_APP_DISCORD_INVITE || 'https://powerback.us/discord',
    TWITTER_HASHTAGS:
      process.env.REACT_APP_TWITTER_HASHTAGS ||
      'NoDonationWithoutRepresentation,NoRepGetStepped,TakeThePowerBack',
    POSITION_PAPER_PATH:
      process.env.REACT_APP_POSITION_PAPER_PATH || 'position-paper.pdf',
    EMAIL: {
      SUPPORT:
        process.env.REACT_APP_EMAIL_SUPPORT_USER || 'support@powerback.us',
      CONTRIBUTE:
        process.env.REACT_APP_EMAIL_CONTRIBUTORS_USER ||
        'contributors@powerback.us',
    },
    SETTINGS: {
      unsubscribedFrom: [],
      emailReceipts: true,
      showToolTips: true,
      autoTweet: false,
    },
    // new user
    MIN_PASSWORD_LENGTH:
      parseInt(process.env.REACT_APP_MIN_PASSWORD_LENGTH) || 8,
  },
};
