# Dependency Security Review

Reviewed November 14, 2026. Audit results are a dated snapshot, not a permanent guarantee.

## Current Disposition

Full npm audit: **12 entries (10 moderate, 2 low), from three advisories**. Production-only audit:
**zero**. The same-day baseline had 14 entries (12 moderate, 2 low). These counts include packages
affected through their dependencies; they are not counts of distinct vulnerabilities.

ESLint 10.15.0 and its config-array 0.23.6 now depend on minimatch 11.x and resolve to patched
11.0.8. Those two advisory paths are removed. ESLint's Node engine range is unchanged and the
existing plugin/parser peers remain supported. No production dependency or override changed.
The residual paths below are development/build tooling; that scope limits but does not eliminate risk.

Do not use `npm audit fix --force`, downgrade the PWA plugin, or insert blanket major-version
overrides merely to make audit green. Reassess a supported upstream update or a separately scoped,
verified migration when available. Existing Babel/EJS overrides are unchanged.

## Advisory Reachability

### minimatch

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate.
Fixed in 11.0.1. The remaining 10.2.6 is required by TypeScript ESLint's parser tooling
(even typescript-estree 8.72.2 requests ^10.2.2) and Workbox's glob 11.1.0 (^10.1.1).
The issue requires attacker-controlled patterns and `optimizationLevel >= 2`.
The inspected lint configuration and Vite precache configuration use fixed
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
