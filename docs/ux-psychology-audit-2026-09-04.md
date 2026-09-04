# UX And Psychological Product Audit

Date: 2026-09-04. Baseline: `v0.1.6`, commit `a8db1b0`.
Direct review by the main agent; no subagents. Implementation order and acceptance criteria:
[active maintenance plan](mobile-rehaul-remaining-plan.md#september-remediation).

## Scope And Evidence

Inspected current source and an isolated local Chromium session through Playwright. Traversed
onboarding, Today, Arrival, Affect Map, Word Ladder, Body Compass, Plutchik, Reflection,
optional exploration, vocabulary practice, Journal, journal exercise, and Settings.
Used synthetic entries only. Inspected RO/light and EN/dark main journeys; sampled RO/dark
and EN/light settings, including 320x640. Main screenshots use 393x742.

This is a heuristic/product audit, not a participant study or clinical validation. Psychological
consequences below are reasoned risks, not measured effects on users. No new physical speech,
Safari, full automated-suite, production, or complete four-combination pass is claimed.

Local screenshots live in ignored `output/playwright/audit-*.png`; interaction snapshots live in
ignored `.playwright-cli/`. Durable reproduction steps and source references are recorded below.

## What Works

- Coherent shell, familiar bottom navigation, restrained light/dark surfaces, large main actions.
- Explicitly optional exploration and an immediate finish action after early session capture.
- Informal Romanian address, replayable introduction, clear external Google disclosure.
- Local storage, no account requirement, deterministic safety construction, explicit provenance.
- Rejected/partial results already have distinct journal semantics when the finish path saves them.
- Broad existing tests provide useful regression protection; uncovered exit paths remain important.

## Findings

### F1 / P1: A new quick check-in can overwrite an earlier saved entry

Reproduction: Affect -> place point -> select nostalgia -> continue -> Not really -> revise ->
Back to Today -> Journal -> Today -> quick joy -> continue -> Done -> Journal.
The previous nostalgia entry becomes joy, retaining its original time; no second entry appears.

Cause: `src/App.tsx:134` completes quick entry without starting a new workflow. In
`src/features/check-in/workflow/useCheckInWorkflow.ts:113`, any active session identity is reused.
Tab/navigation resets do not end that workflow. Identity reuse is appropriate for an explicit
revision, but not for a new check-in reached from Today.

Impact: silent history corruption; a reflective journal cannot be trusted to remember the user's
sequence. Evidence: `audit-overwritten-session.png` and the preceding rejection journal snapshot.
Remediation: R1a.

### F2 / P1: Rejection and revision do not survive ordinary navigation

Reproduction: select nostalgia on Affect -> continue -> Not really -> Revise selection.
The map reopens empty, with no point or selected word. Return to Today/Journal: the rejected
result is shown as a possible word, with no recorded rejection. Today omits its relationship.

`src/screens/ReflectionScreen.tsx:104` changes local state; only `finish()` saves the answer.
Line 292 calls navigation directly for revision. Feature screens unmount, losing their local
drafts. The still-visible "Reflection saved" message does not describe these edits.

Impact: the interface invites correction but forgets it. For quick/word routes, an unsaved rejection
also leaves the base entry eligible as a named emotion under `isSessionEligibleForPatterns`.
The Affect reproduction did not enter analytics because that base entry remains a suggestion.

Remediation: R1b. Preserve confirmed edits and distinguish editing a current reflection from
starting another. Screenshots: `audit-ro-reject-light.png`, `audit-ro-rejection-lost-journal.png`.

### F3 / P1: Valid body observations can lead to a silent dead end

Reproduction: Body -> Chest -> Pressure -> Mild -> See what might fit. The enabled button does
nothing and displays no feedback. `src/screens/BodyCompassScreen.tsx:106` requires a nonempty result.

Enumerated all 183 single-region/sensation/intensity combinations exposed by current data using
the production `somaticModel.analyze`: 64 return no suggestions. This is a count of input cases,
not an estimate of affected users. Screenshot: `audit-body-no-result.png`.

An empty suggestion set is legitimate. The risk is pressuring users to increase intensity or choose
a different sensation just to advance. Do not lower scoring thresholds or fabricate an emotion.
Remediation: R2, an explicit no-suggestion outcome that can retain the bodily observation.

### F4 / P2: Saved journal exercises cannot be fully read back

Reproduction: Unpack a moment -> fill all four fields -> Save -> Done -> open journal exercises.
The new-entry form is empty; the saved preview shows situation and outcome only. The noticed and
response fields still exist in IndexedDB, verified through the repository, but have no reading UI.

`src/components/ChainAnalysis.tsx:74` limits the collection to three entries; line 151 renders
noninteractive previews. `src/data/chain-presentation.ts` chooses one detail using
`outcome || response || noticed`. Older exercises also lack a complete in-app browsing path.

Impact: effort spent on context produces little retrievable value. The user may reasonably mistake
hidden text for lost text. Remediation: R3. Screenshot: `audit-journal-readback-dark.png`.

### F5 / P2: "Keep only what fits" lacks an individual-choice control

Reproduction: Body -> Chest -> Warmth -> Moderate -> continue. Results: love, pride, tenderness,
gratitude. Reflection supplies one Yes/Partly/Not really answer for the whole group. Partly adds
advice to retain useful words but no way to retain gratitude alone.

`src/screens/ReflectionScreen.tsx:269` renders passive result labels and line 275 one global fit.
Session eligibility is global. Today shows the first three labels without the partial relationship.
Screenshot: `audit-en-body-results-dark.png`.

Impact: tentative system proposals dominate the record even when the user recognizes only one.
The interface should enact the agency expressed by its copy. Remediation: R4; preserve original
suggestions as provenance and record explicit individual choices separately.

### F6 / P2: Vocabulary learning often supplies labels without useful distinctions

Observed examples:
- Practice promises short examples; anxiety/apprehension/fear produces only a generic intensity
  statement. `src/components/GranularityTraining.tsx:59` selects a template per distinction
  category; `src/data/granularity-triads.ts` contains IDs but no examples or per-word contrasts.
- Word Ladder choices contain bare labels. Comparison appears only after selection and only for
  fully reviewed sibling groups; it was absent for Bad -> Stressed -> Overwhelmed.
- Joy + sadness -> bittersweetness -> Explore further -> More context repeats that bittersweetness
  is the closest suggestion, without explaining the word. This result has no reviewed description.

Impact: the person least familiar with emotion vocabulary gets little help at the choice point.
Generic uncertainty language does not substitute for a definition. A model blend also has no basis
for a universal "closest match" claim about this user. Remediation: R5.

Use reviewed definitions and short examples; keep model explanations distinct from claims about
the user's experience. The broad Romanian label `Rau` (rendered with its diacritic) also needs a
state-context cue at the point of choice; its existing explanatory description is currently hidden.
This is a targeted ambiguity concern, not evidence for rewriting the whole catalog's grammar.

### F7 / P2-P3: Explanatory layout competes with the next useful choice

At 393x742, Word Ladder after choosing Bad places the path panel and stop-here panel above the
children; no complete child option is initially visible. Both "Choose ... as answer" and
"Continue with ..." act on the current word but have different navigation consequences.
Source: `src/screens/WordLadderScreen.tsx:151` and line 170; `audit-ro-words-light.png`.

Affect suggestions are readable as chips, but the duplicated SVG word labels are approximately
7-8 rendered pixels at this mobile width (11-12 viewBox units), clustered around nearby points.
Source: `src/components/DimensionalField.tsx`, 500-unit viewBox. Screenshot: `audit-ro-affect-light.png`.

Lower-priority observations: Help me choose opens another method menu before Guide me; the initial
language switch is on onboarding page three; quick self-naming gets the same tentative-result
framing as model inference. These are verified structures, with usability impact still heuristic.

Remediation: R6. Keep a clear intermediate-word finish action, compact the supporting path,
and let readable labels outside the plot carry the decision. Preserve the existing theme system.

## Basis For Psychological And UX Judgment

[Nielsen's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
support visible outcomes, recoverable actions, familiar language, and help at the decision point.
They guide this review; they do not establish measured comprehension or clinical outcomes.

[Nummenmaa et al., bodily maps of emotions](https://doi.org/10.1073/pnas.1321664111)
reports maps obtained using self-report. It does not validate this application's particular
weights or the inference of an individual's emotion from a sensation. Retain the existing
curated-hypothesis boundary and offer observation-only completion when suggestions are absent.

## Deferred Questions

### September 5 Editorial Follow-Through

The remediation adds authored examples, not diagnostic criteria or a validated intensity scale.
The anxiety/fear distinction was cross-checked against the
[APA anxiety entry](https://dictionary.apa.org/anxiety) and
[APA fear entry](https://dictionary.apa.org/fear); guilt wording against the
[APA guilt entry](https://dictionary.apa.org/guilt). Everyday words still overlap.
Romanian practice prose follows the catalog's displayed terms (ingrijorare, manie, durere),
not newly invented translations. Bittersweetness explains coexistence, not a mechanism that
can be inferred reliably from two selected buttons. Existing reviewed null guidance is unchanged.

Consider an optional context note attached to an emotion entry only after complete readback works.
Evaluate the narrow quick-choice palette with real usage feedback before changing its defaults.
Keep existing external evidence waivers explicit; none blocks fixing F1-F4. No new clinical,
physical screen-reader, or participant claim follows from this audit.
