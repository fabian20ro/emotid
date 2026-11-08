# Product Maintenance Plan

Updated November 8, 2026. The mobile migration and the bounded M1-M3/startup maintenance work
are implemented, including the code-hygiene corrective pass. Publication status belongs to the
exact-revision hosted workflow and public verification, not a moving status copied into this plan.

Historical implementation detail belongs in `ITERATION_LOG.md`, release criteria in
`docs/release-quality-gates.md`, candidate evidence in `docs/physical-release-evidence.md`, and
release scope in `docs/releases/v0.1.6.md`. Do not duplicate completed phases here.

## Publication Contract

1. Freeze the candidate and verify affected behavior plus the maintained release gates.
2. Commit/push; await successful exact-revision CI, Pages and public smoke.
3. Repeat affected EN/RO x theme browser journeys on the public URL with isolated synthetic data.

## Active Remediation

The prioritized findings and PR A-G sequence live in
[the multidisciplinary audit](audit-2026-11-06.md#ordine-recomandata-de-implementare).
PRs A-E are merged (#12-#16). PR F implements R10/R11/R24 on its branch: stable choice IDs,
legacy text fallback, the Romanian repelled/rejected distinction and count-aware Journal copy.
Review/merge and exact-SHA publication checks remain distinct from implementation; evidence belongs
to the iteration log. R18 remains an upstream tooling risk, not a patched dependency claim.
Next implementation: PR G. Keep scoring and safety gating unchanged.

### Next Implementation: PR G

1. R14 first: remove the unsupported three-body-group grounding claim in `docs/CODEMAPS/models.md`
   and correct extension paths in `docs/CONTRIB.md`. Verify each statement against actual owners;
   do not implement a new psychological rule merely to make old documentation true.
2. R21: move result relationship, selected-result filtering and pattern eligibility out of
   `session-presentation.ts` into one small catalog-free policy module. Keep localized labels and
   headings in presentation. Start with public-policy parity tests for named/suggested/partial/
   rejected/legacy/body-observation records and a dependency-isolation check. Migrate analytics
   consumers directly; avoid a second facade or generic policy framework.
3. R22: test completion-to-session parity for every route and crisis tier, including observation-only
   sessions and explicit revisions. Make the existing completion boundary the sole owner of
   `outcome`/`crisisTier`; serialization copies them and continues to own identity and selections.
   Safety classification must not change. Do not combine this with new scoring or guidance.
4. R23: verify production references, then remove only the unused inferred breadcrumb result and
   its obsolete tests. Keep the used selection handler and the actual multi-parent Word Ladder path.
5. Verify each slice before the next, then full policy/unit/type/lint/build checks, frozen production
   browser matrix, PWA lifecycle/retry and supporting gates. Check actual import ownership and
   unchanged performance budgets, not just filenames. Review/merge, exact-SHA Pages/smoke, then
   affected public journeys. No unmeasured performance improvement claim.

Small architecture improvement: a catalog-free session policy shared by analytics and presentation.
This removes accidental content coupling while retaining one source of behavioral truth.

### Measurement After G

- R20: synthetic histories of 100/1000/5000 records; record Journal open/render time, DOM size,
  memory and exercise-typing behavior. Identify the limiting operation before considering bounded
  rendering, pagination or indexing. Keep deletion, export and ordering semantics intact.
- Old-tab PWA hypothesis: two builds with a genuinely changed lazy chunk, two tabs, B activated
  while A stays open; exercise an unvisited route online/offline. Add recovery only if reproduced,
  without forced mid-reflection reload or user-data clearing. Fixture retry isolation is not
  evidence that this separate lifecycle scenario is solved.

## Conditional Next Work

- **Publication:** live-regression tooling is merged and its initial hosted run passed.
  Repeat it after remediation PRs are published. Commands and evidence boundaries belong to
  [release quality gates](release-quality-gates.md#opt-in-live-regression-matrix).
- **Registration failures:** a bounded WebKit probe reproduced pending-registration rejection
  during fixture navigation, not a persistent startup failure. Keep storage and PWA checks separate;
  change registration ownership only for a reproduced ordinary-route/settled-startup failure.
  See the [investigation](webkit-registration-investigation.md).
- **WebKit startup:** PR D's two-worker local matrix encountered four blank-page timeouts at the
  initial `goto`; five traced repetitions of each case passed. Root cause remains unconfirmed;
  do not equate these timeouts with the registration rejection above. Keep the evidence in the
  iteration log and capture traces on recurrence, before changing application startup or retries.
- **Dependencies:** November 8 reassessment: 15 dev-toolchain entries from three advisories,
  no production entries. Compatible patched transitive releases are not available in the inspected
  dependency chains. The [dependency security review](dependency-security.md) records reachability
  and review triggers. No forced downgrade or unsupported major override.

- **Vocabulary:** only a deliberately selected incomplete reachable choice group, with EN/RO
  editorial review and provenance. Current coverage is 66 reviewed meanings. Do not fill the
  catalog automatically or infer needs from new definitions; reviewed-null guidance stays intact.
- **Chunk recovery:** WebKit retained failed module state across reload in bounded simulations;
  reopening passed. Recent-summary copy names reopening. Investigate broader route retry only
  against a reproduced failure; no universal retry framework or automatic cache clearing.
- **Dependency/browser maintenance:** act on a current advisory or reproduced regression; no
  speculative major upgrades. M1's zero-audit result is historical, not a perpetual security claim.
- **Content questions:** masculine Romanian labels, a fourth reflection answer, optional context
  notes, Google prompt changes and broader affect terminology require separate product evidence
  or approval. They are not unfinished migration work.

## Deferred External Evidence

- Low-tier Android: existing three-run matrix when a distinct device is available.
- Moderated comprehension: six real participants using
  `docs/moderated-comprehension-validation.md`; synthetic review is not a substitute.
- Full human TalkBack J1-J9: previously waived; retain the distinction from bounded passed
  checkpoints and browser semantics. No new speech pass claimed by this maintenance work.
- Native macOS Safari: retry after Safari/SafariDriver changes; the recorded transport failure
  occurred before product rows.
- iOS simulator: existing acceptance/robustness when the runtime is available, particularly after
  adapter changes. Physical iPhone testing remains outside scope.
- Live regions containing controls and modal background exposure: native AT risks, not confirmed
  defects. Obtain direct evidence before altering announcements or adding inert behavior.

These prerequisites do not block verified product fixes or justify inventing new features.

## Implementation And Verification Rules

Smallest failing regression -> bounded fix -> focused checks -> frozen release candidate.
Use `docs/release-quality-gates.md` for executable gates; do not maintain a second command list.
Run suites sequentially when they share build/test artifacts. Require exact-revision CI/deploy/
public smoke and affected live journeys; push success or HTTP 200 alone is insufficient.
Keep the existing 150,000-byte initial gzip JS limit. Inspect actual module ownership, not just
a wrapper filename; static startup, total assets, offline precache and physical timing differ.

Preserve client-only storage, no telemetry/backend, selected-word-only AI handoff, informal
Romanian singular, bilingual copy, reversible selection and deterministic safety semantics.
Do not change scoring, guidance or language contracts during cleanup.

KISS/YAGNI: no router/state-library/repository rewrite without demonstrated need.
DRY/Rule of Three: share repeated behavior, not vaguely similar platform workflows.
SoC/POLA: storage, workflow, catalog and presentation retain clear ownership.
Fail Fast: validate records/provenance and reject forbidden startup imports.
Gall's Law: ship verified increments; stop when the bounded acceptance criteria pass.

A new versioned release is optional and requires synchronized release identity owners.
Do not move the existing v0.1.6 tag to newer maintenance commits.
