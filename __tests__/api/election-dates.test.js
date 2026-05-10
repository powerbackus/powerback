const { FEC } = require('../../constants');

describe('Election Dates Constants', () => {
  it('should have ELECTION_CYCLE with API and type config', () => {
    expect(FEC).toBeDefined();
    expect(FEC.ELECTION_CYCLE).toBeDefined();
    expect(FEC.ELECTION_CYCLE.API_BASE).toBeDefined();
    expect(FEC.ELECTION_CYCLE.ELECTION_ENDPOINT).toBeDefined();
    expect(FEC.ELECTION_CYCLE.ELECTION_TYPES).toBeDefined();
  });

  it('should have ELECTION_TYPES for primary, general, and runoff', () => {
    const { ELECTION_TYPES } = FEC.ELECTION_CYCLE;

    expect(ELECTION_TYPES).toHaveProperty('PRIMARY', 'P');
    expect(ELECTION_TYPES).toHaveProperty('GENERAL', 'G');
    expect(ELECTION_TYPES).toHaveProperty('RUNOFF', 'R');
    expect(ELECTION_TYPES).toHaveProperty('SPECIAL', 'S');
  });

  it('should have a valid API_BASE URL', () => {
    const { API_BASE } = FEC.ELECTION_CYCLE;

    expect(API_BASE).toMatch(/^https?:\/\//);
  });
});
