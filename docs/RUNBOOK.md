# Emot-ID Runbook

## Quick Reference

Client-only PWA. No backend. All data in browser (localStorage + IndexedDB).

- **Production:** `https://fabian20ro.github.io/emot-id/`
- **Local dev:** `http://localhost:5173/emot-id/`
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

**Target viewport**: 393×742 (Pixel 9a Chrome). Also verify 320×604 (smallest phone).

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
- Production manifest budgets: `npm run check-performance`
- Diagnostic production mobile trace: `npm run test:performance`
- Manual testing on 393×742 viewport
- Keyboard-only navigation through full flow
- Crisis path: select distress emotions → verify banner appears

See `docs/release-quality-gates.md` for physical mobile-performance thresholds and the mandatory
VoiceOver/Safari plus TalkBack/Chrome acceptance script.
