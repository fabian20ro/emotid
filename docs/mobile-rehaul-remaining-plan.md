# Product Maintenance Plan

Status: the mobile UI/UX migration and `v0.1.2` patch closure are complete. The deployed product
has no known release-blocking defect. Work now follows evidence and maintenance needs rather than
a migration phase sequence. Updated August 14, 2026.

Historical implementation detail belongs in `ITERATION_LOG.md`, release criteria in
`docs/release-quality-gates.md`, candidate evidence in `docs/physical-release-evidence.md`, and
release scope in `docs/releases/v0.1.2.md`.

## Released Baseline

- One routed mobile shell across Today, Explore, Journal, Settings, Privacy, and Support.
- Quick, Body Compass, Affect Map, Word Ladder, and Plutchik converge on tentative Reflection.
- One typed completion, current-session safety, local persistence, and recovery boundary.
- User correction and rejection remain explicit; inferred content is optional and unconfirmed.
- Local-only journal; no account, backend, telemetry, or cloud sync.
- Optional Google Search AI Mode handoff sends only selected emotion names.
- EN/RO, light/dark, keyboard, compact reflow, offline update, persistence, safety, and performance
  have broad repeatable coverage.

## Maintenance Triggers

Open a product change only for:

1. a reproduced functional, safety, accessibility, privacy, or data-loss defect;
2. repeated owner or participant evidence of a comprehension problem;
3. dependency, browser, operating-system, or security maintenance;
4. a deliberately approved product capability.

Use the smallest behavior-boundary test and implementation. Keep bilingual copy, deterministic
crisis semantics, client-only privacy, and platform-local native adapters.

## Deferred Evidence

- **Low-tier Android:** run the existing three-run performance matrix when a distinct device is
  available. Do not relabel Pixel 6a or emulator evidence.
- **Moderated comprehension:** resume `docs/moderated-comprehension-validation.md` only with six
  real participants. Expert, owner, synthetic, and automated review are not participant outcomes.
- **Complete human TalkBack:** bounded EN/RO browser and installed checkpoints passed. A full human
  J1-J9 matrix remains waived for this release.
- **Native macOS Safari:** retry after Safari/SafariDriver changes. Current activation transport is
  blocked before product rows and is not an application failure.

## Closed Pending Evidence

Do not change onboarding language placement, Affect terminology, Google AI Mode wording, or skip
behavior from incomplete synthetic runs. Reopen only after repeated human evidence or a new
deterministic contradiction.

## Avoid

No speculative router migration, global state library, backend, telemetry, datastore rewrite,
design-system project, workflow DSL, or universal device framework. Apply DRY after repeated use,
YAGNI to unproven needs, and KISS at every change boundary.
