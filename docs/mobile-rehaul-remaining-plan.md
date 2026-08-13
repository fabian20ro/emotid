# Remaining Product Plan

Status: core mobile migration, P47 rejected-result trust correction, and P48 Journal exercise
discoverability complete. P45 human validation is deferred. Remaining work: release closure and
bounded evidence-dependent copy review. Updated August 13, 2026.

This is the only active implementation plan. Historical work belongs in `ITERATION_LOG.md`,
release criteria in `docs/release-quality-gates.md`, and candidate evidence in
`docs/physical-release-evidence.md`.

## Current Baseline

- Today, Explore, Journal, Settings, Privacy, Support, all input routes, and Reflection share one
  routed mobile shell and one completion/persistence boundary.
- Quick, Body Compass, Affect Map, Word Ladder, and Plutchik converge on a tentative Reflection
  flow. Users can reject results, stop early, and leave optional interpretation unopened.
- Crisis support is deterministic from the current result only. Saved history cannot increase
  present urgency; tier-4 support remains ahead of reflection and requires acknowledgment.
- Saved reflections remain on-device. The first-run introduction exposes the existing default-on
  local-save choice, and replay reflects the current setting.
- Google AI Mode remains an explicit, default-on external-link capability. It sends only selected
  emotion names through the existing fixed query with `udm=50`; no API, backend, or telemetry was
  added.
- Visible EN/RO language uses reflection rather than assessment terminology, explains Affect Map
  dimensions in ordinary language, identifies Plutchik choices as model-specific starting
  emotions, and names Google AI Mode directly.
- Journal summaries use metric-local evidence thresholds. The journal exercise is one optional
  four-part reflection, legacy seven-field records remain readable/exportable, and vocabulary
  practice reports no certainty totals.
- English/Romanian, light/dark, keyboard, reflow, focus, PWA lifecycle, and performance budgets
  have broad automated coverage. Historical physical and simulator evidence retains the limits
  documented in `docs/physical-release-evidence.md`.
- Today starts Place the Feeling directly and keeps Help me choose one tap away. Explore groups
  noticing/naming separately from comparison/learning without duplicating route ownership.
- Vocabulary practice now offers a reason-neutral Not sure yet choice. Its feedback and sticky
  Continue action remain visible at 320x568 across EN/RO and light/dark themes.
- Rejected results retain local provenance but are presented on Today, Journal, and saved detail as
  suggestions that did not fit. They remain excluded from pattern analytics and inferred guidance.
- Journal shows the latest saved exercise before emotion-reflection history, with a factual timestamp
  and direct link to the existing exercise screen. Exercise and emotion stores remain separate.

Physical iPhone testing remains outside scope. Simulator VoiceOver is not represented as physical
screen-reader evidence.

## Open Risks

1. Six-session moderated participant evidence is deferred; synthetic walkthroughs are preflight only.
2. Final exact-candidate release dispositions remain open.

## Architecture Direction

### Keep

- client-only deployment and explicit outbound-link boundary;
- feature registry, lazy routes, and route-local input state;
- one typed workflow for completion, current-session safety, Reflection, and persistence;
- workflow-local bounded write coordinator and privacy-safe diagnostics;
- deterministic crisis data and fail-closed reviewed catalog content;
- machine-readable acceptance manifest with platform-local adapters.

### Next Change Boundary

P46 closes one exact release candidate; it does not add product behavior. Freeze the commit only
after it is pushed, record every unavailable human or physical gate as an explicit defer/waiver,
and run automated gates against that same SHA. Do not change copy to make an unevidenced validation
row pass.

### Avoid

No router migration, global state library, backend, telemetry, database rewrite, design-system
project, workflow DSL, or universal device-test framework. Extract a shared pattern only after
three real uses or when a safety/data-loss boundary requires one owner.

## Recommended Sequence

### P46 - Release Closure (next actionable)

1. Freeze the pushed candidate SHA and run a clean dependency install.
2. Run `npm run check`, full Playwright, PWA, performance, iOS Simulator, macOS Safari, and any
   available Android supporting gates against that exact SHA.
3. Record pass, waive, or defer dispositions for human TalkBack gestures/spoken order, Romanian
   TalkBack pronunciation, installed Android mode, distinct low-tier timing, and P45 participants.
4. Consolidate candidate-bound evidence and require zero unresolved release-blocking defects.

### P49 - Evidence-Dependent Comprehension Copy

Defer changes to onboarding language placement, Affect Map terminology, Google AI Mode/Search
wording, and onboarding skip. The synthetic runs were incomplete or used an English browser locale;
they establish no repeated human comprehension failure. Reopen only with human evidence or a new
deterministic contradiction.

### P45 - Moderated Participant Validation (deferred)

Retain `docs/moderated-comprehension-validation.md` for a future six-person round. Do not convert
expert review, synthetic agents, automation, or owner acceptance into participant outcomes. If
release closure precedes recruitment, record an explicit waiver naming every unrun task and its
residual comprehension risk.

## Verification Rule

Every phase starts with a failing behavior-boundary test, then the smallest implementation,
focused verification, and complete repository gates. Visual and accessibility changes require
rendered EN/RO and light/dark Playwright coverage. Safety changes require deterministic invariants
and separate psychological review. Persistence tests use controllable promises and clocks.

## Decision

Run P46 next against the pushed P48 commit. Keep P49 and P45 deferred; record an explicit P45 waiver
if release closure proceeds before human recruitment.
