const { emailTopics } = require('../shared');

const {
    getDeltasDir,
    getSnapshotsDir,
    getPersistentDataDir,
  } = require('./paths'),
  { APP } = require('./app'),
  { FEC } = require('./fec'),
  { SERVER } = require('./server');

module.exports = {
  getDeltasDir,
  getSnapshotsDir,
  getPersistentDataDir,
  EMAIL_TOPIC_NAMES: emailTopics.EMAIL_TOPIC_NAMES,
  EMAIL_TOPICS: emailTopics.EMAIL_TOPICS,
  emailTopics,
  SERVER,
  FEC,
  APP,
};
