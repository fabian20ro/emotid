# Release Quality Gates

## Automated Gates

Run before release:

```bash
npm run check
npm run test:language-refresh
E2E_PRODUCTION=true npm run test:e2e
npm run test:pwa
npm run test:pwa:retry
npm run test:performance
npm run test:deployed:local
```

The release browser matrix and CI use the production build created by `check`, without hot
reload. Port 5173 must be free. Plain `npm run test:e2e` retains the development-server workflow
for focused iteration; do not edit imported files during a final development-backed run.

`test:tooling` is part of the policy gate, locally and in CI. It checks the retired catalog command
against temporary fixtures and parses workflow YAML to protect publication concurrency, main-only
publishing, minimal permissions and full-SHA action pins with a maintained update path.
It also builds analytics and session serialization in memory, inspecting actual runtime modules:
analytics must not pull in catalog/presentation, and serialization must not load model safety logic.

The PWA fixture selects v1 and resets its origin-outage control before every attempt. Both controls
are loopback-only and validate methods/values. Updates wait until all controlled app tabs/windows
close: no forced reload or global skip-waiting action while a draft may be active. The retained-tab
matrix checks actual different lazy chunk hashes, EN/RO x themes x Chromium/WebKit, old-tab draft
continuity, full saved-data export and v2 activation/reopen only after the final app tab closes.
Origin socket outage is used across engines; Chromium's native offline-emulation/reopen check also
remains. WebKit's `setOffline` limitation and exact boundaries are in the
[PWA investigation](pwa-old-tab-update.md). This is not native airplane-mode or AT evidence.

CI uploads `test-results/pwa/` as `pwa-lifecycle-evidence` on success and failure for 14 days,
including successful lifecycle/network/hash JSON evidence and first-failure traces.
`test:pwa:retry` runs the real lifecycle with one deliberate failure
after v2 is active, then requires a successful retry from v1. The outer test rejects any other
failure and checks that the first trace survives; this intentional flaky result is not counted as
an ordinary product pass. Evidence: `.reports/pwa-retry.json` and `test-results/pwa-retry/`.
CI uploads those exact paths as `pwa-retry-evidence`, on success or failure, for seven days.
The fixture endpoint and injection flag are test-only, never shipped application behavior.

Keyboard journeys traverse controls sequentially, without `locator.focus()`. The `pressTab`
helper uses native Option+Tab on macOS WebKit to include buttons; other hosts/engines use Tab.
Plain Tab/Shift+Tab still exercise modal containment. This follows WebKit's macOS keyboard
preference behavior ([upstream report](https://github.com/microsoft/playwright/issues/41808));
it does not alter system preferences or establish hardware/assistive-speech support. If the host
keyboard-navigation preferences differ, reproduce on two plain HTML buttons before diagnosing
an application regression. Never replace traversal with programmatic target focus to turn green.

`test:language-refresh` is a separate Chromium development-boundary regression. It starts an
ephemeral Vite server, simulates a provider edit in memory, and requires document and selection
preservation without Fast Refresh invalidation. It never edits source files and does not replace
the production matrix. CI runs it after browser installation, before the production journeys.

`npm run check:release` is included in `npm run check`. It runs deterministic drift fixtures, then
requires one release identity across `package.json`, the lockfile root, the README release URL, the
latest numeric release-note filename and title, and the maintenance-plan release-scope link. It
does not query GitHub: a tag and release do not exist while their candidate commit is being checked.

After a `main` artifact is deployed, GitHub Actions runs `npm run test:deployed` against the Pages
URL emitted by `actions/deploy-pages`. The isolated, cache-busted Chromium journey verifies the
Today shell, index-referenced assets, manifest icons, service-worker activation and control after
reload, one lazy Settings chunk, zero same-origin browser failures, and zero unexpected outbound
requests. Deployment failures retain a dedicated screenshot, trace, and HTML report. This gate
checks the published boundary; it does not replace the deeper local offline/update lifecycle test.

### Opt-In Live Regression Matrix

```bash
DEPLOYED_BASE_URL=https://fabian20ro.github.io/emotid/ npm run test:live
```

`playwright.live.config.ts` requires an explicit HTTP(S) target (no credentials, query or hash),
starts no local server and uses fresh browser contexts with synthetic data only. Never substitute
a persistent personal profile. It reuses existing tests, with no retries or filtered errors:

- 46 Chromium/WebKit storage/journal checks: EN/RO x light/dark malformed-date retention/recovery
  and privacy-dialog focus; journal deletion, export/reset and Romanian body details; two-tab
  erasure with/without notifications, stale exercise drafts, partial-clear retry, pending-clear
  settlement, and blocked v1 database upgrade/recovery.
- Two separate Chromium/WebKit PWA checks: registration/activation, reload control, assets,
  manifest and lazy Settings, with existing browser/network failure assertions intact.

Storage projects block service workers: their synthetic fixture navigation can interrupt pending
registration in WebKit. PWA projects explicitly allow workers; storage results alone are not
offline/PWA evidence. See the [registration investigation](webkit-registration-investigation.md).
This matrix is browser evidence, not native Safari or assistive-speech evidence.

Run the **Live regression checks** workflow manually after merging the workflow to the default
branch. It targets the public Pages URL, has read-only repository permissions and retains the
HTML report plus failure traces/screenshots for 14 days. Local artifacts use
`playwright-report/live/` and `test-results/live/`. The workflow does not deploy or replace the
automatic post-deployment smoke gate. Record the successful Pages deployment SHA separately:
the test checkout SHA and `DEPLOYED_REVISION` cache-busting token do not prove the served revision.
`npm run test:live:config` checks target validation and bounded discovery without network/browser
access; it runs in `npm run check` and PR CI.

The expanded erasure matrix requires PR A's storage lifecycle implementation on the target.
Run against a local preview before merge; run against Pages only after that revision is deployed.

The primary Playwright config stops CI after one test has exhausted its retries. This shortens red
feedback while preserving the first screenshot, trace, and HTML report. Local runs have no failure
limit, and every successful CI run still executes the complete Mobile Safari and Mobile Chrome
matrix.

`npm run check-acceptance` validates the canonical J1-J9 IDs/titles, EN/RO scope, evidence classes,
adapter registrations, Playwright test anchors, and this document. The manifest owns metadata only;
platform steps, selectors, fixtures, and lifecycle remain in their adapters.

`check-performance` reads the production Vite manifest and fails when:

- initial JavaScript exceeds 150,000 gzip bytes;
- the application entry exceeds 50,000 gzip bytes;
- production assets exceed 960,000 bytes;
- a primary feature screen is no longer a dynamic build entry.

Session presentation must remain a dynamic entry. The build's catalog-startup guard also traverses
static chunk imports and inspects Rollup's actual module ownership, rejecting the full catalog even
through a different eager importer. An empty journal must not pull the complete catalog onto
Today's critical path. Browser tests verify
that no summary request occurs without history, plus delayed/failed loading with retained data.

`test:performance` records production startup and first-open behavior for Body, Affect, Words, and
Plutchik. The JSON artifact includes transfer/decoded bytes, resource paths, long tasks, and
elapsed time. CI timing is diagnostic because shared runners do not represent physical devices.

The same performance command measures histories of 100/1,000/5,000 sessions **and** exercises,
Chromium/WebKit, EN/RO x light/dark, three isolated contexts per combination. Artifacts include
raw event-to-frame timings, summary statistics, DOM counts and available approximate heap values.
Targets are loopback-only; never run large-history seeding on Pages or a personal browser profile.
The production browser matrix separately verifies 5,000-record order, eligibility, detail/deletion,
retained drafts and complete exports. See [R20 methodology and limits](history-scale-measurements.md).
The history-pagination matrix requires bounded rows, first/middle/last access, keyboard/direct-page
navigation, visible focus from both control sets, deletion at a page boundary and cross-tab erasure.
Check both languages/themes, narrow/desktop layout and complete aggregates/exports; pagination must
not change storage semantics. Scope and evidence boundaries: [pagination contract](history-pagination.md).
Use native clocks for timing; fake clocks and missing memory APIs cannot establish performance.

## Moderated Comprehension Acceptance

Before release freeze, run the six-task local protocol in
`docs/moderated-comprehension-validation.md` with six participants. Record only aggregate,
non-identifying results in the repository. Expert walkthroughs and automated journeys establish the
preflight but cannot satisfy the participant thresholds.

Repeated comprehension failures require a bounded fix and a rerun with new participants. One
finding is sufficient when it concerns safety, privacy, accessibility, data loss, or an irreversible
action. An explicit release waiver must name any unrun or failed task and its residual risk.

## Native Desktop Safari Supporting Gate

Playwright's Mobile Safari project uses a WebKit test build, not the installed `Safari.app`. On a
Mac, run the permission-free capability check with:

```bash
npm run test:safari:native:preflight
```

After the owner explicitly enables Safari Remote Automation, run `npm run test:safari:native`.
This bounded EN/RO production audit covers Quick persistence and AI-link semantics, Word Ladder
intermediary completion, and tier-4 gating. Record it as `NATIVE_SUPPORTING_PASS`; it cannot close
an iOS VoiceOver evidence gap. See `docs/macos-native-safari-testing.md`.

## iOS Simulator Supporting Gate

Real Simulator Safari through Appium/XCUITest is stronger layout and browser evidence than
Playwright WebKit emulation. It is the project's Apple functional gate; physical iPhone testing is
outside project scope. Record rows as `SIMULATOR_SUPPORTING_PASS`, never as VoiceOver evidence.
Keep this gate opt-in and local; do not make an 8+ GB Xcode runtime a general CI requirement.

```bash
npm run test:ios:simulator:preflight
npm run test:ios:simulator
npm run test:ios:simulator:acceptance
npm run test:ios:simulator:robustness
```

The 16-row base matrix is a focused smoke gate. The 36-row acceptance matrix covers J1-J9 in EN/RO
on the named iPhone SE and iPhone 17 Pro profiles. The robustness matrix covers bounded rotation,
dark theme, 200% Page Zoom, accessibility text, focus, contrast, and visual-viewport layout risks.
See `docs/ios-simulator-testing.md`.

## Mobile Performance Acceptance

Measure on one representative mid-tier and one low-tier Android device with a cold browser cache.
Record device, OS, Chrome version, network, battery/thermal state, and three runs per journey.
Use the median for the release decision.

| Measurement | Mid-tier target | Low-tier target |
| --- | ---: | ---: |
| Cold launch to usable Today | <= 2,500 ms | <= 4,000 ms |
| First primary route open | <= 500 ms | <= 900 ms |
| Warm route return | <= 150 ms | <= 150 ms |
| Interaction-blocking task | <= 200 ms | <= 200 ms |

If a target fails, profile that journey before changing code. Do not replace timing evidence with
bundle-size inference.

Record all three raw runs, medians, environment details, and artifact references in
`docs/physical-release-evidence.md`. Run against the exact deployed commit being released.

## Android Assistive-Technology Acceptance

Playwright cannot validate synthesized speech, rotor/local-context navigation, or screen-reader
gestures. Physical iPhone and VoiceOver testing is not part of this project's release scope. Run
J1-J9 with TalkBack and Chrome on Android, in English and Romanian, in browser and installed PWA:

```bash
npm run test:android:physical:preflight
```

The preflight must report one unlocked authorized device, the intended WebAPK when installed mode
is selected, and the actual TalkBack/input capabilities. It creates no evidence. A later CDP-driven
journey remains `SUPPORTING_PASS` even when TalkBack happens to be enabled; only retained physical
speech/focus/activation evidence can receive `PASS` or `BOUNDED_PASS`.

1. First-run introduction: every step title, explanation, and progress announced once and in order.
2. Settings replay: background unavailable, dialog bounded, swipe navigation trapped, Close returns
   to the exact replay trigger.
3. Affect route: destination heading announced, field instructions discoverable, suggestions
   announced after placement.
4. Body Compass: Front, Back, and List modes are distinguishable; list regions are operable; the
   saved signal receives focus; edit, remove, add-another, evidence, and completion remain
   discoverable without duplicate map/list announcements.
5. Word Ladder: intermediary word and both decisions announced; direct completion receives focus.
6. Save recovery: pending status is polite, failure is announced once, Retry receives normal focus.
7. Browser history and Journal deletion: Back/Forward restore exact destinations; deleting one
   entry returns focus to the Journal without reviving stale routes.
8. Tier-4 support fixture: safety message precedes resources; reflection remains unavailable before
   acknowledgment; resource labels and links are actionable.
9. Reflection disclosure: inferred needs and AI are absent from the compact result; direct finish
   and optional exploration remain discoverable; exploration receives focus and Back restores it
   to the disclosure trigger.

Record:

| Field | Value |
| --- | --- |
| Device / OS / browser | |
| Assistive technology version | |
| Journey and language | |
| Spoken order | |
| Duplicate or missing speech | |
| Focus/gesture defect | |
| Pass/fail and evidence | |

Fix only reproduced defects. Add the closest browser-observable regression without claiming that it
tests synthesized speech. This gate remains open until the Android browser and installed rows pass.

Result classes:

- `PASS`: the required physical assistive technology performed navigation, speech, and activation.
- `BOUNDED_PASS`: a named physical checkpoint passed, but not the complete journey.
- `AUTOMATED_PASS`: deterministic browser automation passed; no native, hardware, or
  assistive-technology claim.
- `SUPPORTING_PASS`: real device/browser behavior passed through DevTools or another input that
  bypassed the required assistive technology.
- `NATIVE_SUPPORTING_PASS`: an installed desktop browser passed; no mobile or assistive-technology claim.
- `SIMULATOR_SUPPORTING_PASS`: real Simulator browser behavior passed; no physical-device claim.
- `BLOCKED`: the environment prevented a valid run; never reinterpret as an application failure.
- `FAIL`: a requirement failed on the exact intended environment and candidate.

Use `docs/physical-release-evidence.md` as the release record. It contains the complete language,
browser/installed-mode matrix, performance table, evidence fields, and temporary DevTools-only save
failure fixture.
