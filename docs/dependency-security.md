# Dependency Security Review

Reviewed November 8, 2026. Audit results are a dated snapshot, not a permanent guarantee.

## Current Disposition

Full npm audit: **15 entries (13 moderate, 2 low), from three advisories**. Production-only audit:
**zero**. All reported paths belong to development/build tooling. This review does not claim
that affected dependencies are patched or that tooling cannot be exploited.

Registry checks found no fix within the supported ranges: ESLint 10.14.0 still requires minimatch
10.x; TypeScript ESLint 8.72.1 still requires minimatch 10.x; Workbox 7.4.1 still requires glob 11.x
and node-resolve 16.x. deepmerge 4.3.1 remains its latest release. Unrelated available updates
were not installed. The only new package is dev-only yaml 2.9.1 for structured workflow tests;
the existing runtime/toolchain versions and peer cohort remain unchanged.

Do not use `npm audit fix --force`, downgrade the PWA plugin, or insert blanket major-version
overrides merely to make audit green. Reassess a supported upstream update or a separately scoped,
verified migration when available. Existing Babel/EJS overrides are unchanged.

## Advisory Reachability

### minimatch

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate.
Installed 10.2.6; fixed in 11.0.1. The issue requires attacker-controlled patterns and
`optimizationLevel >= 2`. Current owners are ESLint/config-array, TypeScript ESLint and
Workbox's glob. The inspected lint configuration and Vite precache configuration use fixed
repository-controlled patterns, not journal content. A malicious PR can modify build code/config
already; this is not a reason to grant it write credentials or secrets.

No 10.x patch exists at review time. Revisit when these owners adopt a patched major or when
pattern sources change. An untrusted-pattern service would require a different risk assessment.

### glob

[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderate.
Installed 11.1.0 under Workbox 7.4.1; fixed in 14.0.2. The advisory concerns asynchronous traversal
continuing after AbortSignal cancellation. The inspected Workbox call is
`globSync(globPattern, { cwd, follow, ignore })` in
`node_modules/workbox-build/build/lib/get-file-details.js`, with no AbortSignal.
The application does not send user data to this build-time path.

No 11.x patch exists at review time. Revisit when Workbox adopts patched glob or changes to
asynchronous/untrusted traversal. No cross-major override added.

### deepmerge

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), low.
Installed 4.3.1; no patched release published. Path:

`vite-plugin-pwa@1.3.0 -> workbox-build@7.4.1 -> @rollup/plugin-node-resolve@16.0.3 -> deepmerge@4.3.1`.

Both inspected resolver distributions call `deepMerge({}, defaults)` only while constructing
constant defaults; caller options are combined separately. No journal content or external merge
source reaches that call in this version. Revisit after a patch, dependency replacement, or
changes to the resolver's input/call sites.

## Operational Controls

PR workflows retain read-only permissions. Only the deploy job has Pages/OIDC write permissions;
publishing is restricted to main. Top-level concurrency retains an in-progress main workflow
through deployed smoke while permitting superseded PR cancellation. New pending main runs can
still supersede older pending runs; an already-running publication must finish.

Workflow actions are pinned to full upstream SHAs resolved from the existing major tags on
November 8, 2026, with version comments and weekly Dependabot action updates. Pinning top-level
actions does not freeze every nested action, package installation, or runner image.
See [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
and [secure action use](https://docs.github.com/en/actions/reference/security/secure-use).

Build only reviewed code; do not expose development/test servers to untrusted networks.
No audit suppression, vendored dependency fork or new production network behavior was added.

## Verification And Reassessment

Keep clean `npm ci`, `npm ls --depth=0`, full product checks, frozen production Chromium/WebKit,
PWA lifecycle and retry-isolation tests, performance, local deployed smoke and language Fast
Refresh. Use the maintained release-quality gates; exact results belong in `ITERATION_LOG.md`.

Repeat full and production-only audits before the next dependency change, when an advisory is
updated, when the relevant package owners publish support for fixes, or when inspected input
sources change. Historical October remediation remains in the iteration log, not a current
zero-risk statement.
