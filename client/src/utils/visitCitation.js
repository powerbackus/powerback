import { CITATIONS } from '@CONSTANTS';
const { addTrackingParams, trackLinkClick } = require('./linkTracking');

/**
 * Visit citation link with tracking
 * Opens external citation links in new tab with UTM tracking parameters
 */
export const visitCitation = (cit) => {
  const url = CITATIONS[cit].a;
  const trackedUrl = addTrackingParams(url, { medium: 'footer' }, cit);
  trackLinkClick(url, cit, { medium: 'footer' });
  window.open(trackedUrl, '_blank');
};
