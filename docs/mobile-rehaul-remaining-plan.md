# Product Maintenance Plan

Updated November 7, 2026. The mobile migration and the bounded M1-M3/startup maintenance work
are implemented, including the code-hygiene corrective pass. Publication status belongs to the
exact-revision hosted workflow and public verification, not a moving status copied into this plan.

Historical implementation detail belongs in `ITERATION_LOG.md`, release criteria in
`docs/release-quality-gates.md`, candidate evidence in `docs/physical-release-evidence.md`, and
release scope in `docs/releases/v0.1.6.md`. Do not duplicate completed phases here.

## Publication Contract

1. Require frozen-candidate verification for Today history states, real catalog module ownership,
   Affect input cleanup and removal of the unused session-only export.
2. Commit/push; await successful exact-revision CI, Pages and public smoke.
3. Repeat affected EN/RO x theme browser journeys on the public URL with isolated synthetic data.

The implementation distinguishes pending/error/empty history without blocking Quick, rejects
eager full-catalog modules during build, and retains canonical labels and deterministic safety.
The active plan is shortened; the generated Playwright run marker is no longer tracked.
The November audit found additional state/data defects beyond those publication checks.

## Active Remediation

The prioritized findings and PR A-G sequence live in
[the multidisciplinary audit](audit-2026-11-06.md#ordine-recomandata-de-implementare).
PR A implements durable multi-tab erasure, per-store atomic clear and history recovery;
PRs #12/#13 are merged. PR B implements renewed agreement after result changes and support continuity
(R02/R03). PR C implements draft ownership and reflection navigation (R04/R08) on its branch;
publication evidence belongs to the iteration log and exact-revision hosted checks.
PR D implements the shared dialog focus/viewport boundary, vocabulary focus progression and
dated Journal accessible names (R07/R09/R12), with sequential keyboard coverage from R15.
Next implementation: PR E, safe tooling and release verification.
Keep scoring and safety gating unchanged. Remaining priorities stay in the audit, not a duplicate list.

### Next Implementation: PR E

1. R13 first: trace references to `scripts/extract-catalog.cjs`; retire the obsolete writer and
   its executable documentation if no supported caller needs it. Preserve curated catalogs,
   reviewed-null guidance and provenance. Test the supported catalog validation/review path;
   never run the old generator over real content to reproduce its destructive output.
2. R16/R19: add workflow contract tests before changing configuration. PR builds may cancel
   superseded runs; main publication must finish deployment plus smoke. Keep deploy permission
   restricted to the deploy job. Pin actions to verified upstream commit SHAs with version comments
   and Dependabot updates. No new publishing service or release framework.
3. R17: reproduce a PWA-test retry after switching to v2. Add an explicit test-server reset to v1
   before every attempt, with validation of allowed versions. Verify the injected first failure
   and subsequent successful retry, retaining the original trace. This is fixture isolation,
   not a change to application update behavior.
4. R18: rerun full and production-only dependency audits. Inspect affected call paths and select
   compatible fixes; no forced PWA downgrade or speculative major migration. Update the security
   review with dated remaining advisories, reachability and next review trigger.
5. Separate tooling changes from dependency changes in reviewable commits. After the final lockfile,
   run clean install, full check, frozen production browser matrix, PWA lifecycle, language refresh,
   performance and local deployed smoke. Validate hosted workflow behavior after reviewed merge;
   exact-SHA Pages/smoke and affected public journeys remain publication requirements.

Small architecture improvement: make the existing PWA test server's version an explicit resettable
test boundary. No shared platform-runner abstraction; no product state or catalog schema rewrite.

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
- **Dependencies:** November's audit supersedes the earlier single-advisory snapshot:
  15 dev-toolchain entries from three advisories, no production entries. R18 tracks reassessment;
  [dependency security review](dependency-security.md) retains the previous analysis until updated.
  No force-fix PWA downgrade.

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
