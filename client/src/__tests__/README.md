# Client Tests

This directory holds frontend tests that run under the **root** Jest config (e.g. `npm test` from project root). The root suite includes both backend `__tests__/` and `client/src/__tests__/`; `client/src/App.test.js` is excluded (see `jest.config.js` `testPathIgnorePatterns`) because it requires React/Babel transform not applied at root.

For full testing docs, Jest config, and API test conventions see **`specs/testing-strategy.md`** and **`.cursor/rules/11-testing.mdc`**.

## Donation Limits Testing

Comprehensive tests for donation limits and compliance tier scenarios.

## Quick Test Script

For the fastest way to test the donation limits logic without running the full test suite:

```bash
# From the project root
node scripts/tests/test-donation-limits.js
```

This script tests all the key scenarios and will show you exactly what's working and what's not.

## Full Test Suite

To run the complete test suite with React Testing Library:

```bash
# From the client directory
npm test

# Or to run just the donation limits tests
npm test -- --testPathPattern="DonationLimitsContext|LimitModal"
```

## Test Coverage

### DonationLimitsContext Tests (`DonationLimitsContext.test.tsx`)

Tests the core logic for determining limit violations:

- **Guest Tier**: Per-donation ($50) and annual cap ($200) limits
- **Compliant Tier**: Per-candidate per-election ($3500) limits
- **Edge Cases**: Exact limit amounts, fallback scenarios
- **Real-world Scenarios**: The specific case that was failing (compliant user with $1000 already donated, trying $2501)

### LimitModal Tests (`LimitModal.test.tsx`)

Tests the UI component that displays limit messages:

- **Text Display**: Verifies "per donation" vs "per candidate per election" text appears correctly
- **Compliance Tier Differences**: Ensures bronze/silver show different messages than gold
- **PAC Limits**: Tests PAC limit specific messaging
- **Modal Interactions**: Button rendering and custom messages

## Key Test Scenarios

### The Fix That Was Needed

The main issue was that gold tier users were seeing "per donation" instead of "per candidate per election" when hitting the $3500 limit. The tests verify this is now fixed:

```javascript
// Before the fix (would fail)
expect(limitInfo.scope).toBe('per donation'); // ❌ Wrong for gold tier

// After the fix (passes)
expect(limitInfo.scope).toBe('per candidate per election'); // ✅ Correct for gold tier
```

### All Tested Scenarios

1. **Guest Tier**:
   - $75 donation (exceeds $50 limit) → "per donation"
   - $50 + $160 annual total (exceeds $200 cap) → "total annual cap"
2. **Compliant Tier**:
   - $4000 donation (exceeds $3500 limit) → "per candidate per election" ✅
   - $500 + $3200 election total (exceeds $3500) → "per candidate per election"
   - $2501 with $1000 already donated → "per candidate per election" ✅ (the failing case)
   - $3500 exactly at limit → "per candidate per election"

## Running Specific Tests

```bash
# Test just the context logic
npm test -- --testPathPattern="DonationLimitsContext"

# Test just the modal component
npm test -- --testPathPattern="LimitModal"

# Test with coverage
npm test -- --coverage --testPathPattern="DonationLimitsContext|LimitModal"
```

## Debugging

If tests fail, the quick test script will show you exactly what the function is returning vs what it should return. This makes it easy to spot issues like:

- Wrong scope text ("per donation" vs "per candidate per election")
- Incorrect limit amounts
- Wrong limit types
- Missing or incorrect messages

## Adding New Tests

When adding new compliance scenarios or edge cases:

1. Add the scenario to the quick test script (`scripts/tests/test-donation-limits.js`)
2. Add corresponding React tests in the appropriate test file
3. Update this README with the new test scenarios

This ensures both the logic and UI are thoroughly tested for all donation limit scenarios.
