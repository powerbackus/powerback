// *** THIS FOLLOW THE NEW SCHEMA OF CONGRESS.GOV AFTER THE PROPUBLICA API WAS DEPRECATED.
// export interface Bill {
//   congress: number; // 119
//   number: number; // 54
//   billId: string; // "hjres54-119"
//   title: string;
//   introducedDate: string; // ISO
//   sponsor: string;
//   latestAction: { text: string; date: string };
//   summary: string;
//   urls: { congressDotGov: string; textPdf: string };
// }

// export const WE_THE_PEOPLE: Bill = {
//   congress: 119,
//   number: 54,
//   billId: 'hjres54-119',
//   title: 'We The People Amendment',
//   introducedDate: '2025-02-12',
//   sponsor: 'J000295',
//   latestAction: {
//     text: 'Referred to the House Committee on the Judiciary.',
//     date: '2025-02-12',
//   },
//   summary:
//     'Proposing an amendment to the Constitution of the United States providing that the rights protected and extended by the Constitution are the rights of natural persons only.',
//   urls: {
//     congressDotGov:
//       'https://www.congress.gov/bill/119th-congress/house-joint-resolution/54',
//     textPdf:
//       'https://www.congress.gov/119/bills/hjres54/BILLS-119hjres54ih.pdf',
//   },
// };

export const WE_THE_PEOPLE = {
  _id: '6809879a6bb46a7928eac3f0',
  bill_id: 'hjres54-119',
  bill_slug: 'hjres54',
  congress: '119',
  bill: 'H.J.RES.54',
  bill_type: 'hjres',
  number: 'H.J.RES.54',
  bill_uri: 'https://api.congress.gov/v3/bill/119/hjres/54',
  title:
    "['title']: Proposing an amendment to the Constitution of the United States providing that the rights protected and extended by the Constitution are the rights of natural persons only.",
  short_title: 'We The People Amendment',
  sponsor_title: 'Rep.',
  sponsor: 'Pramila Jayapal',
  sponsor_id: 'J000298',
  sponsor_uri: 'https://api.congress.gov/v3/member/J000298',
  sponsor_party: 'D',
  sponsor_state: 'WA',
  gpo_pdf_uri: null,
  congressdotgov_url:
    'https://www.congress.gov/bill/119th-congress/house-joint-resolution/54',
  govtrack_url: 'https://www.govtrack.us/congress/bills/119/hjres54',
  introduced_date: '2025-02-12',
  active: false,
  last_vote: null,
  house_passage: null,
  senate_passage: null,
  enacted: null,
  vetoed: null,
  primary_subject: '',
  committees: '',
  committee_codes: ['hsju00'],
  subcommittee_codes: [],
  latest_major_action_date: '2025-02-12',
  latest_major_action: 'Referred to the House Committee on the Judiciary.',
  house_passage_vote: null,
  senate_passage_vote: null,
  summary:
    "['summary']: Proposing an amendment to the Constitution of the United States providing that the rights protected and extended by the Constitution are the rights of natural persons only.",
  summary_short: '',
  cbo_estimate_url: null,
  versions: [
    {
      status: 'Introduced in House',
      title: 'IH',
      url: 'https://www.govinfo.gov/content/pkg/BILLS-119hjres54ih/xml/BILLS-119hjres54ih.xml',
      congressdotgov_url:
        'https://www.congress.gov/119/bills/hjres54/BILLS-119hjres54ih.htm',
    },
  ],
  actions: [
    {
      id: 1,
      chamber: 'House',
      action_type: 'IntroReferral',
      datetime: '2025-02-12',
      description: 'Referred to the House Committee on the Judiciary.',
    },
  ],
  presidential_statements: [],
  votes: [],
};
