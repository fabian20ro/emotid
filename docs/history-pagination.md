# Accessible History Pagination

November 8, 2026. Base: `ab7bc14` (#20). Candidate: `codex/accessible-history-pages`.

## Contract

- Journal and saved exercises render at most 20 records at a time, in their existing order.
  First/previous/next/last buttons and a validated direct-page number input are available above
  and below multi-page lists. Single-page lists have no navigation controls.
- EN/RO range text, labelled controls, native disabled boundaries, visible focus and 44px targets.
  Changing either set of controls focuses/reveals the single range summary above the new rows.
  No extra live region or keyboard interception; existing platform keyboard helper covers macOS
  WebKit's Option+Tab convention. Numeric jumps require submission, not every keystroke.
- Journal page state lives with App's history owner and survives detail/back/tab navigation.
  Exercise page state lives with the exercise view and survives detail/form toggles. Pages are
  transient, not stored preferences or new browser-history entries; reload starts at the first page.
- Deleting the final row on the last page clamps to the preceding page. Empty histories reset the
  page so new saves cannot resurrect a stale offset. IDs, not visible row positions, drive selection
  and deletion. Detail return retains the page and the existing screen-heading focus contract.
- Successful exercise deletion transfers focus after dialog cleanup, including bulk deletion to
  the empty view. Cancellation and failed deletion keep existing confirmation behavior.
- Drafts, complete statistics, latest-exercise lookup and full data exports do not use page slices.
  Both repositories still hydrate all records. No schema/storage/safety/scoring changes, new
  dependencies, virtualization, backend or telemetry.

## Implementation / TDD

`useHistoryPage` owns only bounds and transient state. `HistoryPagination` owns common controls and
focus, leaving record rendering with each existing view. The exercise slice is memoized so typing
does not defeat `ChainEntryList`'s existing optimization. Pagination UI remains behind lazy routes.

Failing regressions preceded each fix: Journal and exercise lists rendered 41 instead of 20 rows;
bottom controls were absent; bulk deletion lost focus after its trigger disappeared. Unit coverage
also checks keyboard/direct jumps, aggregate counts, stable selected IDs, shrinking/empty lists and
retained drafts. The complete-export/5,000-record browser regression now visits first/middle/last
pages without weakening its exact record assertions.

Browser matrix: Chromium/WebKit, EN/RO x light/dark, 320x568 and desktop snapshots. It verifies
keyboard traversal/activation, visible range focus, contrast, target geometry, invalid page input,
detail return, one-row page deletion, bulk deletion and cross-tab erasure. Concurrent erasure keeps
the established storage-recovery boundary rather than silently presenting stale data.

Harness corrections, excluded from acceptance: the initial test expected Romanian after erasure
reset preferences to the English browser locale; direct Tab on macOS WebKit skipped native buttons.
The corrected assertions verify the reset and reuse `pressTab`; no product behavior was weakened.

## Measurement And Limits

Reuse the unchanged native-clock R20 performance harness: 100/1000/5000 records per store, three
fresh contexts per language/theme/browser. DOM counts are direct observations; interaction timings
include transitions and tracing, not INP or physical-device latency. Before evidence from the #20
candidate is retained in `.reports/pwa-old-performance-evidence/`; final follow-up measurements and
gate results belong to `ITERATION_LOG.md`.

EN/light comparison at 5,000 records/store, same macOS arm64 host and browser versions, three
fresh contexts per row. Timings in milliseconds, medians; not a randomized performance experiment.

| Browser | Journal before -> after | Exercise list before -> after | Typing before -> after |
| --- | ---: | ---: | ---: |
| Chromium 151.0.7922.34 | 406.4 -> 320.6 | 394.5 -> 317.3 | 20.6 -> 22.1 |
| WebKit 26.5 | 591 -> 329 | 513 -> 321 | 21 -> 20 |

DOM nodes in both engines: Journal 40,099 -> 309; exercise list 20,053 -> 183; exercise form while
typing 20,079 -> 209. The unchanged roughly 300ms route transition still contributes to navigation
timings. Form-open median was 11.3 -> 24.6ms in Chromium and 25 -> 22ms in WebKit: do not claim every
interaction improved. Approximate Chromium heap in these samples was 81.4 -> 39.6MB; WebKit exposes
no corresponding heap value. DOM reduction is the strong direct result, not a memory/latency SLA.

Full hydration and aggregate scans still grow with history size. The stacked follow-up measures
navigation-to-hydrated readiness separately: [method and limits](history-hydration.md).
These tests are not low-tier Android, native
screen-reader speech or real-participant acceptance. No new physical-device evidence is claimed.
