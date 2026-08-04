# Release Quality Gates

## Automated Gates

Run before release:

```bash
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
```

`check-performance` reads the production Vite manifest and fails when:

- initial JavaScript exceeds 150,000 gzip bytes;
- the application entry exceeds 50,000 gzip bytes;
- production assets exceed 960,000 bytes;
- a primary feature screen is no longer a dynamic build entry.

`test:performance` records production startup and first-open behavior for Body, Affect, Words, and
Plutchik. The JSON artifact includes transfer/decoded bytes, resource paths, long tasks, and
elapsed time. CI timing is diagnostic because shared runners do not represent physical devices.

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

1. VoiceOver with Safari on an Apple device.
2. TalkBack with Chrome on Android.

For each combination, run every journey in English and Romanian, in Safari/Chrome and the installed
PWA:

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

Use `docs/physical-release-evidence.md` as the release record. It contains the complete language,
browser/installed-mode matrix, performance table, evidence fields, and temporary DevTools-only save
failure fixture.
