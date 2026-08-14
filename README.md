# Emot-ID

> **[Try the live app](https://fabian20ro.github.io/emotid/)**

Current release: **[v0.1.2](https://github.com/fabian20ro/emotid/releases/tag/v0.1.2)**

Privacy-first PWA for exploring emotions through words, body sensations, and affect mapping.

## Product Flow

- **Today** opens Affect Map directly, keeps route guidance one tap away, and offers quick words.
- **Arrival** guides uncertainty toward placement, words, or body signals.
- **Body Compass** offers front, back, and accessible list selection, then records a sensation and
  intensity before suggesting possible words.
- **Affect Map** places a state by energy and pleasantness.
- **Word Ladder** moves from broad feeling families toward more precise language.
- **Plutchik** explores possible blends between two primary emotions.
- **Explore** separates ways to notice and name from comparison and vocabulary learning.
- **Reflection** presents tentative meaning, an explicit fit check, optional needs, and a user-chosen next step.
- **Journal** keeps optional local reflections and guided chain-analysis entries, delays aggregate
  summaries until three saved check-ins, and supports deletion of one check-in at a time.

## Features

- English and Romanian interface.
- Local-only IndexedDB journal; no account, telemetry, or cloud sync.
- Versioned full-data JSON export and explicit local-data deletion.
- Deterministic support prompts with actionable resources and no diagnosis from selected words.
- Optional Google Search AI Mode link using only selected emotion names; enabled by default with an explicit opt-out.
- Light and dark themes, keyboard operation, route focus management, reduced-motion support, and mobile reflow.
- Installable offline PWA with tested update and data-retention behavior.

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 7 + vite-plugin-pwa
- Tailwind CSS 4
- Framer Motion 12
- Vitest + Testing Library

## Local Development

Requires Node.js 20.19+, 22.13+, or 24+.

```bash
npm install
npm run dev
```

## Testing

```bash
npm run check
npm run test:e2e
npm run test:pwa
npm run test:performance
npm run test:android:physical:preflight
npm run test:safari:native:preflight
npm run test:ios:simulator:preflight
npm run test:ios:simulator:acceptance
npm run test:ios:simulator:robustness
```

`npm run check` covers lint, unit/integration tests, bilingual audits, TypeScript, and the production build. Playwright covers Mobile Safari and Mobile Chrome; the PWA suite exercises the production service worker, offline reopen, automatic update, and local-data survival.
It also rejects drift between the J1-J9 acceptance manifest, platform registrations, Playwright
test anchors, result classes, and the normative release document.
The production performance probe records cold startup, first feature opening, transfer size, and
long tasks; deterministic manifest and precache budgets run in `npm run check`.
The permission-free Safari preflight verifies the installed native tooling. The opt-in
`npm run test:safari:native` audit requires one-time Safari Remote Automation authorization and is
documented in `docs/macos-native-safari-testing.md`; it is supporting desktop evidence, not mobile
VoiceOver acceptance.
The opt-in Appium/XCUITest audit drives real Safari in the named iOS Simulator profiles and is
documented in `docs/ios-simulator-testing.md`. Its complete J1-J9 EN/RO matrix is the project's
Apple functional gate. It does not claim installed-PWA behavior or VoiceOver speech, rotor, and
gesture coverage; physical iPhone testing is explicitly outside project scope.

## Method Context

The optional exploration methods draw from Plutchik's emotion model, hierarchical emotion vocabularies, circumplex affect models, and body-awareness research. Emot-ID is a reflection tool, not therapy, diagnosis, or emergency care.

## License

MIT
