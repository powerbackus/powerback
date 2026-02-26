import { thisCampaign } from '../this';
import { next } from './next';

export const nextEnd = () => {
  let { end } = thisCampaign();
  return next(end);
};
