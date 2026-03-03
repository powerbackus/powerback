export interface Role {
  votes_against_party_pct?: number;
  votes_with_party_pct?: number;
  chamber: 'House | Senate';
  missed_votes_pct?: number;
  fec_candidate_id: string;
  title: 'Representative';
  next_election?: string;
  total_present?: number;
  missed_votes?: number;
  senate_class?: string;
  total_votes?: number;
  fax?: string | null;
  short_title: 'Rep.';
  congress: string;
  district: string;
  office?: string;
  ocd_id: string;
  state: string;
}
