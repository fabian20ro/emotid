# iOS Simulator Safari Testing

This opt-in local gate drives installed Simulator Safari through Appium/XCUITest. It is stronger
browser and layout evidence than Playwright WebKit emulation, but it is not a physical iPhone or
VoiceOver pass.

## Prerequisites

- macOS with full Xcode and an available iOS runtime;
- named profiles `Emot-ID iPhone SE` and `Emot-ID iPhone 17 Pro`;
- Appium on `PATH` with the XCUITest driver installed;
- repository dependencies installed.

The permission-free preflight reads versions, runtimes, and named profiles without booting a
Simulator, starting Appium, opening Safari, or creating evidence:

```bash
npm run test:ios:simulator:preflight
```

## Run

```bash
npm run test:ios:simulator
npm run test:ios:simulator:robustness
```

The command builds the production app, serves it from the same local origin used by native desktop
Safari, starts Appium only when needed, and runs:

- Quick persistence and exact Google AI Mode query semantics;
- direct completion with an intermediary Word Ladder emotion;
- one failed local detail save, retry, and exactly one Journal entry;
- tier-4 support before Reflection details.

Each journey runs in English and Romanian on both profiles: 16 rows. Every row also checks the
exact production JS/CSS assets, unique run token, document language, heading focus, horizontal
overflow, heading viewport bounds, and 44px primary-action height.

Filters support focused diagnosis:

```bash
node scripts/ios-simulator-audit.mjs --profile=se --language=ro --journey=tier4
```

Allowed profiles: `all`, `se`, `17-pro`. Allowed languages: `all`, `en`, `ro`. Allowed journeys:
`all`, `quick`, `word-intermediate`, `save-retry`, `tier4`.

The six-case robustness suite is risk-based, not a Cartesian product. It covers onboarding focus,
SE and 17 Pro landscape, dark Word Ladder, and compact Quick/tier-4 at 200% Safari Page Zoom plus
accessibility text. It checks orientation, theme, visual-viewport reflow, shell and action bounds,
sticky overlap, semantic-token contrast, and programmatic focus. Run one case with:

```bash
node scripts/ios-simulator-audit.mjs --suite=robustness --case=se-text-tier4-ro
```

## Side Effects And Safety

- The runner never installs Xcode, runtimes, Appium, or drivers.
- It accepts only a loopback candidate URL, never erases a Simulator, and cannot clear a public
  production origin.
- It clears only synthetic Emot-ID state on that loopback origin before each journey.
- A profile booted by the runner returns to Shutdown; an already booted profile remains booted.
- The robustness suite restores appearance, content size, portrait orientation, and Safari Page
  Zoom. Unknown transient Simulator state fails instead of becoming a restoration value.
- A pre-existing Appium or preview service is reused and never killed by the runner.
- Evidence contains synthetic fixture data only and is written under ignored
  `.reports/ios-simulator/<timestamp>/`.

Safari's first-run coachmark is dismissed only when a visible native control has accessibility
label `Close`. A stale Share Sheet, unstable post-rotation viewport, unknown native UI, or missing
web context fails the run rather than contaminating evidence.

## Evidence

`report.json` records tool versions, profile UDIDs and original states, local Git/build identity,
service ownership, native coachmark handling, viewport data, duration, screenshot, and result for
every row. Screenshots are captured explicitly in `NATIVE_APP` context and the previous web context
is restored, avoiding SafariDriver's inconsistent web-only crops. Valid functional rows use
`SIMULATOR_SUPPORTING_PASS`; failures use `FAIL`.

The Simulator cannot currently provide reliable installed-PWA identity after Share Sheet
activation, nor VoiceOver speech/rotor/gesture evidence. These are documented limitations, not
application failures. Physical installed-PWA and VoiceOver acceptance remains P38.
