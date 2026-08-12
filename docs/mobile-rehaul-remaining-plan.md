# Remaining Product Plan

Status: core mobile migration complete. Remaining work is native-mobile verification, correction of
demonstrated defects, and release sign-off. Updated August 12, 2026.

This document is the current execution plan. Historical implementation detail belongs in
`ITERATION_LOG.md`; release requirements belong in `docs/release-quality-gates.md`; run evidence
belongs in `docs/physical-release-evidence.md`.

## Current State

### Complete

- Today, Arrival, Explore, Journal, Settings, Privacy, and Support use the routed mobile shell.
- Quick, Body Compass, Affect Map, Word Ladder, and Plutchik converge through one Reflection,
  crisis-evaluation, and persistence boundary.
- Results are tentative; inferred meaning, needs, next steps, and external AI exploration require
  explicit user choice.
- Word Ladder allows direct completion at an intermediary emotion and keeps leaf descriptions
  fail-closed unless a complete reviewed sibling group exists.
- English and Romanian copy, reviewed psychological provenance, local-only persistence, export,
  deletion, offline use, update survival, dark theme, keyboard use, and mobile reflow have automated
  coverage.
- CI, the 212-case Playwright matrix, the production PWA lifecycle, and browser performance budgets
  pass.
- Installed macOS Safari passed the bounded EN/RO Quick, Word intermediary, and tier-4 audit.
- Pixel 6a passed the functional Android journey matrix. Genuine TalkBack J5 passed in EN/RO;
  installed J6/J8 checkpoints also passed.
- The repository-owned Appium/XCUITest runner passes the complete 36-row J1-J9 EN/RO acceptance
  matrix on named iPhone SE and iPhone 17 Pro profiles. It preserves Simulator state, validates
  candidate identity, and writes native screenshots plus a JSON report.
- The bounded P36 matrix passes 6/6 real-Safari variants: compact onboarding focus, SE landscape,
  17 Pro landscape, dark Word Ladder, and Quick/tier-4 at 200% Safari Page Zoom plus accessibility
  text. It verifies visual-viewport bounds, reflow, focus, contrast, action bounds, sticky overlap,
  candidate assets, and restoration of Simulator and Safari state.
- One machine-readable acceptance contract owns J1-J9 IDs/titles, EN/RO scope, and result classes.
  Playwright, Android, and Appium register all nine journeys; SafariDriver registers J5/J8/J9.
  Platform steps, selectors, fixtures, and lifecycle remain local.

### Confirmed Open Gates

1. Genuine TalkBack remains incomplete beyond J5 and bounded installed J6/J8 checkpoints.
2. No distinct low-tier Android performance profile has been measured.
3. The current candidate cannot receive physical sign-off until the required exact-candidate rows
   are rerun or explicitly waived.

Simulator installed-PWA identity and VoiceOver speech/rotor/gesture automation remain unsupported
capabilities. Physical iPhone testing is explicitly outside project scope; neither limitation is an
open release gate or a basis for claiming VoiceOver coverage.

P35 and P36 reproduced and fixed four product defects: missing tier-4 focus handoff, a visible
noninteractive onboarding outline, 200% Page Zoom overflow caused by the global 320px minimum, and
focused destinations clipped outside the visual viewport. No unresolved product defect remains
from the Simulator matrices.

## Product And Psychological Guardrails

- Reduce evaluative threat: invite observation; do not imply a test, score, diagnosis, or correct
  emotional answer.
- Preserve agency: every inferred meaning, need, action, and external handoff stays optional,
  reversible, and explicitly chosen.
- Match cognitive load to the likely moment: one decision at a time, short labels, progressive
  disclosure, and a clear stopping action.
- Maintain epistemic humility: model output is a possibility, not a fact about the user.
- Separate support from inference: crisis resources remain deterministic, auditable, and available
  before reflective detail without claiming that selected words prove danger.
- Do not add explanatory copy by default. Prefer structure, order, labeling, and direct actions.
- Do not infer personal meaning from release fixtures or retain private journal content in evidence.

## UI/UX Principles Equivalent To Architecture Principles

| Architecture principle | UI/UX equivalent | Operational rule for Emot-ID |
| --- | --- | --- |
| KISS | Clarity over cleverness | One primary task and one dominant action per state; plain language; no decorative interaction that needs explanation. |
| YAGNI | Evidence before interface | Add a control, screen, option, or explanation only for an observed user need or release risk. |
| DRY | Consistency with purpose | Repeated actions keep the same name, placement, feedback, and focus behavior; do not force different tasks into one generic component. |
| Rule of Three | Pattern after repetition | Standardize an interaction after three real occurrences reveal the stable pattern; keep the first two implementations local. |
| SoC | One concern per moment | Separate input, interpretation, safety, persistence, and settings; reveal secondary concerns progressively. |
| POLA | Predictability and user control | Match platform conventions, preserve input, make consequences explicit, and return focus/navigation where the user expects. |
| Fail Fast | Early, local, recoverable feedback | Expose unavailable actions and failures at the point of action; explain recovery without losing work or showing false success. |
| Gall's Law | Progressive enhancement from a working path | Start with the smallest complete journey, verify it with users and assistive technology, then add variants without replacing the proven core. |

Supporting usability principles:

- Visibility of system status: pending, saved, not saved, offline, and gated states are explicit.
- Recognition over recall: visible choices and path context; no requirement to remember model terms.
- Error prevention before error messaging: disable unsafe completion, confirm destructive actions,
  and retain retryable input.
- Accessibility as interaction quality: semantic order, focus, speech, touch size, contrast, reflow,
  reduced motion, and text scaling are product behavior, not post-release polish.
- Minimum necessary interruption: overlays only for genuinely blocking decisions; all fixed overlays
  portal to `document.body` and trap/restore focus.

## Architecture Direction

The highest-impact small improvement, a platform-neutral acceptance-journey manifest, is complete.

The manifest may own:

- journey ID, risk, prerequisites, languages, and supported modes;
- semantic checkpoints and expected outcomes;
- required evidence and result classification;
- no driver selectors, protocol calls, device lifecycle, or product state mutation.

Each adapter keeps its natural mechanics: Playwright, Android ADB/CDP, macOS SafariDriver, and iOS
Appium/XCUITest. This removes drift without creating a universal automation framework.

Architecture rules:

- Keep the client-only boundary; no backend, telemetry, device cloud, or outbound behavior without
  explicit product/security intent.
- Keep `App` as the single completion, crisis, Reflection, and persistence boundary.
- Keep route input local until a demonstrated interruption requires lifting it.
- Keep lifecycle, protocol client, journey intent, evidence writing, and result classification
  separate.
- Preflight all external capabilities before starting servers, simulators, browsers, or evidence
  directories.
- Never clear or seed the public production origin by default. Destructive reset requires an
  explicit local origin and explicit flag.
- Extract shared behavior after repeated use; do not build a workflow DSL, page-object hierarchy,
  generic state machine, or test-device platform.

## Recommended Sequence

### P38 - Apple Simulator Acceptance Closure (Complete)

1. Added the complete J1-J9 Appium matrix in EN/RO on both named profiles.
2. Kept the 16-row smoke and six-row robustness suites separate for efficient diagnosis.
3. Recorded Simulator evidence honestly without physical-device or VoiceOver claims.

### P39 - Android Physical Closure

Complete foundation:

- One pure, tested preflight boundary now validates exact device count/authorization, unlock state,
  Android identity, TalkBack enabled/bound/touch-exploration state, external keyboard, and WebAPK
  availability before evidence or CDP side effects.
- The physical runner records that snapshot plus local Git identity and guarantees browser/CDP
  cleanup. Pixel browser J6/J8 pass EN/RO as supporting evidence after the change.

Remaining sequence:

1. Pixel 6a: genuine TalkBack J6 and J8 in browser, then J4, J2, J7, J9, J3, and J1 in risk order;
   cover browser and installed modes in EN/RO.
2. Distinct low-tier Android: three-run production timing matrix from
   `docs/release-quality-gates.md`.
3. Retain spoken order, focus/gesture behavior, exact candidate identity, screenshots/video, and
   private-data-free notes.

Exit criteria: every required Android row passes or has an explicit accepted disposition.
Supporting automation is never promoted to assistive-technology evidence.

### P40 - Release Sign-Off

1. Freeze one candidate SHA and deploy it.
2. Run clean install, dependency, automated, native supporting, physical AT, and performance gates
   against that exact candidate.
3. Consolidate results in `docs/physical-release-evidence.md`; remove superseded candidate rows from
   the active matrix while retaining history in Git and `ITERATION_LOG.md`.
4. Confirm zero unresolved release-blocking defects and record the final decision.

## Explicit Non-Goals

- No leaf-description generation without new observation evidence.
- No telemetry, accounts, cloud sync, AI API, or backend.
- No redesign based only on Simulator screenshots.
- No universal test framework, device farm, React Router migration, datastore rewrite, or broad
  design-system project.
- No physical iPhone acquisition or testing.
- No claim that Simulator VoiceOver, desktop VoiceOver, Playwright WebKit, or DevTools activation is
  physical mobile screen-reader acceptance.

## Decision Rule

Work on P39 next when Android hardware and owner presence are available. Until then, keep the
acceptance contract and automated/native supporting gates green without adding another test
abstraction. P40 freezes the candidate and records the final release decision.
