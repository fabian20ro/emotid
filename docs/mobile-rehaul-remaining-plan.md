# Product Maintenance Plan

Updated November 14, 2026. The mobile migration and the bounded M1-M3/startup maintenance work
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
PRs A-G are merged (#12-#18). PR G implements R14/R21-R23: corrected extension/safety
documentation, catalog-free session policy, completion-owned metadata and unused breadcrumb removal.
Review/merge and exact-SHA publication checks remain distinct from implementation; evidence belongs
to the iteration log. R18 remains an upstream tooling risk, not a patched dependency claim.
R20 measurements and the exercise-typing fix are merged (#19). The retained-tab PWA failure and
deferred-activation fix are merged (#20); publication is separate. Method, tradeoffs and browser
limits: [PWA investigation](pwa-old-tab-update.md). Accessible bounded history rendering is
merged in #21; contract and evidence: [history pagination](history-pagination.md).
Full-hydration instrumentation (#22, merged through #21) is also in main; method and findings:
[hydration](history-hydration.md). Exact-revision publication and public checks are recorded in the
November 9-10 iteration entries. The separate WebKit offline-reopen runtime remediation (#24)
is merged; post-merge publication evidence belongs to the November 10 entry.
Keep scoring and safety gating unchanged.

### Recommended Next: Review The Bounded Dependency Fix

R20's [measurements](history-scale-measurements.md) demonstrated typing and DOM costs. Rendering is
now bounded to 20 rows per list. Full-hydration measurement is implemented separately from the
production build; full arrays and aggregate scans still grow with history size.

1. Review the ESLint-only remediation after exact-head CI; merge is a user decision. After merge,
   verify the deployed revision and public smoke. Revisit residual R18 paths when a supported fix
   lands or input reachability changes; see the [dependency review](dependency-security.md).
2. No further product remediation is established by the post-merge live checks. Keep the existing
   regression gates for future changes. Browser upgrades remain distinct from native Safari/
   airplane-mode acceptance; [investigation](pwa-old-tab-update.md#runtime-remediation).
3. If WebKit offline reopen fails again, retain JSON/first-failure traces and compare main-document vs lazy-module
   failures before another change. No higher retries, early origin restoration or speculative worker
   workaround. Keep large fixtures and hydration instrumentation loopback-only.
4. No storage rewrite from these bounded measurements. If slower-device evidence or longer-note/
   shuffled-order requirements reveal a bottleneck, add that fixture first, profile its owning
   operation, then choose one measured fix. Preserve export, aggregates, ordering, epochs and errors.
   Otherwise stop here; no speculative IndexedDB indexes, global store or repository abstraction.

Architecture follow-up remains evidence-driven. The catalog-free session policy is now implemented;
do not add another facade, global store or generic recovery framework merely to continue refactoring.

## Conditional Next Work

- **Publication:** live-regression tooling is merged and its initial hosted run passed.
  Repeat it after remediation PRs are published. Commands and evidence boundaries belong to
  [release quality gates](release-quality-gates.md#opt-in-live-regression-matrix).
  Large-history fixture tests remain loopback-only; do not add them to the public seeding matrix.
- **Registration failures:** a bounded WebKit probe reproduced pending-registration rejection
  during fixture navigation, not a persistent startup failure. Keep storage and PWA checks separate;
  change registration ownership only for a reproduced ordinary-route/settled-startup failure.
  See the [investigation](webkit-registration-investigation.md).
- **WebKit startup:** PR D's two-worker local matrix encountered four blank-page timeouts at the
  initial `goto`; five traced repetitions of each case passed. Root cause remains unconfirmed;
  do not equate these timeouts with the registration rejection above. Keep the evidence in the
  iteration log and capture traces on recurrence, before changing application startup or retries.
- **WebKit offline emulation:** the historical 1.62.1 literal-worker control failed under `setOffline`;
  maintained cross-engine coverage uses origin outage. The runtime remediation is verified against
  that separate outage/reopen case, not a new offline-emulation or native airplane-mode acceptance.
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
