# Remaining Mobile Migration Plan

Status: P7 trust and safety boundary complete, July 26, 2026.

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
- Made inferred needs user-selectable in Reflection: one need starts selected, while multiple
  suggestions require an explicit optional choice that persists into Journal and JSON export.
- Removed the unreachable modal-era Quick Check-in, results, history, settings, uncertainty,
  intervention, and sessions-only export presentation after tracing every production caller.
- Replaced the mixed-responsibility Body Map with a route-owned staged flow and a
  presentation-only, theme-aware `BodyRegionMap`.
- Replaced automatic label-derived actions with explicit neutral choices, made rejected results
  discard inferred details, disclosed the Google handoff, and migrated the crisis presentation.
- Deleted the unreachable Guided Scan stack after confirming that it had no release entry point.

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
Exactly one need starts selected; multiple needs start empty. The existing optional `selectedNeed`
field carries the choice through the shared save boundary into Journal detail and JSON export.
No taxonomy, mapping layer, or next-step behavior changed.

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

## Recommended Sequence

1. Make Reflection persistence completion and failure explicit.
2. Verify interruption behavior while saving, including rapid repeated taps and repository errors.
3. Re-run the bilingual, cross-browser release matrix and perform one production-build smoke pass.

## Recommended Next Update

Close the remaining persistence trust gap without introducing a queue or global state framework:

1. Make `App.saveReflection` await the existing repository save and return an explicit result.
2. Keep the close action pending while the write is in flight; prevent duplicate submissions.
3. Show a compact bilingual retry/continue-without-saving state when IndexedDB fails.
4. Preserve the current immediate close path when local saving is disabled.
5. Add repository-failure unit coverage and Playwright journeys for pending, retry, opt-out, and
   rapid repeated taps in both browser engines.
