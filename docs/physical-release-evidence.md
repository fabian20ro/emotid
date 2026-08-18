# Physical And Native Release Evidence

This file records current evidence, not requirements. The normative J1-J9 journeys, result classes,
and performance thresholds live in `docs/release-quality-gates.md`. Historical detail remains in
Git and `ITERATION_LOG.md`.

Supporting browser, desktop, and Simulator results cannot replace required Android
assistive-technology or hardware-performance gates. Physical iPhone testing is outside scope.

## Current Target

| Field | Value |
| --- | --- |
| Released product | `v0.1.5` (immutable tag resolves the exact release commit) |
| Corrective product commit | `fb28bf3` |
| Romanian spelling product commit | `b3669bb` |
| Runtime baseline | `v0.1.4` at `88f0fd5`; `v0.1.5` adds Romanian copy corrections and regression guards |
| Candidate status | RELEASED AS `v0.1.5` WITH EXPLICIT EVIDENCE WAIVERS |
| Production URL | `https://fabian20ro.github.io/emotid/` |
| Exact release workflow | `Deploy to GitHub Pages` for the `v0.1.5` release commit, successful including deployed smoke |
| Corrective product workflow | `Deploy to GitHub Pages` run `32077254862`, successful including deployed smoke |
| Romanian spelling workflow | `Deploy to GitHub Pages` run `32107489742`, successful including deployed smoke |
| Test date | 2026-08-18 |
| Current decision | RELEASED WITH EXPLICIT EVIDENCE WAIVERS; no open product blocker |

`v0.1.3` includes the P0-P3 privacy, accessibility, provenance, persistence, policy, and bounded
maintenance corrections described in its release note. `v0.1.4` adds only the automated
release-identity consistency gate. `v0.1.5` corrects Romanian spelling and extends deterministic
language-quality coverage. Native, Simulator, TalkBack, and physical-performance rows below
predate `v0.1.5` and remain retained evidence, not exact-current-candidate passes.

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
| Lint, unit/integration, acceptance contract, i18n, psychological copy, build, budgets | AUTOMATED_PASS | `npm run check`: 88 files / 696 tests |
| Release-identity fixtures and live repository | AUTOMATED_PASS | `npm run check:release`: 8/8 fixtures; live repository pass |
| Mobile Safari + Mobile Chrome browser matrix | AUTOMATED_PASS | current working tree: 276/276; exact `v0.1.5`: 274/274 |
| Production offline/update/data-retention lifecycle | AUTOMATED_PASS | `npm run test:pwa` |
| Production browser performance probe | AUTOMATED_PASS | `npm run test:performance` |
| Exact `v0.1.5` CI, PWA, performance, Pages deploy, public smoke | PASS | Release-commit `Deploy to GitHub Pages` workflow; deployed smoke 1/1 |
| Corrective product CodeQL | PASS | Run `32077254251` at `fb28bf3` |
| Corrective product CI, Pages deploy, public-URL smoke | PASS | Run `32077254862` at `fb28bf3`; deployed smoke 1/1 |
| Romanian spelling CodeQL | PASS | Run `32107489151` at `b3669bb` |
| Romanian spelling CI, Pages deploy, public-URL smoke | PASS | Run `32107489742` at `b3669bb`; deployed smoke 1/1 |

These results validate browser-observable behavior. They do not validate synthesized speech,
screen-reader gestures, installed mobile UI, or low-tier hardware timing.

## Retained Native And Physical Evidence

Each row retains its recorded candidate identity. The new exact `v0.1.5` rows are identified as
such; older native and physical evidence is not relabeled as current.

| Candidate | Environment | Scope | Result | Evidence |
| --- | --- | --- | --- | --- |
| `v0.1.5` / `0fd3981` | Pixel 6a Android 17, Chrome 151 + TalkBack 17.0.1 | Complete J1-J9; EN/RO; light/dark; exact local assets, native activation, TTS dispatch | SUPPORTING_PASS, 36/36 | `.reports/android-physical/2026-08-18T21-14-31-521Z-talkback-browser/` |
| working tree from `0fd3981` | Pixel 6a Android 17, Chrome 151 + TalkBack 17.0.1 | Sentence-case follow-up; J8 RO light/dark; exact local assets | SUPPORTING_PASS, 2/2 | `.reports/android-physical/2026-08-18T21-36-05-200Z-talkback-browser/` |
| working tree from `ec050f9` | Pixel 6a Android 17, Chrome 151 + TalkBack 17.0.1 | Pre-mount Romanian document-language follow-up; J9 RO light/dark; exact local assets | SUPPORTING_PASS, 2/2 | `.reports/android-physical/2026-08-18T22-14-51-804Z-talkback-browser/` |
| `fbf039e` | Pixel 6a Android 17, Chrome 151 + TalkBack 17.0.1 | Owner-operated Today speech before/after explicit Chrome `ro` app locale | OWNER_OBSERVED_PASS with Chrome `ro`; configuration finding with inherited `en-US` | `.reports/android-physical/2026-08-18T22-54-22Z-human-talkback-browser-locale/` |
| working tree from `0fd3981` | Pixel 6a Android 17, Chrome 151 + TalkBack 17.0.1 | Owner-operated Romanian speech observation and uppercase experiment | FINDING; not a complete journey pass | `.reports/android-physical/2026-08-18T21-25-00Z-human-talkback-v015/` |
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

The exact `v0.1.5` follow-up passed all 36 automated physical TalkBack rows. A separate owner
observation reproduced English-voice pronunciation across Romanian controls while Android, Chrome,
and TalkBack were configured `en-US`; visible copy, accessible names, and `html lang="ro"` remained
Romanian, and explicit per-control `lang="ro"` did not change the voice. This remains an
assistive-technology configuration limitation, not an application localization failure. The same
observation found one product defect: CSS uppercase made the sentence-case Reflection eyebrow read
character by character. Removing that transform made physical speech normal; the corrected working
tree then passed J8 RO light/dark 2/2. The observation did not complete human J1-J9, so the existing
waiver remains.

The same owner observation later isolated English-voice speech to the initial Today heading,
actions, quick choices, recent-thread heading, and bottom navigation. A deterministic browser probe
confirmed that Romanian UI was first mounted while the static document still had `lang="en"`;
the language effect ran only afterward. The bootstrap now applies the stored language before React
mounts and applies runtime changes before rerendering localized text. Mobile Chromium and WebKit
capture `ro` at the first Today DOM mutation and verify all reported nodes inherit it. The corrected
working tree passed physical J9 RO light/dark 2/2. Android, Chrome, and TalkBack remain configured
`en-US`, so the automated TTS diagnostic still attributes its English voice to AT configuration;
physical Romanian pronunciation quality is not claimed without another owner listening pass.

The subsequent owner listening pass separated the remaining layers. With Chrome inheriting the
device's `en-US` locale, all initial Today headings and button labels still used the English voice
despite correct visible copy, accessible names, pre-mount `html lang="ro"`, and the physical J9
supporting pass. After the owner explicitly selected Romanian in Android's Chrome-language dialog,
the same title and complete heading/button sequence through `Jurnal` were spoken in Romanian.
TalkBack's own `double tap to activate` hint remained English because TalkBack and the device stayed
`en-US`. Therefore the bootstrap correction is retained as a real semantic fix, but physical voice
selection is accurately attributed to browser/AT configuration rather than that code change.

## Retained Physical Matrix

TalkBack rows retain earlier supporting evidence. The no-AT browser and installed rows below are
exact evidence for their recorded pre-`v0.1.2` candidates and do not claim current-candidate,
speech, or gesture validation.

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

### Retained v0.1.0 Candidate Matrix

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
| A11Y-LANG-1 | working tree from `ec050f9`; Mobile Chrome / Pixel report | Initial Today | Romanian controls mounted before the post-render language effect changed static `html lang="en"` | High accessibility / localization | first-DOM-mutation and reported-control assertions in `accessibility-acceptance.spec.ts` | Resolve/apply document language before `createRoot`; update language before runtime rerender | Mobile Chromium/WebKit 2/2; physical J9 RO light/dark 2/2 |
| P46-CTA-1 | `e34c6ad`; CI Mobile Safari 390x664 | Quick | Newly mounted commitment remained below fixed navigation when chip activation did not scroll | High usability | `TodayScreen.test.tsx`; `smoke.spec.ts` viewport assertion | Reveal action with nearest scrolling; preserve chip focus and explicit commitment | Playwright 256/256; CI run `31703694847` |
| P35-FOCUS-1 | working tree from `ad38399c`; both iOS profiles | J8 tier-4 | Acknowledgment removed its button and left no focused destination | High accessibility | `ReflectionScreen.test.tsx`; `crisis-routes.spec.ts` | Focus the newly revealed result heading | J8 4/4; base matrix 16/16 |
| P36-OUTLINE-1 | working tree from `32a3d708`; SE Safari | J1 onboarding | Programmatically focused noninteractive heading showed Safari's blue outline | Medium accessibility / visual | `Onboarding.test.tsx`; `accessibility-acceptance.spec.ts` | Suppress outline only for the programmatic onboarding heading | P36 onboarding 1/1; robustness 6/6 |
| P36-REFLOW-1 | working tree from `32a3d708`; SE Safari at 200% | Quick and J8 | Global 320px body minimum forced 132px horizontal overflow in a 188px visual viewport | High accessibility | compact 200% `accessibility-acceptance.spec.ts` | Remove the obsolete body minimum width | P36 text rows 2/2; Playwright 212/212 |
| P36-FOCUS-1 | working tree from `32a3d708`; SE Safari at 200% | Quick and J8 | Focus moved correctly in the DOM but the destination remained clipped outside `visualViewport` | High accessibility | `focusDestination.test.ts`; compact 200% Playwright | Shared focus destination reveals only clipped headings | P36 text rows 2/2; base 16/16 |

For a failure: retain evidence, reproduce on the intended environment, reduce to the smallest
stable case, add the closest deterministic browser regression, fix, rerun automated gates, and
retest the same native row. Record environment blocks separately from application failures.

## Current Release Evidence

| Gate | Status | Closure condition |
| --- | --- | --- |
| Exact-release automated baseline | PASS | `v0.1.5` release-commit workflow; release fixtures 8/8, 88 files / 696 tests, and Playwright 274/274 |
| Post-deployment public-URL smoke | PASS | `v0.1.5` release-commit workflow; deployed smoke 1/1 |
| iOS Simulator browser matrix | RETAINED, SUPPORTING | Pre-`v0.1.5`; base 16/16, acceptance 36/36, robustness 6/6 |
| Simulator installed PWA / VoiceOver | OUT OF SCOPE | Capability limitation recorded; no physical-iPhone substitution claim |
| Pixel 6a browser + installed, no AT | RETAINED, SUPPORTING | Pre-`v0.1.5`; J1-J9 EN/RO, 36/36 total |
| Pixel 6a TalkBack | CURRENT SUPPORTING_PASS / WAIVER REQUIRED FOR HUMAN MATRIX | Exact `v0.1.5` automated physical J1-J9 EN/RO light/dark 36/36; corrected J8/J9 RO light/dark 4/4; owner confirms Romanian Today speech with Chrome app locale `ro`; TalkBack hints remain English under AT/device `en-US`; complete human J1-J9 not claimed |
| Mid-tier Android performance | RETAINED PASS | Pre-`v0.1.5` three-run matrix; current automated performance probe passes |
| Low-tier Android performance | DEFERRED / WAIVER REQUIRED | Distinct device unavailable; Pixel is not relabeled |
| Moderated comprehension | DEFERRED / WAIVER REQUIRED | Six participant sessions unavailable; synthetic reviews remain preflight |
| Native macOS Safari | BLOCKED, SUPPORTING ONLY | SafariDriver activation transport; no reproduced product failure |
| Release-blocking product defects | NONE REPRODUCED | No unresolved failure after required rows |

Release decision: **RELEASED AS `v0.1.5` WITH EXPLICIT EVIDENCE WAIVERS.** Current automated and
post-deployment gates expose no unresolved product defect. Simulator, native-browser, installed
WebAPK, TalkBack, and physical performance evidence remains attached to its recorded older
candidate. Residual accessibility, low-tier performance, and comprehension risks remain deferred;
none is converted into an exact-current pass by retained evidence.
