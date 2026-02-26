interface Version {
  congressdotgov_url: string;
  status: string;
  title: string;
  url: URL;
}

interface Action {
  action_type: string;
  description: string;
  datetime: string;
  chamber: string;
  id: number;
}

interface Vote {
  total_not_voting: number;
  roll_call: number;
  total_yes: number;
  question: string;
  total_no: number;
  chamber: string;
  result: string;
  api_url: URL;
  date: string;
  time: string;
}

interface Statement {
  veto_threat: string | undefined;
  position: string | undefined;
  date: string | undefined;
  would_sign: boolean;
  url: URL;
}

export interface Bill {
  senate_passage_vote: string | undefined | null;
  house_passage_vote: string | undefined | null;
  cbo_estimate_url: string | undefined | null;
  senate_passage: string | undefined | null;
  house_passage: string | undefined | null;
  last_vote: string | undefined | null;
  presidential_statements: Statement[];
  enacted: string | undefined | null;
  vetoed: string | undefined | null;
  latest_major_action_date: string;
  withdrawn_cosponsors?: number;
  subcommittee_codes: string[];
  latest_major_action: string;
  congressdotgov_url: string;
  committee_codes: string[];
  cosponsors_by_party?: {
    D?: number | undefined;
    I?: number | undefined;
    L?: number | undefined;
    R?: number | undefined;
  };
  gpo_pdf_uri?: URL | null;
  introduced_date: string;
  primary_subject: string;
  sponsor_party: string;
  sponsor_state: string;
  sponsor_title: string;
  summary_short: string;
  govtrack_url: string;
  short_title: string;
  cosponsors?: number;
  sponsor_uri: string;
  version?: Version[];
  committees: string;
  sponsor_id: string;
  actions: Action[];
  bill_slug: string;
  bill_type: string;
  bill_uri: string;
  congress: string;
  active: boolean;
  bill_id: string;
  sponsor: string;
  summary: string;
  number: string;
  title: string;
  votes: Vote[];
  bill: string;
  _id: string;
}
