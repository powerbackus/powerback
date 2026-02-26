# Spec: Testing Strategy and Implementation

## Purpose

Define comprehensive testing approach to achieve 80%+ coverage and ensure application reliability.

## Current State Assessment

- **Coverage**: ~65/100 - Limited automated testing
- **Unit Tests**: Basic auth tests only
- **Integration Tests**: Minimal API endpoint testing
- **E2E Tests**: None implemented
- **Accessibility Tests**: Manual only

## Testing Pyramid

### Unit Tests (Foundation - 60% of tests)

- **Business Logic**: All utility functions, hooks, services
- **Component Logic**: React components, custom hooks
- **Validation**: Form validation, input sanitization
- **Compliance**: FEC limit calculations, tier logic

### Integration Tests (Middle - 30% of tests)

- **API Endpoints**: All routes with authentication
- **Database Operations**: CRUD operations, migrations
- **External Services**: Stripe, email, SMS integration
- **Context Integration**: React Context interactions

### E2E Tests (Top - 10% of tests)

- **Critical User Flows**: Donation, authentication, compliance
- **Cross-Browser**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Chrome Mobile
- **Accessibility**: Screen reader compatibility

## Test Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)

```bash
# Unit Tests Setup
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest-environment-jsdom ts-jest
```

**Priority Test Areas:**

- `services/electionCycleService.js` - FEC compliance logic
- `client/src/hooks/` - All custom hooks (including `usePaymentProcessing`)
- `client/src/contexts/` - Context providers and consumers
- `auth/authbase.js` - JWT token management and validation
- `auth/tokenizer.js` - Authentication error handling
- `auth/tokenStore.js` - In-memory token store operations
- `controller/users/password/change.js` - Password change with token invalidation
- `validation/` - Input validation and sanitization

### Phase 2: Integration (Weeks 3-4)

```bash
# Integration Tests Setup
npm install --save-dev supertest mongodb-memory-server
```

**Priority Test Areas:**

- `routes/api/users.js` - Authentication endpoints (login, refresh, logout)
- `routes/api/` - All API endpoints
- `controller/` - Business logic controllers
- `models/` - Database models and operations
- Payment processing flows
- Email/SMS integration
- Authentication middleware integration

### Phase 3: E2E (Weeks 5-6)

```bash
# E2E Tests Setup
npm install --save-dev playwright
npx playwright install
```

**Critical User Flows:**

1. User registration and authentication
2. Token refresh and session persistence
3. Password change with token invalidation
4. Donation flow (guest/compliant tiers)
5. Compliance promotion and validation
6. Payment processing and confirmation
7. Account management and settings

## Test Structure and Organization

### Unit Tests

```
__tests__/
├── unit/
│   ├── auth/
│   │   ├── authbase.test.js
│   │   ├── tokenizer.test.js
│   │   └── tokenStore.test.js
│   ├── services/
│   │   ├── electionCycleService.test.js
│   │   ├── celebration/
│   │   │   ├── dataService.test.js
│   │   │   ├── validationService.test.js
│   │   │   ├── emailService.test.js
│   │   │   ├── orchestrationService.test.js
│   │   │   └── notificationService.test.js
│   │   └── logger.test.js
│   ├── hooks/
│   │   ├── useAuth.test.tsx
│   │   ├── useComplianceCaps.test.tsx
│   │   ├── useDonationLimits.test.tsx
│   │   └── usePaymentProcessing.test.tsx
│   ├── utils/
│   │   ├── validation.test.js
│   │   └── formatting.test.js
│   └── components/
│       ├── Cap.test.tsx
│       ├── DonationLimitsContext.test.tsx
│       └── TabContents.test.tsx
```

### Integration Tests

```
__tests__/
├── integration/
│   ├── api/
│   │   ├── auth.test.js
│   │   ├── payments.test.js
│   │   ├── users.test.js
│   │   └── compliance.test.js
│   ├── auth/
│   │   ├── token-rotation.test.js
│   │   ├── password-change.test.js
│   │   └── session-management.test.js
│   ├── database/
│   │   ├── models.test.js
│   │   └── migrations.test.js
│   └── services/
│       ├── stripe.test.js
│       └── email.test.js
```

### E2E Tests

```
__tests__/
├── e2e/
│   ├── auth/
│   │   ├── registration.spec.ts
│   │   ├── login.spec.ts
│   │   ├── token-refresh.spec.ts
│   │   ├── password-change.spec.ts
│   │   └── password-reset.spec.ts
│   ├── donation/
│   │   ├── bronze-tier.spec.ts
│   │   ├── silver-tier.spec.ts
│   │   ├── gold-tier.spec.ts
│   │   └── compliance-limits.spec.ts
│   ├── compliance/
│   │   ├── promotion.spec.ts
│   │   └── validation.spec.ts
│   └── accessibility/
│       ├── screen-reader.spec.ts
│       └── keyboard-navigation.spec.ts
```

## Test Configuration

### Current Jest Configuration (Root)

The root `jest.config.js` runs both backend `__tests__/` and client `client/src/__tests__/` tests in one suite (Node environment). Key settings:

- **testMatch**: `**/__tests__/**/*.js`, `**/?(*.)+(spec|test).js`
- **testPathIgnorePatterns**: `/tests-examples/` (Playwright specs), `client/src/App.test.js` (requires React/Babel transform not configured at root)
- **moduleNameMapper**: `@scure/bip32` → `__mocks__/scureBip32.js` (ESM-only package used by BTC/celebration code path)
- **setupFilesAfterEnv**: `test/setup.js` (in-memory MongoDB, env mocks, clear collections afterEach)
- **testTimeout**: 10000 ms; **maxWorkers**: 1

```javascript
// jest.config.js (current)
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/tests-examples/', 'client/src/App.test.js'],
  moduleNameMapper: {
    '^@scure/bip32$': '<rootDir>/__mocks__/scureBip32.js',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/client/**',
    '!**/coverage/**',
    '!**/migrations/**',
    '!**/jobs/**',
    '!**/dev/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  maxWorkers: 1,
  // ...
};
```

### Jest Configuration (Frontend)

```javascript
// client/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/index.tsx',
    '!src/setupTests.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: '__tests__/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
    {
      name: 'Mobile Chrome',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 5'],
      },
    },
  ],
};
```

## Test Data and Fixtures

### Test Database Setup (test/setup.js)

Uses `mongodb-memory-server`; no deprecated Mongoose options (`useFindAndModify`, `useUnifiedTopology`, `useNewUrlParser` are removed in current MongoDB driver). Sets `NODE_ENV=test`, `DISABLE_JOBS`, `DISABLE_TOKEN_CLEANUP`, and other env vars for tests.

```javascript
// test/setup.js (current)
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    dbName: 'test-db-' + Date.now(),
  });
});
afterEach(async () => {
  /* deleteMany on all collections */
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

### API Test Mocks and Conventions

Backend API tests that hit routes loading the full server may pull in ESM or side-effectful code. Use mocks so tests stay fast and deterministic:

- **`@scure/bip32`**: Jest `moduleNameMapper` in `jest.config.js` points to `__mocks__/scureBip32.js` (required when routes load celebration/receipt/BTC path).
- **Hash generation**: `controller/users/account/utils/hash/generate` uses dynamic `import('crypto')`, which Jest does not support. In `__tests__/api/auth.test.js` and `__tests__/api/password-reset.test.js`, mock this module to return a fixed `{ hash, expires, issueDate }`.
- **sendEmail**: Mock `controller/comms/sendEmail` in auth and password-reset API tests so no real email is sent.

API contract details tests rely on (update tests to match API, not the reverse):

- **POST /api/users**: Body `username` (email), `password`, `err` (number). Success 200; validation failure 403 with `body.message`.
- **POST /api/users/login**: Body `username`, `password`. Success 200 with `accessToken` and user fields (e.g. `username`). Use `require('../../server')` for the app (no root `app.js`).
- **Password reset**: PUT body `hash` (exactly 18 hex chars), `givenUsername`, `newPassword`. Invalid hash format → 403. Lock after failed attempts (valid hash + wrong username); lock response 200 with body `'This account has been locked.'`.
- **Unsubscribe**: Hash 18 hex chars; topic camelCase: `electionUpdates`, `districtUpdates`, `celebrationUpdates`. Invalid body → 403; GET returns `{ isValid, isExpired }`.
- **Account activation**: Mock `sendEmail`; ExUser requires `exId` (ObjectId). GET activate can return `false` or `{ isHashConfirmed, isLinkExpired }`.

Celebration service tests (`__tests__/services/celebrationService.test.js`): Use `donatedBy` (not `userId`) for Celebration documents; include `donorInfo: { compliance: 'compliant' }`. For “cancelled” vs active, use `defunct: true`; `cancelCelebrationsForCandidate` sets `defunct: true`, not `status: 'cancelled'`. Assert with `defunct: false` for “still active” count.

### Test Fixtures

```javascript
// __tests__/fixtures/users.js
export const testUsers = {
  guest: {
    email: 'guest@test.com',
    password: 'password123',
    compliance: 'guest',
  },
  compliant: {
    email: 'compliant@test.com',
    password: 'password123',
    compliance: 'compliant',
  },
};

// __tests__/fixtures/donations.js
export const testDonations = {
  validGuest: { amount: 25, candidateId: 'test-candidate-1' },
  invalidGuest: { amount: 75, candidateId: 'test-candidate-1' },
  validCompliant: { amount: 1000, candidateId: 'test-candidate-1' },
  invalidCompliant: { amount: 4000, candidateId: 'test-candidate-1' },
};
```

## Accessibility Testing

### Automated Accessibility Tests

```typescript
// __tests__/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);

    // Test color contrast (using axe-core)
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        const axe = require('axe-core');
        axe.run((err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
});
```

## Performance Testing

### Bundle Size Testing

```javascript
// scripts/test-bundle-size.js
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/build/static/js');
const maxSize = 500 * 1024; // 500KB

const files = fs.readdirSync(bundlePath);
files.forEach((file) => {
  if (file.endsWith('.js')) {
    const filePath = path.join(bundlePath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;

    if (sizeKB > maxSize / 1024) {
      throw new Error(
        `Bundle ${file} exceeds size limit: ${sizeKB}KB > ${maxSize / 1024}KB`
      );
    }
  }
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Acceptance Criteria

### Coverage Targets

- Unit tests: 80%+ coverage for all business logic
- Integration tests: All API endpoints covered
- E2E tests: All critical user flows tested
- Accessibility: WCAG 2.1 AA compliance verified

### Performance Targets

- Bundle size: < 500KB gzipped
- Test execution: < 5 minutes for full suite
- E2E tests: < 30 seconds per test
- Coverage reports: Generated automatically

### Quality Gates

- All tests pass before merge
- Coverage thresholds met
- Accessibility violations = 0
- Performance budgets respected

## Development utility tests (scripts/tests)

Manual, non-Jest scripts live in **`scripts/tests/`**. They exercise Stripe config, donation limits, email templates, donor validation, social webhooks, and similar. Run from project root: `node scripts/tests/<name>.js`. They are not part of `npm test`. See [scripts/README.md](../scripts/README.md#tests).

## Links

- Rules: `.cursor/rules/11-testing.mdc`
- Code: `__tests__/`, `client/src/__tests__/`, `test/`, `__mocks__/`, `scripts/tests/`
- Related: specs/quality-assessment.md, specs/backend-compliance.md, docs/npm-scripts.md, scripts/README.md
