# POWERBACK.us Specifications Overview

This directory captures domain specifications that guide implementation. Each spec defines scope, inputs/outputs, invariants, interfaces, and acceptance checks. Update these as behavior/policy evolves.

## Structure

- `project-architecture.md` - Comprehensive system architecture, component design, and integration patterns
- `backend-compliance.md` - Compliance tiers, limits, resets, and server authority
- `frontend-compliance.md` - Frontend compliance display, promotion logic, and tier ratchet behavior
- `frontend-ui.md` - UI/UX patterns, accessibility, navigation/state, and styling (including custom hooks)
- `jobs-notifications.md` - Background jobs, election-date updater, and email notifications
- `pac-limit-system.md` - PAC contribution limits, tipLimitReached field, and payment flow integration
- `webhook-optimization.md` - Webhook processing optimization for users at PAC limits
- `quality-assessment.md` - Quality standards, current assessment (78/100), and improvement roadmap
- `testing-strategy.md` - Comprehensive testing approach to achieve 80%+ coverage
- `performance-optimization.md` - Performance standards and optimization strategies
- `_template.md` - Spec authoring template for new domains

## Documentation

- `docs/authentication-system.md` - JWT authentication system, token management, and security patterns
- `docs/API.md` - API endpoint documentation with authentication details

## Agentic Loop

1. Discuss requirements and update the relevant spec(s)
2. Implement edits guided by specs and project rules
3. Verify (lint/tests/perf on request) and summarize
4. Update specs/rules to reflect shipped behavior

## Quality Checks
- TypeScript errors typically caught by IDE/editor during development
- ESLint validation via `npm run lint` when needed
- Focus on editor feedback over terminal commands for type checking

## Conventions

- Defer to code for source of truth; specs describe intended behavior
- Keep specs concise and actionable
- Link concrete files/APIs where relevant

