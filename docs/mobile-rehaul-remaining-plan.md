# Remaining Product Plan

Status: core mobile migration and primary-entry information architecture complete. Remaining work:
moderated comprehension validation and release closure. Updated August 13, 2026.

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

Physical iPhone testing remains outside scope. Simulator VoiceOver is not represented as physical
screen-reader evidence.

## Open Risks

1. Moderated comprehension evidence remains open.
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

P45 is research and bounded correction, not an architecture phase. Use the existing screens and
local evidence templates. Change product behavior only for repeated findings, or immediately for
safety, accessibility, or data loss. Do not add telemetry, a research backend, or a generic survey
system.

### Avoid

No router migration, global state library, backend, telemetry, database rewrite, design-system
project, workflow DSL, or universal device-test framework. Extract a shared pattern only after
three real uses or when a safety/data-loss boundary requires one owner.

## Recommended Sequence

### P45 - Moderated Comprehension Validation (next)

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

Run P45 next. The implementation is now broad enough that another speculative UI pass would add
more risk than value. Short moderated sessions should identify repeated comprehension failures;
fix only those findings, then freeze the exact P46 release candidate.
