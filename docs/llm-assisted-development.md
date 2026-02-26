# Vibe Coding Notes (LLM-Assisted Development)

## Navigation

* [Docs index](./README.md)
* [Project README](../README.md)
* [Production commands](./production-commands.md)
* [Eligibility](./eligibility.md)

---

## Purpose

This document records how LLMs were used while finishing and hardening POWERBACK, and the standards applied along the way.

It exists to:

* Preserve context while it is still fresh
* Set expectations for contributors
* Avoid unsafe or low-signal changes, especially in sensitive areas

This is **not** an endorsement of “AI-first” development, nor a requirement that contributors use LLMs.

---

## How LLMs Were Used Effectively

LLMs were most useful where the work was:

* **Mechanical or repetitive**

  * Import normalization
  * File moves and path rewrites
  * Renaming symbols consistently
* **Refactor-adjacent**

  * Breaking large files into smaller units
  * Simplifying conditional logic once behavior was understood
* **Scaffolding**

  * One-off scripts for data shaping or cleanup
  * Initial drafts of documentation or comments
* **Search and synthesis**

  * Tracing flows across the codebase
  * Summarizing existing behavior before changing it

In these cases, the model acted like a fast but literal junior engineer. All outputs were reviewed, edited, and often rewritten.

### Concrete examples from this repo

* **Deterministic transforms over hand edits:** when updating FAQ content, the goal was to keep formatting consistent and repeatable. Changes were pushed into a script (see `scripts/build/build-faq.js`) instead of doing manual cleanup in multiple places.
* **Tracing code before changing behavior:** when working around the celebration lifecycle, the first step was to trace the status logic in `shared/celebrationStatus.js` and then follow the watchers (`houseWatcher.js`, `challengersWatcher.js`) to understand the blast radius.
* **Environment and deploy changes:** for anything that touches environment loading or deploy behavior, prefer explicit tooling and docs (see `dev/env-manager.js` and `docs/environment-management.md`) instead of “try this and hope.”

---

## Where LLMs Are Dangerous

LLMs were not trusted to make autonomous decisions in areas such as:

* Authentication, sessions, or tokens
* Stripe payment flow or donation lifecycle
* Compliance logic (FEC-related behavior, user eligibility)
* Data migrations or destructive database operations
* Security headers, CSP, or server hardening

In these areas:

* LLMs were used only to explain existing code
* Or to propose changes that were then rewritten manually

If you cannot explain the change without referring to the underlying code, it should not ship.

---

## House Rules for LLM-Assisted Changes

If you use an LLM while working on this codebase:

1. **No blind paste**

   * You must understand every line you commit
2. **Small, scoped diffs**

   * One concern per commit
3. **Behavior first**

   * Be explicit about what changes and what stays the same
4. **Prefer scripts over prompts**

   * Repeated edits should be encoded as deterministic scripts
5. **No “cleanup” drive-bys**

   * Cosmetic or stylistic refactors require justification

LLMs are tools, not authors, and not a substitute for ownership.

---

## Verification Checklist (Required)

Before committing or opening a PR:

* App builds cleanly (frontend and backend)
* No new warnings or lint regressions
* Critical user flows still work:

  * Auth
  * Carousel interaction
  * Celebration/donation path
* Any scripts are idempotent or clearly labeled as one-time

If a change cannot be verified locally, explain why.

---

## Contributor Guidance

When proposing LLM-assisted work:

* State where the model was used (scope only, not prompts)
* Describe the before/after behavior in plain terms
* Point to the exact files and flows affected
* Provide screenshots or logs where relevant

The bar for trust is clarity, not novelty or cleverness.

---

## Patterns Worth Copying

Some repo patterns intentionally favor clarity over cleverness:

* Explicit data ingest and shaping scripts
* Conservative error handling
* Separation between UI affordances and enforcement logic

Follow existing patterns unless there is a concrete reason not to.

---

## Final Note

LLMs helped accelerate POWERBACK near the finish line. They did not replace judgment, ownership, or responsibility.

If this document feels strict, that is intentional. This is a production system dealing with money, politics, and trust.

---

## Related

* [Production commands](./production-commands.md)
* [Eligibility](./eligibility.md)
* [Docs index](./README.md)
* [Project README](../README.md)
