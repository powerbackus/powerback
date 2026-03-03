import { thisCampaign } from '../this';
import { next } from './next';

export const nextStart = () => {
  let { start } = thisCampaign();
  return next(start);
};
