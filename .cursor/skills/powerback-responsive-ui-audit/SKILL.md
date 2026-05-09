---
name: powerback-responsive-ui-audit
description: Use when auditing, reporting, or fixing responsive layout issues in the POWERBACK React/TypeScript app.
---

# POWERBACK Responsive UI Audit Skill

Use this skill when the user asks for a responsive UI audit, mobile layout review, viewport testing, overflow check, modal/sidenav layout check, or responsive CSS patch.

Default to AUDIT MODE unless the user explicitly asks for PATCH MODE.

## Core rule

Do not redesign POWERBACK.

This skill is for finding and fixing launch-facing layout breakage with minimal, targeted changes.

## Modes

### AUDIT MODE

Find layout problems and report them.

Do not edit files.

Output a prioritized list of issues with reproduction details.

### PATCH MODE

Fix only confirmed high-impact responsive problems.

Prefer minimal CSS or layout changes.

Do not refactor unrelated components.

Do not change product copy unless required for layout.

## Target viewports

Test these viewport sizes:

- 360 x 740: mobile portrait
- 740 x 360: mobile landscape
- 768 x 1024: tablet portrait
- 1280 x 720: small laptop height edge case
- 1366 x 768: laptop
- 1920 x 1080: desktop
- 1080 x 1920: vertical monitor

## Target surfaces

Audit these app surfaces when available:

- Landing / splash
- Lobby / carousel
- Search bar and filtered politician results
- Auth modal / credentials modal
- Tour / onboarding / Joyride overlays
- Mobile sidenav
- Checkout / payment
- Tips / confirmation
- FAQ / terms / privacy pages
- Any empty, loading, blocked, or error states

## What to look for

Prioritize:

- Horizontal overflow
- Text clipping
- Buttons or CTAs below the fold when they should be visible
- Modal content taller than the viewport with no usable scroll behavior
- Fixed heights causing cropped content
- Carousel cards overflowing or becoming unreadable
- Sidenav overlapping active modals or tour overlays
- Tiny text on mobile
- Excessive whitespace or absurd scaling on large screens
- Mobile landscape unusability
- Sticky/fixed elements covering important content
- Footer/header collisions
- Broken Bootstrap override behavior
