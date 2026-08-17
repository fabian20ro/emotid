# Product Maintenance Plan

Status: the mobile UI/UX migration and the August 18 corrective pass are complete on `main`.
Remaining work is release closure or evidence collection, not another migration program. Updated
August 18, 2026.

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
- Every successful `main` deployment receives an isolated public-URL smoke check for shell, assets,
  manifest, service-worker control, lazy-route loading, browser errors, and outbound requests.
- Red CI browser runs stop after the first test exhausts its retries; local diagnostics remain
  unlimited and green CI still executes the complete two-engine matrix.

## Completed Corrective Pass

- **P0:** data deletion now pauses and drains the workflow writer before clearing both stores;
  Privacy switch geometry is measured across compact EN/RO and light/dark combinations.
- **P1:** Affect has neutral-origin language, visible SVG focus, contrast-safe selected chips, and
  completion reveal; Plutchik reveals its result/action; Word Ladder persists the traversed graph
  path; Journal distinguishes exercise-load failure from empty history.
- **P2:** the unchanged emotion-name-only Google AI Mode handoff requires explicit fit; body matches
  retain qualitative provenance; crisis save state remains visible; repositories fail fast on
  malformed records; safety-resource URLs have one source.
- **P3:** CI runs one complete policy gate; stale docs, security guidance, dead bridge code, the
  missing color token, and ambiguous Word Ladder accessible names are corrected.

## Active Priorities

### P4 - Corrective release closure

1. Require the pushed `main` workflow, both browser projects, Pages deployment, and public smoke to
   pass for the exact corrective commit.
2. If this pass is published as a patch, create one immutable release identity and update only the
   release note and candidate-bound evidence owner. Do not rewrite historical evidence rows.
3. Continue monitoring the initial-JavaScript budget. It is close to its ceiling but still passes;
   profile and split only after a measured failure or material route-timing regression.

### P5 - External evidence when available

1. Run the existing low-tier Android performance matrix on a genuinely distinct low-tier device.
2. Resume moderated comprehension only with six real participants; synthetic agents remain expert
   preflight, not participant evidence.
3. Resume complete TalkBack and native Safari rows only when the required environment is available.

### P6 - Evidence-gated product questions

1. Revisit live-region controls and modal background exposure only after native assistive-technology
   evidence reproduces a failure.
2. Review standalone Romanian masculine emotion labels with native linguistic and psychological
   input before any catalog-wide grammatical change.
3. Add a fourth Reflection fit answer only if participant evidence shows that `partly` is
   insufficient.

## Recommended Sequence

Close P4 first. P5 is next only when its external prerequisites exist. P6 remains closed unless its
named evidence trigger occurs. No product refactor is justified while automated quality,
performance, and production-boundary gates pass.

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
- **Assistive-technology uncertainty:** live regions containing controls and modal background
  exposure remain risks, not reproduced defects. Recheck with native screen-reader evidence before
  changing announcements or adding `inert` behavior.
- **Romanian catalog register:** standalone masculine emotion labels need native psychological and
  linguistic review before a bulk grammatical rewrite.
- **Reflection choice set:** do not add a fourth "not sure" answer until participant evidence shows
  that the existing "partly" choice fails to express uncertainty.

## Closed Pending Evidence

Do not change onboarding language placement, Affect terminology, Google AI Mode wording, or skip
behavior from incomplete synthetic runs. Reopen only after repeated human evidence or a new
deterministic contradiction.

## Avoid

No speculative router migration, global state library, backend, telemetry, datastore rewrite,
design-system project, workflow DSL, or universal device framework. Apply DRY after repeated use,
YAGNI to unproven needs, and KISS at every change boundary.
