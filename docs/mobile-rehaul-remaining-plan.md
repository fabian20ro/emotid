# Product Maintenance Plan

Status: the mobile migration and `v0.1.6` maintenance release are complete. The September 4 direct
UX/psychology audit reproduced new persistence, revision, body-completion, and journal-readback
defects. R1-R6 product changes are implemented and locally verified; publication requires the
hosted workflow and public smoke gate. Updated September 5, 2026. The summary records delivered scope, not
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

Current catalog coverage is deliberately bounded: 61 reviewed descriptions, not an invented
definition for every word. Missing prose stays absent; existing no-guidance decisions stay intact.
Editorial review is not clinical validation, participant evidence, or a new physical AT pass.

### Next Recommended Work

1. Remediate newly reported development-toolchain advisories in `browserslist`, `fast-uri`, and
   `@humanfs/node`. Confirm patched versions and parent ranges, update only affected lockfile
   branches, then run clean install, policy/unit/build, production browser and PWA checks. Do not
   use forced audit fixes or merge dependency PRs without checking the resolved tree. September 5
   production-only audit reports zero vulnerabilities; full audit propagates seven underlying
   advisories across 96 dependency entries. This is not 96 independent product vulnerabilities.
2. Prioritize another bounded content batch only for high-exposure words lacking
   reviewed definitions. Start with the Stressed/Overwhelmed sibling context; inventory with the
   existing catalog tooling, review EN/RO together, then add rendered comparison tests. Do not
   mass-fill the catalog or create a runtime prose generator.
3. Resume external P6/P7 evidence only on their existing prerequisites. They do not block these
   verified product fixes. No new feature or architectural migration is needed for closure.

Detailed pre-change findings and reproduction: [September audit](ux-psychology-audit-2026-09-04.md).
R1-R6 are labels for this corrective pass, not a renumbering of the migration history.

## Delivered Sequence And Verification

Implementation followed R1a -> R1b -> R2 -> R3 -> R4 -> R5 -> R6. R1-R3 repair
reproduced defects and need no participants or physical device. R4-R6 follow the observed choice
and content gaps, with psychological impact treated as heuristic until real usage validates it.
External P6 evidence and unrelated P7 questions remain deferred on their own prerequisites.

Implemented architectural improvement: the existing check-in workflow owns one current draft
and explicit new/revise/finish transitions, independently of screen mounting. Screen-only
presentation stays local and the ordered writer owns persistence. This addresses the repeated
identity, Back, rejection, and restoration problems without a new state library or router.

Verification follows the normative commands in `docs/release-quality-gates.md`. Local completion:
710 unit/component tests, 298 production Chromium/WebKit journeys, PWA lifecycle, production
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
