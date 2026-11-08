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
PRs A-F are merged (#12-#17). PR G implements R14/R21-R23 on its branch: corrected extension/safety
documentation, catalog-free session policy, completion-owned metadata and unused breadcrumb removal.
Review/merge and exact-SHA publication checks remain distinct from implementation; evidence belongs
to the iteration log. R18 remains an upstream tooling risk, not a patched dependency claim.
Next implementation: R20 measurements, followed by the separate old-tab PWA reproduction.
Keep scoring and safety gating unchanged.

### Recommended Next: R20 History Measurements

1. Add deterministic synthetic session/exercise fixtures for 100/1000/5000 records. Seed isolated
   browser contexts before mounting the app; no personal data, telemetry or public-origin seeding.
   Cover named, inferred, rejected and observation-only sessions so analytics eligibility stays real.
2. Extend the existing production performance harness with Journal open/render and exercise-typing
   journeys. Record browser/version, viewport, dataset size, DOM nodes, timing samples and available
   memory measurements. Keep wall-clock latency and browser-specific heap support explicit; missing
   memory APIs are not zero memory. Use several runs and report median/tail, not a single timing.
3. Compare Chromium/WebKit and check EN/RO x themes for functional parity. Establish the baseline
   before choosing CI thresholds; no device-class or physical-performance claims from desktop proxies.
   Keep correctness assertions repeatable: order, selected-result eligibility, detail navigation,
   deletion, full export and retained exercise drafts.
4. Only if a bottleneck is measured, write its failing regression and implement the smallest local
   fix. Prefer bounded rendering or isolating exercise-list rendering where evidence points there;
   do not introduce pagination/indexing/state infrastructure speculatively. Re-run the same fixtures
   and release gates, retaining before/after evidence and unchanged storage/export semantics.

### Then: Old-Tab PWA Reproduction

1. Build A/B with a genuinely different lazy route chunk; assert different content hashes, not only
   version labels. Open two tabs on A, visit only the initial route, activate B from the other tab.
2. In the retained A tab, open the previously unvisited route online and offline. Verify which app/
   worker version actually remains, record requests/errors and prove saved data survives. If automatic
   update reloads A, record that observed lifecycle rather than claiming a retained-old-tab case.
3. Keep this separate from storage fixtures and from the already-fixed per-attempt server reset.
   Add recovery only for a reproduced failure, with explicit user control during a draft; no forced
   mid-reflection reload or data clearing. Preserve failure artifacts and test retries from clean A.

Architecture follow-up remains evidence-driven. The catalog-free session policy is now implemented;
do not add another facade, global store or generic recovery framework merely to continue refactoring.

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
