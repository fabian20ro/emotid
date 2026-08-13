# Physical And Native Release Evidence

This file records current evidence, not requirements. The normative J1-J9 journeys, result classes,
and performance thresholds live in `docs/release-quality-gates.md`. Historical detail remains in
Git and `ITERATION_LOG.md`.

Supporting browser, desktop, and Simulator results cannot replace required Android
assistive-technology or hardware-performance gates. Physical iPhone testing is outside scope.

## Current Target

| Field | Value |
| --- | --- |
| Product SHA | `61f8743` |
| Verification harness | `312dce9` plus P51 evidence tooling (test-only changes after product freeze) |
| Candidate status | FROZEN AND DEPLOYED; product assets unchanged by later harness commits |
| Production URL | `https://fabian20ro.github.io/emotid/` |
| Verified deployment workflow | `Deploy to GitHub Pages` run `31703694847`, successful |
| Test date | 2026-08-14 |
| Current decision | CONDITIONAL RELEASE: no open product blocker; explicit evidence deferrals below |

`61f8743` contains the only post-freeze product change: revealing the Quick commitment action on
compact screens. Later commits only correct release adapters; their production asset hashes match
the frozen product build.

## Environment Inventory

| ID | Environment | Browser / automation | Assistive technology | Role |
| --- | --- | --- | --- | --- |
| Mac Safari | Mac Studio, macOS 26.6.1 | Safari 26.6, SafariDriver | VoiceOver available, not run | Native desktop supporting |
| iOS SE | iOS 26.5 Simulator, iPhone SE 3 | Mobile Safari, Appium 3.6, XCUITest 12.3.1 | VoiceOver not run | Compact Simulator supporting |
| iOS 17 Pro | iOS 26.5 Simulator, iPhone 17 Pro | Mobile Safari, Appium 3.6, XCUITest 12.3.1 | VoiceOver not run | Modern Simulator supporting |
| Android AT / mid | Pixel 6a, Android 17 / API 37 | Chrome 151, browser + installed WebAPK | TalkBack 17.0.1 | Physical AT and mid-tier performance |
| Android low | Not available | Chrome required | Not required | Open performance gate |

Record exact OS/browser/AT version, viewport, display/text scaling, motion, network, battery, and
thermal differences for every final-candidate physical run.

## Automated Baseline

| Scope | Result | Evidence |
| --- | --- | --- |
| Clean dependency install and audit | AUTOMATED_PASS | `npm ci`; `npm audit`: 0 vulnerabilities |
| Lint, unit/integration, acceptance contract, i18n, psychological copy, build, budgets | AUTOMATED_PASS | `npm run check`: 86 files / 684 tests |
| Mobile Safari + Mobile Chrome browser matrix | AUTOMATED_PASS | `npm run test:e2e`: 256/256 |
| Production offline/update/data-retention lifecycle | AUTOMATED_PASS | `npm run test:pwa` |
| Production browser performance probe | AUTOMATED_PASS | `npm run test:performance` |
| CodeQL | PASS | Run `31703694471` |
| CI, PWA, performance, Pages deploy | PASS | Run `31703694847` |

These results validate browser-observable behavior. They do not validate synthesized speech,
screen-reader gestures, installed mobile UI, or low-tier hardware timing.

## Retained Native And Physical Evidence

| Candidate | Environment | Scope | Result | Evidence |
| --- | --- | --- | --- | --- |
| `61f8743` / harness `4a85b42` | iOS 26.5 Simulator SE + 17 Pro | Base; EN/RO; exact local assets | SIMULATOR_SUPPORTING_PASS, 16/16 | `.reports/ios-simulator/2026-08-13T13-12-18-750Z/` |
| `61f8743` / harness `4a85b42` | iOS 26.5 Simulator SE + 17 Pro | Complete J1-J9; EN/RO; exact local assets | SIMULATOR_SUPPORTING_PASS, 36/36 | `.reports/ios-simulator/2026-08-13T13-14-37-926Z/` |
| `61f8743` / harness `4a85b42` | iOS 26.5 Simulator SE + 17 Pro | Onboarding, landscape, dark, accessibility text | SIMULATOR_SUPPORTING_PASS, 6/6 | `.reports/ios-simulator/2026-08-13T13-18-25-063Z/` |
| `61f8743` / harness `4a85b42` | macOS Safari 26.6 | Quick activation diagnostic | BLOCKED: SafariDriver transport; script activation proves product path | `.reports/macos-safari/2026-08-13T13-21-30-016Z/` |
| deployed `61f8743` / harness `4c82c81` | Pixel 6a Android 17, Chrome 151 | Complete J1-J9; EN/RO; browser | SUPPORTING_PASS, 18/18 | `.reports/android-physical/2026-08-13T13-29-40-393Z-browser/` |
| deployed `61f8743` / harness `4c82c81` | Pixel 6a Android 17, WebAPK | Complete J1-J9; EN/RO; standalone | SUPPORTING_PASS, 18/18 | `.reports/android-physical/2026-08-13T13-30-36-921Z-installed/` |
| deployed `61f8743` / harness `bc6f7e7` working tree | Pixel 6a Android 17, Chrome 151 | Three-run mid-tier production timing | PASS | `.reports/android-physical/2026-08-13T13-32-40-371Z-browser/` |
| working tree from `3aac5ce` | iOS 26.5 Simulator SE | P50 Quick, onboarding focus, Romanian guided Word Ladder; exact local assets | SIMULATOR_SUPPORTING_PASS, 3/3 | `.reports/ios-simulator/2026-08-13T14-14-22-853Z/`; `.reports/ios-simulator/2026-08-13T14-15-12-550Z/`; `.reports/ios-simulator/2026-08-13T14-16-46-516Z/` |
| working tree from `3aac5ce` | Pixel 6a Android 17, Chrome 151 | P50 J1/J5/J9; EN/RO; local production candidate | SUPPORTING_PASS, 6/6 | `.reports/android-physical/2026-08-13T14-18-04-026Z-browser/`; `.reports/android-physical/2026-08-13T14-18-34-467Z-browser/`; `.reports/android-physical/2026-08-13T14-18-57-634Z-browser/` |
| working tree from `3aac5ce` | macOS Safari 26.6 | P50 native regression; Quick activation diagnostic | BLOCKED: SafariDriver transport; script activation proves product path | `.reports/macos-safari/2026-08-13T14-19-33-175Z/` |
| working tree from `1d111cf` | macOS Safari 26.6 | P52 pre-matrix activation capability probe | BLOCKED: seed native click inert; script proves seed; product rows skipped | `.reports/macos-safari/2026-08-13T15-06-21-999Z/` |
| working tree from `312dce9` | Pixel 6a Android 17, TalkBack 17, browser + installed WebAPK | P51 owner-operated onboarding, intermediary, tier-4, Romanian speech, and standalone checkpoints | BOUNDED_PASS, 6/6 | `.reports/android-physical/2026-08-13T21-37-18Z-human-talkback/` |
| working tree from `ad38399c` | macOS Safari 26.6 | Quick + AI link, Word intermediary, tier-4; EN/RO, light/dark | NATIVE_SUPPORTING_PASS, 6/6 | `.reports/macos-safari/2026-08-12T17-59-15-941Z/` |
| working tree from `ad38399c` | iOS 26.5 Simulator SE + 17 Pro | Quick, Word intermediary, save recovery, tier-4; EN/RO; exact local assets | SIMULATOR_SUPPORTING_PASS, 16/16 | `.reports/ios-simulator/2026-08-12T18-02-37-977Z/` |
| working tree from `32a3d708` | iOS 26.5 Simulator SE + 17 Pro | P36 onboarding focus, landscape, dark theme, 200% Page Zoom plus accessibility text; exact local assets | SIMULATOR_SUPPORTING_PASS, 6/6 | `.reports/ios-simulator/2026-08-12T19-20-05-175Z/` |
| working tree from `32a3d708` | iOS 26.5 Simulator SE + 17 Pro | Quick, Word intermediary, save recovery, tier-4; EN/RO; post-P36 regression | SIMULATOR_SUPPORTING_PASS, 16/16 | `.reports/ios-simulator/2026-08-12T19-23-51-726Z/` |
| working tree from `042f16a` | iOS 26.5 Simulator SE + 17 Pro | Complete J1-J9; EN/RO; exact local assets and route postconditions | SIMULATOR_SUPPORTING_PASS, 36/36 | `.reports/ios-simulator/2026-08-12T22-06-52-696Z/` |
| working tree from `32a3d708` | macOS Safari 26.6 | Quick + AI link, Word intermediary, tier-4; EN/RO, light/dark; post-P36 regression | NATIVE_SUPPORTING_PASS, 6/6 | `.reports/macos-safari/2026-08-12T19-26-58-249Z/` |
| `14b38daf` | Pixel 6a, browser + installed | J1-J9 EN/RO through DevTools | SUPPORTING_PASS, 36/36 | `.reports/android-physical/2026-08-07T20-37-23-460Z-browser/`; `.reports/android-physical/2026-08-07T20-38-23-776Z-installed/` |
| `14b38daf` | Pixel 6a, installed TalkBack | J5 complete; J6 retry and J8 support-order checkpoints; EN/RO | PASS / BOUNDED_PASS | `.reports/android-physical/2026-08-07T19-45-00-p30-talkback-installed/`; `.reports/android-physical/2026-08-07T20-40-00-p30-talkback-checkpoints/` |
| `23e0c05c` | Pixel 6a, browser TalkBack | J5 speech, AOA focus, activation, Reflection focus; EN/RO | PASS | `.reports/android-physical/2026-08-12T11-05-00-talkback-j5-local/` |
| `23e0c05c` | Pixel 6a, browser | J5/J6/J8 EN/RO with exact CDP + native foreground proof | SUPPORTING_PASS, 6/6 | `.reports/android-physical/2026-08-12T10-52-54-317Z-browser/`; `.reports/android-physical/2026-08-12T10-53-18-107Z-browser/`; `.reports/android-physical/2026-08-12T10-53-35-749Z-browser/` |
| deployed production; harness from `c048830` working tree | Pixel 6a, Android 17 browser | J6/J8 EN/RO; exact CDP + native foreground proof; final preflight/lifecycle regression | SUPPORTING_PASS, 4/4 | `.reports/android-physical/2026-08-12T22-30-59-970Z-browser/`; `.reports/android-physical/2026-08-12T22-31-20-439Z-browser/` |
| `a0c73e7` | Pixel 6a, Android 17 browser + TalkBack 17 | J6/J8 EN/RO; native focus order, visible speech overlay, TTS dispatch, native key activation, route postconditions | NATIVE_TALKBACK_SUPPORTING_PASS, 4/4 | `.reports/android-physical/2026-08-12T22-59-46-804Z-native-talkback-j6-j8/` |
| working tree from `ae00a67` | Pixel 6a, Android 17 browser + TalkBack 17 | Complete J1-J9 EN/RO; exact local assets, real TalkBack state, native key activation, TTS synthesis/dispatch, route postconditions | SUPPORTING_PASS, 18/18 | `.reports/android-physical/2026-08-12T23-31-33-689Z-talkback-browser/` |
| `0113b35` | Pixel 6a, Android 17 browser + TalkBack 17 | Complete J1-J9; EN/RO; light/dark; exact local assets; local audio, transcript, and TTS voice correlation | SUPPORTING_PASS, 36/36 + audio 4/4 | `.reports/android-physical/2026-08-13T00-29-02-176Z-talkback-browser/` |
| `f59e5175` | Pixel 6a, Android 17 | Three-run mid-tier production timing | PASS | `.reports/android-physical/2026-08-07T17-26-42-635Z-browser/` and retained timing artifacts |

P35/P36 reproduced and fixed four focus/reflow product defects. The final matrices expose no
unresolved functional or performance product defect. P52 now proves the native Safari block before
product navigation: WebDriver element-click leaves a disposable seed control idle, while script
activation changes it synchronously. Product rows are skipped, so no product failure is attributed
to the broken transport. Historical native Safari and current WebKit remain supporting evidence,
not a replacement for the blocked native row.

The complete automated browser TalkBack run exposed one product defect: after native Enter activation, the
persistent onboarding Next button could reclaim focus from the next heading. The heading handoff
now runs in the next animation frame and the same physical J1 row passes in both languages. A J9
failure was traced to mid-row `uiautomator dump` restarting TalkBack/TTS; moving native hierarchy
capture after the postcondition removed the instrumentation defect. Romanian app language and AX
names are correct. On the exact `0113b35` run, Android locale, Chrome UI, dominant audio, and the
voices dispatched during both Romanian audio checkpoints remained `en-US`; Romanian pronunciation
quality is therefore not claimed. The visible app and AX content remained Romanian in both themes.
One earlier full attempt left EN/dark J7 saving for more than 15 seconds. The exact row, the ordered
EN/dark matrix, and the final complete matrix all passed afterward, so this remains an unconfirmed
storage/lifecycle flake rather than a reproduced product defect.

The later P51 owner-operated pass used physical one-finger swipes and TalkBack double-tap. English
onboarding, English/Romanian intermediary selection, English/Romanian safety-resource order, and
English installed standalone navigation passed 6/6. Romanian app content dispatched the installed
`ro-RO` voice while TalkBack role/action instructions used its configured `en-US` voice. The owner
found Romanian speech understandable. TalkBack also announced persistent local-privacy context
during route replacement; target focus remained on the new heading and no missing, duplicate, or
misordered content reproduced. This is a bounded checkpoint pass, not a complete human J1-J9 claim.

## Current Physical Matrix

TalkBack rows retain earlier supporting evidence. The no-AT browser and installed rows below are
exact frozen-product evidence and do not claim speech or gesture validation.

| Device | Language | Theme | Mode | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | J9 | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pixel 6a / no AT | EN | system | Browser | pass | pass | pass | pass | pass | pass | pass | pass | pass | SUPPORTING_PASS |
| Pixel 6a / no AT | RO | system | Browser | pass | pass | pass | pass | pass | pass | pass | pass | pass | SUPPORTING_PASS |
| Pixel 6a / no AT | EN | system | Installed | pass | pass | pass | pass | pass | pass | pass | pass | pass | SUPPORTING_PASS |
| Pixel 6a / no AT | RO | system | Installed | pass | pass | pass | pass | pass | pass | pass | pass | pass | SUPPORTING_PASS |
| Pixel 6a / TalkBack | EN | Light | Browser | pass | supporting | supporting | supporting | pass | supporting | supporting | pass | supporting | BOUNDED_PASS |
| Pixel 6a / TalkBack | EN | Dark | Browser | supporting | supporting | supporting | supporting | supporting | supporting | supporting | supporting | supporting | OPEN FOR HUMAN SIGN-OFF |
| Pixel 6a / TalkBack | RO | Light | Browser | supporting | supporting | supporting | supporting | pass | supporting | supporting | pass | supporting | BOUNDED_PASS |
| Pixel 6a / TalkBack | RO | Dark | Browser | supporting | supporting | supporting | supporting | supporting | supporting | supporting | supporting | supporting | OPEN FOR HUMAN SIGN-OFF |
| Pixel 6a / TalkBack | EN | | Installed | bounded shell | | | | prior pass | prior checkpoint | | prior checkpoint | | BOUNDED_PASS |
| Pixel 6a / TalkBack | RO | | Installed | | | | | prior pass | prior checkpoint | | prior checkpoint | | OPEN FOR FROZEN SHA |

## Android Performance

### Retained Mid-Tier Baseline

Pixel 6a on Android 17 passed the later P29 profile: cold startup median `1,440 ms`; Body
`207.2 ms`; Affect `120.1 ms`; Words `219.4 ms`; Plutchik `130.2 ms`; worst warm return `41.5 ms`; longest
observed task `53 ms`.

### Final-Candidate Matrix

| Device | Measurement | Run 1 ms | Run 2 ms | Run 3 ms | Median ms | Target ms | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mid | Cold launch to usable Today | 1684 | 1470 | 1485 | 1485 | 2500 | PASS |
| Mid | First primary route, worst case | 231.6 | 132.9 | 345.3 | 231.6 | 500 | PASS |
| Mid | Warm route return, worst case | 38.7 | 39.6 | 41.5 | 39.6 | 150 | PASS |
| Mid | Longest interaction-blocking task | 0 | 0 | 52 | 0 | 200 | PASS |
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
| P46-CTA-1 | `e34c6ad`; CI Mobile Safari 390x664 | Quick | Newly mounted commitment remained below fixed navigation when chip activation did not scroll | High usability | `TodayScreen.test.tsx`; `smoke.spec.ts` viewport assertion | Reveal action with nearest scrolling; preserve chip focus and explicit commitment | Playwright 256/256; CI run `31703694847` |
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
| Exact-candidate automated baseline | PASS | Local complete gates and workflow `31703694847` |
| iOS Simulator browser matrix | PASS, SUPPORTING | Base 16/16; acceptance 36/36; robustness 6/6 |
| Simulator installed PWA / VoiceOver | OUT OF SCOPE | Capability limitation recorded; no physical-iPhone substitution claim |
| Pixel 6a browser + installed, no AT | PASS, SUPPORTING | J1-J9 EN/RO, 36/36 total |
| Pixel 6a TalkBack | BOUNDED_PASS / WAIVER REQUIRED FOR FULL MATRIX | Six owner-operated browser/installed checkpoints passed; complete human J1-J9 not claimed |
| Mid-tier Android performance | PASS | Frozen-product three-run matrix |
| Low-tier Android performance | DEFERRED / WAIVER REQUIRED | Distinct device unavailable; Pixel is not relabeled |
| Moderated comprehension | DEFERRED / WAIVER REQUIRED | Six participant sessions unavailable; synthetic reviews remain preflight |
| Native macOS Safari | BLOCKED, SUPPORTING ONLY | SafariDriver activation transport; no reproduced product failure |
| Release-blocking product defects | NONE REPRODUCED | No unresolved failure after required rows |

Final recommendation: **CONDITIONAL RELEASE.** The frozen product has no unresolved automated,
simulator, browser, installed-WebAPK, or mid-tier performance defect. Release ownership must accept
the residual accessibility, low-tier performance, and comprehension risks above; none is converted
into a pass by supporting or historical evidence.
