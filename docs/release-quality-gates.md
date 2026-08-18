# Release Quality Gates

## Automated Gates

Run before release:

```bash
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
npm run test:deployed:local
```

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

`test:performance` records production startup and first-open behavior for Body, Affect, Words, and
Plutchik. The JSON artifact includes transfer/decoded bytes, resource paths, long tasks, and
elapsed time. CI timing is diagnostic because shared runners do not represent physical devices.

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
