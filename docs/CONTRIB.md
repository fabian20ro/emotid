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
| `npm run check` | Run the complete local release gate |
| `npm run test:pwa` | Verify the production service-worker lifecycle |
| `npm run preview` | Preview production build locally |

## Adding a New Emotion Model

1. Create `src/models/<id>/` with `types.ts`, `index.ts`, data JSON file(s)
2. Extend `BaseEmotion` with model-specific fields
3. Implement `EmotionModel<YourType>` interface
4. Add the model ID to `MODEL_IDS` in `src/models/constants.ts`
5. Register the lazy model/route boundary in `src/features/check-in/registry.ts` and its visualizer in `src/components/ModelVisualization.tsx`
6. Add i18n keys to both `src/i18n/en.json` and `src/i18n/ro.json`
7. Add model, workflow, bilingual-copy, and browser-path tests at the smallest behavior boundary

## Conventions

- **Light and dark themes** — use semantic tokens and verify both rendered states
- **Bilingual** — all user-facing text needs both `ro` and `en` versions (i18n completeness test enforces key parity)
- **Portal modals** — all `position: fixed` overlays must use `createPortal(content, document.body)` to escape WebKit stacking contexts (see architecture codemap)
- **Touch targets** — use at least 44px; prefer 48px for dense mobile selection controls. SVG controls use an invisible hit shape
- **Safe-area insets** — applied per-component (Header top, bottom bar bottom), NOT on `#root`
- **Responsive behavior** — prove compact geometry at 320px and standard mobile geometry at 393px; do not infer it from a breakpoint
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
npm run check
```
