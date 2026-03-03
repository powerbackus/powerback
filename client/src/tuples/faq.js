// URLs sourced from constants (relative path for Node build scripts; @CONSTANTS is Webpack-only)
const {
  GIT_REPO,
  PATREON_URL,
  TWITTER_URL,
  DISCORD_INVITE,
  POSITION_PAPER_PATH,
  WE_THE_PEOPLE_BILL_URL,
} = require('../constants/constants.node');

// Alias for consistency
const GITHUB_URL = GIT_REPO;
const DISCORD_URL = DISCORD_INVITE;

module.exports = [
  {
    key: 1,
    topic: 'How It Works',
    questions: [
      {
        q: 'What is POWERBACK.us?',
        a: `POWERBACK.us ("POWERBACK") is a donation platform that gives small-dollar donors real leverage. Instead of giving money directly to campaigns, your donations are held in escrow and only delivered when specific conditions are met. This creates accountability and ensures your money goes to politicians who actually represent your interests.`,
        key: 1,
      },
      {
        q: 'Why should I only use POWERBACK for my political contributions, and not other platforms?',
        a: `POWERBACK is built for voters, not politicians. We hold your donations in escrow until conditions are met, giving you real leverage. Our first goal is a House floor vote on the "<a href="${WE_THE_PEOPLE_BILL_URL}" target="_blank" rel="noopener noreferrer">We The People</a>" amendment to overturn Citizens United.`,
        key: 2,
      },

      {
        q: 'Why give money to politicians when nothing ever changes, and they may not even get it?',
        a: "Your donation becomes a public record you can share and organize around. Tag your Representatives and ask why the money's still sitting there. POWERBACK brings the receipts.",
        key: 3,
      },
      {
        q: 'Can I give to challengers through POWERBACK, or only incumbents?',
        a: "We focus on current office holders to create immediate pressure. Term limits are popular, but fund limits are powerful. If incumbents don't serve the people, that creates opportunities for challengers.",
        key: 4,
      },
    ],
  },
  {
    key: 2,
    topic: 'Celebrations',
    questions: [
      {
        q: 'What is a Celebration?',
        a: `A Celebration is your conditional donation. POWERBACK holds it in escrow and only delivers it to the campaign if the "<a href="${WE_THE_PEOPLE_BILL_URL}" target="_blank" rel="noopener noreferrer">We The People</a>" amendment gets a House floor vote. It's tied to the vote happening, not any individual lawmaker's actions.`,
        key: 1,
      },
      {
        q: 'What if a vote on We The People never happens? Do I get a refund?',
        a: 'No. Refunds would erase the stakes. Although Celebrations are irreversible, if they fail, your donation goes to support POWERBACK as a fallback so we can maintain the platform and expand it beyond one bill, while refusing to reward political hypocrisy and inaction.',
        key: 2,
      },
      {
        q: "Why isn't my Representative/State listed?",
        a: 'We only list Representatives that are facing serious, financed challengers to their seat according to campaign filings with the Federal Election Commission. In other words, your Representative is virtually unopposed this election. Run against them!',
        key: 3,
      },
      {
        q: 'Does POWERBACK cover any other bills, or the Senate, or local elections?',
        a: `Right now, we only focus on "<a href="${WE_THE_PEOPLE_BILL_URL}" target="_blank" rel="noopener noreferrer">We The People</a>." We're working to expand to other bills and elections. Want to help? Become a <a href="${PATREON_URL}" target="_blank" rel="noopener noreferrer">patron</a> or join our <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord</a> to stay updated.`,
        key: 4,
      },
    ],
  },
  {
    key: 3,
    topic: 'Transparency',
    questions: [
      {
        q: 'What does POWERBACK charge?',
        a: "2.9% plus 30 cents per Celebration (Stripe's fee). Other platforms charge 3.95% flat, which is cheaper for small donations under $29. Above that, we're cheaper. We keep the lights on while keeping your donations impactful.",
        key: 1,
      },
      {
        q: 'Does POWERBACK have any party or corporate affiliation?',
        a: `No. We're independent and open source. Candidate order is randomized, and we never mention political parties. Check out our code on <a href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>, follow us on <a href="${TWITTER_URL}" target="_blank" rel="noopener noreferrer">X</a>, join <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord</a>, or read our <a href="/${POSITION_PAPER_PATH}" target="_blank" rel="noopener noreferrer">position paper</a> for details.`,
        key: 2,
      },
      {
        q: 'Will campaigns email me?',
        a: "We don't provide your email address to candidate campaigns, so you won't get added to their mailing lists through POWERBACK.",
        key: 3,
      },
      {
        q: 'Is POWERBACK a prediction or event market?',
        a: "No. POWERBACK is an election campaign donation conduit, not a market. We don't offer trading, odds, shares, or payouts based on events. POWERBACK is operated by a federally registered political committee (PAC).",
        key: 4,
      },
    ],
  },
];
