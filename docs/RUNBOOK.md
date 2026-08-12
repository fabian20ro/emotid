# Emot-ID Runbook

## Quick Reference

Client-only PWA. No backend. All data in browser (localStorage + IndexedDB).

- **Production:** `https://fabian20ro.github.io/emotid/`
- **Local dev:** `http://localhost:5173/emotid/`
- **Deploy:** automatic via GitHub Actions on push to `main`

## Common Tasks

### Clear user data (development)

```javascript
// Preferences
localStorage.clear()
// Session history
indexedDB.deleteDatabase('emot-id-sessions')
```

### Add i18n strings

1. Add key to both `src/i18n/en.json` and `src/i18n/ro.json`
2. Access via `useLanguage().section('sectionName').keyName`
3. `i18n-completeness.test.ts` enforces key parity between languages

## Troubleshooting

### Build fails with type errors

```bash
npx tsc -b --noEmit   # Check TypeScript errors without building
```

### PWA not updating

Service worker caches aggressively. Users may need to hard refresh or clear site data in DevTools > Application > Storage.

### IndexedDB issues

If `idb-keyval` fails (e.g., private browsing), the app gracefully degrades — sessions aren't saved but the app remains functional.

### Mobile layout issues

**Target viewport**: 393×742. Also verify 320×568, 360×800, and 430×932.

Common problems:

- **BubbleField top clustering** — Bubble canvas must inherit full height. Verify `h-full min-h-0` chain from parent doesn't collapse.
- **BodyMap regions untappable** — Small regions use expanded `hitD` paths. Label pills use invisible 48px hit rectangles. Check `body-paths.ts`.
- **BodyMap lower regions cut off** — Height-fit rendering relies on `h-full min-h-0` container chain. Inspect `data-testid="bodymap-root"` sizing.
- **Settings menu invisible** — Likely trapped in stacking context. Must be portaled to `document.body`.
- **Safe-area double padding** — Insets are per-component, NOT on `#root`. Check for duplicate `env(safe-area-inset-bottom)`.
- **Dimensional suggestions overlap plot** — Suggestion tray must be in normal flow below plot, not absolute overlay. Check `data-testid="dimensional-suggestion-tray"`.

## Monitoring

No server-side monitoring. Health indicators:
- GitHub Actions build status
- Acceptance-contract drift: `npm run check-acceptance`
- Production manifest budgets: `npm run check-performance`
- Diagnostic production mobile trace: `npm run test:performance`
- Manual testing on 393×742 viewport
- Keyboard-only navigation through full flow
- Crisis path: select distress emotions → verify banner appears
- Android physical capability: `npm run test:android:physical:preflight`; run device journeys using
  `docs/android-physical-testing-setup.md`
- Native Safari capability: `npm run test:safari:native:preflight`; run the authorized desktop
  audit separately using `docs/macos-native-safari-testing.md`
- iOS Simulator capability: `npm run test:ios:simulator:preflight`; run the opt-in Mobile Safari
  base, complete acceptance, and robustness matrices using `docs/ios-simulator-testing.md`

See `docs/release-quality-gates.md` for physical Android performance thresholds and the mandatory
TalkBack/Chrome acceptance script. Physical iPhone testing is outside project scope.

## Release Candidate Evidence

1. Record the candidate SHA, deployed URL, workflow URL, and device inventory in
   `docs/physical-release-evidence.md`.
2. Run `npm ci`, `npm ls`, `npm audit --omit=dev`, and every automated gate from
   `docs/release-quality-gates.md` against that SHA.
3. Complete the iOS Simulator J1-J9 matrix and the bilingual browser/installed-PWA TalkBack matrix.
4. Complete three cold/warm performance runs on representative low- and mid-tier Android devices.
5. Fix only reproduced failures, add the closest deterministic regression, redeploy, and retest the
   failed physical row.

Do not sign off synthesized speech, screen-reader gestures, installed behavior, or hardware timing
from Playwright. The template's console fixtures are temporary inspection tools and must never
become production query parameters or runtime test hooks.
