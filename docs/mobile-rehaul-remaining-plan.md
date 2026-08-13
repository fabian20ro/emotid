# Remaining Product Plan

Status: core mobile migration, persistence hardening, current-session safety semantics, and
first-run storage transparency complete. Remaining work: Journal simplification, primary-entry
information architecture, moderated comprehension validation, and release closure. Updated
August 13, 2026.

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
- English/Romanian, light/dark, keyboard, reflow, focus, PWA lifecycle, and performance budgets
  have broad automated coverage. Historical physical and simulator evidence retains the limits
  documented in `docs/physical-release-evidence.md`.

Physical iPhone testing remains outside scope. Simulator VoiceOver is not represented as physical
screen-reader evidence.

## Open Risks

1. Journal aggregates use one global three-session gate. One somatic entry can appear as a body
   pattern after two unrelated reflections satisfy the threshold.
2. `Unpack a moment` requires seven fields and dormant copy calls it DBT, while the implementation
   duplicates triggering/prompting events and omits important links and alternatives.
3. Vocabulary practice says there is no score but ends with clear/unsure totals, which can make
   uncertainty feel like underperformance.
4. Today adds a route-choice step before Place the Feeling, and Explore gives naming and learning
   methods equal weight.
5. Moderated comprehension evidence and final exact-candidate release dispositions remain open.

## Architecture Direction

### Keep

- client-only deployment and explicit outbound-link boundary;
- feature registry, lazy routes, and route-local input state;
- one typed workflow for completion, current-session safety, Reflection, and persistence;
- workflow-local bounded write coordinator and privacy-safe diagnostics;
- deterministic crisis data and fail-closed reviewed catalog content;
- machine-readable acceptance manifest with platform-local adapters.

### Next Small Improvement

Add one pure Journal evidence-policy module containing only per-summary eligibility predicates and
small thresholds. It replaces the misleading global gate and gives tests one auditable boundary.
It must not become an analytics framework, scoring service, or generic rules engine.

### Avoid

No router migration, global state library, backend, telemetry, database rewrite, design-system
project, workflow DSL, or universal device-test framework. Extract a shared pattern only after
three real uses or when a safety/data-loss boundary requires one owner.

## Recommended Sequence

### P43 - Journal and Learning Surface Simplification (next)

1. Add red-first tests for each Journal metric, then replace the global presentation gate with the
   pure evidence policy. Body summaries require their own somatic evidence; labels remain factual
   counts or observations, not personal patterns.
2. Characterize stored chain records and export behavior. Migrate existing data without loss, then
   simplify new entries to four neutral parts: what happened; what was noticed; what the person
   did; what followed or might help next. Require only enough content to save a meaningful entry.
3. Remove clear/unsure totals and score-like completion copy from vocabulary practice. Keep
   `not sure` equal to any other answer and retain descriptive distinctions after a choice.
4. Remove only proven-unused causal, trait, achievement, and cross-model i18n/history copy.
5. Verify legacy records, export/delete, recovery, EN/RO, 320px and 200% reflow, keyboard/focus,
   light/dark, and complete WebKit/Chromium Journal/Explore journeys.

Exit: no summary appears from unrelated evidence; no clinical overclaim; no forced seven-field
task; no uncertainty score; old local records remain readable and exportable.

### P44 - Entry and Explore Information Architecture

1. Characterize current deep-link, Back/Forward, interruption, and recovery behavior before edits.
2. Make Place the Feeling the direct Today primary action. Keep Help me choose as the secondary
   route into the existing guide.
3. Keep direct method selection in Explore and group existing routes into naming and learning.
   Add no hub, route layer, or tutorial.
4. Verify route history, focus handoff, touch geometry, compact/large mobile, EN/RO, light/dark,
   WebKit/Chromium, and PWA update survival.

Exit: primary placement begins in one tap; guidance remains one tap away; every existing method
remains reachable without duplicated route choices.

### P45 - Moderated Comprehension Validation

Run five to eight short, local sessions across Romanian and English where feasible. Collect no
telemetry. Observe without coaching:

- start Place the Feeling and start with Help me choose;
- select an intermediary Word Ladder term;
- reject a Reflection result and finish;
- explain local saving and what the Google handoff sends;
- use Journal reflection and `not sure` vocabulary practice.

Record completion, hesitation, wrong turns, interpretation of urgency, and participant wording.
Fix repeated findings; a single finding is sufficient only for safety, accessibility, or data loss.

### P46 - Release Closure

1. Record pass, waive, or defer dispositions for remaining human TalkBack gestures/spoken order,
   Romanian TalkBack pronunciation, installed Android mode, and distinct low-tier timing.
2. Freeze and deploy one candidate SHA.
3. Run clean install, dependency, `npm run check`, full Playwright, PWA, performance, iOS Simulator,
   macOS Safari, and available Android supporting gates against that exact SHA.
4. Consolidate evidence and require zero unresolved release-blocking defects.

## Verification Rule

Every phase starts with a failing behavior-boundary test, then the smallest implementation,
focused verification, and complete repository gates. Visual and accessibility changes require
rendered EN/RO and light/dark Playwright coverage. Safety changes require deterministic invariants
and separate psychological review. Persistence tests use controllable promises and clocks.

## Decision

Implement P43 next. Per-metric evidence eligibility is the smallest high-impact architecture
change and removes the most misleading remaining psychological claim before the larger entry-flow
reordering.
