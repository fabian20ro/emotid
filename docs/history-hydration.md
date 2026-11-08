# Full History Hydration Measurements

November 8, 2026. Stacked base: `0094cd3` / PR #21 (`codex/accessible-history-pages`).
Candidate: `codex/history-hydration-measurements`. Implementation, merge and publication are distinct.

## Method

The ordinary optimized production build remains in `dist`. A separate optimized build in
`.history-hydration-build` wraps real module import boundaries using a test-only Vite plugin.
No product source hooks, telemetry, schema changes or timing code are shipped. The plugin rejects
ordinary build mode, publishable output paths and missing measured boundaries. Browser contracts
also scan ordinary JavaScript and check that its runtime has no probe.

Per history store, the probe observes repository start/end, guarded `values()` start/end, synchronous
record validation, then the React layout commit with `loading=false`, error state and exact count.
The post-validation interval includes sorting **and Promise continuation**, not isolated sort CPU.
Guarded read includes database opening, epoch checks and the transaction, not just disk I/O.
The two repositories overlap: do not sum their durations to estimate total startup time.

Independent document observations record first Today DOM and the recent-session summary after two
animation frames. Today presence is not full hydration. A held exercise read can coexist with an
already rendered recent-session summary; both-store readiness requires both hook commits. Held and
failed reads are deliberate browser controls; incomplete, duplicate, failed, miscounted or temporally
inconsistent measurements cannot become valid hydration summaries.

Loopback-only fixtures: 0/100/1,000/5,000 records **per store**, EN/RO x light/dark x Chromium/WebKit,
three repetitions of ordinary and instrumented builds each: 32 matrix cases, 192 fresh contexts.
Ten additional browser contracts verify the hold/failure/isolation behavior. Full export is compared
exactly on the first repetition of each build/combination; Journal rendering remains bounded.
Timing JSON contains counts, structural outcomes and durations, not record contents or error text.

Each sample uses a new browser context and app document; seeding occurs before measured navigation.
HTTP routing disables HTTP cache, workers are blocked, and OS/disk caches are not reset. This is cold
application state, not cold hardware. Native page clocks exclude Playwright polling from timings.
Production then instrumented runs alternate in fixed order; paired controls reveal build/observer
differences but are not a randomized causal estimate of probe overhead.

## Evidence And Decision

Frozen matrix: 42/42 passed without retries, 32 complete timing artifacts. macOS 27.2 (26B123),
arm64, Node 26.8.1, Chromium 151.0.7922.34 and WebKit 26.5; viewport 393x742. EN/light medians, milliseconds,
three fresh contexts per build/row. Read/decode/sort columns use the instrumented build.

| Engine | Records/store | Today ready, ordinary | Today ready, instrumented | Both hooks committed | Sessions read / decode / sort+continuation | Exercises read / decode / sort+continuation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Chromium | 0 | 52.1 | 56.5 | 36.3 | 2.9 / 0 / 0 | 3.8 / 0 / 0 |
| Chromium | 100 | 67.4 | 61.1 | 43.2 | 2 / 0.3 / 0 | 8 / 0.1 / 0 |
| Chromium | 1,000 | 73.4 | 70.9 | 48.7 | 10.4 / 0.7 / 0 | 11.9 / 0.2 / 0 |
| Chromium | 5,000 | 96.6 | 96.5 | 71.5 | 28.8 / 1.8 / 0.1 | 39.3 / 0.5 / 0.1 |
| WebKit | 0 | 54 | 51 | 37 | 2 / 0 / 0 | 3 / 0 / 0 |
| WebKit | 100 | 75 | 73 | 44 | 1 / 1 / 0 | 6 / 0 / 0 |
| WebKit | 1,000 | 77 | 80 | 51 | 11 / 1 / 0 | 13 / 0 / 0 |
| WebKit | 5,000 | 102 | 95 | 70 | 25 / 2 / 0 | 29 / 1 / 0 |

Across all four language/theme combinations at 5,000/store, both-hook medians ranged 71.5-99.1ms
in Chromium and 70-80ms in WebKit; largest individual samples were 101.8ms and 85ms respectively.
Ordinary-build Today-ready medians ranged 96.6-117.6ms / 102-113ms. Journal-open medians remained
316.7-318.1ms / 316-321ms, including the existing route transition. Fixed-order sampling does not
establish a theme/language effect or an instrumentation speedup. Zero-duration values reflect
clock precision/rounding, not free work.

Decision: retain the current repositories. The guarded-read interval grows with record count and
is larger than validation/sort here, but includes scheduling and concurrent work; it does not prove
an I/O bottleneck. These results do not justify a schema migration, global store or aggregate cache.
First review/publish the pagination and measurement stack, then investigate only a reproduced
problem or a separately scoped larger/longer-content requirement.

Local raw evidence: `.reports/hydration-final-evidence/`; each `history-hydration.json` includes
all samples, browser version, environment, ordinary/instrumented manifest SHA-256 and completion
status. CI retains equivalent evidence; final gate results and TDD record are in `ITERATION_LOG.md`.

## Limits / Follow-Up

- Three samples per combination: p95 is the maximum, not a stable tail-latency estimate. No timing SLA.
- Synthetic records contain short fixed content; key order already matches timestamp order. Sorting
  is favorable; arbitrary long notes, shuffled chronology and much larger histories are unmeasured.
- Both repositories still hydrate complete arrays; aggregate scans are not individually profiled.
  Bounded rendering does not impose a storage or memory ceiling. Approximate Chromium heap is only
  supporting evidence; WebKit exposes no equivalent value here.
- No INP, low-tier Android, native Safari, screen-reader speech or participant acceptance claim.
- Keep repository/index changes conditional on a reproduced bottleneck. Preserve full exports,
  aggregate semantics, ordering, erasure epochs, loading and error behavior in any later experiment.

Commands and CI artifact retention: [release quality gates](release-quality-gates.md).
