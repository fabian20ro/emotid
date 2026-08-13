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

**[2026-08-04]** Same-document browser navigation needs snapshots, not depth counters — A
`popstate` event does not say whether traversal moved backward or forward. Store and validate the
typed destination stack in every History entry, restore that exact snapshot, and rotate a
generation when a tab reset must invalidate older workflow entries.

**[2026-07-30]** Workflow extraction must preserve recency, not only final values — Ordered
persistence can have an older base write and a newer revision write in flight together. Model
workflow status with explicit events, carry whether a resolved write is still latest, and test that
an older success cannot hide a newer failure. Keep safety construction pure and shared by every
entry route.

**[2026-07-30]** Lazy feature screens need explicit loaded dependencies — Loading a screen and its
model in parallel is insufficient if the screen then relies on a hidden module cache. Let the
feature boundary inject the concrete loaded engine so screen state stays synchronous, direct tests
remain deterministic, and retry/loading behavior has one owner.

**[2026-07-29]** Model output becomes user history only after an explicit commitment — Persist the
user's committed input early, but keep inferred labels, needs, and actions optional. Derived
suggestions that are unconfirmed, partial, or rejected may remain visible in the Journal for
context, but must not silently enter pattern analytics as facts about the user. When a rejected
result remains for provenance, every history surface must frame it as a suggestion that did not
fit; a bare emotion heading contradicts the user's rejection even when analytics are correct.

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

## Code Patterns & Pitfalls

**[2026-08-13]** Async deadlines need cancellation and generation isolation — Racing a timeout
against a write only stops the caller from waiting; it does not stop the underlying mutation.
Propagate `AbortSignal` to the transaction boundary, reject new work while a non-cancellable write
is unresolved, rotate workflow generations on reset, and ignore obsolete or late completion. Keep
diagnostics structural and transient: operation ID, kind, duration, outcome; never user content.

**[2026-07-22]** Fixed mobile shells need explicit grid areas and scroll reset — Conditional rows such as offline banners can shift auto-placed content and push navigation outside the viewport. Name shell grid areas, keep the content row `minmax(0, 1fr)`, and reset the internal content scroller whenever the destination changes.

**[2026-02-07]** Temporary script format must match module mode — `.js` + `require(...)` fails in `"type": "module"` repos. Use `.cjs` for CommonJS temporary scripts. Always check `package.json` module type before writing temp scripts.

**[2026-02-07]** Long `node -e` commands are brittle and expensive to debug — Quoting/syntax breakage in large inline commands causes repeated iterations. Move complex logic into script files. Reserve `node -e` for short commands only.

**[2026-07-29]** Psychological source data needs fail-closed provenance — Unreviewed catalog prose
must not look reviewed because it exists in a data file, and research-informed somatic curation
must not be labeled clinical. Keep explicit provenance states, reject bypasses during loading and
CI, and describe evidence at the narrowest level it actually supports.

**[2026-08-07]** Reviewed guidance needs explicit no-suggestion provenance — Missing guidance
cannot distinguish "not reviewed" from "reviewed and intentionally omitted." Record a reviewed
`null` decision at the source boundary, keep hydration output empty, and make route inventories
skip that decision. This prevents repeated audits and pressure to invent emotion-to-need mappings.

**[2026-08-07]** Guidance review scope follows confirmable results, not loaded model entries — A
model may load hidden variants, intermediate nodes, or generated combinations that do not match
what a user can commit. Derive each inventory from production roots, transitions, and analyzer
semantics; retain the exact reachable IDs in the batch so UI changes make scope drift visible.

**[2026-08-07]** Comparison prose is a choice-set capability — Reviewing one label is insufficient
when nearby options remain undescribed. Derive sibling groups from production structure and expose
comparison only when every visible option has reviewed bilingual copy. Partial groups fail closed;
tests must cover both the newly complete group and an intentionally incomplete one.

**[2026-08-04]** Enriched psychological inputs need a fail-closed analysis boundary — A base
region becomes a body signal only after sensation and intensity are valid. Validate that complete
shape once before scoring and reuse the guard for UI selection filtering; do not encode the
contract as an unchecked cast or duplicate partial property checks.

## Testing & Quality

**[2026-08-13]** Native acceptance adapters need stable cross-platform hooks — Copy migrations left
the Android, iOS, and macOS adapters waiting for obsolete labels while browser behavior remained
correct. Reuse semantic state (`data-testid`, state class, ARIA state) for navigation and completion;
assert localized accessible names only when naming or speech is the behavior under test. After the
third shared selector, centralize the selector contract but keep platform actions local.

**[2026-08-12]** Safety acknowledgments need an explicit focus handoff — When acknowledging crisis
resources removes the active control and reveals reflective content, focus does not acquire a useful
destination automatically. Focus the newly revealed result heading, keep the support message first
in document order, and verify the transition in unit, rendered-browser, and native-browser tests.

**[2026-08-12]** Programmatic focus must also be visible in the visual viewport — DOM focus can be
correct while Safari Page Zoom leaves the destination behind browser chrome or outside the current
visual viewport. Use one shared destination helper after repeated focus handoffs: focus without
scrolling, measure against `visualViewport`, and reveal only when clipped. Test both visible and
clipped paths; do not make every focus transition scroll unconditionally.

**[2026-08-12]** Native-browser readiness requires stable observable state — Element presence does
not prove that React effects, Safari rotation, or CoreSimulator lifecycle transitions have settled.
Wait for the exact state under test and, for geometry, require consecutive aligned layout and
visual-viewport samples. Reject transient `unknown` restoration values and stale native overlays;
never weaken product assertions to accommodate harness races.

**[2026-08-12]** External screen-reader keyboards need transport-specific calibration — Host
window switching, pointer forwarding, and modifier layout can alter assistive-technology focus
without changing DOM focus. For TalkBack through scrcpy AOA, disable mouse forwarding, make the
mirror foreground before preparing the checkpoint, and verify the actual Action modifier on the
connected keyboard. Retain Android focused-node data plus before/activation/after visuals; do not
infer success from the host window alone.

**[2026-08-13]** TalkBack audio needs source and language attribution — On Pixel 6a / Android 17,
scrcpy `playback` produced digital silence while `output` captured TalkBack speech. Validate volume
before transcription and retain the actual TTS-dispatch voices alongside app, browser, Android,
and dominant audio languages. A mixed transcript can contain localized page labels plus TalkBack
roles/instructions in the device language; it does not by itself prove an app localization defect.
Audio remains supporting evidence beside bound TalkBack/touch exploration, exact AX names, native
activation, visible speech output, and route postconditions.

**[2026-08-09]** Physical browser targeting needs two independent exact proofs — A matching CDP
page is not proof that Android displays the same Chrome tab. Give every browser audit a unique URL
token, require the exact token in both the non-standalone CDP page and Chrome's native URL bar,
and fail instead of falling back to a stale target. Match the parsed query value, not an arbitrary
hierarchy substring or token prefix.

**[2026-08-04]** Seed browser state only after stopping the previous app instance — writing
`localStorage` while an old React tree is alive can race its persistence effects and silently
restore stale language or preferences. Navigate to an inert same-origin document, clear and seed
storage there, then start one fresh application navigation.

**[2026-08-04]** Physical browser execution is not automatically assistive-technology evidence —
DevTools activation on a connected phone can prove production assets, persistence, layout, and the
accessibility tree, but it bypasses TalkBack gestures and speech. Label it supporting evidence.
Require an input source Android recognizes as external for TalkBack keyboard shortcuts, and retain
spoken-output evidence before marking a screen-reader row passed.

**[2026-08-04]** Long-lived evidence cannot share a runner-owned output root — Playwright cleans
`test-results/` at suite start. Keep physical-device recordings and traces in a separate ignored
artifact directory, then verify their presence after all automated suites finish.

**[2026-08-03] Updated [2026-08-13]** Longitudinal UI needs metric-local evidence thresholds — One
or two observations are entries, not a personal pattern. Each summary must count only entries that
contain the evidence it presents; unrelated entries cannot satisfy a shared global gate. Keep the
small thresholds in one pure policy, use factual non-conclusive labels, and test both sides plus
the transition after deletion.

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

**[2026-08-04]** Trace deprecations through every executable entrypoint — A production build and a
browser-test worker can call the same deprecated Node API through different owners. Run traced
focused commands for each affected entrypoint, upgrade direct/synchronized cohorts at their
owners, and verify the resolved tree; do not infer that one clean build or a warning suppression
fixes the runner.

**[2026-08-03]** GitHub namespace retirement and Git transport state can diverge — Account or
organization renames can permanently retire heavily used `OWNER/REPOSITORY` combinations. A live
repository may remain readable through the web and REST API with `disabled: false` while smart
HTTP returns `Your repository is disabled`; renaming that repository may not help when the block
follows its repository ID. Before owner changes, inventory affected repositories and create full
ref bundles. During recovery, verify `git ls-remote` after every rename; if the block follows the
ID, retain the repository as a metadata archive and publish a fresh repository ID.

**[2026-07-26]** Safety contacts require current source verification before becoming actionable — Do not preserve a phone number merely because it already exists in copy or tests. Verify the country, service, availability, and dialing format through the hotline lookup source, then update links, bilingual copy, and deterministic tests together.

**[2026-02-07]** Documentation accuracy depends on source verification — Stale behavior statements required follow-up fixes. Verify implementation details against actual source before writing docs. Map each doc claim to file/function evidence.

**[2026-07-28]** Dependency majors require the complete peer cohort and an honest engine floor — ESLint 10 became viable only after synchronizing `@eslint/js`, TypeScript ESLint, React Hooks, and React Refresh, then raising the Node development baseline to the strictest supported range. Validate with a clean `npm ci`, `npm ls`, lint, and the complete product suite; do not normalize resolver warnings with a permanent force install.

**[2026-02-17]** Always run `npm outdated` before and after updates — Distinguishes semver-compatible updates (`npm update`) from major version bumps (explicit `npm install pkg@latest`). Check peer dependency conflicts before batching major bumps.

**[2026-04-11]** Vitest packages must move together — Upgrading `vitest` without matching `@vitest/coverage-v8` left `package-lock.json` with incompatible peers and broke `npm ci` in CI. Treat `vitest` and `@vitest/*` helpers as a synchronized set; regenerate the lockfile and verify with fresh `npm ci`.

## Process & Workflow

**[2026-08-13]** Accessibility instrumentation must not alter the active assistive-technology row —
Android `uiautomator dump` can launch a TalkBack permission activity and restart TTS. During a
TalkBack journey, use non-intrusive screenshot/CDP evidence; capture the native hierarchy only
after the final postcondition. Native Enter can also let a persistent control reclaim focus after
a synchronous React handoff; schedule destination focus for the next frame and retain a keyboard
regression.

**[2026-08-13]** Native adapters must follow accessible names and state-specific focus contracts —
Icon-only controls expose their name through `aria-label`, not text content. Resolve controls by
accessible name and keep selectors platform-local. After an overlay closes, verify that the exact
trigger owns focus and is visible; do not also require a scrolled-off screen heading to own focus.
Heading-entry focus and trigger-return focus are mutually exclusive state contracts.

**[2026-08-12]** Release documentation needs one owner per fact — Keep the active plan limited to
future work, the quality-gate document normative, the evidence ledger candidate-bound, and the
iteration log historical. Appending completed phases and newer runs to every document creates
contradictory candidates, test counts, and remaining-work claims. Link across roles instead of
copying status text. When three or more test adapters repeat acceptance metadata, centralize only
stable IDs, language scope, and evidence classes; validate human documentation and executable
registrations against it while leaving selectors, fixtures, and lifecycle platform-local.

**[2026-08-07]** Hardware test CLIs must validate before touching hardware — A physical-audit
script treated `--help` as an unknown no-op and started its full device suite. Handle help and
reject unsupported arguments before creating evidence directories, opening browsers, or calling
ADB; cover both paths with a process-level test that requires no connected device.

**[2026-08-04]** Inferred psychological guidance needs an explicit agency boundary — A tentative
emotion result can remain immediately useful without also showing needs, explanations,
interventions, or external AI. Keep the default result compact and closable; reveal interpretation
only after an explicit user choice, restore focus when returning, and verify that hidden guidance
is absent from the DOM across ordinary and crisis-gated routes.

**[2026-08-04]** Async browser races need explicit event gates, not fixed delays — Browser and
runner upgrades change how quickly a transient state can disappear. Hold the actual completion
event, assert the pending state and operation count, then release it explicitly. Keep page-native
timestamps separate from Playwright matcher polling when collecting performance evidence.

**[2026-03-29]** Keep `AGENTS.md` in the ROM layer only — if a fact is discoverable from code, docs, configs, or tests, keep it out of bootstrap memory. Put repeated corrections in `LESSONS_LEARNED.md`; keep raw single-session observations in `ITERATION_LOG.md`.

**[2026-06-06]** GitHub Actions state can outrun local refs — For CI fixes, trust `gh run list/view` for the failing `headSha`, then `git fetch --all --prune` before comparing with local `origin/main`. Do not call a run stale from local refs until fetch succeeds.

---

**[2026-08-13]** Psychological contracts must cover behavior, not only copy — A compliant disclaimer
does not neutralize a contradictory rule. Test crisis prominence, inference, persistence, and
history-driven behavior against the same agency and uncertainty constraints as visible language.

---

## Archive

<!-- Lessons that are no longer applicable. Keep for historical context. -->
<!-- Format: **[YYYY-MM-DD] Archived [YYYY-MM-DD]** Title — Reason for archival -->

**[2026-07-22] Archived [2026-08-13]** Rehaul presentation around one shared safety boundary —
The shared completion boundary remains correct, but temporal escalation was removed because saved
label history cannot justify stronger present urgency. The active contract now requires
current-session crisis visibility only.

**[2026-08-13] Archived [2026-08-13]** Android playback capture is not TalkBack speech evidence —
Initial probes found only accessibility earcons through scrcpy `output` and no reliable microphone
transcript. Replaced after a longer Android 17 probe established that scrcpy `output`, unlike
`playback`, captures TalkBack speech; the active lesson now requires source, volume, and language
attribution instead of rejecting audio capture categorically.

**[2026-02-17] Archived [2026-07-28]** ESLint 10 blocked by TypeScript ESLint — Obsolete after
TypeScript ESLint 8.65 added ESLint 10 support. The replacement lesson records the synchronized
peer and Node-engine requirements.

**[2026-06-19] Archived [2026-07-29]** Catalog regeneration must preserve curated copy — Replaced
when the full-catalog audit found that presence was not evidence of review. Regeneration now
preserves only descriptions explicitly marked `reviewed`, retains translated labels and needs,
and rejects somatic context claims without provenance.
