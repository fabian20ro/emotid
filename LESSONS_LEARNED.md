# Lessons Learned

> maintained by AI agents. validated, reusable insights.
> **read start of every task. update end of every iteration.**

## How to Use

- **start of task:** read before writing code — avoid known mistakes
- **end of iteration:** new reusable insight? → add to appropriate category
- **promotion:** pattern 2+ times in `ITERATION_LOG.md` → promote here
- **pruning:** obsolete → Archive section (date + reason). never delete.

---

## Architecture & Design Decisions

**[2026-07-29]** Model output becomes user history only after an explicit commitment — Persist the
user's committed input early, but keep inferred labels, needs, and actions optional. Derived
suggestions that are unconfirmed, partial, or rejected may remain visible in the Journal for
context, but must not silently enter pattern analytics as facts about the user.

**[2026-07-28]** Generated psychological copy needs a typed boundary from catalog prose — Do not
parse or splice emotion descriptions into generated narratives. Keep reviewed bilingual templates
in one typed module, let model logic select templates, and test that arbitrary catalog prose cannot
leak into synthesis. Catalog descriptions and generated interpretations have different review
scope and certainty requirements.

**[2026-07-22]** Preserve the external AI handoff contract during result-screen migrations — `allowExternalAI` gates a Google Search AI Mode link using `udm=50`; the existing localized `aiPrompt`/`aiPromptMultiple` templates receive only selected emotion names. Do not replace this with an API integration or alter query semantics without explicit product intent.

**[2026-02-07]** Planning drift occurs when priority docs are inferred instead of read — Re-read `ANALYSIS.md` before ordering work. Quote exact section IDs/phase numbers when mapping priorities. Treat planning docs as authoritative artifacts.

**[2026-02-07]** Mobile clipping/overlap issues come from weak height constraints — Enforce explicit parent-child height chains (`h-full`, `min-h-0`) and normal-flow layout. Prefer structural sizing fixes over hardcoded transforms. Keep touch targets >=44px (>=48px for dense chip rows).

**[2026-02-24]** Emotion seed data includes deliberate non-obvious corrections — Preserve these unless explicitly revalidated: Plutchik `nostalgia = [serenity, sadness]`, Plutchik `compassion = [trust, sadness]`, duplicate `aggressiveness` stays replaced by `ruthlessness`, wheel uses `overwhelmed` instead of non-emotion label `busy`, and the dimensional model keeps extra unpleasant-calm emotions to avoid quadrant sparsity.

**[2026-07-22]** Begin with experience, not theory selection — On mobile, asking users to choose an emotion model before describing their state adds cognitive load at the moment capacity may be lowest. Start with words, body, placement, or uncertainty; expose named models later as optional tools.

**[2026-07-22]** Rehaul presentation around one shared safety boundary — Route-specific screens may own input state and reuse different model engines, but all completion must converge through the same crisis evaluation, temporal escalation, reflection, and persistence controller. This enables independent UI replacement without safety drift.

## Code Patterns & Pitfalls

**[2026-07-22]** Fixed mobile shells need explicit grid areas and scroll reset — Conditional rows such as offline banners can shift auto-placed content and push navigation outside the viewport. Name shell grid areas, keep the content row `minmax(0, 1fr)`, and reset the internal content scroller whenever the destination changes.

**[2026-02-07]** Temporary script format must match module mode — `.js` + `require(...)` fails in `"type": "module"` repos. Use `.cjs` for CommonJS temporary scripts. Always check `package.json` module type before writing temp scripts.

**[2026-02-07]** Long `node -e` commands are brittle and expensive to debug — Quoting/syntax breakage in large inline commands causes repeated iterations. Move complex logic into script files. Reserve `node -e` for short commands only.

**[2026-07-29]** Psychological source data needs fail-closed provenance — Unreviewed catalog prose
must not look reviewed because it exists in a data file, and research-informed somatic curation
must not be labeled clinical. Keep explicit provenance states, reject bypasses during loading and
CI, and describe evidence at the narrowest level it actually supports.

## Testing & Quality

**[2026-07-29]** Mobile dialog focus return needs an explicit opener — Mobile Safari does not
reliably make a tapped button `document.activeElement`, so a trap cannot always infer where focus
must return. Pass the opener explicitly for touch-triggered overlays, preserve it across React
development-effect replays, restore only after the background becomes interactive, and verify the
same contract in WebKit and Chromium.

**[2026-07-22]** Theme colors need paired semantic foreground and background tokens — Reusing white text on a lightened dark-theme accent produced a 2.03:1 contrast ratio. Validate computed foreground/background contrast in real browser states, including overlays and post-action screens, rather than checking token values alone.

**[2026-02-07]** Preference tests become flaky when bypassing storage facade — Direct `localStorage` writes did not align with app read path. Mock/assert through `storage.get()` for behavior tests. Keep direct `localStorage` assertions for storage-layer tests only.

**[2026-02-07]** Duplicate text in UI requires scoped assertions — Single-match queries (`getByText`) fail where duplicate labels are expected. Use scoped or multi-match queries. Validate text uniqueness before using `getByText` single-match.

**[2026-02-07]** Build diagnostics should separate language correctness from toolchain instability — `npm run build` can fail in SW/PWA stage despite passing `tsc` and tests. Run `npx tsc -b` and tests as primary correctness gates. Report persistent plugin failures separately from app regressions.

**[2026-02-07]** Mobile visual fixes require measurement-backed validation — Repeated iterations result from unmeasured visual assumptions. Pair screenshots with scripted geometry checks at `393x742`. Capture before/after visuals and numeric bounds.

**[2026-07-23]** Browser visibility is not viewport visibility — Playwright `toBeVisible()` passes for controls rendered below the viewport or behind a sticky action. For mobile flows that reveal controls, assert `toBeInViewport()` and compare bounding boxes against adjacent sticky or fixed UI.

**[2026-07-23]** Geometry assertions must use one current layout snapshot — Smooth scrolling and entrance animation made an Affect Map test compare pre-scroll plot coordinates with post-scroll tray coordinates. Measure every related rectangle synchronously inside one browser evaluation and poll the derived gaps; never retain page-relative bounds across an interaction that can scroll or animate.

## Performance & Infrastructure

**[2026-07-26]** PWA development tests do not prove offline installation behavior — An empty
Workbox `globPatterns` list left the application dependent on visited-resource runtime caches.
Verify a production build with a controlled service worker, unvisited lazy chunks, offline reopen,
and a two-version update while asserting IndexedDB survival.

**[2026-02-07]** Browser automation can fail due to missing expected channel/runtime — Playwright MCP expected Chrome path unavailable. Verify runtime first, switch to local Playwright binaries if missing. Check browser availability before UI audits. Keep a fallback scripted audit path ready.

**[2026-02-07]** Sandbox restrictions can block local server/browser startup — `EPERM` during dev server and browser launch. Escalate as soon as a required command fails under sandbox rules. Assume UI audit setup may need escalation.

## Dependencies & External Services

**[2026-07-26]** Safety contacts require current source verification before becoming actionable — Do not preserve a phone number merely because it already exists in copy or tests. Verify the country, service, availability, and dialing format through the hotline lookup source, then update links, bilingual copy, and deterministic tests together.

**[2026-02-07]** Documentation accuracy depends on source verification — Stale behavior statements required follow-up fixes. Verify implementation details against actual source before writing docs. Map each doc claim to file/function evidence.

**[2026-07-28]** Dependency majors require the complete peer cohort and an honest engine floor — ESLint 10 became viable only after synchronizing `@eslint/js`, TypeScript ESLint, React Hooks, and React Refresh, then raising the Node development baseline to the strictest supported range. Validate with a clean `npm ci`, `npm ls`, lint, and the complete product suite; do not normalize resolver warnings with a permanent force install.

**[2026-02-17]** Always run `npm outdated` before and after updates — Distinguishes semver-compatible updates (`npm update`) from major version bumps (explicit `npm install pkg@latest`). Check peer dependency conflicts before batching major bumps.

**[2026-04-11]** Vitest packages must move together — Upgrading `vitest` without matching `@vitest/coverage-v8` left `package-lock.json` with incompatible peers and broke `npm ci` in CI. Treat `vitest` and `@vitest/*` helpers as a synchronized set; regenerate the lockfile and verify with fresh `npm ci`.

## Process & Workflow

**[2026-03-29]** Keep `AGENTS.md` in the ROM layer only — if a fact is discoverable from code, docs, configs, or tests, keep it out of bootstrap memory. Put repeated corrections in `LESSONS_LEARNED.md`; keep raw single-session observations in `ITERATION_LOG.md`.

**[2026-06-06]** GitHub Actions state can outrun local refs — For CI fixes, trust `gh run list/view` for the failing `headSha`, then `git fetch --all --prune` before comparing with local `origin/main`. Do not call a run stale from local refs until fetch succeeds.

---

## Archive

<!-- Lessons that are no longer applicable. Keep for historical context. -->
<!-- Format: **[YYYY-MM-DD] Archived [YYYY-MM-DD]** Title — Reason for archival -->

**[2026-02-17] Archived [2026-07-28]** ESLint 10 blocked by TypeScript ESLint — Obsolete after
TypeScript ESLint 8.65 added ESLint 10 support. The replacement lesson records the synchronized
peer and Node-engine requirements.

**[2026-06-19] Archived [2026-07-29]** Catalog regeneration must preserve curated copy — Replaced
when the full-catalog audit found that presence was not evidence of review. Regeneration now
preserves only descriptions explicitly marked `reviewed`, retains translated labels and needs,
and rejects somatic context claims without provenance.
