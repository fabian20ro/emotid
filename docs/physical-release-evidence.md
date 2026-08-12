# Physical Release Evidence

Use one completed copy of this document per release candidate. Browser automation is supporting
evidence only: it cannot pass the physical assistive-technology or Android performance gates.

## Candidate

| Field | Value |
| --- | --- |
| Status | PARTIAL - Android profile complete; full AT and low-tier gates open |
| Commit SHA | `ce9f3b6c0e59500347d26e822e5965b9413a11ae` |
| Production URL | `https://fabian20ro.github.io/emotid/` |
| Tested build/version | `index-DhlYI_OF.js`; `index-BqNKVqyQ.css` (exact local production-build match) |
| Tester | Codex, supervised by repository owner |
| Test dates | 2026-08-04 |
| Automated workflow URL | `https://github.com/fabian20ro/emotid/actions/runs/30890866852` (`Push on main`, successful) |
| Automated artifact name | None published by this workflow |

Release decision: `PASS` only when every required row below passes or has a linked, accepted defect
disposition. Record failures as observed; do not reinterpret missing evidence as a pass.

## Device Inventory

| ID | Device | OS | Browser/version | Assistive technology/version | Installed PWA or browser | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Apple | | | Safari | VoiceOver | Both | |
| Android AT | Google Pixel 6a | Android 15 / API 35 / `BP1A.250505.005` | Chrome 150.0.7871.187 | TalkBack 17.0.1 | Both | 1080x2400; CSS 411px; DPR 2.625; font scale 1.0 |
| Android mid | Google Pixel 6a | Android 15 / API 35 / `BP1A.250505.005` | Chrome 150.0.7871.187 | Not required | Browser | AC powered; 100% battery; 29.8 C; default motion and display scaling |
| Android low | | | Chrome | Not required | Browser | |

Record display/text scaling, zoom, reduced motion, network, battery state, and thermal state when
they differ from defaults. The Android performance devices must be representative mid-tier and
low-tier hardware, not desktop emulation.

## Assistive-Technology Matrix

Run all eight journeys in English and Romanian on both physical combinations. Use a clean browser
profile for first-run journeys. Run the remaining journeys in both browser and installed-PWA mode;
one mode may be marked not applicable only with a reason.

| Device | Language | Mode | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apple / VoiceOver | EN | Browser | | | | | | | | | |
| Apple / VoiceOver | RO | Browser | | | | | | | | | |
| Apple / VoiceOver | EN | Installed | | | | | | | | | |
| Apple / VoiceOver | RO | Installed | | | | | | | | | |
| Android / TalkBack | EN | Browser | P | S | S | S | S | S | S | S | PARTIAL |
| Android / TalkBack | RO | Browser | S | S | S | S | S | S | S | S | SUPPORTING ONLY |
| Android / TalkBack | EN | Installed | S | S | S | S | S | S | S | S | SUPPORTING ONLY |
| Android / TalkBack | RO | Installed | S | S | S | S | S | S | S | S | SUPPORTING ONLY |

`S` means the physical Chrome process passed the functional journey and exposed the expected
accessibility tree, but controls were activated through DevTools. `P` adds a genuine TalkBack
external-keyboard focus pilot but is still short of the complete spoken/gesture journey.

### Required Journeys

1. **J1 First run:** step title, explanation, language choice, and progress are announced once and
   in order. Next/Close labels match the action. Focus never enters hidden content.
2. **J2 Settings replay:** replay opens over inert Settings, swipe navigation stays inside, Close
   returns to the exact trigger, and saved language/theme/privacy choices remain unchanged.
3. **J3 Affect Map:** route heading and placement instructions are announced; pointer/keyboard
   placement reveals suggestions; selection and Continue remain discoverable.
4. **J4 Body Compass:** Front, Back, and List are distinguishable; list regions are operable; the
   saved signal receives focus; edit, remove, add-another, evidence, and completion are announced
   without duplicate map/list content.
5. **J5 Word Ladder:** each intermediary word and both decisions are announced; direct completion
   focuses `Continue with {word}`.
6. **J6 Save recovery:** pending status is polite; one simulated failure is announced once; Retry
   receives normal focus; retry preserves one journal entry rather than duplicating it.
7. **J7 History and Journal:** browser Back/Forward restore exact screens; reset does not revive an
   abandoned route; delete Cancel returns to its trigger; successful delete returns to Journal.
8. **J8 Tier-4 support:** the safety message precedes resources; reflection details remain
   unavailable before acknowledgment; support links are actionable and not redundantly announced.
9. **J9 Reflection disclosure:** the compact result keeps inferred needs and AI absent, direct
   finish and exploration stay in the first viewport, exploration focuses its heading, and Back
   restores focus to the disclosure trigger.

### Journey Observations

Add one row for each matrix failure and for any pass needing evidence beyond the matrix.

| Device/language/mode | Journey | Spoken order | Focus/gesture behavior | Duplicate/missing speech | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Android / EN / Browser | J1 first screen | TalkBack requested accessibility speech while focus moved from heading to explanation; no retained audio transcript | Real AOA USB keyboard; green TalkBack focus moved in document order | Not fully assessed | `.reports/android-physical/2026-08-04T15-23-00-talkback-pilot/` | PARTIAL |
| Android / EN+RO / Browser | J1-J8 | Not assessed by direct speech capture | Physical Chrome, direct DevTools activation, accessibility snapshots and device screenshots | Not assessed | `.reports/android-physical/2026-08-04T20-04-02-041Z-browser/` | SUPPORTING PASS |
| Android / EN+RO / Installed | J1-J8 | Not assessed by direct speech capture | Installed WebAPK, standalone display mode, direct DevTools activation, accessibility snapshots and device screenshots | Not assessed | `.reports/android-physical/2026-08-04T20-03-14-228Z-installed/` | SUPPORTING PASS |
| Pixel 6a / EN+RO / Browser | J9 local P25 candidate | Not assessed by direct speech capture | Physical Chrome `411x808`; default/exploration DOM, viewport geometry, heading focus, and focus return verified through DevTools | Not assessed | `.reports/android-physical/2026-08-05T04-48-27-416Z-browser/` | SUPPORTING PASS |

Evidence can be a timestamped screen recording, audio recording, screenshot, or exact written
transcript. Do not record private journal content.

## Android Performance

Use the production candidate, a cold browser cache for cold launch/first route, and three runs per
measurement. Disable recording between runs, close unrelated apps, and repeat a run affected by an
OS update, thermal warning, incoming call, or accidental gesture. Use the median, not the best run.

| Device | Measurement | Run 1 ms | Run 2 ms | Run 3 ms | Median ms | Target ms | Result/evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mid | Cold launch to usable Today | 1173 | 935 | 1162 | 1162 | 2500 | PASS |
| Mid | First Body open | 393.0 | 127.3 | 295.2 | 295.2 | 500 | PASS |
| Mid | First Affect open | 224.5 | 126.0 | 239.1 | 224.5 | 500 | PASS |
| Mid | First Words open | 217.6 | 119.2 | 228.8 | 217.6 | 500 | PASS |
| Mid | First Plutchik open | 349.0 | 142.8 | 349.2 | 349.0 | 500 | PASS |
| Mid | Warm route return, worst case | 40.4 | 38.6 | 41.1 | 40.4 | 150 | PASS |
| Mid | Longest interaction-blocking task | 0 | 0 | 0 | 0 | 200 | PASS |
| Low | Cold launch to usable Today | | | | | 4000 | |
| Low | First Body open | | | | | 900 | |
| Low | First Affect open | | | | | 900 | |
| Low | First Words open | | | | | 900 | |
| Low | First Plutchik open | | | | | 900 | |
| Low | Warm route return, worst case | | | | | 150 | |
| Low | Longest interaction-blocking task | | | | | 200 | |

Mid-tier raw MP4 recordings, Chrome traces, Perfetto traces, screenshots, and the JSON report are
under `.reports/android-physical/2026-08-04T20-04-49-869Z-browser/`. Recording did not change
the measured intervals; Chrome trace timestamps own route timing and Perfetto supplies device-level
startup evidence.

For elapsed time, record a Chrome DevTools Performance trace or a 60 fps screen recording from the
initiating action until the destination is visible and operable. For blocking time, inspect the
same trace's main-thread tasks. Preserve the three raw recordings with the completed evidence.

## Temporary Failure Fixtures

Use remote Safari Web Inspector or Chrome DevTools on the physical device. These console-only
fixtures change the current page runtime; reload restores normal behavior. Never add them to the
production application or a query parameter.

### Fail the next local save once

Run before starting J6:

```javascript
(() => {
  const originalPut = IDBObjectStore.prototype.put
  let failuresRemaining = 1
  IDBObjectStore.prototype.put = function (...args) {
    if (failuresRemaining > 0) {
      failuresRemaining -= 1
      throw new DOMException('Simulated local save failure', 'QuotaExceededError')
    }
    return Reflect.apply(originalPut, this, args)
  }
})()
```

### Reach tier-4 support without stored fixtures

For J8, use Words and select `Sad` -> `Despair`, then `Add Despair`; select
`Sad` -> `Depressed` -> `Empty`; select `Fearful` -> `Weak` -> `Worthless`; then continue with the
three selected words. Use the corresponding localized labels in Romanian. Do not infer the
tester's real state from this fixture and do not save personal notes during the journey.

## Defect Disposition

| ID | Device/language/mode | Journey/metric | Reproduction | Severity | Regression test | Commit/issue | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

For each failure: reproduce on the named physical combination, reduce it to the smallest stable
case, add the closest browser-observable regression, fix the production behavior, rerun the full
automated gates, then retest the same physical row. A browser test may support the fix but may not
replace physical speech, gesture, installed-PWA, or hardware-timing evidence.

## Sign-Off

| Gate | Result | Evidence |
| --- | --- | --- |
| Automated workflow | PASS | `Push on main` run `30890866852`, exact candidate SHA, successful |
| VoiceOver / Safari | OPEN | Apple device not tested |
| TalkBack / Chrome | PARTIAL | Full supporting matrix plus one genuine focus-order pilot; spoken/gesture matrix open |
| Installed PWA | SUPPORTING PASS | All J1-J8 in EN/RO; genuine TalkBack interaction matrix open |
| Mid-tier Android performance | PASS | Pixel 6a three-run traces and recordings |
| Low-tier Android performance | OPEN | A distinct representative low-tier device is still required |
| Open release-blocking defects | NONE REPRODUCED | Open evidence gates remain release-blocking |

Final decision and rationale: **NOT READY FOR PHYSICAL SIGN-OFF.** The tested Pixel 6a profile has
no reproduced functional or performance defect. VoiceOver/Safari, the complete retained TalkBack
speech/gesture matrix, and a distinct low-tier Android performance profile remain required.

## Android 17 Word Ladder Supplement - 2026-08-07

Candidate `f59e5175cd7663a70fca2f74fd489878c9e8904a` was retested after the Pixel 6a
upgrade to Android 17 / API 37 (`CP2A.260705.006`) with Chrome 150.0.7871.187 and TalkBack 17.0.1.

| Scope | EN | RO | Evidence | Result |
| --- | --- | --- | --- | --- |
| Browser J1-J9, DevTools activation | 9/9 | 9/9 | `.reports/android-physical/2026-08-07T17-26-42-635Z-browser/` | SUPPORTING PASS |
| Installed WebAPK J5, DevTools activation | 1/1 | 1/1 | `.reports/android-physical/2026-08-07T17-29-52-388Z-installed/` | SUPPORTING PASS |
| Browser J5, AOA keyboard + TalkBack speech | PASS | PASS | `.reports/android-physical/2026-08-07T17-32-00-talkback-word-ladder/` | PASS |

For real TalkBack J5, physical `Shift+Tab` / `Tab` returned to the direct intermediary action,
visible speech output retained its name and specificity description, and TalkBack `Action+Space`
completed to Reflection. The result closes only browser-mode J5 in both languages. The installed
TalkBack row, remaining journeys, VoiceOver/Safari, and distinct low-tier Android remain open.

## P30 Android 17 Registry and TalkBack Supplement - 2026-08-07

Candidate `14b38dafe6804ace3cb02409326323d8da46fcb5` was tested on Pixel 6a, Android
17 / API 37 (`CP2A.260705.006`), Chrome 150.0.7871.187, and TalkBack 17.0.1. The
journey harness used the extracted import-safe J1-J9 registry.

| Scope | EN | RO | Evidence | Result |
| --- | --- | --- | --- | --- |
| Browser J1-J9, DevTools activation | 9/9 | 9/9 | `.reports/android-physical/2026-08-07T20-37-23-460Z-browser/` | SUPPORTING PASS |
| Installed WebAPK J1-J9, DevTools activation | 9/9 | 9/9 | `.reports/android-physical/2026-08-07T20-38-23-776Z-installed/` | SUPPORTING PASS |
| Installed WebAPK J5, TalkBack AOA keyboard | PASS | PASS | `.reports/android-physical/2026-08-07T19-45-00-p30-talkback-installed/` | PASS |
| Installed WebAPK J6 retry checkpoint, TalkBack AOA keyboard | PASS | PASS | `.reports/android-physical/2026-08-07T20-40-00-p30-talkback-checkpoints/` | BOUNDED PASS |
| Installed WebAPK J8 resource-order checkpoint, TalkBack AOA keyboard | PASS | PASS | `.reports/android-physical/2026-08-07T20-40-00-p30-talkback-checkpoints/` | BOUNDED PASS |
| Browser J8 foreground-focus attempt | BLOCKED | NOT RUN | `.reports/android-physical/2026-08-07T20-40-00-p30-talkback-checkpoints/browser-en-j8-sequence.json` | HARNESS BLOCKED |

Installed J5 used physical `Shift+Tab` / `Tab`, retained the direct intermediate action plus its
specificity description in visible TalkBack speech, and used TalkBack `Action+Space` to reach
Reflection. J6 moved from the focused failure alert to Retry in one physical Tab; activation
returned to Today with exactly one saved entry. J8 exposed the two support links before Continue
in physical Tab order; activating Continue disclosed Reflection. The EN and RO captures retain the
focused control, visible speech output, and post-activation screen.

The browser J8 attempt began at the alert heading, but physical Tab moved into Chrome UI while the
page DOM focus remained unchanged. A later J5 attempt also showed that the CDP-selected target and
the physically visible Chrome tab could diverge. These are harness limitations, not application
failures. DevTools activation was not substituted for genuine TalkBack evidence. Browser J5/J6/J8
on this exact candidate and genuine J1-J4/J7/J9 rows therefore remain open, along with
VoiceOver/Safari and a distinct low-tier Android profile.

## P31 Foreground Target Supplement - 2026-08-09

Candidate `b41bd0accf008f02da04f4bff2bfe98b67313af5` received one bounded foreground-target
check on Pixel 6a before the device became unavailable. The harness launched a unique browser URL,
selected the exact non-standalone CDP page, and independently found the same token in Chrome's
native URL bar.

| Scope | EN | RO | Evidence | Result |
| --- | --- | --- | --- | --- |
| Browser J5, exact native foreground + DevTools activation | PASS | PASS | `.reports/android-physical/2026-08-07T21-44-25-934Z-browser/` | SUPPORTING PASS |

The report records `foregroundVerified: true`, browser display mode, Android 17 / API 37, and
TalkBack disabled. It therefore resolves the stale-CDP-target ambiguity only; it does not close a
TalkBack row. After removal of the Android device, all unexecuted TalkBack, installed-WebAPK, and
hardware-performance rows remain `NOT RUN` and deferred. The Mac-only Chromium/WebKit regression
suite cannot change those classifications.

## P32 macOS Native Safari Execution - 2026-08-12

The owner enabled Safari Remote Automation. The native session ran on macOS 26.6.1 with Safari
26.6 (`21624.4.5.11.5`). Full Xcode and an iOS Simulator remain unavailable.

| Scope | EN | RO | Evidence | Result |
| --- | --- | --- | --- | --- |
| Installed desktop Safari, Quick / Word intermediary / tier-4 | 3/3 | 3/3 | `.reports/macos-safari/2026-08-12T10-50-48-602Z/` | NATIVE SUPPORTING PASS |
| macOS VoiceOver with installed Safari | NOT RUN | NOT RUN | Native browser baseline only | OPEN |

The native runner does not call `safaridriver --enable` or change Accessibility permissions.
Quick persistence and the gated `udm=50` AI handoff, Word Ladder intermediary completion, and
tier-4 gating passed in both languages across light and dark themes. This remains desktop
supporting evidence and does not close macOS VoiceOver or the Apple mobile VoiceOver/Safari matrix.

## P33 Pixel 6a Resumed Browser and TalkBack Supplement - 2026-08-12

Candidate `23e0c05c879568407abe9b9eac1761a0bd60a34a` was exercised on Pixel 6a, Android 17 /
API 37 (`CP2A.260705.006`), Chrome 151, and TalkBack 17.0.1. The deployed candidate's primary
JavaScript and CSS asset names matched the local production build before the local TalkBack row.

| Scope | EN | RO | Evidence | Result |
| --- | --- | --- | --- | --- |
| Deployed browser J5, exact native foreground + DevTools activation | PASS | PASS | `.reports/android-physical/2026-08-12T10-52-54-317Z-browser/` | SUPPORTING PASS |
| Deployed browser J6, exact native foreground + DevTools activation | PASS | PASS | `.reports/android-physical/2026-08-12T10-53-18-107Z-browser/` | SUPPORTING PASS |
| Deployed browser J8, exact native foreground + DevTools activation | PASS | PASS | `.reports/android-physical/2026-08-12T10-53-35-749Z-browser/` | SUPPORTING PASS |
| Matching local build browser J5, TalkBack AOA keyboard | PASS | PASS | `.reports/android-physical/2026-08-12T11-05-00-talkback-j5-local/` | PASS |

For genuine J5, TalkBack focus named `Continue with Playful` / `Continuați cu Jucăuș` and exposed
the more-specific alternative as its hint. Physical `Right Alt+Space` activated the direct
intermediary action, then visible speech output and Android focus named the Reflection heading in
both languages. The host used a Windows-layout keyboard on macOS; Right Alt, not Left Alt, mapped
to the TalkBack Action modifier through AOA. `scrcpy --mouse=disabled` prevented pointer hover from
moving accessibility focus. This closes only the bounded J5 browser row; J6, J8, and the remaining
journeys still require genuine TalkBack navigation and activation.
