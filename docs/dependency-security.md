# Dependency Security Review

Reviewed October 29, 2026. Audit results are a point-in-time statement, not a permanent guarantee.

## Remediation

Compatible updates: Vite 7.3.7; Vitest and coverage cohort 4.1.12; brace-expansion 5.0.12,
fast-uri 3.1.9, serialize-javascript 7.1.4, source-map-js 1.2.2, undici 7.30.1 and zod 4.6.7.
The lockfile also updates the test runner's compatible transitive dependencies. No application
runtime dependencies, framework majors or PWA-plugin versions changed.

Clean installation and `npm ls --depth=0` succeed. Full audit drops from 14 entries
(5 high, 4 moderate, 5 low) to four low entries. `npm audit --omit=dev` reports zero.

## Remaining Advisory

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4):
deepmerge 4.3.1, low-severity prototype poisoning of returned objects. No patched release
published at review time. The four npm entries represent one advisory propagated through:

`vite-plugin-pwa@1.3.0 -> workbox-build@7.4.1 -> @rollup/plugin-node-resolve@16.0.3 -> deepmerge@4.3.1`.

Reachability inspection: the installed resolver's ESM and CommonJS distributions call deepMerge
only to construct `DEFAULTS` from an empty object and fixed internal `defaults`. Caller options
are combined separately with object spread. No user journal content or external source objects
reach this merge in the inspected version. This is build-time tooling, not shipped application
code. That limits observed exposure; it does not mean the dependency itself is patched.

Keep this residual advisory visible. Do not use `npm audit fix --force`: its proposed
vite-plugin-pwa 0.2.1 downgrade changes the PWA toolchain and is not a supported fix for this app.
No suppression, package alias, vendored fork or blanket override added.

Revisit when deepmerge publishes a fix, the resolver removes/replaces it, or its merge call
sites/input sources change. Recheck `npm explain deepmerge`, both resolver distributions and
the advisory before changing this disposition. Build only reviewed code with the existing
read-only PR workflow; do not expose development/test servers to untrusted networks.

## Verification

Use the existing release-quality gates after dependency changes, including clean `npm ci`,
full product checks, production Chromium/WebKit, PWA lifecycle, performance, local deployment
smoke and language Fast Refresh. Check `npm outdated` before/after; unrelated newer versions
are not automatically remediation requirements. Never suppress failed peer resolution.
