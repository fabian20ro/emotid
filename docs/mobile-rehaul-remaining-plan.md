# Remaining Product Plan

Status: core mobile migration, P46 release closure, and P50 stable native hooks complete. P45 human
validation and unavailable physical evidence are deferred. No current evidence supports another
product-copy migration.
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
- P46 product SHA `61f8743` is frozen and deployed. P50 adds behavior-neutral acceptance hooks on
  top of that baseline. Automated gates, iOS Simulator, Pixel browser, installed WebAPK, and Pixel
  mid-tier timing expose no unresolved product blocker.

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

P50 centralized only six repeated native acceptance hooks. Product behavior and platform-local
interaction code remain separate. The next bounded architecture task may improve native Safari
transport diagnosis; no product architecture change is justified without new evidence.

### Avoid

No router migration, global state library, backend, telemetry, database rewrite, design-system
project, workflow DSL, or speculative copy changes. Extract only repeated contracts or safety/data
boundaries.

## Recommended Sequence

### P50 - Stable Native Acceptance Hooks (complete)

One frozen selector map now covers Today guided entry, save completion, external AI, and onboarding
state/focus. Android, iOS, and macOS adapters consume it; TalkBack speech checks retain accessible
names. Contract tests prevent copy/class selector regressions. Browser, iOS Simulator, and Pixel
rows pass; native Safari remains blocked at its pre-existing WebDriver click transport.

### P52 - Native Safari Activation Capability Probe (next implementation recommendation)

1. Add a disposable seed-page button whose native WebDriver activation sets an observable state.
2. Probe it once after SafariDriver session creation, before the product matrix.
3. When activation is inert, classify the run `BLOCKED` with driver/session diagnostics and skip
   product rows. Never use a script click as passing native evidence.
4. Unit-test pass, blocked, and genuine product-failure classification. Rerun native Safari plus
   `npm run check`; keep the change entirely inside the macOS harness.

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

P50 closes the repeated-selector architecture gap. Implement P52 next because it is local,
bounded, and turns a known Safari transport ambiguity into a fail-fast capability result. Keep P49
closed. Run P45 and P51 only when participants, human AT operation, or distinct hardware exist.
