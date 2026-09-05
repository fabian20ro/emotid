# Product Maintenance Plan

Status: the mobile migration and `v0.1.6` maintenance release are complete. The September 4 direct
UX/psychology audit reproduced new persistence, revision, body-completion, and journal-readback
defects. R1-R6 are live at `aefd2c0`; hosted build, deploy and public smoke passed, followed by
22 live regression journeys. Updated September 5, 2026. The summary records delivered scope, not
six new implementation requests.

Historical implementation detail belongs in `ITERATION_LOG.md`, release criteria in
`docs/release-quality-gates.md`, candidate evidence in `docs/physical-release-evidence.md`, and
release scope in `docs/releases/v0.1.6.md`.

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

## Completed Release Closure

`v0.1.3` owns the P0-P3 corrective pass. Its release commit passed the complete hosted product
workflow, Pages deployment, and public smoke before the immutable tag and GitHub release were
created. Historical evidence rows retain their original candidate identity.

## Completed Automated Maintenance

- **P5:** one pure checker now rejects drift among package metadata, the lockfile root, README
  release URL, latest numeric release-note filename/title, and this plan's release-scope link.
- Eight deterministic Node fixtures cover valid state, numeric semver ordering, malformed JSON,
  and every independent owner mismatch. `check:policy` runs both fixtures and the live repository
  check without relying on network or unreleased GitHub objects.

## Completed Romanian Copy Maintenance

- **v0.1.5:** corrected the Plutchik compassion label and 22 model-owned Body Compass fields while
  preserving internal IDs, English copy, safety semantics, and model behavior.
- One Romanian product-copy inventory now covers translations, generated synthesis, catalog and
  model metadata, body-region data, and somatic display labels; the rendered compassion result is
  also protected in both mobile browser engines.

## Completed TalkBack Accessibility Maintenance

- **v0.1.6:** keeps prose-like eyebrows in sentence case and applies the selected document language
  before localized controls mount and before runtime language rerenders.
- First-mutation browser coverage protects every initially reported Romanian Today heading/control.
  Pixel follow-ups keep app speech separate from Chrome/TalkBack voice configuration: Romanian app
  content passes with Chrome locale `ro`; AT-generated hints follow the AT/device locale.

## Active Priorities

### Current Implementation

- **R1:** distinct new-entry identity; workflow-owned in-memory drafts; immediate fit writes;
  optimistic correction display; ordered writes survive a new draft; stale exits cannot close it.
- **R2:** explicit no-suggestion outcome and optional body-only record; 183 single-signal cases
  enumerated, including 64 empty results. No scoring thresholds or safety labels changed.
- **R3:** all exercise entries reachable; full current/legacy readback; individual confirmation
  and deletion, separate from bulk deletion.
- **R4:** optional per-word acceptance, original suggestions retained; one result selector feeds
  headings, vocabulary and valence; Google receives only chosen words with its unchanged prompt.
- **R5:** five bilingual contrasts/examples, reviewed bittersweetness meaning, available word
  descriptions before commitment, no empty generic context panels or unsupported best-match claim.
- **R6:** compact intermediate continuation with prior selections retained; readable external
  Affect labels; direct guide with remembered navigation step; language on introduction step one.

Current catalog coverage is deliberately bounded: 66 reviewed descriptions, not an invented
definition for every word. Missing prose stays absent; existing no-guidance decisions stay intact.
Editorial review is not clinical validation, participant evidence, or a new physical AT pass.

### Next Recommended Work

M1 dependency remediation is implemented; the full and production-only audits now report zero.
Publication remains subject to the exact-candidate gates in M4.

M2 completes the Stressed sibling group with five new bilingual definitions and the existing
Tense meaning. See [editorial decisions and evidence](m2-stressed-description-review.md).
Other incomplete groups, including the distinct `overwhelmed_fear` context, remain deferred.

1. Inspect initial imports before any further content expansion; only 90 gzip bytes remain under
   the initial-JS budget. Change a loading boundary only after identifying a specific eager owner.
2. Resume external P6/P7 evidence only on their existing prerequisites. They do not block these
   verified product fixes. No new feature or architectural migration is needed for closure.

Detailed pre-change findings and reproduction: [September audit](ux-psychology-audit-2026-09-04.md).
R1-R6 are labels for this corrective pass, not a renumbering of the migration history.

### M1 - Security Maintenance (Implemented)

Updated `browserslist` 4.28.1 -> 4.28.9, `fast-uri` 3.1.5 -> 3.1.7, and `@humanfs/node`
0.16.7 -> 0.16.8, including required child dependencies. Only lockfile resolution changed;
no direct dependency, major version, override, runtime code or UI change.
Clean `npm ci`, complete `npm ls`, full and production-only audits pass. Seven underlying
advisories / 96 propagated entries are removed; current audits report zero. Unrelated outdated
packages remain deliberately unchanged. Final product/publication evidence belongs in the
iteration log and exact-revision hosted workflow. M1-M4 are maintenance packages, not a
renumbering of historical migration phases.

### M2 - One Vocabulary Comprehension Batch (Implemented)

Scope completed: `overwhelmed_bad`, `out_of_control`, `burned_out`, `on_edge`, `irritable`.
The procedure below remains the boundary for any separately approved future batch, not a request
to continue filling the catalog automatically.

1. Derive reachable IDs and sibling groups using existing catalog tooling and Wheel overlays.
   Rank by route prominence, not fabricated usage statistics; select one coherent group, roughly
   4-8 definitions where structure permits. Reuse valid reviewed entries.
2. Add failing group-coverage fixtures and retain a deliberately incomplete-group fixture.
   Comparison stays unavailable until all displayed alternatives have reviewed EN/RO prose.
3. Review variants in context, not by label equivalence. Write brief experiential meanings and
   distinctions without fixed causes, diagnoses, mandatory needs or pressure to choose a leaf.
   Maintain informal Romanian singular and editorial source provenance; no clinical-validation claim.
4. Update source review status and existing hydration/inventory tests. Preserve reviewed-null
   guidance decisions: adding a definition does not authorize emotion-to-advice mappings.
5. Verify pre-choice meaning, intermediate continuation, Back/revision and unchanged AI handoff
   across EN/RO x light/dark, 320x568, 393x742, enlarged text and keyboard; then full release gates.

Done: one complete reachable group, incomplete groups still fail closed, no safety/scoring change,
and no hidden prose falsely counted as available. Stop after this batch; do not fill all missing
catalog entries merely to increase coverage.

### M3 - Small Architecture Improvement (Implemented)

Controlled provider refresh reproduced incompatible `getInitialLanguage`, then incompatible
`useLanguage` after bootstrap extraction alone. Bootstrap/type now live in a leaf module; context
identity and hook live separately from the provider. The existing provider/hook import API remains
available. Synchronous document language, preference precedence and persistence are unchanged.

The repeatable Chromium refresh test preserves the current document and selected Quick word;
CI runs it separately from production tests. Unit and two-engine EN/RO x theme browser regressions
cover stored/browser preference precedence, first localized mutations, runtime changes and reload.
No new state library, async locale loader, translated copy or network behavior. This is a
development/debugging fix, not a claimed user-perceived speedup.

Performance guard: after M3 initial JS is 149,910 gzip bytes / 150,000 limit (90 bytes headroom).
Inspect initial imports before any further content expansion. Re-measure after each
content batch. If headroom runs out, inspect the manifest/import graph and move the specific eager
feature dependency behind its existing lazy boundary. Do not raise budgets or build a global
localization system just to make the gate green.

### M4 - Verification And Publication For Each Batch

During development: smallest failing behavior test -> minimal change -> focused verification.
Full final gates only on a frozen candidate, following `release-quality-gates.md`. Run suites
sequentially when they share production artifacts or test-output directories.

Every publishable batch: `check`, production Chromium/WebKit matrix, PWA lifecycle, performance,
commit/push, exact-revision hosted CI/deploy/smoke, then affected journeys on the public URL using
isolated synthetic storage. Lockfile changes additionally require clean install and audit/tree
checks. A successful push or HTTP 200 alone is not acceptance.

Use existing structural error/retry diagnostics; no private emotion text, telemetry or new outbound
traffic. Keep revision-bound artifacts and distinguish native speech from browser semantics.
Do not rerun physical tests for documentation-only changes.

A versioned release is optional: update the existing identity owners together, pass release
consistency checks, then tag the verified revision on request. The existing v0.1.6 tag does not
contain September main changes; do not rewrite it. Publication of a maintenance fix needs no tag.

## Delivered Sequence And Verification

Implementation followed R1a -> R1b -> R2 -> R3 -> R4 -> R5 -> R6. R1-R3 repair
reproduced defects and need no participants or physical device. R4-R6 follow the observed choice
and content gaps, with psychological impact treated as heuristic until real usage validates it.
External P6 evidence and unrelated P7 questions remain deferred on their own prerequisites.

Implemented architectural improvement: the existing check-in workflow owns one current draft
and explicit new/revise/finish transitions, independently of screen mounting. Screen-only
presentation stays local and the ordered writer owns persistence. This addresses the repeated
identity, Back, rejection, and restoration problems without a new state library or router.

Verification follows the normative commands in `docs/release-quality-gates.md`. M3 local completion:
723 unit/component tests, the development Fast Refresh regression, 314 production Chromium/WebKit
journeys, PWA lifecycle, production
performance, policy, lint, build and asset budgets passed. On publication, require hosted CI and
the public deployed smoke. These checks are not new physical audio evidence.

## Maintenance Triggers

Open a product change only for:

1. a reproduced functional, safety, accessibility, privacy, or data-loss defect;
2. repeated owner or participant evidence of a comprehension problem;
3. dependency, browser, operating-system, or security maintenance;
4. a deliberately approved product capability.

Use the smallest behavior-boundary test and implementation. Keep bilingual copy, deterministic
crisis semantics, client-only privacy, and platform-local native adapters.

## Deferred Evidence And Questions (P6/P7)

- **Low-tier Android:** run the existing three-run performance matrix when a distinct device is
  available. Do not relabel Pixel 6a or emulator evidence.
- **Moderated comprehension:** resume `docs/moderated-comprehension-validation.md` only with six
  real participants. Expert, owner, synthetic, and automated review are not participant outcomes.
- **Complete human TalkBack:** bounded EN/RO browser and installed checkpoints passed. A full human
  J1-J9 matrix remains waived for this release.
- **Native macOS Safari:** retry after Safari/SafariDriver changes. Current activation transport is
  blocked before product rows and is not an application failure.
- **iOS simulator:** run existing acceptance/robustness suites when its runtime is available,
  especially after adapter changes. Keep simulator evidence labeled; no physical iPhone required.
- **Assistive-technology uncertainty:** live regions containing controls and modal background
  exposure remain risks, not reproduced defects. Recheck with native screen-reader evidence before
  changing announcements or adding `inert` behavior.
- **Romanian catalog register:** standalone masculine emotion labels need native psychological and
  linguistic review before a bulk grammatical rewrite.
- **Reflection choice set:** do not add a fourth "not sure" answer until participant evidence shows
  that the existing "partly" choice fails to express uncertainty.

## Outside This Pass

Affect terminology, Google AI Mode prompt semantics, global skip behavior, and catalog-wide
grammatical changes remain unchanged. R6 moved language choice based on direct inspection;
prior synthetic runs are not participant evidence. Per-word acceptance does not add a fourth
global fit answer. An optional emotion-entry context note requires a separate product decision;
do not add reminders, scores, emotion targets, or another model without a demonstrated need.

## Avoid

No speculative router migration, global state library, backend, telemetry, datastore rewrite,
design-system project, workflow DSL, or universal device framework. Apply DRY after repeated use,
YAGNI to unproven needs, and KISS at every change boundary.

SoC: catalog, workflow, persistence and presentation retain owners. POLA: Back retains the draft;
new means a distinct entry; accepted means user-accepted. Fail Fast: reject malformed records and
missing review provenance. Gall's Law: ship one verified increment at a time. UX: progressive
disclosure, recognition over recall, reversible choices, visible save status and no forced
interpretation. Stop when acceptance passes, not when another speculative phase can be invented.
