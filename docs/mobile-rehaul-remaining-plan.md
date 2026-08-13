# Remaining Product Plan

Status: core mobile migration and automated platform coverage complete. Remaining work is focused
reliability, psychological safety, interaction simplification, human validation, and release
closure. Updated August 13, 2026.

This is the only active implementation plan. Historical work belongs in `ITERATION_LOG.md`, release
criteria in `docs/release-quality-gates.md`, and run evidence in
`docs/physical-release-evidence.md`.

## Current Baseline

### Strong and complete

- Today, Arrival, Explore, Journal, Settings, Privacy, Support, check-in routes, and Reflection use
  one routed mobile shell and one completion/persistence boundary.
- Quick, Body Compass, Affect Map, Word Ladder, and Plutchik all reach the same tentative Reflection
  flow. Users can reject results, stop early, and avoid optional interpretation.
- Data stays on-device. There is no account, telemetry, backend, or cloud sync. Google AI Mode is an
  explicit external handoff and external links are independently controllable.
- English/Romanian, light/dark, keyboard, reflow, focus, PWA lifecycle, and performance budgets have
  broad automated coverage. The latest full Playwright matrix passed 214/214; the latest unit run
  passed 664/664.
- Android browser TalkBack supporting automation passed J1-J9 in all EN/RO and light/dark
  combinations, 36/36, plus four local audio/language diagnostics. iOS Simulator, macOS Safari,
  and production PWA supporting suites are complete within their documented capability limits.

### Known open risks

1. Three recent high-distress sessions automatically increase the displayed crisis tier. This
   conflicts with the product contract that selected words must not be treated as evidence of
   present danger or self-harm intent.
2. Saving is enabled by default and disclosed on Today/Privacy, but the first-run introduction does
   not make the storage choice explicit before the first check-in is saved.
3. Journal aggregate evidence is gated by three total sessions, not by evidence relevant to each
   metric. One somatic entry can therefore appear as a body "pattern" when two unrelated sessions
   merely satisfy the global threshold.
4. `Unpack a moment` is a seven-required-field partial behavior-chain exercise. Its dormant copy
   calls it DBT, but it duplicates triggering/prompting events and omits important links and
   alternatives. The clinical label promises more than the product implements.
5. Vocabulary practice says there is no score but ends with counts of "clear" and "unsure"
   choices. This can turn uncertainty into apparent underperformance.
6. Romanian still uses evaluative or literal language such as `verificare` for check-in and
   `caracterul plăcut` for pleasantness. Plutchik and external-search labels also expose avoidable
   model or product jargon.
7. Today leads to a four-choice Arrival screen before the user can begin. Explore gives five
   methods equal visual weight. Both are understandable, but more choice than the core task needs.
8. Human TalkBack gestures/spoken order, Romanian TalkBack pronunciation, installed Android mode,
   a distinct low-tier Android timing profile, and final exact-candidate sign-off remain open or
   need explicit release dispositions.

Physical iPhone testing remains outside scope. Simulator VoiceOver is not represented as physical
screen-reader evidence.

## Prioritized Audit

### P1 - High

#### Persistence can wait forever

`useCheckInWorkflow` serializes writes by chaining every save behind the previous promise. It has
no deadline, unhealthy state, or reset generation. A stuck IndexedDB operation therefore leaves
the user waiting indefinitely and makes Retry ineffective because Retry joins the same queue.

Decision: introduce one small, workflow-local write coordinator. It serializes writes, reports
`idle | writing | degraded`, fails the UI after a bounded deadline, rejects later retries quickly
while the underlying write remains unresolved, and ignores late results from an obsolete workflow
generation. It records only operation ID, kind, duration, and outcome; never emotion content.

Do not add a generic repository framework, event bus, telemetry service, or application state
machine.

#### Historical labels alter crisis prominence

The current temporal rule turns repeated label-derived tiers into a stronger current tier. Even
though the UI describes resources as support rather than diagnosis, the behavior can feel like
surveillance or a hidden risk assessment. It also contradicts the repository's own psychological
copy contract.

Decision: remove temporal tier escalation. Keep support permanently reachable in Settings and keep
the current-session deterministic visibility rules until a separately validated product decision
changes them. Historical entries may never increase urgency by themselves.

#### Sensitive local storage lacks first-run choice

Local-only storage is privacy-preserving, but automatic storage of emotional entries is still a
meaningful consequence. The user sees the local-storage status on Today only after onboarding.

Decision: add a compact save-on-device choice to the final introduction step, enabled by default,
with the same preference and wording used by Privacy. No new onboarding screen. Introduction stays
optional and replayable.

### P2 - Medium

#### Journal summaries overstate evidence

The UI uses one global three-session gate for vocabulary, weekly valence, and somatic frequency.
Use per-summary eligibility and factual labels such as `observations` or `counts`; do not call a
small sample a personal pattern. Rejected suggestions remain excluded. A body summary requires its
own minimum number of somatic entries.

#### Journal exercise overclaims and over-demands

Replace the partial DBT claim with a neutral four-part reflection: what happened; what was noticed
(feelings, thoughts, body, urges); what the person did; what followed or might help next. Keep
responses optional except for the minimum needed to save a meaningful entry. Preserve Back,
entered text, retry, local deletion, and bilingual parity.

#### Vocabulary practice creates an implicit score

Remove clear/unsure totals and performance-like completion copy. Retain `not sure` as an equal,
valid answer and provide descriptive distinctions only after a choice. Finish with a neutral close
or restart action.

#### Language is too evaluative or technical

Run one controlled EN/RO terminology pass across visible surfaces:

- replace Romanian `verificare` according to context with `moment de reflecție`, `înregistrare`, or
  a direct action;
- explain the affect axis as how pleasant or unpleasant the state feels; keep short axis labels;
- describe Plutchik's eight choices as starting emotions in this model, not universal primaries;
- label the handoff `Explore in Google AI Mode` / Romanian equivalent, without changing the fixed
  query or `udm=50` behavior;
- replace `What you may need` with the less essentializing `What might help` where appropriate;
- remove causal, trait, achievement, and obsolete cross-model copy that is no longer rendered.

#### Onboarding primes explanations

The current second screen suggests boundaries, loss, and uncertainty before the user has observed
anything. Replace it with a shorter statement: feelings can have more than one meaning; context and
the user's judgment decide what fits. Combine this with the save-on-device choice.

### P3 - Lower, evidence-driven

#### Entry and Explore require excess choice

Respect the earlier product decision that Place the Feeling is the most important route:

- Today primary action opens Affect Map directly;
- a secondary `Help me choose` action opens the existing two-question guide;
- direct method selection remains in Explore instead of being repeated in Arrival;
- Explore separates three naming routes from two learning/practice routes, rather than presenting
  five equal cards.

Validate this change with users before removing any route. Do not add another hub or tutorial.

#### Settled save status competes with the result

Keep saving/error state programmatically announced, but reduce the visual prominence of the settled
`saved` state. Pending and error states remain prominent and recoverable.

## Architecture Assessment

### Keep

- client-only deployment and explicit outbound-link boundary;
- feature registry and lazy route loading;
- one check-in workflow for completion, safety, Reflection, and persistence;
- route-local input state and typed navigation snapshots;
- semantic color tokens and shared mobile shell;
- machine-readable acceptance manifest with driver-specific adapters;
- deterministic safety data and fail-closed reviewed catalog content.

### Change

The highest-impact small architectural improvement is the workflow-local write coordinator
described in P41. It improves reliability, clarity, observability, debuggability, and testability
without changing repositories or adding a broad abstraction.

Secondarily, make evidence eligibility explicit per Journal summary. One pure policy module may own
the small thresholds and eligibility predicates. It must not become an analytics framework.

### Do not change

- no React Router migration, global state library, backend, telemetry, database rewrite, design
  system project, workflow DSL, or universal device-test framework;
- no component extraction based only on file length;
- no global coverage target. Add tests at changed risk boundaries; current product modules already
  have materially stronger coverage than platform-driver scripts.

## Recommended Sequence

### P41 - Persistence Reliability Boundary (complete)

1. Added a workflow-local coordinator with an eight-second deadline, serialized healthy writes,
   generation isolation, degraded-state rejection, and privacy-safe transient diagnostics.
2. Added `AbortSignal` support to the IndexedDB session write so a genuine pending transaction is
   cancelled instead of merely abandoned.
3. Reused the existing recoverable save-error UI. Retry is blocked while a non-cancellable test
   transaction remains unresolved, then succeeds after settlement without changing session ID.
4. Added deterministic coordinator, hook, and repository tests plus a controlled-clock WebKit and
   Chromium regression for timeout, retry, late settlement, and diagnostics.
5. Verified `npm run check` (84 files / 664 tests), Playwright (214/214), production PWA (1/1), and
   production performance (1/1).

Exit: no UI state can remain pending forever; late writes cannot overwrite current state; normal
save behavior and session identity remain unchanged.

### P42 - Safety, Consent, and Controlled Language (next)

1. Red-first tests remove historical tier escalation while preserving current-session support
   visibility and tier-4 acknowledgment behavior.
2. Delete temporal escalation state/copy/code and update the psychological contract evidence.
3. Add the final-onboarding local-save choice using the existing setting and default-on behavior.
4. Apply the bounded EN/RO terminology and onboarding pass. Keep Google query semantics unchanged.
5. Run a separate psychological review, copy checks, crisis invariants, onboarding/replay tests,
   EN/RO Playwright, dark/light, keyboard, and screen-reader semantics.

Exit: history cannot raise current urgency; storage is transparent before first use; visible copy
is non-evaluative, idiomatic, and behaviorally accurate.

### P43 - Journal and Learning Surface Simplification

1. Add failing per-metric Journal evidence tests, then replace the global presentation gate.
2. Migrate existing chain data without loss; simplify new entries to the neutral four-part model.
3. Remove score-like granularity summaries and obsolete unused i18n/history copy.
4. Verify existing records, export/delete behavior, error recovery, EN/RO, 320px/200% reflow,
   keyboard/focus, dark/light, and Playwright Journal/Explore journeys.

Exit: no clinical overclaim, no forced seven-field task, no uncertainty score, and no summary shown
from unrelated evidence.

### P44 - Entry and Explore Information Architecture

1. Characterize existing route/deep-link/back behavior before changing navigation.
2. Make Place the Feeling the direct Today action and keep Help me choose as secondary support.
3. Group Explore into naming and learning sections using existing routes and components.
4. Verify route history, interruption/recovery, focus handoff, touch geometry, small/large mobile,
   EN/RO, light/dark, WebKit/Chromium, and PWA update survival.

Exit: a new user can start the primary method in one tap, ask for guidance in one tap, and find all
other methods without a new navigation layer.

### P45 - Moderated Comprehension Validation

Run five to eight short, local, task-based sessions across Romanian and English where feasible. Do
not collect telemetry. Observe without coaching:

- start Place the Feeling and start with Help me choose;
- select an intermediary Word Ladder term;
- reject a Reflection result and finish;
- explain what is saved locally and what the Google handoff sends;
- use Journal reflection and `not sure` vocabulary practice.

Record completion, hesitation, wrong turns, interpretation of urgency, and user wording. Fix only
repeated or high-severity findings. Three occurrences may justify a shared interaction pattern;
one occurrence may justify a fix when safety or data loss is involved.

### P46 - Release Closure

1. Decide explicit pass/waive/defer dispositions for human TalkBack browser/installed gestures and
   spoken order, Romanian TalkBack pronunciation, and distinct low-tier Android timing.
2. Freeze one candidate SHA and deploy it.
3. Run clean install, dependency, `npm run check`, full Playwright, PWA, performance, simulator,
   macOS Safari, and available Android supporting gates against that exact candidate.
4. Consolidate evidence and record zero unresolved release-blocking defects.

## Verification Rule

Every phase starts with a failing test at the behavior boundary, then the smallest implementation,
focused verification, and finally the complete repository gates. Visual and accessibility changes
require rendered Playwright checks in EN/RO and light/dark. Safety changes require explicit
deterministic invariants and separate psychological review. Persistence tests use controllable
promises and clocks, never arbitrary sleeps.

## Decision

Implement P42 next. The temporal crisis rule is a contract-level safety problem, and first-run
storage transparency plus the bounded bilingual terminology pass fit the same trust boundary.
