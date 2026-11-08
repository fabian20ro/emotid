# History Scale: R20

November 8, 2026. Baseline: main `2571c3d` (#18). Candidate: R20 branch.
This is desktop browser evidence, not low-tier Android or assistive-technology acceptance.

## Method

- Production build, Chromium/WebKit, 393x742 viewport. Deterministic synthetic datasets:
  100, 1,000 and 5,000 records **in each** of the session and exercise stores.
- Named, inferred, confirmed, partial, rejected and observation-only sessions; real decoders and
  eligibility rules validate the fixtures. Seed an inert loopback document before mounting.
  Fresh browser context per sample; service workers blocked; non-loopback targets rejected.
- Three contexts per size/language/theme/browser. Journal open, exercise-list open, form open,
  then three individual characters. Capture the input/click event through two animation frames
  after the target exists. Navigation numbers include the existing transition; these are not CPU
  duration, INP, page-load-to-hydrated time or physical-device latency.
- Native performance clock only. Playwright's fake clock replaced `performance`, rounded timing
  and hid `performance.memory` in an initial probe. That probe was excluded and baseline repeated.
- JSON records raw samples, median, nearest-rank p95, min/max, DOM nodes, available JS heap,
  browser/version, platform/architecture, viewport, capture time and dataset size. Three-sample
  p95 is simply the maximum. Chromium heap is approximate/quantized and not process memory;
  WebKit does not expose it (`null`, never zero). Tracing adds overhead. No arbitrary CI timing gate.
- Fixture dates are fixed; browser time is not. Date-window summaries can age out on future runs;
  all-time eligibility, list order, deletion and export assertions remain deterministic.

Repeat with `npm run test:performance`. The existing CI performance step runs the same matrix and
uploads `test-results/performance/`. Filter `--grep 'history .*en/light'` through
`npm run test:performance:run --` for the paired baseline comparison after building that revision.
Preserve output outside `test-results/` before another Playwright suite cleans it.

## Paired EN/Light Results

Same native-clock harness before/after; three fresh contexts, nine typing samples per row.
Times in milliseconds; rounded to one decimal. Both builds on macOS arm64,
Chromium 151.0.7922.34 / WebKit 26.5.

| Browser | Records/store | Typing median before -> after | Typing p95 before -> after | Form median before -> after |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 100 | 17.0 -> 18.2 | 19.5 -> 19.0 | 23.7 -> 24.1 |
| Chromium | 1,000 | 25.8 -> 23.2 | 35.4 -> 25.3 | 28.9 -> 20.1 |
| Chromium | 5,000 | 132.7 -> 23.7 | 157.2 -> 46.4 | 159.5 -> 20.0 |
| WebKit | 100 | 21 -> 19 | 25 -> 33 | 23 -> 21 |
| WebKit | 1,000 | 50 -> 15 | 56 -> 32 | 54 -> 16 |
| WebKit | 5,000 | 250 -> 15 | 265 -> 28 | 253 -> 29 |

At 5,000 records, Journal median was 425.5 -> 413.3 ms (Chromium), 597 -> 604 ms (WebKit).
Exercise-list open was 444 -> 413.3 ms, respectively 742 -> 519 ms. Navigation includes roughly
300 ms of transition; do not interpret the entire number as list-computation cost.

The separate frozen-candidate full matrix passed 25/25 cases: startup plus 24 history cases,
72 fresh history contexts. At 5,000 records/store:

| Browser | Language/theme | Typing median | Typing p95 |
| --- | --- | ---: | ---: |
| Chromium | EN/light | 21.4 | 33.6 |
| Chromium | EN/dark | 21.1 | 28.1 |
| Chromium | RO/light | 21.4 | 31.7 |
| Chromium | RO/dark | 22.3 | 36.2 |
| WebKit | EN/light | 21 | 25 |
| WebKit | EN/dark | 15 | 25 |
| WebKit | RO/light | 17 | 26 |
| WebKit | RO/dark | 19 | 43 |

This second run illustrates normal sampling variation; it is not a second baseline or a guarantee.
Full final raw measurements: `.reports/r20-performance-final/` locally; CI repeats the same matrix.

## Bounded Fix

`ChainEntryList` is a memoized presentation component. Entries, language and a stable selection
callback determine its output; typing a separate draft no longer formats/reconciles every row.
One `Intl.DateTimeFormat` per list render replaces one `toLocaleString` formatter per row.
No storage changes, truncation, pagination, dependencies, content changes or altered safety policy.

TDD: the original component called date formatting three times for three typed characters; the
regression now requires no saved-row formatting during typing. Separate tests protect updated
records, callbacks and language. Browser tests use 5,000 records/store in both engines and all
four language/theme combinations: exact order endpoints, analytics eligibility, detail selection,
individual deletion, retained draft, durable deletion after reload and complete exported records.

## Residual Risk / Next Decision

Full hydration and full DOM remain: at 5,000 records, Journal has 40,099 DOM nodes; the exercise
form while typing has 20,079. Chromium reported approximately 81.4 MB JS heap in these samples;
there is no precise cross-browser memory comparison. This PR fixes the measured typing problem,
not unbounded-history scalability. It does not establish a maximum supported history size.

Keep the next planned old-tab PWA reproduction separate. If continuing history work afterward,
start with bounded list rendering and explicit accessible navigation, preserving full export,
aggregate eligibility and stable selected IDs. Reuse these fixtures for before/after evidence.
Do not introduce IndexedDB pagination, indexes or a global store without isolating hydration or
query cost first; this harness currently measures interaction after startup, not hydration cost.

Ignored local evidence: `.reports/r20-baseline-native/`, `.reports/r20-after-native/`.
Final matrix and release-gate results are recorded in `ITERATION_LOG.md`.
