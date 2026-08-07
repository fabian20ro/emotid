# Remaining Mobile Migration Plan

Status: P24 Android physical profile partially complete; full assistive-technology and low-tier
hardware acceptance remain, August 4, 2026.

## Completed Since Last Update

- Localized stored body-region and sensation IDs at display time, completed Journal body/need/step
  detail, and added explicit loading/error/empty states without mutating old records.
- Replaced sessions-only export/delete with versioned full-data behavior covering sessions, chain
  entries, preferences, and dynamic hints; destructive confirmation is now portaled and focus-trapped.
- Replaced Guide Me route reordering with two concrete, deterministic questions that hand off
  directly to Body, Affect, or Words while preserving an explicit no-answer return.
- Repaired Affect Map placement: nearby words now appear as visible pins and persistent controls in
  normal flow, outside sticky-action overlap.
- Replaced Plutchik's generic bubble scatter with a stable eight-emotion wheel, two-choice gating,
  and inline combination feedback while preserving the existing analyzer.
- Replaced generic "Optional theory" subtitles with route-specific Explore descriptions.
- Made external AI search links allowed by default while preserving an explicit user opt-out.
- Replaced the reachable Emotional Vocabulary and Unpack a Moment modal windows with normal routed
  screens. Their model/data behavior remains local and unchanged.
- Replaced abstract Today copy with a direct question and concrete next choices in both languages.
- Removed Settings from active check-ins and Reflection so utility navigation cannot silently
  discard route-local work; screen Back and crisis support remain available.
- Extracted `WordLadderScreen`, added exact one-level hierarchy Back, selectable ancestor levels,
  removable selections, semantic list controls, and bilingual browser coverage.
- Added optional user-driven comparison between the selected word and one unranked sibling from
  the same visible level, using existing catalog descriptions and neutral wording.
- Made inferred needs user-selectable in Reflection: every suggestion starts unselected and an
  explicit optional choice persists into Journal and JSON export.
- Removed the unreachable modal-era Quick Check-in, results, history, settings, uncertainty,
  intervention, and sessions-only export presentation after tracing every production caller.
- Replaced the mixed-responsibility Body Map with a route-owned staged flow and a
  presentation-only, theme-aware `BodyRegionMap`.
- Replaced automatic label-derived actions with explicit neutral choices, made rejected results
  discard inferred details, disclosed the Google handoff, and migrated the crisis presentation.
- Deleted the unreachable Guided Scan stack after confirming that it had no release entry point.
- Made Reflection await local persistence, expose pending/failure states, retry the same detail,
  and continue without false saved confirmation when IndexedDB fails.

## Constraints

- Keep `App` as the single completion, crisis, reflection, and persistence boundary.
- Keep route input state local unless a proven interruption case requires lifting it.
- Reuse model analyzers, catalog data, storage, and typed navigation.
- Add an abstraction only after two production callers need the same behavior.
- No backend, AI API, React Router, generic wizard/state machine, datastore rewrite, or broad design-system project.
- Every user-facing copy change updates English and Romanian together.

## Completed: Protect In-Progress Check-Ins

Settings is hidden during check-in and Reflection. Back remains the explicit exit, tier-4 support
stays in the Reflection content, and preferences are changed only after leaving the workflow.
No draft persistence or navigation-state framework was added.

## Completed: Word Ladder

The inline ladder is now `WordLadderScreen`; it preserves the Wheel analyzer, keeps hierarchy
history local, returns one level at a time, and allows any visited ancestor or precise leaf to be
selected. Selection-time context retains that exact sibling level for optional comparison without
calculating similarity or changing the model contract.

**Tests:** broad and precise completion, hierarchy Back, English and Romanian comparison, keyboard
selection, dark contrast, mobile bounds, no-overlap geometry, and shared crisis completion.

## Completed: Make Needs User-Selectable

Reflection now presents the deduplicated inferred-needs set as a removable single-select control.
Every need starts unselected so model output cannot silently become a user answer. The existing
optional `selectedNeed` field carries an explicit choice through the shared save boundary into
Journal detail and JSON export. No taxonomy, mapping layer, or next-step behavior changed.

**Tests:** no need, one need, deduplicated multiple needs, keyboard selection, clearing,
save-disabled behavior, English/Romanian copy, session detail, JSON export, dark contrast, mobile
bounds, and tier-4 gating.

## Completed: Make Guide Me Deterministic

Guide Me now asks whether a body signal can be located, then only when needed asks whether the
feeling can be placed without a name. A pure decision function returns Body, Affect, or Words.
Answers remain local and disposable; Back moves exactly one question, and every question offers
the unchanged standard route list without forcing an answer.

**Tests:** every decision path, direct handoff to all three routes, keyboard operation, exact Back,
Romanian copy, dark contrast, mobile bounds, and no forced answer.

## Completed: Strengthen Journal Data Trust

Raw body-region and sensation IDs remain unchanged in stored records and exports; a shared somatic
display helper localizes them in Journal patterns and detail. Detail also shows selected needs and
next steps when present while old records retain a clear fallback.

Export now uses a versioned envelope with a fresh repository read of sessions and chain entries plus
a resolved preference snapshot. Delete clears both IndexedDB stores, resets persisted preferences
and dynamic hint state, and preserves only non-preference onboarding completion. Its confirmation
uses the existing body portal and focus trap.

**Tests:** old record compatibility, complete export/delete and reload, preference reset, no data
mutation during viewing, EN/RO body display, empty/loading/error states, focus restoration, dark
contrast, and mobile dialog bounds.

## Completed: Finish Explore and Remove Legacy Presentation

The import graph confirmed that `QuickCheckIn`, `ResultModal`, `SessionHistory`, `SettingsMenu`,
`DontKnowModal`, and their private result/intervention/toggle/info/export helpers had no production
route. Their dedicated tests and 13 unused translation namespaces were deleted with them.

Active journal analytics, session repository compatibility, `ModalShell`, focus trapping, crisis
logic, model analyzers, and the entire Body Compass dependency tree remain. Codemaps now describe
the routed screen architecture instead of the removed modal shell.

**Verification:** `npm run check` passes 68 files and 637 tests. `npm run test:e2e` passes all 80
Mobile Safari and Mobile Chrome cases, including explicit zero-dialog checks for migrated utility
screens. Manual 393x742 dark inspection confirmed readable, bounded Today and delete-confirmation
states. Main CSS fell from 81.70 to 65.20 kB and main JS from 473.84 to 463.19 kB.

## Completed: Body Compass Presentation

`BodyCompassScreen` now owns side, region, sensation, intensity, review, edit, and removal state.
Its lazy `BodyRegionMap` receives only regions, selections, side, and `onRegionActivate`; somatic
input no longer pretends to fit the generic model-visualization contract.

The SVG uses semantic light/dark surface, anatomy, connector, label, selected, and focus tokens.
Front/back filtering, region paths, expanded hit paths, model scoring, and the Area -> Sensation ->
Intensity -> Review workflow are unchanged. Native SVG paths replace motion-owned geometry for
deterministic CSS-variable rendering and keyboard focus.

The unreachable `BodyMap` orchestrator and `SensationPicker` sheet were deleted with their
dedicated tests. The later P7 review also deleted `GuidedScan`, `GuidedScanPhases`,
`IntensityPicker`, and their unused constants, copy, and tests because they had no active caller
or distinct release value.

**Verification:** `npm run check` passes 67 files and 625 tests. `npm run test:e2e` passes all 88
Mobile Safari and Mobile Chrome cases. Browser coverage measures front/back bounds at 360x800,
393x742, and 430x932, SVG label contrast in both themes, keyboard activation, staged completion,
Back/edit/remove/add-another behavior, shared crisis completion, and all non-body regressions.
Manual 393x742 inspection caught and fixed undersized and edge-clipped labels; final light/dark
screens have no console errors. The body route chunk fell from 23.30 kB (8.22 gzip) to 6.89 kB
(2.98 gzip), and main CSS fell from 65.20 to 63.69 kB.

## Completed: P6 Release Hardening

The Affect field now supports arrow-key placement through the same nearest-emotion path as pointer
placement. Its focusable SVG has localized nonvisual instructions, a visible focus ring, and a live
energy/pleasantness readout. No alternate model state or accessibility framework was added.

The browser release matrix now covers:

- Romanian Quick, Body, Affect, Words, Plutchik, Journal, Privacy, and tier-4 journeys.
- Keyboard-only activation and completion through every primary input route and Reflection.
- Portaled destructive-confirmation trapping, wrapping, Escape close, and trigger focus restoration.
- Reduced motion, offline/reconnected state, save-disabled persistence behavior, and one 1280x800
  desktop sanity viewport.
- Deterministic support-boundary fixtures through Quick, Body, Affect, Words, and Plutchik,
  including tier-4 pre-acknowledgment gating.
- Existing mobile geometry at 360x800, 393x742, and 430x932 in both configured browser engines.

Generated Playwright report/result directories are excluded from lint and Git so independently
started developer checks cannot race with Playwright cleanup.

**Verification:** `npm run check` passes 67 files and 628 tests, translation audits, TypeScript,
lint, and production build. `npm run test:e2e` passes all 130 Mobile Safari and Mobile Chrome
cases. Manual desktop light/dark inspection confirmed the Affect focus ring, readout, suggestions,
and constrained field remain visible without clipping.

## Completed: P7 Reflection Trust and Safety

Reflection now treats every generated label as a hypothesis. Choosing `Not really` withdraws
inferred needs, meaning, AI exploration, and next-step content; the user can revise the input or
finish without persisting a label-derived need or action. `Partly` retains uncertainty language.

The former opposite-action lookup and automatic breathing intervention were removed. The optional
next-step view offers three neutral, explicit choices and does not save one until the user selects
it. Opening that subview resets the content scroller so its heading remains visible at 320px.

The external Google AI Mode link keeps the existing fixed-query contract and now gives
just-in-time disclosure before the handoff. Crisis copy explicitly states that selected words
cannot establish danger or self-harm intent. The migrated banner exposes a verified Romanian
telephone resource and international directory as large actionable links; optional grounding is
collapsed by default and framed as stoppable.

The unreachable Guided Scan stack and label-derived opposite-action data were deleted rather than
retained as unsupported clinical behavior.

**Verification:** `npm run check` passes 65 files and 605 tests, bilingual audits, TypeScript, lint,
and production build. `npm run test:e2e` passes all 144 Mobile Safari and Mobile Chrome cases,
covering rejection persistence, partial-fit uncertainty, explicit next-step selection, AI
disclosure, tier-4 gating, actionable support links, dark contrast, and 320px bounds. Manual
320x568 light/dark inspection confirmed readable mismatch, next-step, and support states with no
horizontal overflow.

## Completed: P8 Persistence Trust

`App.saveReflection` now returns an explicit `saved` or `not-saved` result and awaits the existing
session repository before marking a reflection saved. Saving-disabled completion returns without
touching IndexedDB. No queue, global store, schema migration, or persistence abstraction was added.

Reflection owns a four-state local lifecycle: idle, saving, error, and finished. A synchronous
in-flight ref blocks duplicate submissions before React can rerender. The attempted
`ReflectionDetail` remains available for retry, while continuing after failure deliberately
finishes with a not-saved outcome. Success copy appears only after repository confirmation.

Pending state uses a polite live status. Failure uses a normal in-flow alert screen with bilingual
explanation, retry, and continue-without-saving actions. Nothing is shown as uploaded or recovered
when the local write fails.

**Verification:** `npm run check` passes 65 files and 608 tests, bilingual audits, TypeScript, lint,
and production build. `npm run test:e2e` passes all 152 Mobile Safari and Mobile Chrome cases.
Browser fault injection covers delayed completion, four same-task clicks producing one write,
first-write failure and retry, permanent Romanian failure, continue without saving, save-disabled
zero-write behavior, and final Journal contents. Manual 320x568 light/dark inspection confirmed no
horizontal overflow, 48px-or-larger recovery actions, visible keyboard focus, and readable tokens.

## Completed: P9 Automated Accessibility and PWA Lifecycle

Every routed screen now exposes one programmatically focusable `h1`; the application `main`
landmark is named by that heading and moves focus there after destination changes. Reflection
also moves focus when recovery or next-step navigation replaces the current view. Inline saving
does not move focus away from the action the user just invoked.
Pending and failed writes announce only their relevant message instead of treating the entire
screen and its actions as one live region.

Browser zoom is no longer disabled. The active language is synchronized to the document language,
and bilingual Playwright acceptance follows Today -> Arrival -> Affect -> Reflection plus local
save recovery. A 640 CSS-pixel desktop viewport provides the repeatable reflow equivalent for a
1280px viewport at 200% zoom.

Workbox now precaches the complete revisioned local build instead of relying on a short-lived,
visited-resource runtime cache. A separate production-only Chromium harness builds two versions
and proves manifest scope, service-worker control, offline reopen, unvisited Affect/Plutchik chunk
availability, IndexedDB Journal persistence, automatic update activation, and data survival after
the update. It also rejects unexpected external requests.

GitHub Actions now uses Node 24 and current Node 24-compatible major releases. The production PWA
lifecycle is a distinct CI gate after the existing Safari/Chrome development-server matrix.

**Verification:** `npm run check` passes 65 files and 608 tests, translation audits, TypeScript,
lint, and a production build with 18 precache entries. `npm run test:e2e` passes all 160 Mobile
Safari and Mobile Chrome cases. `npm run test:pwa` passes the production offline/update lifecycle.
Manual 393x742 light/dark inspection confirmed focused headings, Affect geometry, and Settings
contrast with no horizontal overflow. Visual inspection caught and removed the browser-default
outline from programmatically focused noninteractive headings; interactive focus indicators
remain.

## P9 Manual Follow-Up

Run the scripted critical journey on physical assistive-technology combinations:

1. VoiceOver with Safari on an Apple device.
2. TalkBack with Chrome on Android.
3. Record spoken order, duplicate announcements, modal focus, route focus, and crisis-content
   priority.
4. Make code changes only for demonstrated defects and add a repeatable regression where the
   browser exposes the behavior.

This device-level gate cannot be represented faithfully by Playwright's accessibility tree and was
not claimed as completed in the automated environment.

## Completed: P10 Product Truthfulness

Settings now exposes only implemented preferences: language and appearance. The no-op simple
language and sound controls were removed with their dead runtime hooks. The notification control
was also removed because its visible "Daily reminder" promise could not run after the client-only
application closed. Legacy preference keys remain part of destructive cleanup only.

Language and appearance selectors now expose their current values through pressed-button semantics
in Settings and onboarding. Full-data export uses schema version 2 and omits the retired
preferences without changing stored session or chain records.

The installed-app surface now uses a text-free, mask-safe four-path mark at Apple, 192px, and 512px
sizes. HTML and manifest metadata describe the routed words, body, and affect experience instead
of the retired bubble-first UI. README, codemaps, and historical-plan status were reconciled with
the current product.

**Verification:** `npm run check` passes 64 files and 598 tests. `npm run test:e2e` passes all 160
Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the production offline/update
lifecycle with manifest, icon, and metadata assertions. Manual 393x742 light/dark inspection
confirmed bounded Settings rows, readable selected/unselected states, and correct accessibility
snapshots.

## Completed: P11 Dependency Remediation

The development graph now resolves with zero npm advisories. Vite, esbuild, PostCSS, fast-uri,
AJV, TypeScript ESLint, and related transitive packages moved to patched versions. ESLint and its
React plugins moved together to versions with explicit ESLint 10 peer support; the documented
Node development baseline now matches ESLint's runtime requirement.

Workbox 7.4.1 remains the latest available release but depends on an off-main-thread Rollup plugin
whose EJS 3 dependency retains a vulnerable build-only Jake/filelist chain. A narrow npm override
supplies EJS 6 to that plugin. The plugin uses the stable CommonJS `ejs.render` API, and the
production PWA build plus offline/update lifecycle remain required compatibility gates for this
override.

**Verification:** clean `npm ci` and `npm ls` pass without peer errors; `npm audit` reports zero
vulnerabilities. `npm run check` passes 64 files and 598 tests, bilingual audits, ESLint 10,
TypeScript, and the Vite 7.3.6 / PWA 1.3.0 production build. `npm run test:e2e` passes all 160
Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the two-build production
lifecycle with 18 precache entries.

## Completed: P12 Psychological Copy Boundary

Reflection and generated synthesis now follow a written bilingual psychological copy contract:
model output is a set of rejectable possibilities, the user remains the authority, needs are
options, and labels cannot establish diagnosis, cause, severity, danger, or self-harm intent.
The contract records the distinct crisis and somatic boundaries plus its SAMHSA, WHO, bodily-map,
and uncertainty-communication basis.

Generated narrative copy moved into one typed module. Synthesis logic selects reviewed templates
but no longer parses and repeats arbitrary catalog descriptions. Reflection's brief statement moved
from an inline language branch into paired i18n keys. The 12 entries in `negative-high.json` were
rewritten in English and Romanian to remove causal certainty, physiological overclaiming,
prescribed needs, and identity judgments while retaining conditional support language.

Executable contract tests keep the bounded inventory explicit, require uncertainty in both
languages, reject known overclaiming patterns, and prove unreviewed descriptions cannot leak into
generated synthesis. Full-catalog and somatic provenance review remain P13 work; P12 does not claim
that the other 276 catalog entries have been clinically reviewed.

**Verification:** `npm run check` passes 65 files and 604 tests, bilingual audits, TypeScript,
lint, and the production build. `npm run test:e2e` passes all 160 Mobile Safari and Mobile Chrome
cases, including rendered English/Romanian uncertainty and high-distress boundary assertions.
`npm run test:pwa` passes the production offline/update lifecycle. Manual 393x742 inspection in
English light and Romanian dark confirmed readable wrapping and no console errors. AI query
semantics, crisis rules, support ordering, and gating are unchanged.

## Completed: P13 Catalog and Somatic Provenance

At P13, the catalog distinguished reviewed source descriptions from bounded runtime-generated copy.
Twelve bilingual descriptions retained explicit reviewed provenance; the other 276 legacy
definitions were removed and hydrated through one needs-aware exploratory template. Duplicate IDs,
key mismatches, and unreviewed source descriptions failed closed. P26 later removed that generated
template and raw needs entirely: absent reviewed provenance now produces no runtime guidance.

Body Compass signal data now records every association as a curated hypothesis. Group-map basis is
recorded narrowly where applicable; unsupported local descriptions and needs were removed. Scoring
is additive without a cross-body coherence multiplier, and the rendered review step explains that
results cannot identify cause, diagnosis, or the user's feeling.

Safety rules moved to one versioned data source shared by runtime evaluation and catalog
regeneration. Duplicate selections cannot inflate prompt prominence; order, padding, inventory,
and combination invariants have explicit tests. `npm run check-copy` enforces catalog, somatic,
and safety provenance in CI.

**Verification:** `npm run check` passes 65 files and 607 tests, bilingual/provenance audits,
TypeScript, lint, and the production build. `npm run test:e2e` passes all 160 Mobile Safari and
Mobile Chrome cases. `npm run test:pwa` passes the production offline/update lifecycle. Manual
393x742 Playwright inspection covered onboarding plus the Body Compass review in light and dark;
the evidence note renders at 14px/20.3px without clipping.

## Completed: P14 Early Capture and Explicit Word Stopping

The shared completion boundary now writes a base check-in as soon as a user commits an emotion.
Reflection details update that same stable session ID and timestamp through a small ordered write
queue. Revising a choice replaces the same entry; saving-disabled mode performs zero writes.
Reflection exposes base-save progress, retry, and accurate detail-save failure copy without a
blocking interstitial. Tier-4 support remains first in reading order and unchanged in behavior.

Word Ladder now states that every visited word can be a final answer. The current intermediary has
one prominent `Continue with {word}` action, the path exposes explicit `Add {word}` controls, and
focus follows each level change. It reuses the existing analyzer through one small
`analyzeSelections` hook method; no second model or wizard abstraction was added.

Journal cards and detail distinguish chosen, suggested, confirmed, partial, rejected, and legacy
results. Suggested, partial, and rejected model output is excluded from vocabulary and valence
patterns while all records remain visible and crisis evaluation remains unchanged.

## Completed: P15 Replayable Introduction and Simplified Completion

Settings now has a Help section with a replay action for the existing introduction. Replay is a
body-portaled, focus-trapped, Escape-dismissible dialog that returns to Settings and preserves
language, theme, privacy, and onboarding state. The language selector remains available only
during first-run setup, where it has product value.

Reflection saves the committed check-in before optional questions and offers a visible one-tap
`Done for now` action before inferred needs or next steps. Needs always require an explicit tap.
Successful completion returns directly to Today; the redundant confirmation screen is gone.
Pending saves keep the current context visible, disable duplicate submission, and do not steal
focus. Romanian theme controls stack below their labels on narrow screens.

**Verification:** `npm run check` passes 66 files and 618 tests, bilingual and psychological-copy
audits, TypeScript, lint, and production build. `npm run test:e2e` passes all 170 Mobile Safari and
Mobile Chrome cases, including 320x568 exit visibility, stable revision writes, intermediary-word
completion, replay dismissal, and Romanian dark preferences. `npm run test:pwa` passes the
production offline/update lifecycle with direct completion. Manual 393x742 dark inspection covered
Reflection, Word Ladder, Romanian Settings, and introduction replay without clipping, collisions,
or console errors.

## Completed: P16 Browser-Observable Assistive-Technology Hardening

Onboarding now focuses each new explanation instead of leaving focus on Next or Close, and exposes
localized semantic progress. Replay is a true body portal over retained Settings; the background is
inert and hidden from assistive navigation, the dialog fills the visual viewport, focus remains
trapped, and close returns to the exact touch or keyboard trigger. The shared trap preserves its
original return target across React development-effect replays and background rerenders.

Word Ladder now focuses the direct `Continue with {word}` decision after every hierarchy change.
Its concise label and description expose both available choices without placing focus on an unnamed
region. Crisis support keeps the same deterministic tier and gating logic while limiting the live
alert to the safety message; telephone and international support remain immediately next in reading
order instead of being repeated as part of one large announcement.

**Verification:** repeatable Mobile Safari and Mobile Chrome coverage asserts first-run and replay
heading focus, localized progress, body portal/inert isolation, full-viewport bounds, touch-trigger
focus restoration, intermediary-word decision focus, concise crisis alerts, resource order, route
focus, save recovery, keyboard trapping, and 200% reflow equivalence. Manual 393x742 inspection
caught and fixed a processed-CSS gap that initially left replay in normal document flow.
`npm run check` passes 66 files and 618 tests; `npm run test:e2e` passes all 174 Mobile Safari and
Mobile Chrome cases; `npm run test:pwa` passes the production offline/update lifecycle.

## Remaining Product Quality Work

1. P16 physical release gate: run VoiceOver/Safari on an Apple device and TalkBack/Chrome on
   Android. Record actual speech for route headings, replay steps and return focus, intermediary
   words, save recovery, and tier-4 support. Fix only device-reproduced defects and add the closest
   browser-observable regression. Playwright cannot validate synthesized speech or screen-reader
   gesture behavior, so this remains explicitly unclaimed.
2. Run the documented production timing probe on representative low/mid mobile hardware and record
   the physical results. CI retains a diagnostic proxy and deterministic bundle budgets, but shared
   runners are not release-device evidence.

## Completed: P17 Lazy Feature Boundaries and Performance Evidence

The measured production graph showed that `App` eagerly imported every destination, Today hydrated
the full model catalog for six quick choices, and the model registry statically imported every
engine while exposing an unreachable somatic dynamic branch. Main application JavaScript was 69.10
kB gzip and initial JavaScript was approximately 169.7 kB gzip.

A typed check-in feature registry now loads each route screen, concrete model, and applicable
visualization together. The loaded model is injected explicitly, keeping `useEmotionModel`
synchronous and removing hidden cache timing. Reflection and utility destinations are deferred,
Today has a provenance-preserving six-emotion catalog boundary, and delayed headings receive focus
after their chunk renders. Stale model-data chunk rules and the production-unused model-selection
hook were removed.

The production app entry is now 32.87 kB gzip and total initial JavaScript is 133.51 kB gzip. Full
offline precache remains complete at 904.72 KiB, up from 895.11 KiB because more revisioned chunks
carry independent module wrappers. Manifest gates cap initial JS, entry JS, and production asset
size and require every primary feature screen to stay dynamic. A production Mobile Chrome probe
records startup, all four first-route opens, bytes, resources, and long tasks as a CI artifact.

**Verification:** 68 test files and 620 tests pass; the two-engine browser matrix passes 176 cases;
the production PWA lifecycle verifies unvisited primary route chunks, offline reopen, automatic
update, and local-data survival. Physical-device timing and synthesized-speech acceptance are not
claimed.

## Completed: P18 Typed Check-In Workflow Boundary

Completion, safety escalation, revision identity, ordered persistence, retry, and finish state now
belong to one typed workflow feature instead of `App`. `buildCheckInCompletion` is the pure shared
safety boundary; a small discriminated reducer represents idle, reflecting, saving, saved,
disabled, and failed states; `useCheckInWorkflow` owns the write queue and stale-promise guards.
The deferred `CheckInFlowHost` owns Arrival, route, and Reflection presentation without adding a
global store, generic dependency container, or workflow framework.

Focused tests prove temporal disclosure only appears when history actually raises the displayed
tier, saving-disabled mode performs zero writes, base retries retain identity, optional details
wait for the base write, and an older base success cannot hide a newer write failure. All Quick,
Body, Affect, Words, and Plutchik completion still converges through the same deterministic safety
and persistence boundary.

## Completed: P19 Explicit Commitment and First-Contact UX

Quick words now enter a visible, reversible selected state and require one explicit localized
Continue action before navigation or persistence. Labels use consistent lowercase presentation.
Arrival leads with the highlighted guided route, places the product-priority Affect Map second,
then offers Words and Body. Guide and Place both remain in the first `393x742` viewport.

The progressive Affect Map now has a centered pre-interaction placement prompt and larger axis
labels, then removes the prompt when placement reveals nearby words. Pointer and keyboard behavior,
suggestion selection, and psychological copy remain unchanged.

The production entry is 31.95 kB gzip and total initial JavaScript is 132.59 kB gzip. Full offline
precache remains complete at 909.15 KiB. The diagnostic mobile proxy recorded 43.6 ms startup,
118.7-375 ms primary first-route opens, and no long tasks.

**Verification:** 72 test files and 631 tests pass with bilingual and psychological-copy audits.
The two-engine browser matrix passes 180 Mobile Safari/Chrome cases across 320x568, 360x800,
393x742, and 430x932. The production PWA lifecycle verifies the deferred workflow host and
unvisited model chunks, offline reopen, update, and local-data survival. The production performance
probe passes. Manual `393x742` inspection covered Quick selection, Arrival hierarchy, and the
Affect empty state with zero browser errors or warnings.

## Remaining After P19

1. Run the documented VoiceOver/Safari, TalkBack/Chrome, and representative low/mid Android
   performance release gates. Browser automation cannot claim synthesized speech or physical
   gesture behavior.
2. P20 Journal autonomy: connect existing repository deletion to one-entry confirmation and avoid
   presenting sparse counts as established personal patterns.
3. P21 navigation and repository truth: make browser forward/reset deterministic, reconcile the
   historical `ANALYSIS.md`, and remove dormant contracts without approved product scope.
4. Keep the deeper Body Compass redesign deferred until the higher-impact Journal and navigation
   work is complete.

## Completed: P20 Journal Autonomy

Journal no longer presents one or two observations as a personal pattern. A pure evidence selector
hides aggregate counts until three saved check-ins and replaces them with a concise early-history
state; individual entries remain immediately useful and accessible. At the threshold, the existing
summaries appear under neutral, non-conclusive wording.

Session Detail now offers one-entry deletion through the existing repository operation. A portaled,
focus-trapped confirmation starts on Cancel, restores the trigger when cancelled, blocks duplicate
submissions, preserves the dialog with an inline error on failure, and returns focus to Journal
only after successful deletion. No datastore, journal store, or generic confirmation framework was
added.

**Verification:** TDD began with failing selector, sparse-history, confirmation, exact-record, and
browser persistence cases. The complete unit/integration suite, bilingual and psychological-copy
audits, TypeScript, lint, production build, two-engine Playwright matrix, focused dark/mobile
deletion journey, production PWA lifecycle, and performance budgets pass. Manual mobile inspection
caught and fixed a wrapped destructive action by stacking confirmation actions at narrow widths.

## Remaining After P20

1. Run the documented VoiceOver/Safari and TalkBack/Chrome acceptance script on physical devices,
   including Journal confirmation speech, cancellation focus return, failure announcement, and
   successful route focus.
2. Run the production timing probe on representative low- and mid-range mobile hardware; retain CI
   metrics as regression signals, not physical-device evidence.
3. P21 navigation and repository truth: make browser forward/reset deterministic, reconcile the
   historical `ANALYSIS.md`, and remove only contracts proven dormant by production and test usage.
4. Reclaim production asset-budget margin before adding another large feature boundary; prefer
   removing obsolete assets or contracts over changing the cap.
5. Keep the deeper Body Compass redesign deferred until navigation truth and physical release gates
   are complete.

## Completed: P21 Deterministic Navigation and Repository Truth

Browser history entries now carry validated snapshots of the typed destination stack instead of a
depth counter. Back and Forward restore the exact screen and payload, including nested utility and
session destinations. Resetting to a tab rotates a navigation generation, so traversing an older
browser entry cannot revive an abandoned check-in or detail route. Reload still begins at Today;
no URL router, global store, or persisted draft format was added.

Repository cleanup removed seven production modules with no production importers and three test
files that exercised only two of those dead controls. Their unreachable i18n keys were removed in
English and Romanian; legacy preference fields remain in export/reset behavior for existing local
data compatibility. `ANALYSIS.md` now has an August 2026 disposition table and explicitly points to
this plan and the codemaps as current sources of truth.

The three PWA PNG icons were recompressed losslessly. Decoded pixel hashes match the originals and
the production PWA lifecycle accepts the new assets. Production CSS fell from 62.53 to 54.25 kB,
and total production assets fell from 952,455 to 871,620 bytes without increasing a budget.

**Verification:** red-first hook and Mobile Chrome tests reproduced Forward returning Today. Four
focused hook tests cover exact Back/Forward restoration, payloads, malformed state, replacement,
and reset generations. `npm run check` passes 71 active files and 579 tests; removed tests covered
only unreachable modules. The full 182-case Mobile Safari/Chrome matrix, production PWA lifecycle,
and performance probe pass. Initial JavaScript is 132,877 bytes gzip, entry JavaScript is 32,236
bytes gzip, precache is 833.10 KiB, and the diagnostic probe reports 46.5 ms startup, 121-375.2 ms
first-route opens, and no long tasks.

## Completed: P22 Body Compass Usability

Body Compass now offers Front, Back, and List as equivalent region-selection modes. List mode uses
ordinary semantic buttons grouped by body area and replaces the visual map rather than duplicating
its accessibility tree. Every mode enters the same region -> sensation -> intensity sequence.

Completing intensity now commits the signal immediately, returns to region selection, and focuses
the inline signal summary. Edit, remove, add-another, the evidence limitation, and the one results
action remain available without a mandatory review screen. The picker reads the fixed anatomy
catalog, so removed regions remain available for selection. The results action is normal-flow on
compact screens so it cannot obscure the saved signal or evidence.

Somatic analysis now validates enriched selections through one fail-closed boundary. Incomplete or
invalid region records produce no analysis rather than reaching scoring through an unchecked cast.
The taxonomy, curated signal weights, persistence format, shared completion controller, and crisis
semantics are unchanged.

**Verification:** red-first unit, component, and Mobile Chrome tests reproduced the unchecked
analysis input and missing List mode. `npm run check` passes 71 files and 580 tests. All 186
Mobile Safari/Chrome cases, the production PWA lifecycle, and the performance proxy pass. Manual
Playwright inspection covered map/list and saved-signal states at `393x742`, plus the compact dark
state at `320x568`; a sticky-action overlap found during inspection was fixed and regression-tested.
Browser automation does not close the physical screen-reader gate.

## Remaining After P22

1. Run the documented VoiceOver/Safari and TalkBack/Chrome acceptance script on physical devices,
   now including Body Compass mode announcements and saved-signal focus, browser Back/Forward,
   reset behavior, and Journal deletion focus.
2. Run cold-start and first-route measurements on representative low- and mid-range Android
   hardware. CI remains a diagnostic proxy, not physical-device evidence.
3. Fix only defects reproduced by those physical-device journeys, adding the closest deterministic
   browser regression without claiming synthesized-speech coverage.
4. Address the existing Node `module.register()` and stale Browserslist-data warnings in a bounded
   dependency-maintenance iteration; they are non-blocking and not P21 regressions.

## Completed: P23 Release-Candidate Baseline and Evidence Contract

Tailwind CSS, its Vite integration, and its internal Node loader now resolve to the synchronized
4.3.3 release. The loader uses Node's current synchronous registration path, removing the traced
`module.register()` deprecation without suppression or a direct dependency on Tailwind internals.
Playwright 1.62.1 removes the same deprecated loader path from test workers. Browserslist
compatibility data is current, and the standards `mobile-web-app-capable` declaration now
accompanies the existing Apple declaration with unit and production-PWA coverage.

One physical release-evidence template now defines the exact commit/device matrix, all eight
bilingual VoiceOver/Safari and TalkBack/Chrome journeys, browser and installed-PWA modes, three-run
Android timing tables, artifact references, temporary DevTools-only failure fixtures, defect
disposition, and sign-off. It adds no production test hook, telemetry, backend, or runtime branch.

**Verification:** clean `npm ci`, synchronized dependency-tree inspection, zero production audit
findings, and traced production/Playwright entrypoints pass without `module.register()` or stale
Browserslist warnings. `npm run check` passes 72 files and 581 tests; the complete 186-case Mobile
Safari/Chrome matrix, production PWA lifecycle, metadata contract, and performance probe pass.
Initial JavaScript is 132,914 bytes gzip and production assets are 874,828 of 960,000 bytes. The
browser-native diagnostic proxy records about 50 ms startup, 35 ms Body/Affect/Words, 324 ms
Plutchik, and no long tasks. Screenshot inspection covers light `393x742` and dark `320x568`
states without console messages or horizontal overflow. Physical acceptance remains open.

## Remaining After P23

1. Complete the evidence template on physical VoiceOver/Safari and TalkBack/Chrome devices for the
   exact deployed candidate, in English and Romanian, in browser and installed-PWA modes.
2. Record three-run medians on representative low- and mid-tier Android hardware; attach raw traces
   or 60 fps recordings and compare them with the documented targets.
3. Fix only failures reproduced on the named device combination. Start each fix with the closest
   deterministic browser regression, then rerun automated gates and the failed physical row.
4. Sign off the release only when the physical matrix, hardware timing, automated workflow, and
   release-blocking defect table are complete. Keep product expansion out of this closure phase.

## P24 Android Physical Acceptance - Partial

The exact deployed `ce9f3b6` candidate was exercised on a Pixel 6a running Android 15 / API 35,
Chrome 150, and TalkBack 17.0.1. The production JavaScript and CSS asset names match a local build.
Chrome remained signed out; no account identity or private journal content entered retained
evidence.

A device-only harness now runs J1-J8 in English and Romanian against physical Chrome in browser and
installed-WebAPK modes. It resets local state, captures device screenshots and accessibility trees,
and reports `SUPPORTING_PASS`; DevTools activation means these results cannot claim synthesized
speech or physical gesture acceptance. All 32 supporting journey combinations passed.

One genuine TalkBack pilot used an AOA USB keyboard that Android classified as external. Focus
moved from the onboarding heading to its explanation in document order. Android accessibility
speech activity was present, but no audio transcript was retained, so this remains partial rather
than a completed TalkBack row.

The Pixel 6a mid-tier performance profile passed all documented targets across three process-cold
runs. Median startup was 1,162 ms; first Body, Affect, Words, and Plutchik opens were 295.2, 224.5,
217.6, and 349.0 ms; worst warm return was 40.4 ms; no long task was observed. Raw device video,
Chrome trace, and Perfetto evidence is retained locally under `.reports/android-physical/`.

## Remaining After P24 Android Pass

1. Complete and retain the full TalkBack spoken-order, duplicate-announcement, gesture, activation,
   and focus-return matrix for J1-J8 in English and Romanian, in browser and installed-PWA modes.
2. Run the same physical matrix with VoiceOver and Safari on an Apple device.
3. Run the documented three-run production measurements on a distinct representative low-tier
   Android device; do not relabel the Pixel 6a as two hardware profiles.
4. Fix only defects reproduced by those open physical rows. Add the closest deterministic browser
   regression, rerun the automated gates, and retest the failed physical row.

## Completed: P25 Reflection Choice and Progressive Disclosure

Reflection now opens as one compact decision surface: tentative emotion words, a short fit check,
one primary finish action, and one secondary exploration action. Inferred needs, next steps,
meaning copy, expanded context, and the external AI handoff are absent from the default DOM and
appear only after an explicit choice to explore. Returning from exploration restores focus to its
trigger. Rejection still clears inferred guidance; tier-4 support still gates all reflection
content before acknowledgement; persistence and save recovery retain their existing contracts.

English and Romanian copy now frames the result as a possibility and asks how close it feels,
without treating the model output as an explanation of the person. The direct finish action and
optional exploration both remain in the first `320x568` viewport. Dark mode uses the established
semantic token pairs; no new component framework, route, persistence field, or workflow state
machine was added.

**Verification:** TDD began with a failing component contract for hidden inferred guidance,
explicit disclosure, and focus return. `npm run check` passes 72 files and 582 tests. The complete
188-case Mobile Safari/Chrome matrix passes, including bilingual, dark-mode, keyboard, `200%`
reflow, compact viewport, persistence, and all crisis-route boundaries. The production PWA
lifecycle and performance proxy pass; budgets remain at 132,943 bytes initial JavaScript gzip and
875,917 of 960,000 production asset bytes. Playwright screenshot review covered English light,
English dark, and Romanian dark Reflection plus the optional exploration at `393x742` with no
overflow or contrast defect. The focused physical J9 harness is ready for the local candidate;
English and Romanian both pass on the Pixel 6a browser at a `411x808` CSS viewport. Device
screenshots and accessibility trees are retained under
`.reports/android-physical/2026-08-05T04-48-27-416Z-browser/`.

## Remaining After P25

1. Repeat focused J9 against the exact deployed candidate after publication. Keep the completed
   local supporting evidence distinct from real TalkBack speech and gesture acceptance.
2. P26 catalog trust audit: review inferred needs and descriptions across every reachable emotion
   with a psychologist, remove causal or prescriptive overreach, and keep one auditable catalog
   source. Start with deterministic catalog tests; do not add personalization or generation.
3. Complete retained TalkBack EN/RO browser and installed-PWA speech/gesture rows, then the
   VoiceOver/Safari matrix. These remain release-acceptance gaps, not browser-test gaps.
4. Run the existing production timing protocol on a distinct low-tier Android device. Do not
   relabel the Pixel 6a as both low- and mid-tier evidence.
5. Keep further workflow expansion out until P26 and physical acceptance close. Fix only defects
   reproduced by the catalog audit or named physical rows.

## P26 Complete: Controlled Guidance Provenance

The first P26 increment adds one provider-neutral Node utility that creates stable catalog batches,
builds the shared psychologist prompt, and validates candidate JSON. Model output cannot claim
`reviewed`; validation requires one decision per known ID, complete English and Romanian copy,
supported fields, mobile word limits, and the same forbidden psychological patterns used by the CI
copy audit. No model SDK, network behavior, runtime dependency, or automatic catalog writer was
added.

The first 12-entry `negative-high.json` batch was sent through one Gemini Flash High call. Its
candidate output passed structural validation but failed domain approval: several changes were
orthography-only duplication better solved by controlled `needId` values, several retained
prescriptive or maximal framing, and one Romanian description contained a typo.

The next increment added 10 controlled bilingual need options and fail-closed hydration. All 12
entries now have explicit reviewed `needId` mappings; the other 276 entries expose no description
or inferred need. Raw legacy needs, unknown need references, and unreviewed guidance fail loading
and CI. One bounded Luna Max call on `despair` and `terror` failed deterministic validation; domain
review used only its useful boundary observation and applied revised bilingual descriptions.

**Verification:** seven review-utility contract tests, five hydration tests, the exact 12-entry
mapping contract, the complete unit/type/lint/copy/build gate, and 188 Mobile Safari/Chrome cases
pass. Runtime guidance remains explicit, optional, and behind Explore.

**Next:** review the deduplicated unreviewed emotions reachable through Quick and Body Compass.
Reuse existing need options; add one only when the batch demonstrates a missing atomic concept.
Keep model escalation to disputed descriptions and apply no provider output without domain review.

### P26 Quick + Body Guidance Complete

The review utility now derives a cross-source, deduplicated Quick + Body Compass batch from one
shared Quick ID file and the somatic signal data. The batch contained 29 unresolved IDs. One Luna
Max advisory review reduced an intentionally broad draft to 13 approved mappings and one new
controlled option, `rest / odihnă`.

Sixteen ambiguous labels now record `needId: null`: reviewed, intentionally no suggestion, and
absent at runtime. This avoids repeatedly auditing the same cases without turning `joy`, `numb`,
withdrawal, guilt, contempt, or surprise into unsupported emotion-to-need conclusions. Across the
catalog there are now 41 reviewed decisions, 25 visible mappings, and 11 controlled bilingual
options. Regenerating the Quick + Body batch returns zero unresolved entries.

**Next:** derive the remaining route inventories in exposure order: Affect Map, then Plutchik and
Word Ladder. Keep descriptions as a separate review field; do not expand need vocabulary merely to
force complete coverage.

### P26 Affect Map Guidance Complete

The review utility now derives Affect reachability directly from the 38-entry production
dimensional overlay through the same small cross-source batch boundary used by Quick and Body.
Surface batches permit only controlled `needId` or explicit `none`; description review remains a
separate field and iteration.

Nine Affect entries already had reviewed guidance. One Luna Max advisory pass challenged the 29
remaining draft decisions. Domain review retained five new mappings (`afraid`, `lonely`, `sad`,
`tender`, and `tired`) and marked the other 24 as reviewed no-suggestion decisions. No vocabulary
option was added. Regenerating the Affect batch returns zero unresolved entries.

Across the catalog there are now 70 reviewed guidance decisions, 30 visible mappings, 40 explicit
no-suggestion decisions, and the same 11 controlled bilingual options.

### P26 Plutchik Guidance Complete

The review utility now derives results from the current interaction contract: eight selectable
primary emotions, all 28 unordered pairs, and the production combination overlays. It finds 29
reachable result IDs because `trust + sadness` produces two blends. Intensity variants and
non-primary combinations remain outside the inventory because the current wheel cannot commit
them to Reflection.

Ten results already had reviewed decisions. One Luna Max advisory pass challenged the 19 remaining
cases and rejected all tentative mappings as context-dependent. Domain review recorded 19 explicit
no-suggestion decisions, added no vocabulary, and preserved the four existing visible mappings for
`anxiety`, `despair`, `love`, and `shame`. Regenerating the Plutchik batch returns zero unresolved
entries.

Across the catalog there are now 89 reviewed guidance decisions, 30 visible mappings, 59 explicit
no-suggestion decisions, and the same 11 controlled bilingual options.

### P26 Word Ladder Guidance Complete

The review utility and runtime now share one seven-ID root source. Graph traversal follows every
production child link and includes directly confirmable roots and intermediate words as well as
leaves. The resulting route inventory contains 214 IDs: 31 previously reviewed and 183 requiring a
decision.

One quota-bounded Luna Max pass challenged only 46 tentative map candidates. Domain review retained
31 mappings, recorded 152 explicit no-suggestion decisions, and added no vocabulary. Regenerating
the Word Ladder batch returns zero unresolved entries. The route exposes 44 reviewed mappings and
keeps guidance absent for the other 170 words.

Across the catalog there are now 272 reviewed guidance decisions, 61 visible mappings, 211 explicit
no-suggestion decisions, and the same 11 controlled bilingual options. All user-confirmable Quick,
Body Compass, Affect, Plutchik, and Word Ladder results now have an explicit needs decision.

**Next:** plan the separate description-provenance phase. Do not generate prose for all remaining
entries by default; first identify where a description materially improves comparison or
reflection, then review those surfaces in bounded bilingual batches.

## P27 Description Provenance

### P27.1 Contract Complete

Reviewed descriptions are now a distinct catalog capability, not a fallback for guidance. CI
requires both languages, explicit reviewed provenance, 10-45 words, observational framing, and no
advice, direct address, inferred need, or crisis instruction. Optional Reflection uses the first
canonical description once, labels it “A possible meaning” / “Un posibil sens”, and omits empty or
duplicate context rows. The Word Ladder list stays label-only.

Comparison eligibility is atomic at the visible choice-set boundary. The control appears only when
the selected word and every sibling have reviewed bilingual descriptions; there is no placeholder
copy and no partially informed comparison.

### P27.2 Pilot Complete

The deterministic pilot is the deduplicated union of the 12-description baseline, all six Quick
emotions, and all seven Word Ladder roots: 23 canonical IDs. One Luna Max advisory pass returned a
structurally valid set. Domain review accepted 19 reformulations and retained four stronger local
drafts (`anger`, `joy`, `rage`, `terror`). No provider output was applied automatically.

All Quick choices can now expose reviewed meaning during optional exploration, and all seven Word
roots form one complete comparison group. At this stage, the remaining 265 catalog entries still
failed closed for description prose.

### P27.3 Word Ladder Intermediates Complete

The review utility now derives all 41 intermediate words and seven sibling groups from the same
production roots and overlays used by the route. Red-first contracts fix the exact inventory,
levels, parent links, description-only payload, and complete-group behavior.

One quota-bounded Luna Max advisory pass covered all 41 entries. Domain review retained four
existing descriptions, accepted 29 candidates, and revised eight for agency, uncertainty, semantic
precision, or natural Romanian. All seven intermediate sibling groups now support comparison in
EN/RO; leaf groups still fail closed. The catalog contains 60 reviewed descriptions and 228 entries
without prose.

### Recommended Next Sequence

1. Measure whether intermediate descriptions improve stopping and comparison. Keep the 166 leaves
   label-only unless that evidence justifies a leaf phase; avoid telemetry without explicit product
   and privacy intent, so begin with bounded moderated observation.
2. Repeat deployed Pixel 6a TalkBack acceptance in EN/RO, then complete VoiceOver/Safari and a
   distinct low-tier Android performance pass. Keep physical acceptance separate from browser CI.
3. If evidence justifies leaf comparison, define complete sibling families from the production
   graph, prioritize the most-used families, and retain the same red-first, bilingual, atomic gate.
