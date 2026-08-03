# Contributing to Emot-ID

## Setup

```bash
git clone https://github.com/fabian20ro/emotid.git
cd emotid
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (`http://localhost:5173/emotid/`) |
| `npm run build` | TypeScript check + Vite production build |
| `npm test` | Run all unit tests once (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests (mobile Safari + Chrome) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Adding a New Emotion Model

1. Create `src/models/<id>/` with `types.ts`, `index.ts`, data JSON file(s)
2. Extend `BaseEmotion` with model-specific fields
3. Implement `EmotionModel<YourType>` interface
4. Add model ID to `MODEL_IDS` in `src/models/constants.ts`
5. Register in `src/models/registry.ts` with a visualization component
6. Add i18n keys to both `src/i18n/en.json` and `src/i18n/ro.json`
7. Add first-hint text to `firstHint.<modelId>` in both i18n files

## Conventions

- **Dark theme only** — no light mode
- **Bilingual** — all user-facing text needs both `ro` and `en` versions (i18n completeness test enforces key parity)
- **Simple-language compatibility** — provide both standard and simplified variants for explanatory copy
- **Portal modals** — all `position: fixed` overlays must use `createPortal(content, document.body)` to escape WebKit stacking contexts (see architecture codemap)
- **44px touch targets** — all interactive elements must meet 44px minimum. SVG elements use invisible `<rect>` for hit expansion
- **Safe-area insets** — applied per-component (Header top, bottom bar bottom), NOT on `#root`
- **Mobile breakpoint** — 480px for compact phone (`MOBILE_BREAKPOINT`), standard `sm:` (640px) for desktop
- **Z-index scale** — use CSS custom properties from `index.css` (`--z-base` through `--z-onboarding`)
- **Functional state updates** — required in callbacks to avoid stale closures
- **Dynamic inline styles** for emotion `color` (not Tailwind classes)

## Documentation Sync Rule

If behavior changes, update docs in the same PR:
- `README.md` for user-visible features
- `docs/RUNBOOK.md` for operations/troubleshooting
- `docs/CODEMAPS/*.md` for architecture changes

## Pre-commit

```bash
npm test && npm run lint
```
