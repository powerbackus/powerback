/**
 * Email topic constants - single source of truth
 * Used for email subscription management across client and server
 */

module.exports = {
  // Object form for backend usage (e.g., EMAIL_TOPICS.electionUpdates)
  EMAIL_TOPICS: {
    electionUpdates: 'electionUpdates',
    districtUpdates: 'districtUpdates',
    celebrationUpdates: 'celebrationUpdates',
    billUpdates: 'billUpdates',
  },
  // Display names mapped to topic keys
  EMAIL_TOPIC_NAMES: {
    electionUpdates: 'Changed Election Dates',
    districtUpdates: 'District Challengers',
    celebrationUpdates: 'Celebration Updates',
    billUpdates: 'Activity on "We The People"',
  },
  // Array form for frontend iteration (maintains display order)
  EMAIL_TOPICS_ARRAY: [
    'districtUpdates',
    'electionUpdates',
    'celebrationUpdates',
    'billUpdates',
  ],
};
