# Release Quality Gates

## Automated Gates

Run before release:

```bash
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

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

## Native Desktop Safari Supporting Gate

Playwright's Mobile Safari project uses a WebKit test build, not the installed `Safari.app`. On a
Mac, run the permission-free capability check with:

```bash
npm run test:safari:native:preflight
```

After the owner explicitly enables Safari Remote Automation, run `npm run test:safari:native`.
This bounded EN/RO production audit covers Quick persistence and AI-link semantics, Word Ladder
intermediary completion, and tier-4 gating. Record it as `NATIVE_SUPPORTING_PASS`; it cannot close
the mobile VoiceOver/Safari release gate. See `docs/macos-native-safari-testing.md`.

## iOS Simulator Supporting Gate

Real Simulator Safari through Appium/XCUITest is stronger layout and browser evidence than
Playwright WebKit emulation, but it does not replace a physical iPhone or physical VoiceOver.
Record functional rows as `SIMULATOR_SUPPORTING_PASS`. Keep this gate opt-in and local; do not make
an 8+ GB Xcode runtime a general CI requirement.

```bash
npm run test:ios:simulator:preflight
npm run test:ios:simulator
npm run test:ios:simulator:robustness
```

The base matrix covers Quick, Word intermediary completion, local save recovery, and tier-4 gating
in EN/RO on the named iPhone SE and iPhone 17 Pro profiles. The robustness matrix covers bounded
rotation, dark theme, 200% Page Zoom, accessibility text, focus, contrast, and visual-viewport
layout risks. See `docs/ios-simulator-testing.md`.

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

## Physical Assistive-Technology Acceptance

Playwright cannot validate synthesized speech, rotor/local-context navigation, or screen-reader
gestures. Complete both combinations:

1. VoiceOver with Safari on a physical iPhone.
2. TalkBack with Chrome on Android.

For each combination, run J1-J9 in English and Romanian, in Safari/Chrome and the installed PWA:

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
tests synthesized speech. This gate remains open until both physical combinations pass.

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
