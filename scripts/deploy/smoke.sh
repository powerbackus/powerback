#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

RUN_VALIDATE_ENV=1
RUN_LINT=1
RUN_TEST_BACKEND=1
RUN_TEST_CLIENT=1
RUN_BUILD=1
RUN_E2E=0

usage() {
  cat <<'EOF'
Usage: scripts/deploy/smoke.sh [options]

Default checks:
  - validate env (npm run validate:env)
  - lint (npm run lint)
  - backend tests (npm run test)
  - client tests (CI=true npm run test:client)
  - backend build (npm run build)

Options:
  --no-validate-env   Skip env validation
  --no-lint           Skip lint
  --no-test-backend   Skip backend tests
  --no-test-client    Skip client tests
  --no-build          Skip backend build
  --e2e               Run Playwright tests (npx playwright test)
  -h, --help          Show this help
EOF
}

log_step() {
  echo
  echo "==> $1"
}

have_playwright_browsers() {
  local -a candidates=(
    "${PLAYWRIGHT_BROWSERS_PATH:-}"
    "${REPO_ROOT}/node_modules/.cache/ms-playwright"
    "${REPO_ROOT}/node_modules/playwright/.local-browsers"
    "${REPO_ROOT}/node_modules/@playwright/test/.local-browsers"
    "${HOME}/.cache/ms-playwright"
  )

  local d
  for d in "${candidates[@]}"; do
    if [[ -n "${d}" && -d "${d}" ]] && compgen -G "${d}/*" >/dev/null; then
      return 0
    fi
  done

  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-validate-env)
      RUN_VALIDATE_ENV=0
      ;;
    --no-lint)
      RUN_LINT=0
      ;;
    --no-test-backend)
      RUN_TEST_BACKEND=0
      ;;
    --no-test-client)
      RUN_TEST_CLIENT=0
      ;;
    --no-build)
      RUN_BUILD=0
      ;;
    --e2e)
      RUN_E2E=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

cd "${REPO_ROOT}"

log_step "Smoke checks starting"

if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
  echo "node_modules not found. Run: npm ci" >&2
  exit 1
fi

if [[ "${RUN_TEST_CLIENT}" -eq 1 ]] && [[ ! -d "${REPO_ROOT}/client/node_modules" ]]; then
  echo "client/node_modules not found. Run: npm ci --prefix client" >&2
  exit 1
fi

if [[ "${RUN_VALIDATE_ENV}" -eq 1 ]]; then
  log_step "Validate environment"
  if [[ -f "${REPO_ROOT}/scripts/validate-environment.js" ]]; then
    npm run validate:env
  else
    echo "Skipping validate:env (missing scripts/validate-environment.js in this checkout)"
  fi
fi

if [[ "${RUN_LINT}" -eq 1 ]]; then
  log_step "Lint"
  npm run lint
fi

if [[ "${RUN_TEST_BACKEND}" -eq 1 ]]; then
  log_step "Backend tests"
  npm run test
fi

if [[ "${RUN_TEST_CLIENT}" -eq 1 ]]; then
  log_step "Client tests (CI=true)"
  CI=true npm run test:client
fi

if [[ "${RUN_BUILD}" -eq 1 ]]; then
  log_step "Backend build"
  npm run build
fi

if [[ "${RUN_E2E}" -eq 1 ]]; then
  log_step "Playwright E2E tests"

  if ! npx playwright --version >/dev/null 2>&1; then
    echo "Playwright is not available. Install dependencies (npm ci) and ensure @playwright/test is installed." >&2
    exit 1
  fi

  if ! have_playwright_browsers; then
    echo "Playwright browsers not found. Run: npx playwright install --with-deps" >&2
    exit 1
  fi

  npx playwright test
fi

log_step "Smoke checks passed"
