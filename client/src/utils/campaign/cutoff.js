import { cycle } from './cycle';

export const cutoff = (donationDate) => {
  let electionDate = cycle(new Date(donationDate));
  let isDonationOfCurrentElectionCycle =
    new Date(donationDate) < electionDate;
  if (!isDonationOfCurrentElectionCycle) {
    electionDate = cycle(
      new Date(electionDate.setFullYear(electionDate.getFullYear() + 1))
    );
    isDonationOfCurrentElectionCycle =
      new Date(donationDate) < electionDate && new Date() <= electionDate;
    return !isDonationOfCurrentElectionCycle;
  } else {
    return isDonationOfCurrentElectionCycle;
  }
};
