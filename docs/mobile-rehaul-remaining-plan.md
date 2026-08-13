# Remaining Product Plan

Status: core mobile migration and P46 release closure complete. P45 human validation and unavailable
physical evidence are deferred. No current evidence supports another product-copy migration.
Updated August 13, 2026.

This is the only active implementation plan. Historical work belongs in `ITERATION_LOG.md`,
release criteria in `docs/release-quality-gates.md`, and candidate evidence in
`docs/physical-release-evidence.md`.

## Current Baseline

- Today, Explore, Journal, Settings, Privacy, Support, all input routes, and Reflection share one
  routed mobile shell and one completion/persistence boundary.
- Quick, Body Compass, Affect Map, Word Ladder, and Plutchik converge on tentative Reflection.
  Users can correct or reject results, stop from intermediary words, and leave interpretation closed.
- Crisis support is deterministic from the current result. Tier-4 support precedes reflection and
  requires acknowledgment; saved history cannot increase present urgency.
- Saved reflections remain on-device. Local saving and external Google AI Mode links default on,
  remain explicit choices, and no backend or telemetry exists.
- EN/RO, light/dark, keyboard, compact reflow, focus, PWA lifecycle, persistence, safety, and
  performance have broad repeatable coverage.
- Product SHA `61f8743` is frozen and deployed. Automated gates, iOS Simulator, Pixel browser,
  installed WebAPK, and Pixel mid-tier timing expose no unresolved product blocker.

Physical iPhone testing remains outside scope. Simulator VoiceOver is not physical screen-reader
evidence.

## Open Risks

1. Human TalkBack gesture/spoken-order and Romanian pronunciation are not rerun on the frozen product.
2. A distinct low-tier Android device is unavailable; Pixel 6a mid-tier evidence cannot replace it.
3. Six-session moderated participant evidence is deferred; synthetic walkthroughs are preflight only.
4. Exact-candidate macOS Safari is blocked by SafariDriver activation transport, not a reproduced app failure.

## Architecture Direction

### Keep

- client-only deployment and explicit outbound-link boundary;
- feature registry, lazy routes, and route-local input state;
- one typed completion, safety, Reflection, and persistence workflow;
- bounded writes, privacy-safe diagnostics, deterministic crisis data, and fail-closed reviewed copy;
- one acceptance manifest with platform-local adapters.

### Next Change Boundary

P50 may stabilize selectors shared by Android, iOS, and macOS native adapters. This release found
the same stale-copy failure in all three. Add stable product test hooks only for controls used across
those adapters, then centralize their names once. Do not create a workflow DSL or universal device
framework.

### Avoid

No router migration, global state library, backend, telemetry, database rewrite, design-system
project, workflow DSL, or speculative copy changes. Extract only repeated contracts or safety/data
boundaries.

## Recommended Sequence

### P50 - Stable Native Acceptance Hooks (next recommended)

1. Inventory selectors repeated across at least three native adapters: Today guided entry, save
   completion, external AI link, and onboarding progress/focus.
2. Add narrow semantic test IDs where no stable state exists. Keep accessible-name checks where
   naming or speech is the behavior under test.
3. Export one small selector map from `scripts/acceptance/`; retain platform-local interactions.
4. Start with contract tests proving all adapters consume the map. Run focused adapter tests,
   `npm run check`, Playwright, then one base row per available native platform.

### P51 - Deferred Physical Evidence

When resources exist, run human TalkBack EN/RO in browser and installed mode, then a distinct
low-tier three-run performance matrix. Preserve these as evidence tasks; change product code only
when a failure reproduces independently.

### P45 - Moderated Participant Validation (deferred)

Retain `docs/moderated-comprehension-validation.md` for a future six-person round. Do not convert
expert review, owner acceptance, synthetic agents, or automation into participant outcomes.

### P49 - Evidence-Dependent Comprehension Copy (closed pending evidence)

Do not change onboarding language placement, Affect terminology, Google AI Mode wording, or skip
behavior from incomplete synthetic runs. Reopen only after repeated human evidence or a new
deterministic contradiction.

## Verification Rule

Start each product phase with a failing behavior-boundary test and the smallest implementation.
Visual/accessibility changes require EN/RO, light/dark browser coverage. Safety changes require
deterministic invariants and psychological review. Native evidence must name platform limits.

## Decision

Implement P50 next because three independent adapters failed from one copy-drift pattern. Keep P49
closed. Run P45 and P51 only when participants, human AT operation, or distinct hardware exist.
