# Physical Release Evidence

Use one completed copy of this document per release candidate. Browser automation is supporting
evidence only: it cannot pass the physical assistive-technology or Android performance gates.

## Candidate

| Field | Value |
| --- | --- |
| Status | OPEN |
| Commit SHA | |
| Production URL | |
| Tested build/version | |
| Tester | |
| Test dates | |
| Automated workflow URL | |
| Automated artifact name | |

Release decision: `PASS` only when every required row below passes or has a linked, accepted defect
disposition. Record failures as observed; do not reinterpret missing evidence as a pass.

## Device Inventory

| ID | Device | OS | Browser/version | Assistive technology/version | Installed PWA or browser | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Apple | | | Safari | VoiceOver | Both | |
| Android AT | | | Chrome | TalkBack | Both | |
| Android mid | | | Chrome | Not required | Browser | |
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
| Android / TalkBack | EN | Browser | | | | | | | | | |
| Android / TalkBack | RO | Browser | | | | | | | | | |
| Android / TalkBack | EN | Installed | | | | | | | | | |
| Android / TalkBack | RO | Installed | | | | | | | | | |

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

### Journey Observations

Add one row for each matrix failure and for any pass needing evidence beyond the matrix.

| Device/language/mode | Journey | Spoken order | Focus/gesture behavior | Duplicate/missing speech | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Evidence can be a timestamped screen recording, audio recording, screenshot, or exact written
transcript. Do not record private journal content.

## Android Performance

Use the production candidate, a cold browser cache for cold launch/first route, and three runs per
measurement. Disable recording between runs, close unrelated apps, and repeat a run affected by an
OS update, thermal warning, incoming call, or accidental gesture. Use the median, not the best run.

| Device | Measurement | Run 1 ms | Run 2 ms | Run 3 ms | Median ms | Target ms | Result/evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mid | Cold launch to usable Today | | | | | 2500 | |
| Mid | First Body open | | | | | 500 | |
| Mid | First Affect open | | | | | 500 | |
| Mid | First Words open | | | | | 500 | |
| Mid | First Plutchik open | | | | | 500 | |
| Mid | Warm route return, worst case | | | | | 150 | |
| Mid | Longest interaction-blocking task | | | | | 200 | |
| Low | Cold launch to usable Today | | | | | 4000 | |
| Low | First Body open | | | | | 900 | |
| Low | First Affect open | | | | | 900 | |
| Low | First Words open | | | | | 900 | |
| Low | First Plutchik open | | | | | 900 | |
| Low | Warm route return, worst case | | | | | 150 | |
| Low | Longest interaction-blocking task | | | | | 200 | |

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
| Automated workflow | | |
| VoiceOver / Safari | | |
| TalkBack / Chrome | | |
| Installed PWA | | |
| Mid-tier Android performance | | |
| Low-tier Android performance | | |
| Open release-blocking defects | | |

Final decision and rationale:
