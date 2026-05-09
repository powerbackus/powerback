---
name: powerback-ga-instrumentation
description: Use when adding, reviewing, or modifying GA4 event tracking in POWERBACK React/TypeScript code.
---

# POWERBACK GA Instrumentation Skill

When modifying analytics:

1. Find existing analytics helpers before creating new ones.
2. Use `trackGoogleAnalyticsEvent(...)`.
3. Prefer stable snake_case event parameters.
4. Do not log unsafe free-text user input unless explicitly sanitized.
5. Keep event names stable and descriptive.
6. If adding event params, list the matching GA4 custom dimensions/metrics needed.
7. Avoid changing product behavior while adding tracking.
8. Run lint/build if available.
