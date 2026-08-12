# Physical And Native Release Evidence

This file records current evidence, not requirements. The normative J1-J9 journeys, result classes,
and performance thresholds live in `docs/release-quality-gates.md`. Historical detail remains in
Git and `ITERATION_LOG.md`.

Supporting browser, desktop, and Simulator results cannot replace physical assistive-technology or
hardware-performance gates.

## Current Target

| Field | Value |
| --- | --- |
| Planning SHA | working tree from `32a3d708c4e6164805d961739bf2cabb835b3505` |
| Candidate status | NOT FROZEN; physical rows were run on earlier named SHAs |
| Production URL | `https://fabian20ro.github.io/emotid/` |
| Latest automated workflow | `Push on main` run `31591341181`, successful |
| Test date | 2026-08-12 |
| Current decision | NOT READY FOR PHYSICAL SIGN-OFF |

Freeze one SHA before final sign-off. Previous results remain useful regression evidence but do not
automatically pass a later exact candidate.

## Environment Inventory

| ID | Environment | Browser / automation | Assistive technology | Role |
| --- | --- | --- | --- | --- |
| Mac Safari | Mac Studio, macOS 26.6.1 | Safari 26.6, SafariDriver | VoiceOver available, not run | Native desktop supporting |
| iOS SE | iOS 26.5 Simulator, iPhone SE 3 | Mobile Safari, Appium 3.6, XCUITest 12.3.1 | VoiceOver not run | Compact Simulator supporting |
| iOS 17 Pro | iOS 26.5 Simulator, iPhone 17 Pro | Mobile Safari, Appium 3.6, XCUITest 12.3.1 | VoiceOver not run | Modern Simulator supporting |
| Android AT / mid | Pixel 6a, Android 17 / API 37 | Chrome 151, browser + installed WebAPK | TalkBack 17.0.1 | Physical AT and mid-tier performance |
| Apple physical | Not available | Safari + installed PWA required | VoiceOver required | Open release gate |
| Android low | Not available | Chrome required | Not required | Open performance gate |

Record exact OS/browser/AT version, viewport, display/text scaling, motion, network, battery, and
thermal differences for every final-candidate physical run.

## Automated Baseline

| Scope | Result | Evidence |
| --- | --- | --- |
| Lint, unit/integration, acceptance contract, i18n, psychological copy, build, budgets | AUTOMATED_PASS | `npm run check`: 81 files / 642 tests |
| Mobile Safari + Mobile Chrome browser matrix | AUTOMATED_PASS | `npm run test:e2e`: 212/212 |
| Production offline/update/data-retention lifecycle | AUTOMATED_PASS | `npm run test:pwa` |
| Production browser performance probe | AUTOMATED_PASS | `npm run test:performance` |
| Latest GitHub workflow | PASS | Run `31591341181` |

These results validate browser-observable behavior. They do not validate synthesized speech,
screen-reader gestures, installed mobile UI, or low-tier hardware timing.

## Retained Native And Physical Evidence

| Candidate | Environment | Scope | Result | Evidence |
| --- | --- | --- | --- | --- |
| working tree from `ad38399c` | macOS Safari 26.6 | Quick + AI link, Word intermediary, tier-4; EN/RO, light/dark | NATIVE_SUPPORTING_PASS, 6/6 | `.reports/macos-safari/2026-08-12T17-59-15-941Z/` |
| working tree from `ad38399c` | iOS 26.5 Simulator SE + 17 Pro | Quick, Word intermediary, save recovery, tier-4; EN/RO; exact local assets | SIMULATOR_SUPPORTING_PASS, 16/16 | `.reports/ios-simulator/2026-08-12T18-02-37-977Z/` |
| working tree from `32a3d708` | iOS 26.5 Simulator SE + 17 Pro | P36 onboarding focus, landscape, dark theme, 200% Page Zoom plus accessibility text; exact local assets | SIMULATOR_SUPPORTING_PASS, 6/6 | `.reports/ios-simulator/2026-08-12T19-20-05-175Z/` |
| working tree from `32a3d708` | iOS 26.5 Simulator SE + 17 Pro | Quick, Word intermediary, save recovery, tier-4; EN/RO; post-P36 regression | SIMULATOR_SUPPORTING_PASS, 16/16 | `.reports/ios-simulator/2026-08-12T19-23-51-726Z/` |
| working tree from `32a3d708` | macOS Safari 26.6 | Quick + AI link, Word intermediary, tier-4; EN/RO, light/dark; post-P36 regression | NATIVE_SUPPORTING_PASS, 6/6 | `.reports/macos-safari/2026-08-12T19-26-58-249Z/` |
| `14b38daf` | Pixel 6a, browser + installed | J1-J9 EN/RO through DevTools | SUPPORTING_PASS, 36/36 | `.reports/android-physical/2026-08-07T20-37-23-460Z-browser/`; `.reports/android-physical/2026-08-07T20-38-23-776Z-installed/` |
| `14b38daf` | Pixel 6a, installed TalkBack | J5 complete; J6 retry and J8 support-order checkpoints; EN/RO | PASS / BOUNDED_PASS | `.reports/android-physical/2026-08-07T19-45-00-p30-talkback-installed/`; `.reports/android-physical/2026-08-07T20-40-00-p30-talkback-checkpoints/` |
| `23e0c05c` | Pixel 6a, browser TalkBack | J5 speech, AOA focus, activation, Reflection focus; EN/RO | PASS | `.reports/android-physical/2026-08-12T11-05-00-talkback-j5-local/` |
| `23e0c05c` | Pixel 6a, browser | J5/J6/J8 EN/RO with exact CDP + native foreground proof | SUPPORTING_PASS, 6/6 | `.reports/android-physical/2026-08-12T10-52-54-317Z-browser/`; `.reports/android-physical/2026-08-12T10-53-18-107Z-browser/`; `.reports/android-physical/2026-08-12T10-53-35-749Z-browser/` |
| `f59e5175` | Pixel 6a, Android 17 | Three-run mid-tier production timing | PASS | `.reports/android-physical/2026-08-07T17-26-42-635Z-browser/` and retained timing artifacts |

P35/P36 reproduced and fixed four focus/reflow product defects. The final native matrices expose no
unresolved functional or performance product defect. Simulator installed-PWA and VoiceOver probes
remain blocked by evidence capability, not application behavior.

## Current Physical Matrix

Blank rows are open for the future frozen candidate. Do not copy a result from an earlier SHA
without an explicit equivalence decision in the final sign-off.

| Device | Language | Mode | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | J9 | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Physical iPhone / VoiceOver | EN | Browser | | | | | | | | | | OPEN |
| Physical iPhone / VoiceOver | RO | Browser | | | | | | | | | | OPEN |
| Physical iPhone / VoiceOver | EN | Installed | | | | | | | | | | OPEN |
| Physical iPhone / VoiceOver | RO | Installed | | | | | | | | | | OPEN |
| Pixel 6a / TalkBack | EN | Browser | | | | | prior pass | | | | | OPEN FOR FROZEN SHA |
| Pixel 6a / TalkBack | RO | Browser | | | | | prior pass | | | | | OPEN FOR FROZEN SHA |
| Pixel 6a / TalkBack | EN | Installed | | | | | prior pass | prior checkpoint | | prior checkpoint | | OPEN FOR FROZEN SHA |
| Pixel 6a / TalkBack | RO | Installed | | | | | prior pass | prior checkpoint | | prior checkpoint | | OPEN FOR FROZEN SHA |

## Android Performance

### Retained Mid-Tier Baseline

Pixel 6a on Android 17 passed the later P29 profile: cold startup median `1,440 ms`; Body
`207.2 ms`; Affect `120.1 ms`; Words `219.4 ms`; Plutchik `130.2 ms`; worst warm return `41.5 ms`; longest
observed task `53 ms`.

### Final-Candidate Matrix

| Device | Measurement | Run 1 ms | Run 2 ms | Run 3 ms | Median ms | Target ms | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mid | Cold launch to usable Today | | | | | 2500 | OPEN |
| Mid | First primary route, worst case | | | | | 500 | OPEN |
| Mid | Warm route return, worst case | | | | | 150 | OPEN |
| Mid | Longest interaction-blocking task | | | | | 200 | OPEN |
| Low | Cold launch to usable Today | | | | | 4000 | OPEN |
| Low | First primary route, worst case | | | | | 900 | OPEN |
| Low | Warm route return, worst case | | | | | 150 | OPEN |
| Low | Longest interaction-blocking task | | | | | 200 | OPEN |

Use three production runs and medians. Preserve raw recordings/traces. Do not relabel the Pixel 6a
as both mid- and low-tier evidence.

## Controlled Fixtures

Fixtures are test input, never statements about the tester. Do not save personal notes.

### J6 Save Failure

Use Web Inspector/DevTools to fail the next local IndexedDB `put`, then reload after the journey to
restore the normal runtime:

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

### J8 Tier-4 Support

In Words, select `Sad -> Despair`, `Sad -> Depressed -> Empty`, and
`Fearful -> Weak -> Worthless`; continue with those three words. Use localized labels in Romanian.

Never expose these fixtures through production query parameters or application controls.

## Defect Disposition

| ID | Candidate / environment | Journey | Reproduction | Severity | Regression | Fix / issue | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P35-FOCUS-1 | working tree from `ad38399c`; both iOS profiles | J8 tier-4 | Acknowledgment removed its button and left no focused destination | High accessibility | `ReflectionScreen.test.tsx`; `crisis-routes.spec.ts` | Focus the newly revealed result heading | J8 4/4; base matrix 16/16 |
| P36-OUTLINE-1 | working tree from `32a3d708`; SE Safari | J1 onboarding | Programmatically focused noninteractive heading showed Safari's blue outline | Medium accessibility / visual | `Onboarding.test.tsx`; `accessibility-acceptance.spec.ts` | Suppress outline only for the programmatic onboarding heading | P36 onboarding 1/1; robustness 6/6 |
| P36-REFLOW-1 | working tree from `32a3d708`; SE Safari at 200% | Quick and J8 | Global 320px body minimum forced 132px horizontal overflow in a 188px visual viewport | High accessibility | compact 200% `accessibility-acceptance.spec.ts` | Remove the obsolete body minimum width | P36 text rows 2/2; Playwright 212/212 |
| P36-FOCUS-1 | working tree from `32a3d708`; SE Safari at 200% | Quick and J8 | Focus moved correctly in the DOM but the destination remained clipped outside `visualViewport` | High accessibility | `focusDestination.test.ts`; compact 200% Playwright | Shared focus destination reveals only clipped headings | P36 text rows 2/2; base 16/16 |

For a failure: retain evidence, reproduce on the intended environment, reduce to the smallest
stable case, add the closest deterministic browser regression, fix, rerun automated gates, and
retest the same native row. Record environment blocks separately from application failures.

## Open Release Gates

| Gate | Status | Closure condition |
| --- | --- | --- |
| Exact-candidate automated baseline | OPEN AFTER FREEZE | All automated commands pass on frozen SHA |
| iOS Simulator browser matrix | BASE + ROBUSTNESS SIMULATOR_SUPPORTING_PASS | Rerun on frozen candidate |
| Simulator installed PWA / VoiceOver | BLOCKED | No reliable installed identity or speech/rotor/gesture evidence; physical gate remains authoritative |
| Physical iPhone VoiceOver | OPEN | J1-J9, EN/RO, browser + installed |
| Pixel 6a TalkBack | PARTIAL HISTORICAL | Remaining journeys and final-candidate rerun |
| Mid-tier Android performance | PASS HISTORICAL | Final-candidate rerun after freeze |
| Low-tier Android performance | OPEN | Distinct device, three-run matrix |
| Release-blocking product defects | NONE REPRODUCED | No unresolved failure after required rows |

Final decision: **NOT READY FOR PHYSICAL SIGN-OFF.** P37 acceptance-contract consolidation is
complete. The next phase is P38 physical closure when the required devices are available.
