# Remaining Mobile Migration Plan

Status: P10 product truthfulness complete, July 27, 2026.

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
also moves focus when saving, recovery, next-step, and completion replace the current view.
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

## Remaining Product Quality Work

1. P11: patch the development dependency advisory graph without unrelated major upgrades.
2. P12: establish the psychological copy contract and revise high-risk active descriptions.
3. P13: review full catalog and somatic provenance plus safety-rule invariants.
4. P14: complete physical VoiceOver/Safari and TalkBack/Chrome release acceptance.
5. P15: optimize bundle architecture only if real-device measurements justify it.
