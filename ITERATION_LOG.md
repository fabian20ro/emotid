# Iteration Log

> Append-only journal of AI agent work sessions on this project.
> **Add an entry at the end of every iteration.**
> When patterns emerge (same issue 2+ times), promote to `LESSONS_LEARNED.md`.

## Format

Each entry should follow this structure:

---

### [YYYY-MM-DD] Brief Description of Work Done

**Context:** What was the goal / what triggered this work
**What happened:** Key actions taken, decisions made
**Outcome:** Result — success, partial, or failure
**Insight:** (optional) What would you tell the next agent about this?
**Promoted to Lessons Learned:** Yes/No

---

### [2026-03-29] Maintenance audit after pulled config changes

**Context:** Re-audited the repo after a `git pull` to align the existing agent-memory system with the setup guide without dropping project-specific memory.
**What happened:**
- Slimmed `AGENTS.md` down to bootstrap-only ROM content: refs to `LESSONS_LEARNED.md`, `ITERATION_LOG.md`, `SETUP_AI_AGENT_CONFIG.md`, core constraints, and active sub-agents only.
- Moved non-obvious model data corrections out of `AGENTS.md` into `LESSONS_LEARNED.md`; added a process lesson clarifying the ROM/RAM/log split.
- Replaced overlapping generalist sub-agent `senior-software-engineer.md` with focused `architect.md`.
- Fixed stale `CLAUDE.md` references inside `code-simplifier.md`.
- Added missing `SETUP_AI_AGENT_CONFIG.md` and `.github/pull_request_template.md`.
**Outcome:** Success. Memory layers clearer, stale references removed, missing maintenance artifacts added.
**Insight:** After config files already exist, setup work should behave like a maintenance migration, not a reset. Preserve durable lessons; only move them to the right layer.
**Promoted to Lessons Learned:** Yes

### [2026-03-16] Periodic maintenance audit of agent config files

**Context:** Applied SETUP_AI_AGENT_CONFIG.md periodic maintenance protocol to audit all config files against the research-backed guide.
**What happened:**
- Audited AGENTS.md: added `work style: telegraph` directive, removed discoverable project description (already in README), added `Legacy & Deprecated` section, added periodic maintenance reference, added file paths to sub-agents table, condensed to template structure. Went from ~73 lines to ~65 lines.
- Audited LESSONS_LEARNED.md: condensed verbose "How to Use" section to match template's compact format. All 11 active lessons retained — all still relevant.
- Audited ITERATION_LOG.md: 5 entries since last maintenance (2026-02-17 to 2026-02-27). No unhandled patterns detected — all promotable insights were already handled.
- Audited sub-agents: 6 agents. 3 under 100-line limit (agent-creator 65, planner 70, code-simplifier 85). 3 over limit (psychologist 130, senior-software-engineer 126, ux-expert 176). Flagged ux-expert as most bloated but preserved domain-specific content that earns its place per SkillsBench research.
- Cross-file consistency: zero overlap between AGENTS.md and LESSONS_LEARNED.md. Sub-agents table matches `.claude/agents/` directory. All file references valid.
**Outcome:** Success. Config files leaner, aligned with guide template. No content lost.
**Insight:** The 100-line limit for sub-agents is a guideline, not a hard rule — domain-specific advisory agents (psychologist, ux-expert) carry knowledge that isn't model-native or codebase-discoverable. Trimming would lose curated value.
**Promoted to Lessons Learned:** Yes

---

### [2026-02-24] Restructure AI agent config per setup guide

**Context:** Applied research-backed AI agent configuration guide (Evaluating AGENTS.md, SkillsBench) to restructure project config files. Goal: remove discoverable content from agent context, keep only non-discoverable policy/constraints.
**What happened:**
- Swapped CLAUDE.md ↔ AGENTS.md roles: CLAUDE.md is now a redirect ("Read AGENTS.md"), AGENTS.md is the canonical bootstrap file.
- Trimmed AGENTS.md from 151 lines (old CLAUDE.md content) to ~65 lines. Removed: tech stack listing, quality gate commands, persistence contracts table (was already stale — 6 keys documented vs 8 in storage.ts), new model checklist, UI interaction rules, docs map. All discoverable from codebase.
- Preserved: operating priorities, safety guardrails (all 5), data integrity notes (all 5), constraints (client-only, i18n mandate, portal/focus-trap, crisis determinism), learning system, workflow essentials.
- Added 2 new sub-agents: `planner.md` (implementation planning for multi-step features) and `agent-creator.md` (meta-agent for creating new specialists).
- Kept all 4 existing project-specific agents unchanged (psychologist, senior-software-engineer, code-simplifier, ux-expert).
- Did NOT add architect.md — senior-software-engineer already covers that role.
- Fixed phantom reference to nonexistent `TODOS.md` (replaced with `ANALYSIS.md`).
**Outcome:** Success. Config files are leaner, policy-focused. Zero code changes — build/tests unaffected.
**Insight:** The Persistence Contracts table being stale (6 vs 8 keys) validated the guide's core premise: duplicating discoverable info creates drift. The portal/focus-trap invariant was kept despite being visible in code because the WebKit stacking context bug it prevents is non-obvious.
**Promoted to Lessons Learned:** No (one-time restructuring, not a reusable technical pattern)

---

### [2026-02-17] Update dependencies to latest versions

**Context:** Branch `claude/update-dependencies-1g80E` — update all project dependencies to current versions.
**What happened:**
- Ran `npm update` for semver-compatible bumps (framer-motion 12.29->12.34, @vitejs/plugin-react 5.1.2->5.1.4, @playwright/test 1.58.1->1.58.2, @types/react 19.2.10->19.2.14, typescript-eslint 8.54->8.56).
- Installed major version bumps: `@types/node` ^24->^25, `eslint-plugin-react-refresh` ^0.4->^0.5, `globals` ^16->^17, `jsdom` ^27->^28.
- Attempted ESLint 9->10 and @eslint/js 9->10 but hit `ERESOLVE` peer dependency conflict with `typescript-eslint` (requires eslint ^8.57 or ^9). Skipped.
- Verified: build passes, all 366 tests pass (49 files), lint errors unchanged (39 pre-existing, not regressions), 0 npm audit vulnerabilities (was 1 high before update).
**Outcome:** Success. All non-blocked dependencies updated. ESLint 10 deferred.
**Insight:** Always check `npm outdated` to distinguish semver-compatible from major bumps. Attempt major bumps together but be ready to back off individual packages on peer conflicts. Verify lint error count before and after to confirm no regressions.
**Promoted to Lessons Learned:** Yes (ESLint 10 constraint, npm outdated workflow)

---

### [2026-02-17] Migrate memory system to two-file format

**Context:** Replaced the observational-memory single-file system (`LESSONS_LEARNED.md` with raw incident buffer, observation log, and reflector cycle) with a two-file system: curated `LESSONS_LEARNED.md` + append-only `ITERATION_LOG.md`.
**What happened:**
- Migrated 11 existing observations from the old format into categorized sections (Architecture, Code Patterns, Testing, Performance, Dependencies).
- Active Guardrails content was dissolved into the categorized lessons (each guardrail traces back to a specific lesson entry).
- Created `ITERATION_LOG.md` as the new temporal journal.
- Updated `AGENTS.md` with the memory & continuous learning workflow.
- Updated `CLAUDE.md` Lessons Loop section to reference both files.
**Outcome:** Success. All prior knowledge preserved, system simplified from 3 sections (buffer/log/reflector) to 2 files with clearer roles.
**Insight:** The old observational-memory format was powerful but required agents to understand a complex 3-phase cycle. The two-file split (curated vs. raw) achieves the same signal/noise separation with less cognitive overhead.
**Promoted to Lessons Learned:** No (process change, not a reusable technical insight)

---

### [2026-02-25] Split large files and fix bugs

**Context:** Data JSON files exceeded the 25KB agent file-loading limit (somatic 59KB, plutchik 62KB, 4 wheel files 26-38KB). Five large components (15-22KB) also needed decomposition.
**What happened:**
- Split somatic `data.json` (59KB) into 5 files by body group (`head`, `torso-front`, `torso-back`, `arms`, `legs`). Initial 4-way split had torso at 25.9KB, so re-split into front/back.
- Split plutchik `data.json` (62KB) into 6 files by category (`primary`, `intensity`, `dyad`, `secondary-dyad`, `tertiary-dyad`, `opposite-dyad`).
- Split 4 oversized wheel files into halves (`happy-1/2`, `angry-1/2`, `sad-1/2`, `fearful-1/2`).
- All model `index.ts` files updated to spread-import split files and re-export merged data. Consumer imports updated to use model index re-exports.
- Split 5 large components: ResultModal (22KB→12KB, extracted ResultsView, ResultModalViews, result-modal-types), App (17KB→15KB, extracted FirstInteractionHint, useReminders hook), GuidedScan (17KB→12KB, extracted GuidedScanPhases), SessionHistory (17KB→8KB, extracted session-history-utils, SessionHistoryPanels), SettingsMenu (15KB→13KB, extracted SettingsToggle).
- Fixed 4 bugs: unhandled promise rejection on daily reminder (`.catch()`), silent storage failure logging (`console.warn`), synthesis `.pop()` mutation replaced with `.at(-1)` + `.slice()` + empty-array guard, `console.error` in production gated behind `import.meta.env.DEV`.
- Updated models and frontend codemaps.
**Outcome:** Success. All 366 tests pass, all data files under 25KB, all components under 15KB.
**Insight:** When splitting data by a natural axis, verify actual sizes — torso body group was 25.9KB which required a secondary split (front/back). Using `.cjs` extensions for Node.js splitting scripts avoided ESM issues per LESSONS_LEARNED.md.
**Promoted to Lessons Learned:** No

---

### 2026-02-27 — Wheel breadcrumb navigation for multi-level selection

**Context:** The Emotion Wheel only allowed selecting level 2 (leaf/tertiary) emotions. Users who felt a broad emotion like "happy" without specificity were forced to pick an arbitrary leaf, producing inauthentic selections.
**What happened:**
- Added `WheelBreadcrumb.tsx` component — absolute overlay at top of visualization area showing drill-down path (e.g., `Happy > Playful`). Tapping any segment selects that emotion and resets to root.
- Added `breadcrumbPath` (derived from parent chain) and `handleBreadcrumbSelect` to `useEmotionModel` hook. Path is computed, not stored — no ModelState changes needed.
- Used `BaseEmotion & { parent?: string }` type assertion in hook since `parent` lives on `WheelEmotion`, not `BaseEmotion`. Generic hook can't import wheel-specific types.
- Added `topInset` parameter to `calculateDeterministicPositions` and `calculateRandomPositions` in `bubble-layout.ts` so bubbles don't spawn under the breadcrumb overlay. Passed through `VisualizationProps`.
- Consulted psychologist agent: multi-level selection is clinically valid. Forced leaf selection can produce inauthentic data for alexithymic users or those experiencing broad undifferentiated states.
- UX expert recommended absolute overlay positioning (same pattern as `FirstInteractionHint`) to avoid layout shift / ResizeObserver issues. This was critical given the user's note about visibility issues when space changed.
- Added i18n strings for en/ro. Added 9 tests (path derivation, breadcrumb selection, duplicate prevention).
**Outcome:** Success. 374 tests pass, build succeeds, typecheck clean.
**Insight:** When a generic hook needs to access model-specific fields (like `parent`), use inline type assertion rather than importing model-specific types to preserve the hook's model-agnostic design. Derived state (walking parent chains) is preferable to stored state for simple hierarchies.
**Promoted to Lessons Learned:** No

---

### 2026-02-27 — Expand Emotion Wheel with 53 new leaf-level emotions

**Context:** The emotion wheel had 165 emotions (7 L0 root, 41 L1 intermediate, 117 L2 leaf). User requested analysis by psychologist agents per emotion family to identify gaps and add new leaf-level emotions that make sense in both English and Romanian.
**What happened:**
- Launched 7 psychologist sub-agents (one per emotion family: Happy, Surprised, Bad, Fearful, Angry, Disgusted, Sad) to analyze gaps in emotional granularity.
- Agents returned ~65 candidates. After conflict resolution (9 cross-family ID collisions resolved via suffix patterns, different RO labels, or drops), finalized 53 new L2 emotions.
- Added entries across all 11 data files: happy-1 (+7), happy-2 (+3), surprised (+4), bad (+6), fearful-1 (+4), fearful-2 (+4), angry-1 (+3), angry-2 (+7), disgusted (+5), sad-1 (+6), sad-2 (+4).
- Each entry includes bilingual labels, adaptive descriptions (~100-150 words each in RO/EN), needs, correct color matching siblings, parent reference, and parent children array update.
- Zero code changes — the spread-operator auto-discovery in `index.ts` picks up all new JSON entries automatically.
- Created `IMPROVEMENT_PLAN.md` documenting multi-tree emotion membership (emotions belonging to multiple parent families) as a future architectural improvement, with 11 specific cross-family duplicate observations.
- Key conflict resolutions: `depleted` uses "Secatuit" (RO) to avoid collision with `drained/Epuizat`; `exposed_sad` and `helpless_sad` use suffix pattern to avoid collisions with fearful equivalents; `self_critical` (Angry) vs `self_blaming` (Sad) differentiated by focus.
- Special description care: "obsessive" framed as transient anxiety loop not OCD; "burned_out" as emotional state not clinical syndrome; "passive_aggressive" as learned communication strategy; "self_loathing" validates while encouraging professional support.
**Outcome:** Success. 374 tests pass (49 files), all parent-child bidirectionality validated, no duplicate IDs, no orphans. Total emotions: 165 → 218.
**Insight:** When adding emotions across families, always check for ID collisions across all 11 data files first. The suffix pattern (e.g., `embarrassed_sad`, `exposed_sad`) is the established convention for same-concept-different-context emotions. Romanian labels need extra care for compound phrases (e.g., "Tratat cu condescendenta" for patronized is long but necessary).
**Promoted to Lessons Learned:** No

---

### [2026-04-11] Fix GitHub Actions npm ci failure from Vitest peer mismatch

**Context:** GitHub Pages deploy run `24269632901` failed during `npm ci` with `ERESOLVE` because `vitest` was bumped to `^4.1.2` while `@vitest/coverage-v8` stayed on `^4.0.18`.
**What happened:**
- Read `LESSONS_LEARNED.md` first; then checked local repo and found it stale versus remote `main`, so fetched `origin/main` and switched to a fix branch from the failing revision.
- Confirmed remote `package.json`/`package-lock.json` mismatch via `gh api`: root requested `vitest ^4.1.2` but `@vitest/coverage-v8 ^4.0.18`, and the lockfile still carried `@vitest/coverage-v8` peer `vitest 4.0.18`.
- Updated `package.json` to `@vitest/coverage-v8 ^4.1.2`, regenerated `package-lock.json`, then verified with fresh `npm ci`, `npm test`, and `npm run build`.
**Outcome:** Success. `npm ci` now passes locally; tests passed (`52` files, `396` tests) and production build succeeded.
**Insight:** For Vitest upgrades, helper packages like `@vitest/coverage-v8` need to stay on the same release line as `vitest` or CI will fail before tests even start.
**Promoted to Lessons Learned:** Yes

---

---

### [2026-05-05] Safety hardening: modal portals, external-link consent, deterministic crisis time, focus trap drift

**Context:** Implement 4 high-priority audit tasks (overlay safety, privacy gate, trap robustness, deterministic crisis semantics).
**What happened:**
- Refactored `ModalShell` to always render through `createPortal(..., document.body)` with SSR-safe fallback.
- Added explicit external AI consent setting (`allowExternalAI`) in storage + App state + Settings UI; default remains off; Result modal hides outbound CTA when off and shows explanation copy.
- Extended EN/RO i18n with external-link consent labels and disabled-state messaging.
- Hardened `useFocusTrap` against focus drift (Tab when active element outside trap now rehomes to first/last focus target).
- Refactored temporal crisis functions to accept optional `nowMs` injection for deterministic boundary testing; expanded tests for exact 7-day cutoff behavior.
- Updated tests for new settings props and external-link gating; all targeted tests pass.
**Outcome:** Success.
**Insight:** One shared modal primitive with internal portalization gives low-change, high-leverage compliance across all overlays and keeps behavior consistent.
**Promoted to Lessons Learned:** No

### [2026-05-07] Tighten temporal crisis escalation coverage

**Context:** Hourly maintenance pass. Temporal crisis logic is safety-critical and already has deterministic boundary tests; a missing escalation case was a low-risk, useful regression guard.
**What happened:**
- Added a regression test proving `escalateCrisisTier('tier2', ...)` advances to `tier3` when the temporal high-distress threshold is met.
- Verified the focused temporal crisis test file after installing dependencies with `npm ci`.
**Outcome:** Success. Behavior unchanged; coverage slightly stronger.
**Insight:** Tier-by-tier escalation deserves explicit coverage, especially in crisis-gating code where auditable behavior matters.
**Promoted to Lessons Learned:** No

---

### [2026-05-11] Repo sweep: keep tests green during branch audit

**Context:** Ran a one-by-one test sweep across the repos under `/workspace/git` on the current branch.
**What happened:** Verified `npm test` in `emot-id` failed, traced it to Romanian translation keys missing from the completeness check, added the missing `groundingTitle`, `groundingBody`, and `bridges.cognitiveFromDimensional` entries in `src/i18n/ro.json`, and re-ran the suite successfully.
**Outcome:** Success — `npm test` passes and the repo is left with only the intended tracked edit.
**Insight:** Translation completeness tests are easiest to satisfy by restoring the missing source-of-truth keys instead of weakening the check.
**Promoted to Lessons Learned:** No

---

### [2026-05-11] Polish dimensional copy in EN/RO

**Context:** Small maintenance pass on the locale strings for the dimensional model.
**What happened:** Corrected Romanian typos in the dimensional prompts and aligned both locales around clearer pleasantness/intensity wording in `src/i18n/en.json` and `src/i18n/ro.json`.
**Outcome:** Success. Copy is cleaner, and the i18n completeness test still passes.
**Insight:** Locale text drifts are easiest to catch when the paired EN/RO strings stay semantically parallel instead of only matching key sets.
**Promoted to Lessons Learned:** No

---

### [2026-05-12] Document default-off external AI links in README

**Context:** Small maintenance pass after reviewing the privacy-facing UI copy.
**What happened:** Updated `README.md` so the "Explore further" line now states that external AI links stay off by default, matching the consent-gated outbound behavior in the app.
**Outcome:** Success. Documentation now reflects the opt-in privacy boundary more accurately.
**Insight:** When a feature can send user-selected content outside the app, the README should call out the default-off state explicitly so the privacy story stays aligned with the UI.
**Promoted to Lessons Learned:** No

---

### [2026-05-12] Hide DimensionalField axis labels after first mobile interaction

**Context:** Follow-up polish from the UX action plan. The dimensional view keeps axis labels visible even after the user has already interacted, which can keep priming the user on mobile.
**What happened:**
- Added mobile detection in `DimensionalField` with a `hasInteracted` gate.
- Hid the axis labels after the first field, dot, or suggestion interaction on mobile only; desktop stays unchanged.
- Added a focused regression test that mocks `matchMedia` and proves the labels disappear after the first mobile interaction.
**Outcome:** Success. Mobile-only guidance is less persistent, and the existing desktop behavior remains intact.
**Insight:** For small UX gates, make the trigger explicit and keep the desktop path stable; a focused viewport-specific regression test is enough to lock the boundary.
**Promoted to Lessons Learned:** No

---

### [2026-05-13] Align crisis temporal note copy

**Context:** Small maintenance pass on the crisis banner temporal-note copy.
**What happened:**
- Fixed the Romanian `crisis.temporalNote` typo in `src/i18n/ro.json`.
- Aligned the English `crisis.temporalNote` copy in `src/i18n/en.json` and the CrisisBanner fallback string in `src/components/CrisisBanner.tsx` so the runtime default matches the locale text.
- Verified with the focused i18n completeness test and a production build.
**Outcome:** Success. User-facing copy is clearer and the fallback stays in sync.
**Insight:** When a locale string is also used as a runtime fallback, update the component default together with the translation files to avoid drift.
**Promoted to Lessons Learned:** No

---

### [2026-05-13] Refresh test-count doc and fix ResultModal temporal-note assertion

**Context:** Small maintenance pass during autopilot. The repo docs still mentioned an older test count, and one ResultModal regression test no longer matched the actual crisis-banner fallback copy.
**What happened:**
- Updated `ANALYSIS.md` to report the current Vitest inventory: 400 tests across 52 files.
- Adjusted `src/__tests__/ResultModal.test.tsx` to assert the current temporal-note copy (`pattern appearing more often lately`).
- Verified with `npm test` after the change.
**Outcome:** Success. Documentation is current and the full suite passes again.
**Insight:** When a runtime copy string drifts, fix the assertion to the live contract unless the product text itself is the thing that needs changing.
**Promoted to Lessons Learned:** No

---

### [2026-05-13] Announce timed micro-intervention phases for assistive tech

**Context:** Small accessibility pass on the timed micro-intervention flow. The breathing and savoring prompts change text over time, but the changing phase text was not explicitly exposed as a live region.
**What happened:**
- Added `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` to the breathing phase text in `src/components/MicroIntervention.tsx`.
- Added the same live-region attributes to the savoring step text so both timed prompts announce updates consistently.
- Added focused tests that render each timed prompt and assert the live-region contract.
- Verified with `npm exec vitest -- run src/__tests__/MicroIntervention.test.tsx` and `npm run build`.
**Outcome:** Success. The timed intervention prompts are now more screen-reader friendly without changing visible behavior.
**Insight:** Any prompt that updates on a timer should expose the changing instruction as a status region, otherwise assistive tech can miss the phase transitions entirely.
**Promoted to Lessons Learned:** No

---

### [2026-05-13] Retitle stale IMPROVEMENT_PLAN reference in analysis doc

**Context:** Small docs cleanup during autopilot. `ANALYSIS.md` still referred to a nonexistent `TODOS.md` section even though the repo now tracks future work in `IMPROVEMENT_PLAN.md`.
**What happened:**
- Retitled the `ANALYSIS.md` section from `TODOS.md Disposition` to `Improvement Plan Disposition`.
- Replaced the remaining `TODOS.md: Implements ...` references in that section with `IMPROVEMENT_PLAN.md: Implements ...`.
**Outcome:** Success. The analysis doc now points at the real planning artifact instead of a dead filename.
**Insight:** When a repo’s follow-up work has moved from ad hoc TODOs into a named plan file, update the narrative docs to match the live artifact so future agents do not chase a file that does not exist.
**Promoted to Lessons Learned:** No

---

### [2026-05-14] Refresh test-count doc to match live Vitest inventory

**Context:** Small docs sync during autopilot. The analysis doc still reported the previous Vitest inventory after the suite grew by two tests.
**What happened:**
- Re-checked the live Vitest inventory with `npm exec vitest -- list --json` and confirmed 402 tests across 52 files.
- Updated `ANALYSIS.md` to reflect the current count.
**Outcome:** Success. Documentation now matches the observed test inventory.
**Insight:** When a count is used as a health signal in docs, verify it with the cheapest live inventory probe before editing and keep the number exact.
**Promoted to Lessons Learned:** No

---

### [2026-05-14] Clarify sound setting copy in EN/RO and README

**Context:** Small copy maintenance pass. The settings section still used the vague label "Sound effects", and the README had a typo in the sound-feedback bullet.
**What happened:**
- Renamed `settings.soundLabel` to `Sound` in `src/i18n/en.json` and `Sunet` in `src/i18n/ro.json`.
- Added focused `SettingsMenu` coverage for the sound section label in both English and Romanian.
- Reworded the README bullet to say the sound feedback "can be muted" instead of "mutable".
- Verified with focused Vitest runs for `SettingsMenu` and i18n completeness.
**Outcome:** Success. The settings copy is clearer and the docs now match the actual mute toggle.
**Insight:** Short, concrete labels work better for toggle sections; if a control is binary, the label should name the thing, not the effect.
**Promoted to Lessons Learned:** No

---

### [2026-05-14] Cover external AI consent copy in SettingsMenu

**Context:** Small privacy-copy maintenance pass. The settings drawer already exposes the external AI consent toggle, but the section had no focused regression coverage for the label and hint copy in both locales.
**What happened:**
- Added `SettingsMenu` assertions for the external AI consent label and hint in English.
- Added matching Romanian assertions to protect the localized privacy copy.
- Verified the focused `SettingsMenu` test file after the change.
**Outcome:** Success. The privacy-facing settings copy now has direct regression coverage in both languages.
**Insight:** Consent-gated features deserve explicit copy assertions, especially when the wording explains where user content is sent.
**Promoted to Lessons Learned:** No

---

### [2026-05-14] Harden breathing exercise regression coverage

**Context:** Small accessibility-oriented maintenance pass. The breathing micro-intervention already exposes a live status region, but its full inhale → hold → exhale → check-in cycle had no focused regression test.
**What happened:**
- Expanded `src/__tests__/MicroIntervention.test.tsx` with a fake-timer test that steps through the full breathing cycle and verifies the follow-up check-in appears at completion.
- Kept the existing assistive-tech announcement assertions in place for the initial breathing and savoring prompts.
- Verified with focused Vitest on the MicroIntervention test file.
**Outcome:** Success. The timed breathing flow now has direct regression coverage.
**Insight:** Timer-driven support flows are easiest to keep stable when the test exercises the whole cycle, not just the initial render state.
**Promoted to Lessons Learned:** No

---

### [2026-05-14] Polish crisis-adjacent copy in EN/RO

**Context:** Small copy-maintenance pass. The numbness guidance line had an awkward English phrasing and a Romanian grammar error, which made the safety-adjacent guidance read less cleanly than the surrounding copy.
**What happened:**
- Reworded `somatic.numbnessFlooding` in `src/i18n/en.json` to say the body may be "trying to protect you".
- Fixed the matching Romanian string in `src/i18n/ro.json` so it now reads naturally.
- Tightened the Romanian crisis helpline detail to use `România`.
- Verified the locale files with the focused i18n completeness Vitest.
**Outcome:** Success. The support copy reads more naturally in both locales without changing behavior.
**Insight:** Safety-oriented guidance should stay calm and grammatically clean; tiny copy fixes matter there because users read them under stress.
**Promoted to Lessons Learned:** No

---

### [2026-05-15] Clarify external AI opt-in wording in README

**Context:** Small docs maintenance pass. The README mentioned that external AI links stay off by default, but it did not say the switch lives in Settings.
**What happened:**
- Reworded the README "Explore further" bullet to say external AI links stay off by default and require explicit opt-in in Settings.
**Outcome:** Success. The privacy boundary is a little clearer for first-time readers.
**Insight:** When a feature is privacy-sensitive, naming the place where the opt-in lives reduces guesswork and keeps docs aligned with the UI.
**Promoted to Lessons Learned:** No

---

### [2026-05-15] Surface simple language and reminder controls in README

**Context:** Small docs-discoverability pass. The app already exposes simple language mode and daily reminders in Settings, but the README's feature list did not mention them.
**What happened:**
- Added a README feature bullet calling out simple language mode and daily reminders as accessibility/pacing controls.
**Outcome:** Success. The public-facing docs now surface a couple of existing user controls that were previously easy to miss.
**Insight:** When a feature lives behind Settings but materially changes the user experience, mention it in the top-level README so discoverability matches the app.
**Promoted to Lessons Learned:** No

---

### [2026-05-15] Localize settings language buttons

**Context:** Small copy polish pass. The settings drawer had a hardcoded Romanian label without diacritics, and the language switch buttons were not covered by locale-specific regression tests.
**What happened:**
- Added `menu.languageRo` and `menu.languageEn` to `src/i18n/en.json` and `src/i18n/ro.json`.
- Swapped the hardcoded `Romana` / `English` button text in `src/components/SettingsMenu.tsx` for the localized menu strings, with readable fallbacks.
- Added focused `SettingsMenu` assertions for the localized language buttons in both English and Romanian.
- Verified with focused Vitest runs for `SettingsMenu` and i18n completeness.
**Outcome:** Success. The language controls now read cleanly in both locales and have direct regression coverage.
**Insight:** Even tiny hardcoded labels in a settings drawer are worth routing through i18n when the rest of the menu already is.
**Promoted to Lessons Learned:** No

---

### [2026-05-16] Surface emotional vocabulary tracking in README

**Context:** Small docs-discoverability pass. The app already shows a Past Sessions vocabulary panel with top identified emotions and milestone counts, but the README feature list did not mention it.
**What happened:**
- Added a README feature bullet calling out emotional vocabulary tracking in Past Sessions.
**Outcome:** Success. The top-level docs now surface another existing user-facing insight panel that was easy to miss.
**Insight:** If the UI already summarizes a meaningful persisted view of the user's behavior, the README should name it explicitly so readers know it exists before they open the app.
**Promoted to Lessons Learned:** No

---

### [2026-05-16] Clarify external AI hint as Google Search

**Context:** Small copy-maintenance pass. The settings drawer already exposed the external AI consent toggle, but the hint still described it generically as an external search engine.
**What happened:**
- Updated `settings.allowExternalAIHint` in `src/i18n/en.json` and `src/i18n/ro.json` to name Google Search explicitly.
- Synced the `SettingsMenu` fallback hint and focused `SettingsMenu` test assertions to the new wording.
- Verified the targeted `SettingsMenu` Vitest file after the copy change.
**Outcome:** Success. The privacy-facing copy is more precise and still passes focused regression coverage.
**Insight:** When a consent-gated link really resolves to one specific public service, naming it explicitly is clearer than using a generic "external search engine" placeholder.
**Promoted to Lessons Learned:** No

---

<!-- New entries go above this line, most recent first -->

### [2026-07-22] Implement mobile experience rehaul

**Context:** Implemented the approved Daily Thread, Arrival, route-based check-in, and Meaning + Need rehaul with repeatable browser verification.
**What happened:**
- Replaced model-first global navigation and modal orchestration with Today/Explore/Journal, typed destinations, screen-based Back behavior, and revised onboarding without theory choice.
- Added Body Compass, progressive Affect Map, Word Ladder, Plutchik Explore access, crisis-first Meaning + Need reflection, next-step choice, Journal/session detail, split Settings/Privacy/Support, local patterns, and light/dark themes.
- Preserved existing model engines, bilingual catalog, additive IndexedDB sessions, save-disabled behavior, offline operation, and deterministic direct/temporal crisis evaluation.
- Replaced legacy E2E assumptions with 34 Playwright cases covering all primary routes, tier-4 gating through real UI input, persistence, browser Back, language, offline state, and geometry at 360x800, 393x742, and 430x932 in Mobile Safari and Mobile Chrome.
**Outcome:** Success. `npm run check` passes with 736 tests; `npm run test:e2e` passes all 34 cases.
**Insight:** Named grid areas and route-triggered scroll reset are required when optional chrome and internally scrolling screens share a fixed mobile shell.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-22] Plan mobile rehaul implementation

**Context:** Converted the approved six-concept mobile rehaul into an implementation blueprint grounded in the current component, model, persistence, i18n, and crisis-safety architecture.
**What happened:**
- Mapped every mock to reusable current assets and explicit product, interaction, data, and presentation gaps.
- Defined the target Today/Explore/Journal information architecture and the required full screens, secondary screens, and transient sheets.
- Specified a typed navigator, shared check-in contract, additive session metadata, and one route-independent safety boundary.
- Broke delivery into 25 reviewable slices and three releases, each with scoped files and verification gates.
**Outcome:** Success. `docs/mobile-rehaul-implementation-plan.md` is ready to guide implementation.
**Insight:** A screen rehaul can preserve safety-critical domain engines when routes own input state and one shared controller owns completion, crisis evaluation, reflection, and persistence.
**Promoted to Lessons Learned:** Yes

---

### [2026-05-16] Restore settings crisis copy keys

**Context:** `npm run build` failed in `src/components/SettingsMenu.tsx` because the `menu` i18n section no longer exposed `crisisSupport` and `crisisDetail`, while the component still referenced them.
**What happened:**
- Restored `menu.crisisSupport` and `menu.crisisDetail` in `src/i18n/en.json`.
- Restored the same keys in `src/i18n/ro.json`.
- Re-ran `npm run build` and confirmed the TypeScript/Vite pipeline completes.
**Outcome:** Success. The settings drawer crisis support block type-checks again.
**Insight:** When a component already owns fallback-safe copy usage, the fastest recovery is usually to restore the missing locale keys rather than reshaping the component.
**Promoted to Lessons Learned:** No

---

### [2026-05-17] Tighten AnalyzeButton coverage

**Context:** Compound Autopilot small-scope run on clean `agent/compound/emot-id`; selected a test-only improvement around existing analyze button contracts.
**What happened:**
- Added focused tests for dimensional and somatic disabled guidance.
- Added focused test for enabled selection-count label.
- Kept implementation unchanged.
**Outcome:** Success. Focused AnalyzeButton tests and TypeScript build passed.
**Insight:** No new reusable project lesson; this was straightforward characterization coverage.
**Promoted to Lessons Learned:** No

---

### [2026-06-06] Fix latest GitHub Pages deploy JSON failure

**Context:** Latest GitHub Pages deploy run 27015785171 failed on `main@54a8308be0a6089fb255a0bf24fff04077051747` during `npm ci`.
**What happened:**
- Fetched remote refs after local `origin/main` proved stale.
- Fixed invalid `package.json` syntax by adding the missing comma between `check` and `check-translations` scripts.
- Verified with `npm ci`, `npm test`, and `npm run build`.
**Outcome:** Success. The CI-blocking JSON parse error is fixed locally on `codex/fix-latest-deploy-json`.
**Insight:** When Actions says latest and local refs disagree, fetch before drawing conclusions from local `origin/main`.
**Promoted to Lessons Learned:** Yes

---

### [2026-06-19] Restore generated emotion catalog integrity

**Context:** Container-local green gate reported 19 failures after catalog extraction erased curated bilingual fields and omitted somatic-only emotions.
**What happened:**
- Changed the extractor to preserve existing non-empty localized catalog copy.
- Updated somatic extraction for `contextDescription` and `contextNeeds`.
- Regenerated 288 canonical emotions, restoring 12 somatic-only entries.
- Verified focused catalog/model tests and the complete local green gate.
**Outcome:** Success. All 476 tests, translation checks, lint, and production build pass.
**Insight:** Generated catalogs combine overlay structure with curated copy; either source alone is incomplete.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-13] Validate modal ARIA references after portal commit

**Context:** `ModalShell` checked child IDs during render, before portaled children existed in the document, producing false missing-target warnings.
**What happened:**
- Moved label/description target validation into a post-commit effect.
- Added regression coverage for valid child references and a genuinely missing label.
- Verified 599 tests, ESLint, TypeScript, and production build.
**Outcome:** Success — valid modal contracts stay quiet; genuine missing references still warn.
**Insight:** DOM-reference validation for portal children must run after commit, not during render.
**Promoted to Lessons Learned:** No

---

### [2026-07-22] Mobile UX and psychological rehaul concepts

**Context:** Audited the current mobile app and developed six mixable rehaul directions through mobile UX, accessibility, affective-science, and emotional-safety lenses.
**What happened:**
- Inspected onboarding, all four model surfaces, settings, quick check-in, and results at `393 x 742`.
- Documented strengths, structural problems, psychological risks, and a recommended experience-first information architecture.
- Created six standalone mobile mocks: Arrival, Body Compass, Affect Map, Word Ladder, Meaning + Need, and Daily Thread.
- Verified six rendered phone frames, page geometry, text fit, horizontal overflow, and control dimensions.
**Outcome:** Success. Review, mix-and-match matrix, final recommendation, interactive gallery, and preview images are available under `docs/`.
**Insight:** Theory-first navigation creates avoidable choice pressure; the models work better as adaptive tools behind an experience-first entry.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-22] Restore external AI handoff in mobile Reflection

**Context:** The mobile rehaul preserved the external-AI consent setting but dropped the gated Google AI Mode link when replacing `ResultModal` with `ReflectionScreen`.
**What happened:**
- Extracted the existing localized URL construction into one shared helper without changing prompt, conjunction, encoding, or `udm=50` behavior.
- Wired `allowExternalAI` into Reflection and restored the external link after consent, including tier-4 pre-acknowledgement gating.
- Added exact single/multiple-language URL tests and a full Playwright activation/back/persistence journey.
- Manually verified the rendered link at `393x742` and inspected its final encoded URL through Playwright.
**Outcome:** Success. `npm run check` passes with 739 tests; `npm run test:e2e` passes all 36 cases in Mobile Safari and Mobile Chrome.
**Insight:** Screen migrations must inventory consent-gated exits and other cross-cutting behaviors, not only visible result content.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-22] Gate deploys with Playwright and repair dark contrast

**Context:** The mobile migration lacked a GitHub Actions browser gate, and several light-theme foreground assumptions made dark-mode actions and guidance difficult to read.
**What happened:**
- Added Chromium and WebKit Playwright installation, execution, and failure-report upload before GitHub Pages deployment.
- Added semantic foreground/background token pairs for accent, warning, need, disabled, and danger states.
- Added computed browser contrast checks across primary screens, route states, portaled overlays, onboarding, and reflection completion.
- Manually inspected Today and Next Step at `393x742` in dark mode.
**Outcome:** Success. `npm run check` passes 739 tests; `npm run test:e2e` passes all 42 Mobile Safari and Mobile Chrome cases.
**Insight:** Dark themes need paired semantic color tokens plus stateful browser checks; palette-level review alone misses rendered contrast failures.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-22] Build the staged Body Compass route

**Context:** Implemented the highest-priority route slice after committing and pushing the mobile rehaul baseline.
**What happened:**
- Committed and pushed baseline `3c3bea1`; GitHub Pages run 29952930349 passed its Chromium and WebKit Playwright steps before deployment.
- Added route-local Area, Sensation, Intensity, and Review states while preserving the shared App completion and crisis boundary.
- Reused the lazy BodyMap, somatic scoring, and optional Guided Scan; added same-region replacement for safe review edits.
- Added bilingual copy, compact semantic body controls, edit/remove/add/skip paths, and removed sticky-action map occlusion.
- Added focused unit coverage and six dedicated browser cases across Mobile Safari and Mobile Chrome.
**Outcome:** Success. `npm run check` passes 743 tests; `npm run test:e2e` passes all 48 cases. Manual 393x742 checks covered every Body Compass stage and dark rendering.
**Insight:** Prefer accessible SVG region controls over coordinate clicks in browser tests; overlapping paths make coordinate targets semantically ambiguous. Utility navigation currently unmounts route-local drafts, so interruption policy should precede the next feature slice.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Repair Affect Map and replace Plutchik presentation

**Context:** The progressive Affect Map rendered nearby choices below the mobile viewport and
behind its sticky action, Plutchik still used the generic bubble scatter, Explore repeated
"Optional theory," and external AI links defaulted off.
**What happened:**
- Changed external AI links to default on while preserving an explicit stored opt-out and the
  existing Google AI Mode query contract.
- Reworked Affect Map geometry into normal flow, revealed three nearby emotion pins after
  placement, kept choices visible after selection, and added theme-aware map tokens.
- Added a deterministic eight-primary Plutchik wheel with two-choice gating and inline dyad
  feedback while reusing the existing model analyzer.
- Replaced generic Explore subtitles with route-specific bilingual copy.
- Added unit tests plus Playwright viewport, overlap, wheel-bound, dark-contrast, combination,
  exact-query, and preference-persistence coverage.
**Outcome:** Success. `npm run check` passes 747 tests, translation audit, lint, TypeScript, and
production build. `npm run test:e2e` passes all 54 Mobile Safari and Mobile Chrome cases.
**Insight:** DOM visibility does not establish mobile reachability; revealed controls need viewport
and adjacent-action geometry assertions.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-23] Move guided workflows out of legacy dialogs

**Context:** Today used vague therapeutic language, while the active vocabulary and chain-analysis
workflows still appeared as dark legacy modal windows inside the migrated mobile shell.
**What happened:**
- Replaced the Today prompt with direct, neutral bilingual language that names the task and next
  action.
- Converted vocabulary practice and chain analysis from modal overlays into route-level screens
  with shared headers, progress, responsive controls, and semantic light/dark theme tokens.
- Preserved workflow state and behavior while adding focused unit and Playwright coverage for
  navigation, input retention, sizing, dialog absence, and exact English/Romanian copy.
- Audited remaining legacy overlays and documented a presentation-only Body Compass migration
  slice, including caller cleanup and visual/interaction verification.
**Outcome:** Success. `npm run check` passes 747 tests, translation audit, lint, TypeScript, and
production build. `npm run test:e2e` passes all 60 Mobile Safari and Mobile Chrome cases.
**Insight:** Multi-step mobile exercises need normal screen navigation, not nested modal context.
Audit reachability before spending migration effort on legacy modules with no active callers.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Protect check-ins and extract Word Ladder

**Context:** Settings could unmount active check-ins and lose local work, while Word Ladder still
lived inside the generic model screen without hierarchy Back or accessible level selection.
**What happened:**
- Committed and pushed the prior migration as `17a7d05` before starting this slice.
- Hid Settings during check-in and Reflection while preserving explicit Back and tier-4 support.
- Extracted `WordLadderScreen` with route-local snapshots, exact one-level Back, selectable visited
  levels, removable selections, and the unchanged Wheel analyzer/completion boundary.
- Replaced buttons forced to `role="listitem"` with semantic lists and named buttons.
- Added bilingual unit and Playwright journeys; manually inspected the flow at `393x742` and
  removed a premature sticky completion action that covered options.
- Stabilized the Affect geometry assertion by waiting for its existing entrance animation.
**Outcome:** Success. `npm run check` passes 754 tests, translation audit, lint, TypeScript, and
production build. `npm run test:e2e` passes all 66 Mobile Safari and Mobile Chrome cases.
**Insight:** For a short deterministic hierarchy, route-local state snapshots provide reliable
one-level Back without changing the model contract or introducing a shared wizard abstraction.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Add user-driven Word Ladder comparison

**Context:** The extracted ladder could select broad and precise words but offered no focused way
to distinguish a choice from nearby words without restarting the hierarchy.
**What happened:**
- Captured the exact visible sibling set when an ancestor or leaf was selected; no similarity
  score, ranking, graph, or analyzer change was introduced.
- Added an optional bilingual comparison disclosure where the user chooses one sibling and sees
  both existing catalog descriptions with neutral, non-diagnostic wording.
- Preserved direct completion without comparison and cleared comparison state with its selection.
- Replaced the sticky completion action with normal-flow placement after manual `393x742`
  inspection found it covering the second row of comparison choices.
- Added broad, precise, Romanian, dark-contrast, keyboard, mobile-overflow, and no-overlap unit and
  Playwright coverage.
**Outcome:** Success. `npm run check` passes 756 tests, translation audit, lint, TypeScript, and
production build. `npm run test:e2e` passes all 68 Mobile Safari and Mobile Chrome cases.
**Insight:** Capturing the visible sibling set at selection time supports honest comparison without
inventing a similarity model; explanation can remain user-directed and deterministic.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Diagnose red GitHub Actions state

**Context:** Current `main` revision `58e279b` showed red Pages and Dependabot Actions runs after
the Word Ladder comparison release.
**What happened:**
- Inspected current and prior Pages logs plus the uploaded Playwright screenshots.
- Found one repeated Mobile Safari failure in the Affect Map geometry assertion; the test stores
  the plot bounds before the component's smooth scroll, then compares them with tray bounds after
  scrolling and during its entrance animation.
- Confirmed the screenshots show the tray below the plot; translations, lint, 756 unit tests,
  build, and the other 67 browser tests passed.
- Separately found Dependabot unable to update vulnerable transitive `@babel/core` from `7.29.0`
  to `7.29.6` because its resolver would downgrade `eslint-plugin-react-hooks` from `7.0.1`.
**Outcome:** Diagnosis complete; no product code changed. Pages red is a deterministic test bug,
not evidence of the depicted overlap. Dependabot needs an explicit dependency resolution change.
The exact `393x742` Mobile Safari case passed three local repetitions outside the sandbox, confirming
that the slower CI runner exposes timing sensitivity rather than a stable layout defect.
**Insight:** Geometry assertions must remeasure both elements in the same polling callback after
programmatic scrolling and entrance animation settle.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Repair Pages CI and Babel security resolution

**Context:** Approved the focused fixes after diagnosing the current Pages Playwright failure and
the independent Dependabot security-update failure.
**What happened:**
- Replaced stale cross-interaction bounding boxes with one polled browser-side snapshot measuring
  plot, suggestion tray, and action gaps synchronously.
- Added an npm override for patched `@babel/core`; regenerated the lockfile at `7.29.7` without
  downgrading `eslint-plugin-react-hooks@7.0.1`.
- Verified the exact `393x742` Mobile Safari case three times before the change and the full suite
  after it.
**Outcome:** Success locally. Clean `npm ci` resolves patched Babel. `npm run check` passes 756
tests, translation audits, lint, TypeScript, and production build. `npm run test:e2e` passes all
68 Mobile Safari and Mobile Chrome cases.
**Insight:** Layout relationships must be sampled atomically when an interaction can trigger
scrolling or animation; a retry around stale coordinates does not make the assertion deterministic.
**Promoted to Lessons Learned:** Yes

---

### [2026-07-23] Make Reflection needs user-selectable

**Context:** Reflection automatically saved the first inferred need, removing user agency when
several emotion results suggested different needs.
**What happened:**
- Reused the existing localized, deduplicated needs list as Reflection-local single-select state.
- Preselected exactly one inferred need; left multiple suggestions unselected; allowed the active
  choice to be cleared.
- Added compact bilingual controls with stable 50px targets and semantic pressed state while
  preserving next-step behavior and the shared save boundary.
- Verified the selected need in Journal detail and JSON export, with tier-4 controls remaining
  completely absent before acknowledgement.
- Added focused unit coverage plus a keyboard-driven multi-need Playwright journey across WebKit
  and Chromium.
**Outcome:** Success. `npm run check` passes 73 files and 762 tests, translation audits, lint,
TypeScript, and production build. `npm run test:e2e` passes all 70 Mobile Safari and Mobile Chrome
cases. Manual `393x742` inspection confirmed wrapped copy, selection state, and actions remain in
normal flow without overlap.
**Insight:** Optional inferred content should preserve agency explicitly: safe defaults for one
suggestion, no hidden ranking when several suggestions compete, and a reversible choice.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Make Guide Me deterministic

**Context:** Arrival's Guide Me option only reordered the same route cards, so it did not reduce
uncertainty or provide a meaningful recommendation.
**What happened:**
- Replaced route reordering with two concrete questions about locating a body signal and roughly
  placing a feeling without naming it.
- Added a pure decision function for Body, Affect, and Words handoffs; answers remain local and are
  never persisted, scored, or inferred from history.
- Made Back move exactly one question and kept an explicit return to all starting points on both
  questions, with no forced answer.
- Added matched English and Romanian copy, stable 92px choice controls, and dark-contrast/mobile
  bounds coverage.
- Added unit tests for every decision path and Playwright journeys for keyboard navigation,
  Romanian copy, Back, and direct handoff to all three routes.
- Ran repository-wide lint/check and Playwright serially after a parallel attempt exposed a
  transient `test-results` directory race between ESLint traversal and Playwright cleanup.
**Outcome:** Success. `npm run check` passes 74 files and 775 tests, translation audits, TypeScript,
and production build. `npm run test:e2e` passes all 76 Mobile Safari and Mobile Chrome cases.
Manual `393x742` inspection confirmed both questions fit without overlap or horizontal overflow.
**Insight:** A short, auditable signal-availability sequence can reduce route-selection load without
personalization, diagnosis, persistence, or a generic questionnaire abstraction.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Strengthen Journal data trust

**Context:** Journal displayed raw body IDs, detail omitted body signals, and Privacy export/delete
covered sessions but silently excluded chain exercises and preferences.
**What happened:**
- Centralized somatic sensation, intensity, and region display labels while preserving raw stored
  IDs and the existing session schema.
- Localized Journal body patterns and detail, showing body signals, selected need, and next step
  without mutating records; added explicit loading, error, and empty states.
- Added a versioned full-data export with fresh IndexedDB reads for sessions and chain entries plus
  resolved preferences and dynamic hint state.
- Made delete clear both IndexedDB stores and reset preferences/hints while preserving onboarding
  completion; synchronized the active UI to default settings.
- Replaced `window.confirm` with an opaque, portaled, focus-trapped confirmation. Manual inspection
  caught and removed panel opacity during entrance animation because underlying controls briefly
  showed through.
- Added unit and Playwright coverage for old records, no-mutation rendering, EN/RO labels,
  downloaded JSON contents, delete/reload, focus restoration, dark contrast, and mobile bounds.
**Outcome:** Success. `npm run check` passes 77 files and 786 tests, translation audits, TypeScript,
and production build. `npm run test:e2e` passes all 80 Mobile Safari and Mobile Chrome cases.
Manual `393x742` light/dark inspection confirmed an opaque, bounded dialog with no overlap.
**Insight:** A trustworthy local-data boundary needs one explicit inventory of every persistence
surface; display localization can stay separate from stable raw records and schema migration.
**Promoted to Lessons Learned:** No

---

### [2026-07-23] Remove unreachable legacy presentation

**Context:** P5 required deleting the modal-era UI after the routed mobile migration, while
preserving active compatibility, safety, and deferred Body Compass boundaries.
**What happened:**
- Traced runtime and test importers for Quick Check-in, result, history, settings, uncertainty,
  info, intervention, and sessions-only export surfaces.
- Deleted 15 unreachable production files and 9 dedicated test files; retained active journal
  analytics, repositories, modal/focus infrastructure, crisis logic, and Body Compass code.
- Removed 13 dead bilingual translation namespaces and updated translation contracts to cover
  active Settings, Support, and Privacy screens.
- Updated codemaps and added explicit zero-dialog browser assertions for Settings, Privacy, and
  Support.
- Compared production output before and after deletion.
**Outcome:** Success. `npm run check` passes 68 files and 637 tests. `npm run test:e2e` passes all
80 Mobile Safari and Mobile Chrome cases. Manual 393x742 dark inspection passed. Main CSS dropped
81.70 -> 65.20 kB (gzip 14.69 -> 12.41); main JS dropped 473.84 -> 463.19 kB (gzip 151.89 ->
148.87).
**Insight:** Import-graph deletion should distinguish similarly named active hooks from dead
components and retain compatibility APIs only when an independent active test or runtime caller
defines their contract.
**Promoted to Lessons Learned:** No

---

### [2026-07-24] Complete Body Compass presentation migration

**Context:** The staged Body Compass still embedded a dark legacy map that owned side selection,
picker dialogs, guided-scan orchestration, and SVG presentation in one generic visualizer.
**What happened:**
- Extracted a presentation-only `BodyRegionMap`; moved side state into `BodyCompassScreen` and kept
  sensation, intensity, review, edit, removal, scoring, and completion at the route boundary.
- Added paired light/dark map tokens and native SVG focus/hover behavior while preserving every
  region path, expanded hit path, and sensation/intensity encoding.
- Removed the unreachable generic `BodyMap`, `SensationPicker`, registry entry, and dedicated tests.
- Retained `GuidedScan` and `IntensityPicker` unchanged with their existing tests pending a
  separate keep/delete product decision.
- Added direct region-map unit contracts plus cross-browser keyboard, SVG contrast, side filtering,
  and 360x800/393x742/430x932 geometry coverage.
- Manually inspected light and dark 393x742 screens; increased label scale and corrected an
  edge-clipped long label found only in the rendered viewport.
**Outcome:** Success. `npm run check` passes 67 files and 625 tests. `npm run test:e2e` passes all
88 Mobile Safari and Mobile Chrome cases. Body route chunk: 23.30 -> 6.89 kB; CSS: 65.20 ->
63.69 kB.
**Insight:** Passing contrast ratios do not guarantee map legibility; SVG text can remain too small
after viewBox scaling. Pair computed contrast with rendered-size and edge-clipping inspection at
the actual constrained viewport.
**Promoted to Lessons Learned:** No

---

### [2026-07-24] Complete P6 release hardening

**Context:** The migrated routes had broad smoke coverage but no explicit bilingual, keyboard,
desktop, reduced-motion, or cross-route crisis release matrix. Affect placement was pointer-only.
**What happened:**
- Added arrow-key Affect placement through the existing nearest-emotion path, with localized
  nonvisual instructions, visible focus, and a live energy/pleasantness readout.
- Added Romanian journeys for Quick, Body, Affect, Words, Plutchik, Journal, Privacy, and tier-4
  safety behavior.
- Added keyboard-only primary-route completion, destructive-dialog focus restoration, reduced
  motion, offline recovery, save-disabled behavior, and 1280x800 desktop checks.
- Added one shared crisis-boundary assertion exercised through Quick, Body, Affect, Words, and
  Plutchik, preserving tier-4 acknowledgment gating.
- Excluded Playwright output directories from lint and Git after concurrent local checks exposed a
  generated-directory cleanup race.
- Manually inspected the focused Affect field in desktop light and dark themes.
**Outcome:** Success. `npm run check` passes 67 files and 628 tests. `npm run test:e2e` passes all
130 Mobile Safari and Mobile Chrome cases. The production build and bilingual audits pass.
**Insight:** A release matrix can expose inaccessible input semantics even when individual child
suggestions are keyboard-operable; test full route completion by input modality, not isolated
buttons. Generated test directories should also be excluded from repository-wide static scans.
**Promoted to Lessons Learned:** No

---

### [2026-07-26] Complete P7 reflection trust and safety boundary

**Context:** Reflection still converted emotion labels into automatic advice, retained inferred
content after explicit rejection, obscured the external Google handoff, and presented crisis
support through legacy styling and an unverified Romanian number. The unreachable Guided Scan
also retained unsupported clinical interaction code.
**What happened:**
- Replaced label-derived opposite actions and automatic breathing with three neutral,
  user-selected next steps; no step persists without an explicit choice.
- Made `Not really` withdraw inferred needs, meaning, AI, and next-step content, with revise and
  finish-without-label paths that persist no inferred need or action.
- Added uncertainty framing for partial fit and just-in-time Google AI Mode disclosure while
  preserving the fixed emotion-name-only `udm=50` query contract.
- Migrated crisis presentation, made support resources actionable, collapsed optional grounding,
  and clarified that selected labels cannot establish danger or self-harm intent.
- Verified the Romanian support resource before replacing stale copy and links; updated English,
  Romanian, unit, and browser contracts together.
- Deleted Guided Scan, its intensity picker/constants/tests, and the opposite-action lookup/tests.
- Manual 320x568 inspection found a hidden next-step heading after an internal view transition;
  added a local scroll reset and cross-browser regression assertion.
**Outcome:** Success. `npm run check` passes 65 files and 605 tests, bilingual audits, TypeScript,
lint, and production build. `npm run test:e2e` passes all 144 Mobile Safari and Mobile Chrome
cases. Manual 320x568 light/dark checks found no horizontal overflow; support links measured at
least 65px high.
**Insight:** A result screen preserves agency only when rejection removes downstream inference,
optional actions require an explicit choice, and internal subviews reset scroll independently of
route navigation. Safety contacts must be source-verified before becoming actionable.
**Promoted to Lessons Learned:** Yes — safety-contact verification.

---

### [2026-07-26] Complete P8 persistence trust

**Context:** Reflection entered its success screen immediately while `App` discarded the
IndexedDB promise. A failed local write could therefore be described as saved, and repeated taps
had no explicit in-flight guard.
**What happened:**
- Added shared reflection detail and save-outcome types; made `App.saveReflection` await the
  existing repository and return `saved` or `not-saved`.
- Added local idle, saving, error, and finished states to Reflection plus a synchronous in-flight
  ref and retained detail for exact retry.
- Added bilingual pending, failure, retry, and continue-without-saving UI with polite status and
  alert semantics; saved confirmation now depends on the actual repository outcome.
- Added unit coverage for unresolved writes, same-task duplicate clicks, rejection, exact retry,
  successful recovery, and Romanian continuation without saving.
- Added real-browser IndexedDB fault injection for delayed completion, first/permanent failure,
  retry, one-record persistence, and saving-disabled zero-write behavior.
- Manually inspected the recovery screen at 320x568 in light and dark themes, including bounds,
  touch-target geometry, keyboard focus, live-region order, and token colors.
**Outcome:** Success. `npm run check` passes 65 files and 608 tests, bilingual audits, TypeScript,
lint, and production build. `npm run test:e2e` passes all 152 Mobile Safari and Mobile Chrome
cases. The rendered recovery screen has no horizontal overflow; actions are 56px and 48px high.
**Insight:** Success copy at a persistence boundary must follow durable-write confirmation.
React-disabled controls are not a sufficient duplicate-write guard because multiple events can
arrive in one task; pair the pending state with a synchronous in-flight ref.
**Promoted to Lessons Learned:** No

---

### [2026-07-26] Complete P9 automated accessibility and PWA lifecycle

**Context:** Routed screens reset scroll without moving assistive-technology focus, browser zoom
was disabled, Reflection live regions announced whole replacement screens, and Workbox disabled
precache so offline behavior depended on previously visited resources.
**What happened:**
- Added one stable focusable screen heading per routed view, a heading-labelled main landmark,
  destination focus, and internal Reflection-state focus.
- Narrowed saving and failure announcements to their relevant message; synchronized document
  language and restored browser zoom.
- Added bilingual critical-journey semantics/focus coverage and a 200% desktop reflow equivalent
  in Mobile Safari and Mobile Chrome.
- Replaced short-lived runtime-only caching with 18 revisioned precache entries covering the shell
  and every lazy visualization chunk.
- Added a production-only two-build PWA harness proving offline reopen, unvisited Plutchik access,
  persisted Journal data, automatic update activation, and no unexpected external requests.
- Updated CI to Node 24-compatible action majors and added the PWA lifecycle as a separate gate.
- Manual 393x742 inspection caught a default outline on the programmatically focused heading;
  removed it without changing interactive focus indicators.
**Outcome:** Success. `npm run check` passes 65 files and 608 tests. `npm run test:e2e` passes all
160 Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the production lifecycle.
The build precaches 18 entries. Real VoiceOver and TalkBack device sessions remain a documented
manual release gate and were not claimed as automated.
**Insight:** A PWA requires production service-worker acceptance, not dev-server offline toggles.
Route focus and live-region scope also need rendered-browser checks because valid ARIA alone can
still produce duplicate announcements or visible noninteractive focus artifacts.
**Promoted to Lessons Learned:** Yes — production PWA lifecycle verification.

---

### [2026-07-27] Complete P10 product truthfulness

**Context:** Settings exposed three promises the client did not deliver: simple language never
changed copy, sound had no playback caller, and a "Daily reminder" could not run after the app
closed. Installed-app metadata and icons still represented the retired purple bubble UI.
**What happened:**
- Removed the simple-language, sound, and reminder controls plus their unused context, hooks,
  notification service, translations, and dedicated tests.
- Kept retired local-storage keys only in destructive cleanup so older installations still delete
  all preferences; moved full-data export to schema version 2 without changing saved records.
- Added pressed-button semantics for language and appearance in Settings and onboarding, with unit
  and cross-browser assertions.
- Replaced the `eid`/thought-bubble assets with a mask-safe four-color mark and aligned favicon,
  manifest, HTML metadata, README, codemaps, and plan status with the routed product.
- Extended the production PWA lifecycle to verify name, description, app ID, icon declarations,
  favicon, and metadata while retaining offline/update/data-survival coverage.
- Manual 393x742 Playwright inspection covered onboarding and Settings in light/dark themes; the
  accessibility snapshot exposed both selector groups and their current pressed values.
**Outcome:** Success. `npm run check` passes 64 files and 598 tests. `npm run test:e2e` passes all
160 Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the two-build production
lifecycle with 18 precache entries.
**Insight:** A persisted toggle is not a feature contract. Preference surfaces should remain
absent until their effect works across the lifecycle implied by their label.
**Promoted to Lessons Learned:** No

---

### [2026-07-28] Complete P11 dependency remediation

**Context:** GitHub reported six open Dependabot advisories. The installed npm graph expanded
those advisories to 21 affected packages, including direct Vite and ESLint tooling plus stale
Workbox and lint transitive chains.
**What happened:**
- Applied compatible patched versions for Vite, esbuild, PostCSS, fast-uri, AJV, TypeScript
  ESLint, and vite-plugin-pwa.
- Upgraded ESLint, `@eslint/js`, React Hooks, and React Refresh as one peer cohort; raised the
  documented Node development baseline to the strictest supported engine range.
- Added a narrow EJS 6 override for Workbox's off-main-thread Rollup plugin, removing its
  vulnerable Jake/filelist/minimatch chain without replacing the current PWA architecture.
- Fixed two new ESLint 10 findings without suppressions: preserved a caught JSON parse cause and
  removed an overwritten button-label initialization.
- Regenerated the lockfile, verified a clean install and peer tree, and archived the obsolete
  lesson that TypeScript ESLint blocked ESLint 10.
**Outcome:** Success. Clean `npm ci` and `npm ls` pass; `npm audit` reports zero vulnerabilities.
`npm run check` passes 64 files and 598 tests, bilingual audits, TypeScript, lint, and production
build. `npm run test:e2e` passes all 160 Mobile Safari and Mobile Chrome cases. `npm run test:pwa`
passes the two-build production lifecycle with 18 precache entries.
**Insight:** Security upgrades are dependency-cohort changes, not isolated version edits. Encode
patched direct minimums and the true Node floor, constrain stale transitive replacements narrowly,
then require clean-install, peer, browser, and production lifecycle gates.
**Promoted to Lessons Learned:** Yes — dependency peer cohorts and engine floors.

---

### [2026-07-28] Complete P12 psychological copy boundary

**Context:** Reflection synthesis and the active high-distress catalog mixed model output with
confident claims about causes, bodily mechanisms, identity, relational safety, and prescribed
needs. Generated synthesis also parsed the first sentence of arbitrary catalog descriptions,
making its certainty and review scope unpredictable.
**What happened:**
- Added a bilingual psychological copy contract grounded in user authority, explicit uncertainty,
  trauma-informed choice, non-diagnostic somatic framing, and conditional crisis directness.
- Separated all generated narratives and pleasant combinations into one typed bilingual module;
  synthesis logic no longer copies catalog descriptions into generated text.
- Moved the brief Reflection hypothesis from an inline language branch into paired i18n keys.
- Rewrote all 12 `negative-high` descriptions in English and Romanian as tentative,
  context-dependent possibilities with explicit limits on cause, severity, and risk inference.
- Added executable contract tests plus English, Romanian, and high-distress Playwright assertions.
  Crisis thresholds/gating, support resources, and Google AI Mode `udm=50` query semantics stayed
  unchanged.
**Outcome:** Success. `npm run check` passes 65 files and 604 tests. `npm run test:e2e` passes all
160 Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the production lifecycle; its
first restricted launch hit the known macOS Mach-port denial and passed when rerun outside that
process sandbox. Manual 393x742 inspection covered English light and Romanian dark Reflection
states with no clipping or console errors.
**Insight:** Catalog prose and generated psychological interpretation need different review
boundaries. Typed, reviewed templates prevent unreviewed descriptions from becoming stronger
claims through string extraction.
**Promoted to Lessons Learned:** Yes — typed generated-copy boundary.

---

### [2026-07-29] Complete P13 catalog and somatic provenance

**Context:** The remaining 276 catalog descriptions had no explicit review provenance, somatic
signals overstated research and clinical support, cross-body scoring inferred unsupported
coherence, and duplicate selected IDs could inflate support-prompt prominence.
**What happened:**
- Added fail-closed catalog hydration: 12 reviewed bilingual descriptions stay explicit; 276
  entries now receive one bounded, needs-aware exploratory template. Duplicate IDs, key
  mismatches, and unreviewed source descriptions are rejected.
- Reclassified every body association as a curated hypothesis, narrowed optional Nummenmaa
  provenance to group-map influence, removed unsupported context claims and coherence
  multipliers, and changed confidence-like labels to exploratory match language.
- Added a bilingual Body Compass evidence boundary before analysis and increased its rendered
  mobile size after Playwright inspection found the initial 12px treatment too weak.
- Centralized the distress inventory and combinations in one versioned safety-rules file shared by
  runtime and catalog extraction; deduplicated selected IDs and added order, padding, inventory,
  and combination invariants.
- Added `npm run check-copy` to CI-equivalent checks, made catalog extraction idempotent under the
  new provenance model, removed the obsolete somatic migration script, and reconciled current and
  historical architecture/psychology documents.
- Manual onboarding review caught universal and body-as-authority language outside the initial
  data audit. Replaced it in English and Romanian and extended the automated i18n copy scan.
**Outcome:** Success. `npm run check` passes 65 files and 607 tests; `npm run test:e2e` passes all
160 Mobile Safari and Mobile Chrome cases; `npm run test:pwa` passes the production lifecycle.
Manual 393x742 light/dark Playwright inspection confirms the Body Compass evidence note at
14px/20.3px without clipping. Catalog regeneration produces the same 288 entries on repeat runs.
**Insight:** Provenance must be fail-closed and narrower than the supporting evidence. A rendered
review remains necessary because repository-wide data audits can miss user-facing claims in
onboarding and can underweight consequential copy through typography.
**Promoted to Lessons Learned:** Yes — fail-closed psychological provenance.

---

### [2026-07-29] Complete P14/P15 early capture, explicit stopping, and replayable introduction

**Context:** Word discovery obscured that an intermediary emotion could be the final answer.
Reflection delayed the durable Journal write and added optional questions plus a second completion
click after the user had already named an emotion. The first-run introduction could not be replayed.
**What happened:**
- Added one pure session constructor/updater and a small ordered write boundary in `App`; base
  check-ins persist immediately, revisions retain identity, optional details update in place, and
  saving-disabled mode performs zero writes.
- Made every Word Ladder level an explicit result with a prominent current-word action, visible
  path actions, and focus movement. Reused the existing analyzer and shared completion boundary.
- Removed the completion interstitial. Reflection keeps one-tap `Done for now` visible before
  optional needs/steps, leaves all inferred needs unselected, keeps pending context visible, and
  distinguishes base-save from optional-detail failures.
- Added result-relationship presentation and excluded unconfirmed, partial, and rejected
  suggestions from vocabulary/valence patterns without changing stored records or crisis logic.
- Reused onboarding as a portaled, focus-trapped, dismissible Settings replay while preserving
  preferences. Hid the setup-only language chooser during replay.
- Independent simplicity-focused UX review identified the below-fold exit, silent need selection,
  blocking save view, crisis/status ordering, suggestion leakage, revision-state ambiguity,
  Romanian theme collision, intermediary stopping ambiguity, and duplicate replay language
  control. All findings were addressed before final verification.
- The final acceptance pass also drove revision-identity guarding, accurate whole-check-in versus
  detail-only failure headings, clearer `Add` versus `Continue` word actions, consistent Privacy
  terminology, and 44px compact controls.
**Outcome:** Success. `npm run check` passes 66 files and 618 tests. `npm run test:e2e` passes all
170 Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the production offline/update
lifecycle. Manual 393x742 dark inspection covered Reflection, intermediary Word Ladder selection,
Romanian Settings, and replay with no clipping, collisions, or console errors.
**Insight:** Persist the user's explicit commitment early; model-derived enrichment remains
optional and cannot become either a selected answer or a personal pattern without confirmation.
**Promoted to Lessons Learned:** Yes — explicit commitment boundary for model output.

---

### [2026-07-29] Complete P16 browser-observable assistive-technology hardening

**Context:** Physical VoiceOver/TalkBack acceptance remained after P9. Browser accessibility-tree
inspection reproduced skipped onboarding explanations, an unnamed Word Ladder focus target, an
over-broad crisis alert, and replay that replaced rather than retained its Settings context.
**What happened:**
- Focused every onboarding step heading, added localized semantic progress, and kept replay as a
  full-viewport body portal over an inert, assistive-hidden Settings surface.
- Extended the shared focus trap with explicit initial and return targets, stable callback handling,
  React development-effect resilience, and delayed restoration after the background is interactive.
- Passed the replay opener explicitly because Mobile Safari touch activation does not reliably
  focus buttons; verified trigger restoration in both browser engines.
- Focused Word Ladder's direct intermediary completion button and attached the alternative
  more-specific path as its accessible description.
- Narrowed crisis live alerts to the safety message while keeping verified resources immediately
  next in deterministic reading order; tiers, gating, and support actions are unchanged.
- Added repeatable first-run/replay, touch return, full-viewport, intermediary focus, crisis scope,
  keyboard trap, route focus, save-recovery, and reflow assertions.
- Manual 393x742 inspection caught Tailwind dropping a dynamic compound overlay selector; moved
  fixed portal geometry to the component and added numeric viewport-bound coverage.
**Outcome:** Success. `npm run check` passes 66 files and 618 tests. `npm run test:e2e` passes all
174 Mobile Safari and Mobile Chrome cases. `npm run test:pwa` passes the production offline/update
lifecycle after the known macOS Mach-port sandbox denial was rerun outside that process sandbox.
Manual 393x742 inspection confirms the corrected full-viewport replay with no exposed background
content. Physical synthesized-speech and gesture acceptance remains an explicit device gate.
**Insight:** Focus restoration must use the action that opened an overlay, not an assumption about
`document.activeElement`; rendered geometry also needs numeric coverage when build-time CSS
processing can remove dynamically named selectors.
**Promoted to Lessons Learned:** Yes — explicit mobile dialog opener.

---

### [2026-07-30] Complete P17 lazy feature boundaries and performance evidence

**Context:** Performance had no repeatable production evidence. Every destination and model engine
joined the startup graph; Today hydrated the complete model catalog for six quick choices; the
registry's somatic dynamic import was unreachable; stale manual chunk rules referenced deleted
files.
**What happened:**
- Added one typed check-in feature registry that parallel-loads each screen, concrete model, and
  visualization, injects the engine explicitly, caches successful promises, and exposes bilingual
  loading/failure recovery.
- Deferred Reflection and utility destinations, preserved route-heading focus across delayed
  rendering, and split Today onto a provenance-preserving quick catalog boundary.
- Removed the production-unused model-selection hook, the dual sync/async screen dependency, and
  stale model-data chunk rules.
- Added Vite manifest output, deterministic initial/entry/precache budgets, a production Mobile
  Chrome timing probe with CI artifacts, deferred-route focus coverage, and unvisited-route PWA
  cache assertions.
- Documented physical performance targets and the unautomatable VoiceOver/Safari plus
  TalkBack/Chrome release script.
**Outcome:** Main app JavaScript fell from 69.10 to 32.87 kB gzip; total initial JavaScript fell from
about 169.7 to 133.51 kB gzip. Full offline precache remains complete at 904.72 KiB. All 68 test
files and 620 tests pass; 176 Mobile Safari/Chrome cases and the production PWA lifecycle pass.
Physical hardware timing and synthesized-speech acceptance remain open device gates.
**Insight:** A lazy boundary must inject its loaded dependency; a hidden cache contract creates
timing-dependent screens and brittle direct tests.
**Promoted to Lessons Learned:** Yes — explicit dependencies at lazy feature boundaries.

---

### [2026-07-30] Complete P18 workflow boundary and P19 first-contact UX

**Context:** `App` still owned completion, safety escalation, revision identity, ordered writes,
retry state, and Reflection navigation. Quick words committed on first tap, guided support was last
on Arrival, the priority placement route was third, and the untouched Affect Map looked empty.
**What happened:**
- Extracted a pure completion builder, discriminated workflow reducer, ordered persistence hook,
  and deferred presentation host while preserving one safety boundary for every route.
- Added direct tests for temporal escalation disclosure, saving-off zero writes, stable retry
  identity, base/detail ordering, and stale-write status protection.
- Made Quick selection reversible and explicit before one localized Continue action; normalized
  quick-label casing.
- Reordered Arrival to Guide, Place, Words, Body and highlighted the guided path.
- Added a visible Affect placement prompt and readable initial axis labels without changing
  placement, suggestions, or selection semantics.
- Updated all browser and PWA journeys to the explicit Quick commitment. The first PWA run exposed
  one stale immediate-completion setup; adding the Continue action fixed it and the complete
  lifecycle passed.
**Outcome:** Success. `npm run check` passes 72 files and 631 tests. The full Playwright matrix
passes 180 Mobile Safari/Chrome cases. PWA and performance suites pass. Entry JavaScript is 31.95
kB gzip; total initial JavaScript is 132.59 kB gzip; precache is 909.15 KiB. Manual `393x742`
inspection found no overlap or console errors.
**Insight:** Workflow extraction must preserve write recency explicitly; final state alone cannot
distinguish a stale base success from a newer revision failure.
**Promoted to Lessons Learned:** Yes — workflow write-recency semantics.

---

### [2026-08-03] Diagnose disabled GitHub transport and migration options

**Context:** GitHub HTTPS fetch/pull returned `Your repository is disabled` and HTTP 403.
**What happened:**
- Confirmed clean local checkout, intact object database, and `main` one commit ahead of the last
  fetched remote head.
- Confirmed GitHub web and API access remain readable with repository admin permission while Git
  upload-pack access is blocked; REST metadata still reports `disabled: false`.
- Inventoried migration scope: 131 pull requests, 33 remote branches, no issues, releases, tags,
  stars, forks, repository secrets, or variables; GitHub Pages uses the `/emot-id/` path.
- The support ticket exposed an account-to-organization-to-account rename cycle affecting 12
  retired owner/repository tuples. Renaming the existing repository preserved ID `1144714166` but
  did not restore Git transport, proving the disable state followed the repository ID.
- Created and verified a full 83-ref bundle, retained the disabled repository and its 131 pull
  requests as `emotid-disabled-archive`, and created a fresh `emotid` repository.
- Updated package, Pages, PWA, test, and documentation paths while retaining `Emot-ID` branding and
  existing browser storage identifiers.
**Outcome:** Fresh repository migration completed with the disabled repository retained as an
archive; local origin now targets `fabian20ro/emotid`. `npm run check` passes 72 files and 631
tests, all audits, production build, and performance budgets. The PWA lifecycle passes after the
known macOS Mach-port sandbox denial was rerun outside that process sandbox.
**Insight:** Owner/repository tuple retirement and repository Git-transport disabling are distinct:
a rename can escape a retired tuple but cannot clear a transport disable flag attached to the
repository ID. Test transport after rename before relying on metadata preservation.
**Promoted to Lessons Learned:** Yes — GitHub namespace retirement and transport state.

---

### [2026-08-03] Complete P20 Journal autonomy

**Context:** Journal presented sparse counts as patterns and supported only all-data deletion, so a
person could neither control one sensitive entry nor distinguish observations from evidence.
**What happened:**
- Added a pure three-session evidence threshold and bilingual early-history state while preserving
  immediate access to every individual entry.
- Connected Session Detail to the existing exact-record repository deletion, with a portaled,
  focus-trapped confirmation, pending/failure states, cancellation focus restoration, and
  post-success Journal focus.
- Used red-first unit, component, repository, and browser tests; the browser journey verifies dark
  contrast, mobile bounds, body portal placement, exact deletion, and persistence after reload.
- Manually inspected the narrow mobile flow and stacked confirmation actions after finding a
  wrapped destructive label.
**Outcome:** P20 complete. Full unit/integration, two-engine Playwright, production PWA, build,
copy, lint, type, and performance gates pass. No persistence schema, safety logic, global state, or
new confirmation abstraction was introduced.
**Insight:** Longitudinal presentation should encode its evidence floor independently from storage,
and deletion tests must cover the threshold transition rather than only repository removal.
**Promoted to Lessons Learned:** Yes — explicit longitudinal evidence thresholds.

---

### [2026-08-04] Complete P21 deterministic navigation and repository truth

**Context:** Browser history stored only stack depth and every `popstate` removed one route, making
Forward behave like Back. The historical audit still looked actionable, dead legacy UI remained in
source/tests, and production assets had only 7,545 bytes of budget margin.
**What happened:**
- Added validated typed stack snapshots to History entries and reset generations that prevent stale
  check-in or utility routes from returning after a tab reset.
- Used red-first hook and Playwright coverage for exact Back/Forward, nested destinations, payloads,
  malformed state, replacement, and reset traversal.
- Removed seven modules with zero production importers, their three isolated legacy test files, and
  bilingual keys with no remaining callers; retained old preference export/reset compatibility.
- Reconciled `ANALYSIS.md` through a current disposition table and living-document links.
- Recompressed all PWA PNG icons losslessly; decoded hashes stayed identical.
**Outcome:** `npm run check` passes 71 active files and 579 tests. All 182 Mobile Safari/Chrome
cases, the production PWA lifecycle, and the performance proxy pass. Production assets are 871,620
of 960,000 bytes, down 80,835 bytes; CSS is down 8.28 kB. The proxy reports 46.5 ms startup,
121-375.2 ms first-route opens, and no long tasks.
**Insight:** History direction cannot be inferred from `popstate`; exact snapshots plus reset
generations are the smallest deterministic model. Dead Tailwind-scanned source can cost production
CSS even when its JavaScript is tree-shaken.
**Promoted to Lessons Learned:** Yes — browser History snapshots and reset generations.

---

### [2026-08-04] Complete P22 Body Compass usability

**Context:** Body Compass exposed only an SVG map, forced a separate review stage after every
signal, and passed enriched region records into analysis through an unchecked cast. This made
non-visual region selection unclear, interrupted multi-area entry, and trusted an implicit runtime
contract.
**What happened:**
- Added one semantic List alternative beside Front and Back; every mode shares the same region,
  sensation, and intensity flow and the list replaces rather than duplicates the map tree.
- Removed the mandatory review stage. Intensity commits immediately, returns to the picker, focuses
  the inline signal, and keeps edit/remove/add-more plus one results action in the same context.
- Decoupled the fixed anatomy picker from transient model visibility so removal never makes an area
  unavailable for the rest of the check-in.
- Added a fail-closed somatic analysis boundary and derived the sensation type from one runtime
  value list, removing the unchecked model cast.
- Reworked English and Romanian Body Compass copy and added compact responsive/dark/focus styles.
- During manual `320x568` dark inspection, found the sticky results action covering inline content;
  moved it into normal flow and added a two-engine geometry/style regression.
**Outcome:** Success. `npm run check` passes 71 files and 580 tests. All 186 Mobile Safari/Chrome
cases, the production PWA lifecycle, and the performance proxy pass. Manual Playwright
inspection covered `393x742` map/list/signal states and `320x568` dark compact rendering with zero
console errors and no horizontal overflow. Physical VoiceOver/TalkBack acceptance remains open.
**Insight:** Enriched psychological selections need one runtime-validating boundary before scoring;
alternate visual and semantic selectors should converge on one activation flow.
**Promoted to Lessons Learned:** Yes — fail-closed enriched-input analysis.

---

### [2026-08-04] Complete P23 release-candidate baseline and evidence contract

**Context:** Node 26 builds and Playwright workers emitted `module.register()` deprecations,
Browserslist data was stale, Chromium warned about missing standards PWA capability metadata, and
the remaining physical VoiceOver/TalkBack and Android timing gates had no candidate-bound evidence
record.
**What happened:**
- Added a red-first document contract for standards plus Apple PWA capability metadata and verified
  both declarations in the production offline/update lifecycle.
- Upgraded the synchronized Tailwind cohort to 4.3.3, Playwright to 1.62.1, and Browserslist data;
  traced build and test entrypoints to prove both deprecated loader owners were removed.
- Added one physical evidence template covering candidate identity, bilingual browser/installed-PWA
  VoiceOver and TalkBack journeys, three-run Android medians, temporary DevTools-only save failure
  and tier-4 fixtures, defect disposition, and sign-off.
- Adapted upgraded-browser tests with explicit IndexedDB completion gates and direct offline network
  proof. Enriched the performance artifact with activation and per-resource timing, then used a
  page-side readiness mark so matcher polling could not inflate route timing.
- Inspected Today, Arrival, Affect, Body List, and Plutchik at `393x742` light and `320x568` dark;
  every capture had exact viewport width and no console error or warning.
**Outcome:** `npm run check` passes 72 files and 581 tests; all 186 Mobile Safari/Chrome cases, the
production PWA lifecycle, and the performance proxy pass. Initial JavaScript is 132,914 bytes gzip;
production assets are 874,828 of 960,000 bytes. The proxy reports about 50 ms startup, 35 ms
Body/Affect/Words, 324 ms Plutchik, and no long tasks. Production dependency audit findings: zero.
Physical synthesized-speech, installed-device, and low/mid Android timing acceptance remains open.
**Insight:** Deprecations must be traced per executable entrypoint, and deterministic browser tests
must gate the event they care about rather than sleeping around it.
**Promoted to Lessons Learned:** Yes — entrypoint-specific deprecation tracing and explicit async
event gates.

---

### [2026-08-04] Prepare unlimited local Android device testing

**Context:** P24 required real TalkBack, installed-PWA, and Android hardware evidence, but no
unmetered physical-device control existed and commercial device clouds imposed usage limits.
**What happened:**
- Installed Android Platform Tools 37.0.1, Android SDK command-line/build tools, the emulator
  binary required by diagnostics, scrcpy 4.1, Appium 3.6.0, and UiAutomator2 8.2.2; reused existing
  Java 21 and ffmpeg.
- Added one shared shell environment sourced by login and interactive zsh shells; Appium doctor
  now reports zero required fixes.
- Detected the connected Pixel 6a over USB; authorization remains a physical confirmation on the
  phone after its Android update.
- Added a repeatable Pixel developer-mode, authorization, TalkBack, validation, and teardown guide.
**Outcome:** The Mac-side Android physical-test stack is installed without a hosted account or
minute limit. Device execution waits only for the Pixel's USB-debugging authorization.
**Insight:** An unlimited physical acceptance setup means locally owned hardware; keep optional
native-app bundle and alternate-streaming dependencies out of a web-PWA toolchain.
**Promoted to Lessons Learned:** No — first occurrence.

### [2026-08-04] Run P24 Android physical acceptance

**Context:** The release candidate needed physical Android browser, installed-PWA, TalkBack, and
hardware timing evidence. The owner could not remain beside the phone, so the run had to stay
unattended without weakening the evidence contract.
**What happened:**
- Matched deployed assets to local commit `ce9f3b6`, installed the production WebAPK, and ran J1-J8
  in English and Romanian in browser and standalone modes on a Pixel 6a / Android 15 / Chrome 150.
- Added a device-only harness that captures accessibility trees, device screenshots, traces,
  Perfetto data, and recordings while labeling DevTools-driven journeys `SUPPORTING_PASS`.
- Kept physical artifacts under `.reports/android-physical/`; Playwright owns and cleans
  `test-results/`, so the two evidence lifecycles cannot share an output root.
- Removed a language-reset race exposed by the installed-PWA Romanian J7 run: reset now stops app
  JavaScript on a same-origin manifest document, clears and writes storage there, then starts one
  fresh candidate navigation. The complete installed and browser matrices passed afterward.
- Made the harness reject locked-device capture, reject performance capture with TalkBack active,
  recover interrupted installed-app launches, validate journey filters, and exit nonzero when any
  journey fails.
- Used a real AOA USB keyboard to make Android expose an external input device; genuine TalkBack
  focus moved from the onboarding heading to its explanation in document order.
- Ran and repeated three process-cold performance samples after hardening recorder teardown. Final
  median startup was 1,162 ms; first-route medians were 217.6-349.0 ms, worst warm return was 40.4
  ms, and no long task was observed.
- Kept Chrome signed out, excluded account identity and private journal content, and documented the
  remaining VoiceOver, TalkBack speech/gesture, and distinct low-tier gates.
- Linked the exact successful `Push on main` workflow for the deployed candidate; that workflow
  publishes no retained Actions artifact.
**Outcome:** The Pixel 6a mid-tier performance profile passes. All 32 physical-browser functional
and semantic combinations pass as supporting evidence. One genuine TalkBack focus-order pilot
passes; full retained speech/gesture acceptance remains open. No product defect was reproduced.
`npm run check` passes 72 files and 581 tests; all 186 Mobile Safari/Chrome cases pass. The
production PWA lifecycle and performance proxy pass after rerunning outside the known macOS
Mach-port sandbox. The final physical performance harness rerun exits cleanly with all artifacts.
**Insight:** A test running on physical hardware still bypasses a screen reader when DevTools owns
activation; input provenance and retained spoken output are part of the acceptance result.
**Promoted to Lessons Learned:** Yes — physical browser versus assistive-technology evidence.

---

### [2026-08-04] Simplify Reflection with explicit exploration

**Context:** Reflection mixed the core result, fit decision, inferred needs, suggested action,
meaning, context, and external AI on one long surface. The next priority was to lower cognitive
load and reduce the authority implied by generated psychological guidance.
**What happened:**
- Started with a failing component test, then split Reflection into a compact result/fit/finish
  surface and an explicitly opened exploration surface.
- Kept inferred needs, next steps, meaning, context, and AI absent from the default DOM; restored
  focus to the disclosure trigger on Back.
- Reframed English and Romanian copy around tentative fit and preserved rejection, early capture,
  save recovery, and tier-4 acknowledgement semantics.
- Migrated all browser journeys, adding compact-viewport geometry, keyboard focus, dark contrast,
  bilingual, persistence, and every crisis-route disclosure assertion.
- Added configurable candidate URLs and focused J9 to the physical Android harness so local or
  deployed Reflection can be checked without changing production configuration.
- Inspected English light/dark, Romanian dark, and optional exploration screenshots at `393x742`.
**Outcome:** Product and automated verification succeeded. `npm run check` passes 72 files and 582
tests; all 188 Mobile Safari/Chrome cases, the production PWA lifecycle, and performance proxy
pass. Physical J9 is pending because the connected Pixel is locked.
**Insight:** Psychological interpretation should be user-pulled, not result-pushed; a direct exit
must remain visually primary and functionally complete.
**Promoted to Lessons Learned:** Yes — explicit agency boundary for inferred guidance.

---

### [2026-08-05] Close P25 physical Reflection verification

**Context:** P25 automated and visual gates passed, but focused Pixel evidence remained blocked
while the connected device was locked.
**What happened:**
- Exposed the local `4173` candidate through `adb reverse`, temporarily kept the charging Pixel
  awake, and ran J9 in English and Romanian on physical Chrome.
- Verified the compact result hides needs and AI, keeps Done and Explore in the first viewport,
  focuses the exploration heading, reveals optional guidance only there, and restores Explore
  focus on Back.
- Retained device screenshots and accessibility trees for both default and exploration states.
- Investigated a suspected Romanian button artefact with a stable second device screenshot and
  live DOM/computed-style inspection; it was the normal circumflex of capital `Î`, not a render
  defect.
**Outcome:** Pixel 6a / Android 15 / Chrome 150 passes J9 in EN and RO at `411x808` as supporting
physical-browser evidence. No P25 defect reproduced. Real TalkBack speech/gesture acceptance and
deployed-candidate repetition remain separate release gates.
**Insight:** Inspect apparent physical screenshot defects against a stable recapture and live DOM
before changing UI; diacritics and transient raster frames can resemble stray controls.
**Promoted to Lessons Learned:** No — first occurrence.

---

### [2026-08-05] Compare bounded model-assisted psychological copy review

**Context:** P26 needs a scalable bilingual catalog audit, but external-model quotas are small and
generated psychological guidance cannot be treated as reviewed copy.
**What happened:**
- Sent the same four public catalog entries and one-change-per-entry rubric to one
  `gpt-5.6-luna` max-effort call and one `gemini-3.6-flash-high` high-effort call.
- Kept both runs advisory-only: no repository tools, no file edits, no diagnosis or treatment.
- Luna consistently preserved uncertainty and agency, but used 11,873 tokens and produced copy too
  long for direct mobile use. Gemini was concise and identified useful wording risks, but introduced
  a Romanian typo and unsupported causal certainty for numbness.
- Accepted neither output into the catalog; compared them as candidate-generation evidence only.
**Outcome:** Luna is the stronger sparse reviewer/arbiter; Gemini Flash is the more efficient first
pass. Recommended workflow: bounded batches, deterministic checks, blind human/domain review, and
explicit provenance before any runtime guidance.
**Insight:** Strong persona prompting improves issue discovery but does not establish psychological
review; even good model output can introduce causal overreach or bilingual defects.
**Promoted to Lessons Learned:** No — already covered by fail-closed psychological provenance.

---

### [2026-08-06] Start P26 with a deterministic guidance-review boundary

**Context:** The catalog audit needed a quota-efficient multi-model workflow without duplicating
policy or allowing generated psychological copy to enter runtime as reviewed guidance.
**What happened:**
- Added one dependency-free Node utility for stable batch creation, one psychologist prompt, strict
  candidate validation, and explicit provider separation.
- Began red-first with missing-module and semantic-policy failures; six contract tests now cover the
  12-entry first batch, provenance, completeness, duplicates, unknown IDs, bilingual copy, forbidden
  claims, and mobile word limits.
- Extracted the CI forbidden-copy patterns into one CommonJS policy shared by the existing catalog
  audit and the new candidate validator.
- Used one Gemini Flash High call on `negative-high.json`; retained its result only under ignored
  reports. Structural validation passed, but domain review approved no automatic catalog changes.
- Reserved Luna quota because disputed needs should first map to a controlled vocabulary; applying
  isolated orthographic edits now would create avoidable churn.
**Outcome:** `npm run check` passes 72 files and 582 tests, all copy/i18n gates, lint, TypeScript,
production PWA build, and performance budgets. Runtime catalog, UI, safety, and persistence are
unchanged, so browser journeys were not rerun.
**Insight:** Provider-neutral candidate artifacts plus a shared deterministic policy make model
assistance replaceable and auditable; structural validity remains deliberately weaker than domain
approval.
**Promoted to Lessons Learned:** No — reinforces the existing fail-closed provenance lesson.

---

### [2026-08-07] Add controlled needs and fail-closed catalog guidance

**Context:** P26 had a deterministic model-review boundary, but catalog hydration still generated
psychological guidance from unreviewed free text. The first reviewed batch needed a small reusable
bilingual vocabulary and explicit source provenance.
**What happened:**
- Began with failing hydration tests, then added 10 controlled bilingual need options and explicit
  reviewed `needId` references.
- Mapped the 12 `negative-high.json` entries and removed raw needs from all 288 source entries.
  The remaining 276 entries now expose no description or inferred need.
- Made hydration and the CI copy audit reject raw needs, unknown references, unsupported statuses,
  and unreviewed descriptions; fixed the exact approved mapping in a regression test.
- Upgraded the provider-neutral review schema to accept controlled IDs or bilingual description
  changes and added quota-efficient `--ids` subsets.
- Used one Luna Max call only for `despair` and `terror`. The validator rejected its terror wording;
  no retry was spent. Domain review applied revised bilingual descriptions while deterministic
  crisis UI retained ownership of urgent support.
- Updated component and browser contracts so absent unreviewed guidance leaves no empty need group,
  while reviewed guidance remains optional behind Explore and persists unchanged.
**Outcome:** `npm run check` passes 73 Vitest files and 587 tests, TypeScript, lint, bilingual and
psychological-copy audits, the production PWA build, and performance budgets. All 188 Mobile
Safari/Chrome Playwright cases, the production PWA lifecycle, and the standalone mobile
performance proxy pass.
**Insight:** A controlled vocabulary removes duplicated translation and orthography drift, while
fail-closed hydration makes incomplete review visible as absence rather than invented authority.
**Promoted to Lessons Learned:** No — concrete application of the existing fail-closed provenance
lesson.

---

### [2026-08-07] Complete the Quick and Body Compass guidance review

**Context:** The next P26 batch crossed several catalog files and needed to distinguish unresolved
guidance from a reviewed decision to offer no suggestion.
**What happened:**
- Began with a failing cross-source batch test, moved Quick IDs into one small JSON source, and
  derived Body Compass IDs directly from somatic signals.
- Built one deterministic 32-ID reachable inventory: three existing reviewed entries and 29 new
  decisions, deduplicated by canonical ID.
- Used one Luna Max psychologist subagent to challenge a broad draft. Domain review accepted 13
  mappings, added only `rest / odihnă`, and rejected 16 ambiguous or prescriptive inferences.
- Added `needId: null` as explicit reviewed no-suggestion provenance. Hydration exposes nothing for
  null decisions, while the review builder no longer queues them again.
- Made safety wording natural in both languages and added exact catalog, Quick, somatic, hydration,
  copy-audit, and browser contracts.
**Outcome:** The catalog contains 41 reviewed decisions, 25 runtime mappings, 11 controlled need
options, and zero unresolved Quick + Body Compass entries. `npm run check` passes 73 Vitest files
and 590 tests; all 190 Mobile Safari/Chrome cases, the production PWA lifecycle, and the mobile
performance proxy pass.
**Insight:** Fail-closed review needs an explicit negative decision. Absence alone cannot distinguish
"not reviewed" from "reviewed and intentionally omitted," so it causes repeated work or pressure
to invent a mapping.
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration record.

---

### [2026-08-07] Keep both compact Reflection choices in the first viewport

**Context:** The complete local browser suite passed after the guidance migration, but the GitHub
runner consistently placed the secondary Reflection action below a 320x568 viewport in both
Mobile Safari and Mobile Chrome.
**What happened:**
- Inspected the failed workflow log, report screenshots, and traces instead of weakening the
  viewport contract.
- Added a red-first geometry assertion requiring the primary exit and optional exploration action
  to share one row, remain within horizontal bounds, and retain at least a 48px target height.
- Changed the two compact actions to equal grid columns and tightened only their narrow-screen
  typography; added the same viewport contract for the longer Romanian labels.
**Outcome:** `npm run check` passes 73 Vitest files and 590 tests. All 192 Mobile Safari/Chrome
Playwright cases, the production PWA lifecycle, and the mobile performance proxy pass locally.
**Insight:** Existing viewport-visibility guidance applies: critical compact choices need measured
geometry in every supported locale, because environment-specific font metrics can expose an extra
row that a local visibility-only run misses.
**Promoted to Lessons Learned:** No — covered by the existing mobile viewport visibility and
measurement lessons.

---

### [2026-08-07] Let manual release verification deploy GitHub Pages

**Context:** App-authenticated pushes did not start the Pages workflow. Manual dispatch ran every
quality gate successfully but skipped Pages setup, artifact upload, and deployment because those
jobs accepted only the `push` event.
**What happened:**
- Reused one event boundary for all three release-only gates: every non-PR invocation may publish.
- Kept pull requests build-only, without Pages credentials or deployment side effects.
- Validated workflow YAML syntax and reran the complete local `npm run check` gate before publish.
**Outcome:** Manual dispatch now follows the same build-then-deploy path as a push while preserving
the existing PR safety boundary.
**Insight:** A declared manual release trigger is incomplete unless artifact creation and deployment
share its event policy; validate the terminal deploy job, not only the build conclusion.
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration record.

### [2026-08-07] Complete the Affect Map guidance review

**Context:** P26 had closed Quick and Body Compass guidance, while Affect still exposed 29
unreviewed canonical emotions across four catalog files.
**What happened:**
- Began with a failing 38-ID inventory contract derived directly from the dimensional production
  overlay, then extracted one shared surface batch boundary for catalog resolution and filtering.
- Restricted surface batches to controlled `needId` or `none`; description proposals now fail
  validation and remain a separate review iteration.
- Built a conservative draft and used one Luna Max psychologist pass only to challenge it. Domain
  review retained five mappings (`afraid`, `lonely`, `sad`, `tender`, `tired`), rejected four
  tempting over-inferences, added no vocabulary, and recorded 24 explicit null decisions.
- Added exact global and dimensional mapping contracts plus Safari/Chrome journeys proving accepted
  guidance stays behind Explore and reviewed null guidance remains absent there.
**Outcome:** Affect is 38/38 reviewed with zero unresolved entries. The full catalog has 70 reviewed
decisions, 30 runtime mappings, 40 explicit no-suggestion decisions, and 11 controlled options.
`npm run check` passes 73 Vitest files and 591 tests; all 196 Mobile Safari/Chrome cases, the
production PWA lifecycle, and the mobile performance proxy pass.
**Insight:** Route inventories should derive from production overlays, while review fields remain
narrow per batch. Positive, mixed, or broad low-mood labels do not need forced guidance merely to
increase visible coverage.
**Promoted to Lessons Learned:** Yes — explicit no-suggestion provenance now recurred across two
route-review batches.

---

### [2026-08-07] Complete the Plutchik guidance review

**Context:** P26 had closed Quick, Body Compass, and Affect guidance, but Plutchik loaded 55 model
entries whose actual route reachability differed from the source inventory.
**What happened:**
- Began with a failing result-inventory contract, then derived all 28 selectable primary pairs from
  production overlays using the runtime combination-or-standalone rule.
- Identified 29 confirmable results, including the two blends produced by `trust + sadness`, while
  excluding intensity variants and combinations the current wheel cannot select.
- Used one Luna Max psychologist pass to challenge four tentative mappings. Domain review rejected
  all four, added no vocabulary, and recorded explicit null decisions for all 19 unresolved IDs.
- Added exact model and Safari/Chrome contracts proving the four existing reviewed mappings remain
  behind Explore and a reviewed null result remains absent there.
**Outcome:** Plutchik is 29/29 reviewed with zero unresolved entries. The full catalog has 89
reviewed decisions, 30 runtime mappings, 59 explicit no-suggestion decisions, and 11 controlled
options. `npm run check` passes 73 Vitest files and 592 tests; all 200 Mobile Safari/Chrome cases,
the production PWA lifecycle, and the mobile performance proxy pass.
**Insight:** Route review must inventory results a user can commit, not every entry a model loads.
For combinatorial tools, derive reachability from selectable inputs and the production analyzer
contract so hidden variants do not create false review scope.
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration record.

---

### [2026-08-07] Complete the Word Ladder guidance review

**Context:** The final route-level P26 needs audit had 214 confirmable Word Ladder nodes, including
roots and intermediary words that can finish a check-in before a precise leaf is selected.
**What happened:**
- Began with a failing 214-ID graph contract and moved the seven production roots into one JSON
  source shared by runtime and review tooling.
- Traversed child links from those roots, retained exact reachable IDs in the batch, and identified
  31 reviewed plus 183 unresolved decisions across two catalog files.
- Defaulted ambiguous words to no suggestion and used one Luna Max psychologist pass only to
  challenge 46 tentative mappings. Domain review retained 31 mappings, 152 null decisions, and no
  new vocabulary.
- Added exact catalog and Safari/Chrome contracts proving mapped root guidance remains behind
  Explore and a reviewed-null intermediary remains absent there.
- Corrected the shared browser helper to respect the configured `/emotid/` base path and bounded
  local WebKit reuse with two workers after repeated 72nd-context navigation stalls; CI retains one
  worker for constrained, deterministic runs.
**Outcome:** Word Ladder is 214/214 reviewed with zero unresolved entries. The full catalog has 272
reviewed decisions, 61 runtime mappings, 211 explicit no-suggestion decisions, and 11 controlled
options. `npm run check` passes 73 Vitest files and 592 tests; all 204 Mobile Safari/Chrome cases,
the production PWA lifecycle, and the mobile performance proxy pass.
**Insight:** Shared route roots plus graph traversal remove inventory drift while keeping the model
architecture simple. Large psychological batches stay quota-efficient when domain review defaults
to absence and asks a model to challenge only visible map candidates.
**Promoted to Lessons Learned:** Yes — confirmable-result inventory scope recurred across Plutchik
and Word Ladder.

---

### [2026-08-07] Establish the reviewed-description contract and pilot

**Context:** P26 closed need provenance for every confirmable result, but only 12 catalog entries
had reviewed descriptions. Reflection could repeat the first description, and Word Ladder could
offer comparisons with missing placeholder prose.
**What happened:**
- Began with failing exact-inventory, copy-policy, Reflection, Word Ladder, and browser contracts.
- Added a description-only 23-ID batch derived from the reviewed baseline, six Quick IDs, and seven
  production Word roots; its payload omits unrelated need vocabulary, and copy validation now
  rejects advice, direct address, and text over 45 words.
- Used one Luna Max psychologist pass. Domain review accepted 19 reformulations and retained local
  drafts for `anger`, `joy`, `rage`, and `terror`.
- Rendered the canonical meaning once in optional Reflection, removed empty context rows, kept the
  initial ladder label-only, and made comparison conditional on complete sibling-group coverage.
- Updated the crisis journey assertion to the reviewed despair description while preserving every
  support-first and gated-detail assertion.
**Outcome:** 23 canonical entries now have reviewed EN/RO descriptions; all six Quick emotions and
the seven Word roots are covered. `npm run check` passes 73 Vitest files and 594 tests; all 204
Mobile Safari/Chrome cases, the production PWA lifecycle, and the mobile performance proxy pass.
Manual Playwright inspection at 320x568 EN/light and 393x742 RO/dark found no horizontal overflow,
description duplication, or comparison-layout defect.
**Insight:** Comparison prose is a choice-set capability, not an entry capability. Partial sibling
coverage changes the information available for some options and can bias selection, so the whole
visible group must fail closed together.
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration record.

---

### [2026-08-07] Complete Word Ladder intermediate descriptions and dependency remediation

**Context:** P27.2 enabled comparison for the seven roots, while 37 of 41 directly confirmable
intermediate words still lacked reviewed prose. The lockfile also resolved three vulnerable
development transitives.
**What happened:**
- Updated `brace-expansion`, `fast-uri`, and `undici` to patched transitive releases; verified a
  clean install with an isolated npm cache and zero audit findings.
- Began with failing exact 41-node, seven-group, and intermediary-comparison contracts, then added
  one shared description-batch builder and reused the production Word Ladder graph reader.
- Used one Luna Max advisory call for all 41 entries. Domain review retained four existing
  descriptions, accepted 29 candidates, and revised eight formulations for uncertainty, agency,
  semantic precision, or natural Romanian.
- Kept leaf comparison fail-closed, added WebKit/Chromium coverage for intermediary-only sibling
  comparison, and promoted the recurring atomic choice-set rule to `LESSONS_LEARNED.md`.
**Outcome:** The catalog now has 60 reviewed EN/RO descriptions and 228 entries without prose. All
seven intermediate sibling groups compare without crossing root families. `npm run check` passes
73 Vitest files and 595 tests; all 206 Mobile Safari/Chrome cases, production PWA lifecycle, mobile
performance proxy, and `npm audit` pass. Manual Playwright checks at 320x568 EN/light and 393x742
RO/dark found zero horizontal overflow or console errors and no text/action overlap.
**Insight:** Description availability must be released at the complete sibling-group boundary.
Graph-derived groups and exact inventories prevent content work from silently changing which
choices receive richer decision support.
**Promoted to Lessons Learned:** Yes — the same complete-choice-set rule now governs both root and
intermediate comparison.

---

### [2026-08-07] Complete the Romanian language quality gate

**Context:** The canonical emotion catalog still exposed many Romanian labels without diacritics,
including high-traffic Word Ladder intermediates. Correcting only the catalog would leave older
IndexedDB sessions displaying their stored misspellings in Today and Journal.
**What happened:**
- Inventoried all 288 canonical labels and began with failing exact-label, model-metadata, NFC, and
  historical-display contracts; avoided an unreliable rule that treats every ASCII label as wrong.
- Corrected 73 reviewed Romanian labels, visible model metadata, and the Body Compass `Brațe` label;
  retained stable IDs and all English copy, model topology, scoring, and safety rules.
- Added one presentation resolver that prefers current canonical copy by ID and falls back to the
  stored snapshot. Today, Journal patterns/list, and session detail reuse it without mutating local
  data or exports.
- Updated Romanian Playwright and physical-device expectations and added exact Word Ladder and Body
  assertions. Manual Playwright inspection covered 320 px light and 393/320 px dark layouts.
**Outcome:** `npm run check` passes 74 Vitest files and 600 tests; all 206 Mobile Safari/Chrome
cases, the production PWA lifecycle, and the mobile performance proxy pass. The reviewed screens
show no clipping, overlap, dark-contrast regression, or stale historical label.
**Insight:** Copy snapshots are appropriate storage fallbacks, but stable catalog IDs should drive
current presentation. Exact reviewed language contracts prevent both regression and false-positive
automatic “corrections.”
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration record.

---

### [2026-08-07] Establish P29 Word Ladder stopping evidence

**Context:** Intermediate descriptions and sibling comparison were implemented, but there was no
bounded evidence that people could stop before a leaf, and physical assistive-technology evidence
still used Android 15 plus mostly DevTools activation.
**What happened:**
- Added a six-participant EN/RO moderated protocol using synthetic situations, neutral prompts,
  privacy limits, exact thresholds, and a fail-closed rule for any future leaf-description pilot.
- Added a `320x568` Romanian/dark Playwright contract for direct-stop focus and order, reversible
  comparison, retained selection, accessible description, and horizontal bounds.
- Expert screenshot review found check icons on every unselected leaf. Replaced them with plus
  icons under a red-first component contract so available choices no longer look completed.
- Retested the deployed `f59e517` candidate on Pixel 6a Android 17 / API 37. All 18 browser J1-J9
  EN/RO rows and both installed-WebAPK J5 rows passed as supporting evidence. Three physical
  performance runs remained within every target.
- Enabled TalkBack visible speech output and used a real AOA USB HID keyboard. Physical
  `Shift+Tab` / `Tab` retained the direct-action and specificity utterances; TalkBack
  `Action+Space` completed `Playful` / `Jucăuș` to Reflection in both languages. Browser J5 is now
  a genuine bounded TalkBack pass; installed and full-matrix claims remain open.
- Fixed the physical harness CLI after `--help` accidentally launched the default suite. Help and
  unsupported arguments now exit before any device effect and have process-level regressions.
**Outcome:** `npm run check` passes 75 files and 603 tests; all 208 Mobile Safari/Chrome cases, the
production PWA lifecycle, and browser performance proxy pass. Participant sessions, genuine
installed-WebAPK TalkBack, remaining TalkBack journeys, VoiceOver/Safari, and a distinct low-tier
Android profile remain open and explicitly unclaimed.
**Insight:** Choice icons must describe current state, not the result of activating a control.
Physical-test tooling also needs a side-effect-free argument boundary because a diagnostic typo
can otherwise mutate a connected device or contaminate evidence.
**Promoted to Lessons Learned:** Yes — side-effect-free hardware CLI validation is reusable across
all future physical gates.

---

### [2026-08-07] Extract P30 physical journeys and advance TalkBack evidence

**Context:** The 569-line Android audit entrypoint mixed CLI/device orchestration with nine journey
definitions. P30 also needed exact-candidate Android 17 evidence beyond the prior browser-only J5
TalkBack result.
**What happened:**
- Began with failing import-safety, registry-selection, result-capture, and invalid-CLI tests; then
  extracted J1-J9 into one import-safe registry and kept ADB/CDP ownership in the entrypoint.
- Recorded owner acceptance of the current Word Ladder experience without misrepresenting it as
  six-participant evidence; leaves remain label-only and the formal protocol remains available.
- Ran the exact `14b38d` candidate through all J1-J9 journeys in EN/RO, browser and installed mode:
  36/36 supporting rows passed with device screenshots and accessibility snapshots.
- Enabled TalkBack visible speech output and used a real AOA USB HID keyboard. Installed J5 passed
  end to end in EN/RO; bounded installed J6 retry and J8 resource-order/acknowledgment checkpoints
  also passed in both languages. No application defect was reproduced.
- Retained the failed browser J8 sequence: Chrome accepted physical Tab in browser chrome while DOM
  focus remained on the page heading. A J5 retry exposed a second foreground-tab mismatch. Both are
  classified as harness blocks, never product failures or TalkBack passes.
**Outcome:** Registry unit/CLI tests pass; `npm run check` passes 76 files and 608 tests; all 208
Mobile Safari/Chrome cases, the PWA lifecycle, performance proxy, lint, and production build pass.
P30 remains partial for genuine browser TalkBack and the remaining J1-J4/J7/J9 physical rows.
**Insight:** CDP target focus is not proof that the same Chrome tab owns physical keyboard focus on
Android. Genuine browser assistive-technology evidence needs an independently verified foreground
surface before input; otherwise retain the attempt as a harness block.
**Promoted to Lessons Learned:** No — first explicit foreground-target occurrence; retain here.

---

### [2026-08-09] Harden physical browser foreground targeting without attached hardware

**Context:** P30 browser TalkBack attempts exposed cases where DevTools controlled one page while
physical keyboard focus belonged to another Chrome surface. The Pixel 6a was removed before the
remaining assistive-technology matrix could continue.
**What happened:**
- Published the already verified P30 journey-registry commit, then kept P31 scoped to one pure
  browser-target module and the existing physical-audit entrypoint.
- Began with a failing contract showing that substring matching accepted a token prefix or text
  outside Chrome's URL bar. Parsed the native `url_bar` query and now require its exact run token.
- Added a unique token per browser audit, exact non-standalone CDP selection, stale-target failure,
  native foreground verification, and a report flag.
- Added one Mobile Chrome/Mobile Safari regression proving the token survives application startup
  and a Quick-to-Reflection journey without changing app state or producing browser errors.
- Retained the earlier Pixel 6a EN/RO J5 foreground run as supporting evidence only. No TalkBack,
  WebAPK, or hardware result was inferred after the phone became unavailable.
**Outcome:** `npm run check` passes 77 files and 612 tests; all 210 Mobile Safari/Chrome cases, the
production PWA lifecycle, and mobile performance proxy pass. Physical Android and iOS acceptance
remain explicitly deferred.
**Insight:** Physical browser evidence needs exact agreement between the automation target and a
native foreground identifier. One token shared across those independent surfaces is smaller and
more auditable than tab-order heuristics or a broader device-control framework.
**Promoted to Lessons Learned:** Yes — the foreground mismatch recurred across P30 and P31, and the
exact dual-proof rule now prevents the same false attribution.

---

### [2026-08-10] Prepare native Safari audit without requesting owner permissions

**Context:** The Android device was unavailable, and the owner could not currently approve Safari
Remote Automation or macOS Accessibility prompts. Playwright WebKit coverage existed, but no test
targeted the installed desktop Safari application.
**What happened:**
- Confirmed Safari 26.5.2, bundled SafariDriver, and VoiceOver are installed; full Xcode and an iOS
  runtime are absent. Corrected the plan's stale statement that Safari was unavailable.
- Began with six failing contracts, then added a dependency-free W3C client, permission-free
  preflight, side-effect-free CLI validation, exact six-row EN/RO inventory, and injected journey
  executor tests.
- Prepared production-native Quick persistence/AI-link, Word Ladder intermediary, and tier-4
  journeys across light and dark themes. State resets from an inert same-origin document so a live
  React tree cannot restore stale preferences or block IndexedDB deletion.
- Kept authorization explicit: the runner never invokes `safaridriver --enable`, never changes
  Accessibility permissions, and does not claim a native pass before a real session runs.
**Outcome:** `npm run check` passes 78 files and 619 tests; all 50 focused Quick, Word Ladder, AI,
and crisis cases pass in Mobile Safari/Chrome. The native server returns the inert seed and app
from separate service-worker scopes and rejects traversal. CLI validation and the real version-only
preflight pass. The Safari session and VoiceOver pass remain `NOT RUN` until the owner is present.
**Insight:** A native-browser runner can stay small by speaking the narrow W3C protocol directly
and keeping permission changes outside the executable. Existing browser journeys should be sampled
by risk, not duplicated into another full automation matrix.
**Promoted to Lessons Learned:** No — first native Safari runner iteration; retain here.

---

### [2026-08-12] Execute native Safari and resume Pixel TalkBack acceptance

**Context:** Safari Remote Automation was enabled and the Pixel 6a returned on Android 17. P32 had
only runner contracts; browser TalkBack remained blocked by foreground and input ambiguity.
**What happened:**
- Ran installed Safari 26.6 on macOS 26.6.1. All six bounded EN/RO Quick, Word intermediary, and
  tier-4 rows passed with native screenshots and a machine-readable report.
- Dismissed a one-time Chrome notifications dialog that correctly caused the exact-foreground
  check to fail. Repeated deployed browser J5, J6, and J8; all six EN/RO supporting rows passed
  with native URL-bar and CDP token agreement.
- Avoided clearing the published origin after the safety review identified possible journal loss.
  Used a fresh localhost origin over `adb reverse` for genuine TalkBack interaction; public and
  local production asset names matched.
- Calibrated the real AOA input path. SDK mouse hover and `Cmd+Tab` disturbed TalkBack focus;
  `--mouse=disabled` plus Right Alt as the Action key produced stable activation on the attached
  Windows-layout keyboard.
- Retained EN/RO J5 focus, specificity hint, activation video, Reflection heading focus, and
  visible speech output. No application defect was reproduced.
**Outcome:** Safari native supporting rows pass 6/6. Pixel deployed J5/J6/J8 supporting rows pass
6/6. Genuine browser TalkBack J5 passes EN/RO on the matching production build. VoiceOver, genuine
TalkBack J6/J8 and remaining journeys, Apple mobile, and distinct low-tier Android remain open.
`npm run check` passes 78 files and 619 tests plus every i18n, copy, build, and performance gate;
the complete Mobile Safari/Mobile Chrome Playwright matrix passes 210/210.
**Insight:** Screen-reader acceptance needs explicit calibration of host focus, pointer transport,
and modifier mapping; DOM focus alone is insufficient even with an external keyboard.
**Promoted to Lessons Learned:** Yes — reusable for every remaining AOA TalkBack row.

---

### [2026-08-12] Establish real iOS Simulator automation

**Context:** Xcode commands worked after owner installation, but `simctl` exposed device templates
without any installed runtime or device instances.
**What happened:**
- Downloaded and installed the official iOS 26.5 arm64 Simulator runtime through Xcode (8.52 GB).
- Created and booted named iPhone SE 3 and iPhone 17 Pro profiles. The 17 Pro's first migration
  needed one erase/retry before completing; no application failure was inferred.
- Installed Appium XCUITest 12.3.1. All required driver-doctor checks passed; only optional
  `applesimutils` remains absent.
- Started WebDriverAgent sessions against Mobile Safari on both profiles. Verified deployed URL,
  title, document completion, onboarding heading, and viewports (`375x549`/DPR 2 and
  `402x714`/DPR 3).
- Located and dismissed Safari's first-run coachmark in native context, switched to web context,
  activated `Next`, and verified onboarding heading/progress step 2.
**Outcome:** Repeatable Appium/XCUITest Safari automation is available on this Mac. Two real iOS
Simulator smoke rows pass. Full bilingual journeys, Simulator VoiceOver, PWA, rotation, and text
size remain unimplemented; physical iPhone VoiceOver remains a separate release gate.
**Insight:** `simctl list devicetypes` proves only templates, not a runnable iOS environment. Check
`simctl list runtimes` and boot a device before claiming Simulator availability.
**Promoted to Lessons Learned:** No — first occurrence; retain in the iteration log.

---

### [2026-08-12] Consolidate the remaining plan and release evidence

**Context:** The active migration plan had grown to 1,018 lines by appending every completed phase.
It repeated physical gates in multiple sections, while the evidence template mixed an obsolete
candidate header with newer supplemental runs and described eight journeys despite defining J1-J9.
**What happened:**
- Replaced the accumulated migration chronology with a concise current-state plan covering only
  confirmed gaps, investigation candidates, guardrails, architecture direction, P35-P39, and
  explicit non-goals.
- Defined UI/UX counterparts for KISS, YAGNI, DRY, Rule of Three, SoC, POLA, Fail Fast, and Gall's
  Law as operational product rules.
- Made `release-quality-gates.md` the normative J1-J9 source and added explicit evidence classes.
- Rebuilt `physical-release-evidence.md` as a candidate-honest evidence ledger: prior SHA evidence
  remains visible, but final-candidate rows stay open until a SHA is frozen and rerun.
- Marked the original review and implementation blueprint as historical inputs so their old audit
  findings and suite counts cannot be mistaken for current state.
**Outcome:** Planning, requirements, evidence, and history now have one owner each. The next
executable phase is P35, followed by iOS variants, bounded acceptance-contract extraction, physical
closure, and final sign-off.
**Insight:** Documentation follows SoC too: active plan, normative gate, evidence ledger, and
historical log must not independently own the same status fact.
**Promoted to Lessons Learned:** Yes — repeated candidate and remaining-work contradictions were
caused by append-only documents with overlapping ownership.

---

### [2026-08-12] Complete P35 repeatable iOS Safari journeys

**Context:** Ad-hoc XCUITest smoke proved the toolchain, but the repository still lacked a bounded,
repeatable bilingual Simulator gate with candidate identity and useful evidence.
**What happened:**
- Began with failing contracts, then added a small W3C Appium client, pure matrix/preflight module,
  and opt-in lifecycle runner. CLI validation completes before device or filesystem effects.
- Added 16 EN/RO rows across named iPhone SE and iPhone 17 Pro profiles: Quick persistence plus
  exact AI-link semantics, Word intermediary completion, save failure/retry, and tier-4 gating.
- Validated exact production assets, unique run token, language, visual viewport, overflow,
  destination focus, and 44px primary actions. Preserved original simulator/service state.
- Captured screenshots explicitly in native context after inconsistent web-context crops appeared,
  then restored the active web context. The repeated SE save-retry evidence rendered correctly.
- The real tier-4 row exposed a product defect: acknowledgment removed the active button without a
  focus destination. Made the revealed result a focusable heading and moved focus there; added unit
  and dual-browser Playwright regressions.
**Outcome:** The final runner passes the complete Simulator matrix 16/16 with native screenshots at
`.reports/ios-simulator/2026-08-12T18-02-37-977Z/`; targeted tier-4 repetition also passes 4/4.
`npm run check` passes 79 files / 631 tests;
Playwright passes 210/210, PWA 1/1, performance 1/1, and installed macOS Safari 6/6. No Appium,
WebDriverAgent, preview listener, or runner-booted SE remains after cleanup.
**Insight:** Native automation evidence must make both browser context and screenshot context
explicit. A visually plausible web-context screenshot can still be a cropped compositor artifact.
Safety gates also need a deliberate focus destination when acknowledgment replaces the trigger.
**Promoted to Lessons Learned:** Yes — the safety focus rule closes a high-risk reusable interaction
boundary. Screenshot-context behavior remains a first occurrence in the iteration log.

---

### [2026-08-12] Complete P36 iOS robustness and UX findings

**Context:** The base Appium matrix passed, but rotation, dark theme, Safari Page Zoom, larger text,
installed-PWA setup, and Simulator VoiceOver remained unclassified.
**What happened:**
- Started with pure failing contracts for a bounded six-case risk matrix, CLI filtering, semantic
  contrast/layout checks, orientation commands, Safari Page Zoom actions, and focus destinations.
- Added real-Safari SE/17 Pro variants for onboarding focus, landscape Quick/tier-4, dark Word
  Ladder, and Quick/tier-4 at 200% Page Zoom plus accessibility text. The runner restores portrait,
  Page Zoom, appearance, content size, profile state, and owned services.
- Reproduced three product defects: Safari's visible outline on the programmatically focused
  onboarding heading, global `body` minimum width causing 132px overflow at 200%, and focused
  destinations clipped outside `visualViewport`. Added regressions, removed the obsolete minimum,
  and introduced one shared focus helper that scrolls only clipped destinations.
- Hardened evidence after real failures: stale Share Sheet contamination now fails; Safari is reset
  per session; post-rotation layout waits for two aligned viewport samples; transient Simulator UI
  state cannot become a restoration value; cleanup waits for Shutdown. Native macOS Safari also
  waits for its requested language/theme effects.
- The installed-PWA probe reached semantic `Add to Home Screen`, but XCUITest activation produced no
  reliable confirmation or installed identity. Simulator VoiceOver could not provide speech,
  rotor, or gesture evidence. Both are documented capability blocks, not product passes/failures.
**Outcome:** Final robustness report 6/6 at
`.reports/ios-simulator/2026-08-12T19-20-05-175Z/`; post-change base matrix 16/16 at
`.reports/ios-simulator/2026-08-12T19-23-51-726Z/`; macOS Safari 6/6 at
`.reports/macos-safari/2026-08-12T19-26-58-249Z/`. `npm run check` passes 80 files / 638 tests;
Playwright 212/212, PWA 1/1, and performance 1/1 pass. Both Simulator profiles are Shutdown; no
preview or Appium listener remains.
**Insight:** Accessibility acceptance needs both correct semantic focus and visual-viewport
reachability. Native evidence also needs explicit readiness and overlay isolation; a passing DOM
assertion is insufficient when native browser UI can cover the candidate.
**Promoted to Lessons Learned:** Yes — repeated focus and native lifecycle races now have shared,
bounded rules. Installed-PWA and VoiceOver limitations remain iteration-specific until a reliable
automation capability exists.

---

### [2026-08-12] Complete P37 acceptance contract consolidation

**Context:** J1-J9 intent, EN/RO scope, and evidence classifications were repeated across the
normative release document, Android, Appium, SafariDriver, and Playwright without an executable
drift boundary.
**What happened:**
- Started with four failing contract tests, then added one small manifest owning only J1-J9
  IDs/titles, languages, and result classes. Kept every platform step, selector, fixture, protocol,
  and lifecycle in its existing adapter.
- Registered exact scope: Playwright and Android J1-J9; Appium J1/J5/J6/J8/J9; SafariDriver
  J5/J8/J9. Native report rows now include `acceptanceId`.
- Added stable Playwright anchors to existing tests rather than duplicating nine browser journeys.
  `npm run check-acceptance` now fails on unknown/duplicate IDs, incomplete full adapters, invalid
  result classes, missing test anchors, or drift in `release-quality-gates.md`.
- Split `AUTOMATED_PASS` from physical `PASS`, `SUPPORTING_PASS`, `NATIVE_SUPPORTING_PASS`, and
  `SIMULATOR_SUPPORTING_PASS`, removing an evidence-semantics ambiguity.
- A SafariDriver rerun exposed a missing postcondition after Start. Added explicit Arrival and Words
  readiness before continuing, with a red-first contract. No delays or generic retries were added.
- The first full Playwright run had two simultaneous Mobile Safari Explore-click timeouts; both
  affected files passed 6/6 serially, and the unchanged canonical two-worker gate then passed
  212/212. No product defect reproduced.
**Outcome:** `npm run check` passes 81 files / 642 tests and all build/copy/budget gates;
`check-acceptance` reports Playwright 9, Android 9, Appium 5, SafariDriver 3. Playwright passes
212/212. Native Safari passes 6/6 with J9/J5/J8 registration evidence at
`.reports/macos-safari/2026-08-12T19-56-39-428Z/`; Appium J1 passes at
`.reports/ios-simulator/2026-08-12T19-56-57-763Z/`. Both profiles are Shutdown and no owned server
remains.
**Insight:** Shared acceptance architecture should centralize vocabulary, not interaction. A small
validated manifest removes silent matrix drift while preserving platform-specific observability
and avoiding a test DSL.
**Promoted to Lessons Learned:** Yes — extends the existing one-owner documentation rule to
machine-readable acceptance metadata after four demonstrated consumers.

---

### [2026-08-13] Complete P38 Apple Simulator acceptance closure

**Context:** The project owner explicitly excluded physical iPhone acquisition/testing and selected
the existing iOS Simulator profiles as the Apple functional gate. Appium covered only five of the
nine canonical journeys.
**What happened:**
- Started with failing tests for a separate 36-row `acceptance` suite, complete J1-J9 adapter
  registration, strict CLI filtering, and explicit journey dispatch. Kept the 16-row smoke and
  six-row robustness suites unchanged.
- Added J2 Settings replay, J3 Affect placement, J4 Body Compass, and J7 browser history plus
  Journal deletion. Expanded J1 from first-frame focus evidence to all three introduction steps and
  completion. Every row retains exact assets, language, run token, geometry, focus, screenshot, and
  normalized result evidence.
- The first real run passed 32/36. All four failures shared one adapter defect: icon-only Settings
  and Close controls were queried by visible text instead of accessible name. After that fix, the
  compact SE exposed a second assertion defect: correct focus restoration scrolls the replay
  trigger into view and can move the Settings heading above the viewport. The gate now checks the
  returned trigger's focus and visibility without incorrectly requiring heading focus at the same
  time.
- Updated active release documentation: Simulator J1-J9 is the Apple functional gate; installed
  iOS PWA and VoiceOver speech/rotor/gesture behavior remain untested limitations, while physical
  iPhone testing is outside project scope rather than an impossible open gate.
**Outcome:** Final Appium acceptance report passes 36/36 at
`.reports/ios-simulator/2026-08-12T22-06-52-696Z/`. Final `npm run check` passes 81 files / 644
tests and all build/copy/budget gates; Playwright passes 212/212. No product defect was reproduced;
the failures were platform-adapter assertions. Both Simulator profiles are Shutdown and no owned
Appium or preview listener remains.
**Insight:** Native browser automation must locate icon-only controls through their accessible name.
Focus restoration and destination-heading focus are different contracts; asserting both
simultaneously can reject correct compact-screen behavior.
**Promoted to Lessons Learned:** Yes — both patterns recur across overlays and native adapters.

---

### [2026-08-13] Harden P39 Android physical preflight and lifecycle

**Context:** P39 requires genuine TalkBack and low-tier Android evidence, but the physical runner
created its evidence directory before checking the device, repeated environment reads, ignored
some ambiguous ADB states, and left `tcp:9222` forwarding behind after a run.
**What happened:**
- Started with failing pure contracts for strict CLI parsing, query-safe candidate URLs, exact
  single-device authorization, unlock state, TalkBack enabled/bound/touch-exploration state,
  external alphabetic keyboard detection, WebAPK availability, and mode-specific readiness.
- Added a side-effect-free `--preflight` path and package command. It reports capabilities without
  creating evidence, launching Chrome/WebAPK, or opening CDP.
- Reused the validated snapshot in reports with local Git head/dirty state. Moved evidence creation
  after preflight and enclosed CDP/browser ownership in `finally`; the runner now removes only its
  `tcp:9222` forward on success or failure. A pre-existing forward fails before ownership begins.
- Ran the real preflight on Pixel 6a / Android 17: one authorized unlocked device, WebAPK and
  external keyboard present, TalkBack disabled. Repeated browser J6/J8 in EN/RO; all four rows
  passed as `SUPPORTING_PASS`, with exact CDP/native foreground proof. No TalkBack pass was inferred.
**Outcome:** Focused Android contracts pass 14/14; final `npm run check` passes 82 files / 647 tests
and every acceptance/i18n/copy/build/budget gate. Physical reports are
`.reports/android-physical/2026-08-12T22-30-59-970Z-browser/` and
`.reports/android-physical/2026-08-12T22-31-20-439Z-browser/`; `adb forward --list` is empty after
each run. Full repository verification follows before commit.
**Insight:** Physical evidence starts at capability attribution. One immutable preflight snapshot
is simpler and more auditable than repeated ad hoc reads, and resource ownership needs cleanup in
the same control flow as execution.
**Promoted to Lessons Learned:** No — extends the existing hardware fail-fast rule; no new reusable
rule required.

---

### [2026-08-13] Add native TalkBack J6/J8 supporting evidence

**Context:** Human scrcpy/AOA calibration was ambiguous and caused unintended Chrome navigation.
The owner asked whether TalkBack speech and behavior could instead be verified autonomously.
**What happened:**
- Probed scrcpy playback and microphone recording. Playback produced valid PCM with accessibility
  earcons but excluded TalkBack speech; local Whisper found no speech in either capture path.
- Ran real TalkBack 17 on Pixel 6a / Android 17 without a host window. Used native Android Tab and
  Enter events, exact DOM/AX focus snapshots, TalkBack visible-speech screenshots, TTS synthesis
  and dispatch logs, and browser postconditions.
- J6 traversed heading to Retry and returned to Today. J8 traversed both support resources before
  acknowledgment and revealed Reflection. EN/RO passed 4/4. No TTS-not-ready errors occurred.
- Found a device/configuration limitation: Romanian UI retained `lang=ro` and Romanian AX names,
  but TalkBack dispatched the `eng-USA` voice. This is not attributed to product behavior without
  checking the device's TalkBack language settings.
- Restored TalkBack `null`, accessibility `0`, normal stay-awake policy, Chrome, logging properties,
  ADB forward/reverse mappings, and the local server. Worktree product code was unchanged.
**Outcome:** `NATIVE_TALKBACK_SUPPORTING_PASS`, 4/4, at
`.reports/android-physical/2026-08-12T22-59-46-804Z-native-talkback-j6-j8/`. Human gesture and
Romanian speech-quality sign-off remain open; no product defect was reproduced.
**Insight:** Screen-reader automation needs attributed signals, not an audio-file assumption.
**Promoted to Lessons Learned:** Yes — adds a reusable TalkBack evidence boundary.

---

### [2026-08-13] Complete automated browser TalkBack supporting matrix

**Context:** The Pixel remained available, but manual scrcpy focus/gesture work was error-prone.
Chrome controls and TalkBack speech appeared in English while the application was Romanian.
**What happened:**
- Started with pure failing contracts for complete J1-J9 registration, strict local-only CLI,
  TTS parsing/readiness, language attribution, and required row evidence.
- Added a dedicated local-production TalkBack runner. It owns server, ADB reverse/forward, exact
  Chrome target, TalkBack enable/restore, native key activation, screenshots, CDP/native trees,
  per-row TTS boundaries, reports, and teardown.
- Recorded app language, browser languages, Android locale, Chrome labels, TTS locale, and voice
  separately. Romanian app/AX output was correct; Android, Chrome, and TTS were `en-US`, assigning
  the pronunciation mismatch to device/browser/assistive configuration.
- Native J1 reproduced a product defect: the persistent Next button reclaimed focus after the next
  heading was synchronously focused. Deferred heading focus one animation frame and added unit plus
  Playwright keyboard regressions.
- The first complete run passed J1-J8 but J9 restarted TTS. Root cause was the runner's mid-row
  `uiautomator dump`, not product navigation. J9 now uses non-intrusive screenshot/CDP capture and
  defers native XML until the row ends.
**Outcome:** Pixel 6a / Android 17 / TalkBack 17 browser J1-J9 passes EN/RO, 18/18
`SUPPORTING_PASS`, with zero TTS-readiness errors at
`.reports/android-physical/2026-08-12T23-31-33-689Z-talkback-browser/`. Final `npm run check` passes
83 files / 653 tests and all lint, acceptance, i18n, copy, build, and budget gates. Overall report
classification now fails whenever any journey row fails. TalkBack,
accessibility, stay-awake, ADB mappings, page, and server were restored. Playwright passes 212/212;
the production PWA lifecycle passes 1/1 after rerunning outside the macOS Chromium sandbox. Human
gesture/spoken-order/pronunciation and installed-mode acceptance remain open.
**Insight:** Separate app localization from browser/device/TTS configuration, and keep native
hierarchy tooling outside an active TalkBack evidence window.
**Promoted to Lessons Learned:** Yes — instrumentation interference and native focus timing are
reusable physical-accessibility constraints.

---

### [2026-08-13] Expand TalkBack evidence across language, theme, and audio

**Context:** Browser TalkBack coverage was light-theme only and retained no direct audio/language
correlation. The owner requested EN/RO and light/dark coverage in all four combinations.
**What happened:**
- Added strict theme/audio CLI options and a 36-row J1-J9 matrix. Every row now asserts the applied
  document theme and retains theme-qualified screenshots, AX data, native hierarchy, logcat, focus,
  activation, TTS, and route evidence.
- Added a local-only audio diagnostic using scrcpy Android `output`, ffmpeg volume analysis, and a
  multilingual whisper.cpp model. Each language/theme checkpoint retains audio, transcript,
  dominant language, and exact TTS-dispatch voices; no evidence leaves the Mac.
- An initial complete run left EN/dark J7 in saving state for more than 15 seconds. Isolated J7,
  ordered EN/dark J1-J9, and the final complete matrix all passed; retained as an unconfirmed
  storage/lifecycle flake, not a product defect.
- Final exact-candidate run on Pixel 6a / Android 17 / TalkBack 17 passed 36/36 plus audio 4/4.
  English audio and voice aligned. Romanian UI/AX text was correct in light/dark, but the device's
  `en-US` TalkBack configuration dispatched English voices and dominated both Romanian audio
  checkpoints; Romanian pronunciation quality remains unclaimed.
**Outcome:** `SUPPORTING_PASS` at
`.reports/android-physical/2026-08-13T00-29-02-176Z-talkback-browser/` for clean SHA `0113b35`.
`npm run check` passes 83 files / 655 tests; Playwright passes 212/212; PWA passes 1/1 outside the
macOS Chromium sandbox. TalkBack, stay-awake, ADB mappings, page, and server state were restored.
**Insight:** Audio language detection and TTS voice dispatch answer different questions; retain both
and attribute mixed assistive-technology output to device configuration unless app language/AX
evidence also fails.
**Promoted to Lessons Learned:** Yes — replaces the earlier categorical audio-capture limitation.

---

### [2026-08-13] Re-audit remaining product work

**Context:** After broad mobile migration and platform automation, the owner requested a fresh
psychological, architecture, and UI/UX audit plus one prioritized implementation plan.
**What happened:**
- Reviewed every active core route plus Journal chain analysis and vocabulary practice against the
  repository psychologist, mobile UX, and architecture rubrics.
- Compared crisis behavior with the project psychological contract and authoritative WHO, SAMHSA,
  and NIMH guidance. Found that temporal label history increases current crisis prominence despite
  the stated no-risk-inference boundary.
- Traced one previously unconfirmed Android save stall to a permitted failure mode: an unbounded
  serialized write promise can block all later writes and retries indefinitely.
- Found first-run storage disclosure, per-summary Journal evidence, partial DBT claims, score-like
  granularity feedback, Romanian terminology, onboarding priming, and entry/Explore choice load as
  bounded follow-up work.
- Replaced the release-only remaining plan with ordered P41-P46 product, validation, and release
  phases. Explicitly rejected broad routing, state, datastore, design-system, telemetry, and test
  framework projects.
**Outcome:** Planning only; no product behavior changed. `npm run test:coverage` passes 83 files /
655 tests. Overall coverage is 76.07% statements and 74.43% branches; core screen and data coverage
is materially higher, so the plan keeps risk-based tests instead of adding a global percentage
target.
**Insight:** Psychological safety invariants need behavioral enforcement, and a small fail-fast
write boundary has more value than a broad architecture refactor.
**Promoted to Lessons Learned:** Yes — behavioral psychological-contract enforcement.

---

### [2026-08-13] Bound and recover stalled session persistence

**Context:** P41 followed an Android J7 run that remained in `Finishing...` for more than 15
seconds. Code inspection confirmed that one unresolved promise blocked every later write and Retry.
**What happened:**
- Started with failing coordinator contracts for timeout, degraded retry, ordered writes, ordinary
  rejection recovery, obsolete generations, and late settlement.
- Added one workflow-local write coordinator with an eight-second deadline and structural,
  transient diagnostics containing no emotion or journal content.
- Propagated `AbortSignal` through `useSessionHistory` to the IndexedDB transaction. A real pending
  transaction now aborts on timeout or workflow reset; adapters that ignore cancellation remain
  degraded until their underlying promise settles.
- Preserved base/detail ordering and stable session identity. Reset rotates the queue generation so
  obsolete work cannot block or update a later check-in.
- Added a controlled-clock Playwright regression that holds IndexedDB completion, proves timeout,
  prevents duplicate writes during degradation, releases the late operation, and retries
  successfully in WebKit and Chromium.
**Outcome:** `npm run check` passes 84 files / 664 tests; Playwright passes 214/214; the production
PWA lifecycle passes 1/1; the production performance proxy passes 1/1. The focused persistence
suite passes 16/16. Initial JavaScript gzip remains within budget at 144,864 bytes.
**Insight:** A deadline without transaction cancellation creates an unknown late-write outcome.
Cancellation, queue health, and workflow generation are one reliability contract.
**Promoted to Lessons Learned:** Yes — bounded async writes with cancellation and generation
isolation.

---

### [2026-08-13] Make safety current-session only and disclose local saving

**Context:** P42 addressed the highest-priority trust gaps: historical labels could silently raise
current crisis prominence, while first-run onboarding did not expose the existing default-on local
save preference. The same pass bounded terminology cleanup without changing product mechanics.
**What happened:**
- Started with failing contracts, then removed temporal crisis escalation, history input, temporal
  UI metadata, and its unused module. Current support tier and tier-4 acknowledgement now depend
  only on the current reflection.
- Reused the existing save preference in the final onboarding step, including replay mode and the
  default-on behavior. Extracted the duplicated switch into one shared `Toggle` component.
- Tightened bilingual copy around reflection, Affect Map axes, Plutchik's model-specific starting
  emotions, optional needs, and Google AI Mode. The Google query contract and `udm=50` behavior did
  not change.
- Added a 320x568 EN/RO x light/dark onboarding Playwright matrix in WebKit and Chromium. It exposed
  a Romanian final-action overflow; compact-height spacing and shorter copy fixed all eight cases.
- Replaced stale remaining-work documentation with future-only P43-P46 phases and updated the
  architecture and psychological contracts to match current-session safety behavior.
**Outcome:** `npm run check` passes 83 files / 653 tests. Playwright passes 222/222 across Mobile
Safari and Mobile Chrome. The production PWA lifecycle passes 1/1 and the production performance
proxy passes 1/1 after correcting one stale CTA selector. Bundle and runtime performance budgets
remain within their configured limits.
**Insight:** Local-only persistence is still a meaningful first-run consequence. Bilingual consent
controls need compact-height coverage, and psychological safety claims must be enforced at the
data boundary rather than left to explanatory copy.
**Promoted to Lessons Learned:** No new entry; the active behavioral-contract and compact mobile
layout lessons already cover these findings. The obsolete temporal-escalation lesson was archived.

---

### [2026-08-13] Simplify Journal evidence and reflection exercises

**Context:** P43 addressed three remaining trust costs: one global Journal threshold let unrelated
entries unlock summaries, the journal exercise forced seven fields while implying a partial DBT
protocol, and vocabulary practice converted uncertainty into a completion total.
**What happened:**
- Started with 14 failing behavior tests. Replaced the global Journal gate with one pure policy
  containing metric-local three-entry thresholds for chosen/confirmed vocabulary, current-week
  valence observations, and somatic entries with selected regions.
- Replaced the seven-step journal worksheet with one four-part form: situation is required;
  noticed experience, response, and outcome or possible support are optional. New records use a
  version-2 discriminated shape; old seven-field records remain readable and export unchanged.
- Raised the user-data export envelope to schema version 3, preserving both record variants. Added
  a portaled, focus-trapped confirmation for deleting journal exercises, including failure recovery.
- Removed clear/unsure totals and dormant score/DBT/history copy in English and Romanian while
  retaining immediate descriptive distinctions and an equal `not sure` path.
- Added a 320x568 EN/RO x light/dark WebKit/Chromium matrix covering save, reload, deletion focus,
  compact layout, and score-free completion, plus a 200% compact Romanian reflow case. Early test
  failures corrected assumptions about reload returning to Today and the exact Romanian tab label.
**Outcome:** `npm run check` passes 83 files / 658 tests. Playwright passes 232/232 across Mobile
Safari and Mobile Chrome. The production PWA lifecycle and performance proxy each pass 1/1.
Initial JavaScript gzip is 143,596 bytes, entry JavaScript gzip is 42,955 bytes, and production
assets total 886,336 bytes, all within budget.
**Insight:** A shared minimum is not a valid evidence policy when summaries consume different data.
Metric-local eligibility prevents unrelated observations from manufacturing apparent patterns.
Versioned union reads preserve local records more simply and safely than an eager datastore rewrite.
**Promoted to Lessons Learned:** Yes — expanded the longitudinal UI lesson to require metric-local
evidence and reject global-gate contamination.

---

### [2026-08-13] Make Affect placement direct and clarify Explore choices

**Context:** P44 addressed an avoidable route-choice step before the primary Affect Map journey and
equal visual weight between naming methods and learning activities in Explore.
**What happened:**
- Started with failing Today callback and Explore grouping contracts. Split the Today entry into a
  direct Place the Feeling primary action and a Help me choose secondary action that retains the
  existing Arrival guide.
- Reused the typed `startRoute('affect')` workflow boundary; no router, state service, or duplicate
  route registry was added. Grouped the existing Explore entries into Notice and name and Compare
  and learn presentation sections, with Affect first.
- Revised bilingual task copy and added semantic regions. Added EN/RO x light/dark route, focus,
  history, grouping, and overflow coverage in WebKit and Chromium, plus four compact mobile sizes.
- Full verification exposed two stale Today copy assertions and a performance proxy that still
  entered every route through Arrival. Updated the benchmark so Affect measures the new direct path
  while Body and Words retain the guided path.
**Outcome:** `npm run check` passes 84 files / 663 tests. Playwright passes 248/248 across Mobile
Safari and Mobile Chrome. PWA lifecycle and performance proxy each pass 1/1. Initial JavaScript
gzip is 143,815 bytes, entry JavaScript gzip is 43,174 bytes, and production assets total 887,550
bytes, all within budget.
**Insight:** Primary-entry changes must update not only journey selectors but also performance
measurement paths; otherwise the benchmark silently measures obsolete information architecture.
**Promoted to Lessons Learned:** No — covered by documentation/source verification and behavioral
contract guidance.

---

### [2026-08-13] Preflight moderated comprehension validation

**Context:** P45 needed one auditable bilingual protocol before participant sessions, plus an
expert cognitive walkthrough that did not misrepresent automation as human evidence.
**What happened:**
- Replaced the narrower Word Ladder observation guide with one six-task protocol covering entry
  choice, intermediary completion, result rejection, local-save and Google teach-back, minimal
  Journal entry, and uncertainty during vocabulary practice.
- Defined participant mix, synthetic task cards, neutral moderation, privacy limits, observation
  fields, aggregate-only repository evidence, and explicit pass/correction thresholds.
- Started from failing copy contracts. Replaced the loaded "all fit" uncertainty explanation with
  the reason-neutral Not sure yet / Nu știu încă choice and neutral continuation feedback.
- Added compact EN/RO x light/dark browser assertions for feedback and action discoverability. The
  first 320x568 run found Continue completely below the viewport; a route-local sticky action fixed
  the defect without introducing a shared layout abstraction.
**Outcome:** Expert preflight complete. Participant evidence remains deliberately open.
`npm run check` passes 84 files / 664 tests. Playwright passes 248/248 across Mobile Safari and
Mobile Chrome, including the eight-scenario EN/RO x light/dark uncertainty matrix. The production
PWA lifecycle and performance proxy each pass 1/1. Initial JavaScript gzip is 143,754 bytes, entry
JavaScript gzip is 43,113 bytes, and production assets total 887,658 bytes, all within budget.
**Insight:** An uncertainty option must not prescribe why someone is uncertain. Automation that can
scroll to click a control can still hide a first-viewport discoverability defect, so critical
compact actions need explicit viewport assertions.
**Promoted to Lessons Learned:** No new entry; existing non-directive language and viewport
visibility lessons already cover both findings.

---

### [2026-08-13] Frame rejected results as rejected suggestions

**Context:** Three GPT-5.6 Luna max synthetic walkthroughs attempted the P45 protocol. Two stopped
in onboarding because of browser tooling; one unfamiliar-English run was partial, bypassed the T2
Word Ladder intermediary, and stopped T6 after step two. Psychologist, mobile UX, and architecture
reviews treated these as preflight only and validated source behavior independently.
**What happened:**
- Marked P45 human validation deferred rather than converting synthetic work into participant
  evidence. Retained the six-person protocol for a future round and documented the release-waiver
  boundary.
- Started with failing pure, component, bilingual-copy, and rendered-browser contracts. Confirmed
  that rejection correctly excluded patterns and inferred detail, while the CTA promised no label
  and history still rendered a bare emotion heading.
- Kept the original result and schema as local provenance. Added one presentation formatter so
  Today and Journal render `Suggested result: anxiety` / `Rezultat sugerat: anxietate`; saved detail
  explicitly labels the value as a suggested result that did not fit.
- Revised the mismatch explanation and CTA to say the user is not confirming the suggestion.
  Preserved the three-result display limit, export, persistence, crisis, and analytics behavior.
- Added a compact EN/RO x light/dark matrix across Mobile Safari and Mobile Chrome. Manual rendered
  inspection at 320x568 RO dark confirmed complete wrapping and the post-finish history label.
**Outcome:** `npm run check` passes 84 files / 668 tests. The complete Playwright run passed 255/256;
one existing Mobile Safari Word Ladder case timed out during `page.goto` and passed immediately in
an isolated rerun, yielding 256 behavior passes. PWA lifecycle and performance proxy pass 1/1.
Initial JavaScript gzip is 143,853 bytes, entry JavaScript gzip is 43,212 bytes, and production
assets total 888,004 bytes, all within budget.
**Insight:** Correct analytics are insufficient when presentation contradicts explicit rejection.
Provenance can remain locally useful only when every summary surface marks it as an unconfirmed
suggestion rather than a user-owned label.
**Promoted to Lessons Learned:** Yes — expanded the existing model-output history boundary.

---

### [2026-08-13] Make saved Journal exercises immediately discoverable

**Context:** P48 corrected a deterministic mismatch: saving an Unpack a moment exercise said it was
in the Journal, but the Journal exposed it only after reopening that same exercise screen.
**What happened:**
- Started with a failing Journal component contract. Passed the existing `chainEntries` and
  `chainLoading` state through `App` without merging repositories, schemas, or export shapes.
- Extracted the factual legacy/current preview policy once it gained a second consumer. Journal now
  selects the newest timestamp without mutating input and shows its situation, timestamp, and one
  accessible Open journal exercises action.
- Kept Unpack a moment as the empty action. When exercises exist but emotion reflections do not,
  the empty copy distinguishes the two record types.
- Added a 320x568 EN/RO x light/dark WebKit/Chromium journey covering save, Done, immediate
  rediscovery, reload persistence, route opening, focus-safe deletion cancellation, and overflow.
  The first run showed the action below the viewport; moving saved exercises before empty emotion
  history made the promised continuation visible without scrolling.
**Outcome:** `npm run check` passes 84 files / 670 tests. Full Playwright passes 256/256. PWA
lifecycle and performance proxy pass 1/1. Initial JavaScript gzip is 143,976 bytes, entry JavaScript
gzip is 43,335 bytes, and production assets total 889,542 bytes, all within budget.
**Insight:** A visible section heading does not make its action discoverable. After saving, the
continuation for that saved object must precede unrelated empty-state content on compact screens.
**Promoted to Lessons Learned:** No — the existing viewport-visibility lesson already covers the
general rule.

---

### [2026-08-13] Freeze and verify the P46 release candidate

**Context:** P46 required one deployed product candidate, complete repeatable gates, native evidence
from available Mac/Simulator/Pixel tooling, and explicit dispositions for unavailable human gates.
**What happened:**
- `npm ci` found transitive `nanoid@3.3.16` advisory GHSA-2v37-7h3g-55p8. Updated only the lockfile
  to `3.3.18`; clean reinstall and audit report zero vulnerabilities.
- GitHub Mobile Safari reproduced a compact Quick defect: the explicit commitment mounted below the
  fixed navigation. Added a failing focus/scroll contract, then nearest scrolling that preserves
  chip focus and does not submit automatically.
- Full local gates passed: 84 files / 672 tests, Playwright 256/256, PWA 1/1, performance 1/1.
  Deployment workflow `31703694847` passed after the prior red run `31699675891`.
- iOS Simulator passed base 16/16, J1-J9 36/36, and robustness 6/6 on both profiles. Native Safari
  was classified BLOCKED after SafariDriver click did nothing while diagnostic script activation
  produced the correct state; no app failure reproduced.
- Android browser and installed WebAPK passed J1-J9 EN/RO, 18/18 each. Pixel 6a three-run medians
  passed every mid-tier target: 1,485 ms startup, 231.6 ms worst first route, 39.6 ms warm return,
  and 0 ms median longest task (52 ms worst observed).
- All three native adapters exposed stale copy selectors. Replaced mutable save/AI checks with
  semantic state where available, synchronized onboarding focus, and retained platform-local flows.
  Human TalkBack, Romanian pronunciation, distinct low-tier hardware, and P45 participants remain
  explicit deferrals rather than inferred passes.
**Outcome:** Product SHA `61f8743` is frozen and deployed with no unresolved product blocker.
Recommendation is conditional release with documented evidence waivers. Initial JavaScript gzip is
144,022 bytes, entry JavaScript gzip 43,381 bytes, and production assets 889,661 bytes.
**Insight:** A native adapter that follows mutable copy can fail every route without finding a
product defect. Shared semantic hooks are justified after the same drift appears on three platforms.
**Promoted to Lessons Learned:** Yes — added the stable native acceptance hook rule.

---

### [2026-08-13] Stabilize native acceptance hooks

**Context:** P46 found the same translated-copy and presentation-class selector drift in Android,
iOS, and macOS adapters. P50 required one narrow contract without a workflow DSL or shared device
framework.
**What happened:**
- Started with failing product and static adapter contracts. Added six semantic hooks for guided
  entry, onboarding dialog/heading/progress, save status, and external AI handoff.
- Exported one frozen hook/selector map from `scripts/acceptance/`. Migrated four native adapters;
  retained accessible-name selection in TalkBack where spoken naming is the behavior under test.
- A back-to-back iOS run exposed a `simctl boot` state race. Extracted and unit-tested an idempotent
  boot boundary: already-booted and lost-race states proceed, while genuine boot failure stays fatal.
- Full browser coverage passed 256/256. PWA passed 1/1 after rerunning outside the macOS process
  sandbox. iOS Simulator passed Quick, onboarding focus, and Romanian guided Word Ladder, 3/3.
  Pixel 6a Android 17 passed J1/J5/J9 in EN/RO, 6/6. Native Safari remained BLOCKED at the known
  driver-click transport; diagnostic script activation reproduced correct product behavior.
**Outcome:** `npm run check` passes 85 files / 676 tests before the final documentation-only diff.
No copy, safety, persistence, visual, or interaction behavior changed. P50 is complete; P52 is a
bounded SafariDriver capability probe recommendation.
**Insight:** Stable product hooks remove application drift, but native transport capability is a
separate precondition. Probe that precondition once and classify it before running product rows.
**Promoted to Lessons Learned:** No — the existing native-hook and hardware fail-fast lessons cover
the reusable boundaries.

---

### [2026-08-13] Fail fast on inert native Safari activation

**Context:** Native Safari repeatedly failed its first product click, while a script click proved
the same product state transition. P52 needed to distinguish transport capability from application
behavior before running any product journey.
**What happened:**
- Started with six failing harness contracts for a disposable seed page, native pass, transport
  block, seed/session failure, matrix short-circuiting, and post-probe product failure.
- Added one seed-page button with synchronous `idle` to `activated` state. SafariDriver probes it
  once after session creation. Script activation runs only after inert native activation and can
  produce `BLOCKED`, never a pass.
- Removed the old script-click fallback from Quick diagnostics. Once the capability probe passes,
  any product journey failure is `FAIL` with DOM diagnostics.
- Safari 26.6 reproduced the transport block directly: native state remained idle, script state
  became activated, result was `BLOCKED`, and journeys remained empty.
**Outcome:** `npm run check` passes 85 files / 682 tests. Playwright passes 256/256; PWA lifecycle
and performance pass 1/1. No production asset, user behavior, copy, safety, or persistence code
changed.
**Insight:** A platform adapter must establish input-transport capability on a disposable surface
before interpreting an application interaction failure. Diagnostic bypasses can validate the
fixture, never the product journey.
**Promoted to Lessons Learned:** No — existing fail-fast hardware and native-browser readiness
lessons already cover the reusable rule.

---

### [2026-08-14] Complete bounded human TalkBack review

**Context:** P51 retained open human gesture, spoken-order, Romanian pronunciation, installed-mode,
and unavailable low-tier Android evidence after the automated TalkBack matrix.
**What happened:**
- Added a deterministic checkpoint preparer and strict CLI contract for bounded owner-operated
  onboarding, Word Ladder intermediary, tier-4 safety, and installed standalone checks.
- On Pixel 6a / Android 17 / TalkBack 17, physical one-finger swipe and double-tap passed English
  onboarding, English/Romanian intermediary selection, English/Romanian support-first safety order,
  and English installed standalone behavior, 6/6.
- Romanian app content dispatched the installed `ro-RO` voice while TalkBack's configured role and
  action instructions used `en-US`. The owner found Romanian speech understandable. Persistent
  local-privacy context could be announced during route replacement; target heading focus and
  content order remained correct, so no product defect reproduced.
- Retained a `BOUNDED_PASS` report and updated the active plan without converting bounded evidence
  into a complete human J1-J9 or low-tier claim.
**Outcome:** `npm run check` passes 86 files / 684 tests; Playwright passes 256/256; PWA and
performance pass 1/1. Product assets, copy, safety, persistence, and interaction behavior are
unchanged. P51 is complete for available hardware; distinct low-tier Android and P45 participants
remain external dependencies.
**Insight:** Deterministic setup can reduce human AT review to a few meaningful gestures, but the
human result must remain separately classified from setup automation and broader matrix coverage.
**Promoted to Lessons Learned:** No — existing TalkBack attribution and supporting-evidence lessons
already cover the reusable boundary.

---

### [2026-08-14] Publish the v0.1.0 release boundary

**Context:** The migration, release candidate, and available native evidence were complete, but the
repository had no tag or GitHub Release and the active plan still read as an implementation queue.
**What happened:**
- Replaced the completed phase sequence with one short maintenance plan: evidence-backed product
  triggers, deferred external evidence, closed speculative copy areas, and explicit architecture
  constraints.
- Added durable `v0.1.0` release notes covering shipped behavior, privacy, verification classes,
  and accepted low-tier, participant, TalkBack, SafariDriver, and physical-iPhone limitations.
- Updated the evidence ledger to the latest successful Pages and CodeQL workflows and linked the
  release from the README. Product code, package version, assets, copy, safety, and persistence were
  unchanged.
- Compared every index-referenced deployed asset with the local production build by SHA-256. All
  four matched. The public manifest and service worker returned 200; a fresh 393x742 Chromium
  session rendered Today and became controlled by the `/emotid/` service worker after reload.
**Outcome:** `npm run check` passes 86 files / 684 tests. Playwright passes 256/256; production PWA
and performance gates pass 1/1. The release closure is ready for an annotated `v0.1.0` tag and
GitHub Release at the documentation commit.
**Insight:** Release closure should turn a completed migration queue into a maintenance contract,
not preserve completed phases as apparent future work.
**Promoted to Lessons Learned:** No — the existing one-owner release-documentation lesson covers
the reusable rule.

---

### [2026-08-14] Align the Romanian voice with private self-reflection

**Context:** Romanian product copy addressed the user with polite plural forms, making an intimate
self-reflection experience sound institutional and socially distant.
**What happened:**
- Migrated all Romanian user address to informal singular across onboarding, Today, entry routes,
  generated synthesis, reflection, Journal, settings, privacy, support, and deterministic crisis
  guidance. English meaning and application behavior remain unchanged.
- Added a product-voice contract that scans static translations and every generated Romanian
  synthesis family for formal pronouns, auxiliaries, and imperatives.
- Updated unit, Playwright, Android, iOS Simulator, and macOS Safari acceptance expectations so
  accessible-name and spoken-language checks follow the released copy.
**Outcome:** `npm run check` passes 86 files / 685 tests. Playwright passes 256/256 across Mobile
Safari and Mobile Chrome, including Romanian light/dark, compact reflow, safety, and Journal flows.
**Insight:** Grammatical register is part of psychological tone and accessibility behavior, not
translation polish; one inconsistent generated or safety message can break the perceived voice.
**Promoted to Lessons Learned:** Yes — added the Romanian informal-singular product voice contract.

---

### [2026-08-14] Publish the v0.1.1 Romanian voice patch

**Context:** The informal-singular Romanian migration was deployed after `v0.1.0` and needed a
bounded patch release plus one live tone and presentation review.
**What happened:**
- Reviewed live Romanian onboarding, Today, guided arrival, Reflection, settings, privacy, and
  light/dark presentation. The voice was consistent and psychologically appropriate.
- The visual pass found `Luminos` and `Întunecat` touching their segment edges. Added a focused
  Settings modifier with stable desktop width and responsive mobile behavior.
- Started with a failing browser geometry contract, then verified text containment, at least 8px
  inline breathing room, and non-overlapping segments at 320px and 1280px in both browser engines.
- Bumped package metadata to `0.1.1`, added patch release notes, and updated the current-release and
  maintenance references. Safety, persistence, privacy, emotion models, and AI handoff behavior
  remain unchanged.
**Outcome:** `npm run check` passes 86 files / 685 tests. Playwright passes 258/258; production PWA
and performance probes pass 1/1.
**Insight:** Translation review must include intrinsic control geometry; text can remain technically
contained while touching an adjacent segment closely enough to look overlapped.
**Promoted to Lessons Learned:** No — the existing measurement-backed visual validation lesson
already covers the reusable rule.

---

### [2026-08-14] Correct compact theme spacing for the v0.1.2 release

**Context:** The first `v0.1.1` Pages run exposed a deterministic cross-platform failure in the new
Romanian appearance-label geometry contract.
**What happened:**
- CI measured only about 6.86px after the desktop appearance label in both Linux browser engines.
  The centered text was constrained by the control's total width, so increasing button padding did
  not affect its rendered inset.
- An initial corrective commit changed that ineffective padding and exact-sha CI remained red.
  Downloading its Playwright screenshot exposed the 1280px state and corrected the diagnosis.
- Increased the appearance control's minimum width from 192px to 216px and added viewport-aware
  assertion diagnostics. Kept the 8px rendered-geometry requirement unchanged across 320px and
  1280px viewports rather than weakening the test.
- Preserved the published `v0.1.1` tag and prepared an immutable `v0.1.2` corrective release.
**Outcome:** `npm run check` passes 86 files / 685 tests. CI-mode focused geometry passes 2/2;
Playwright passes 258/258; production PWA and performance probes pass 1/1.
**Insight:** A broad compact-layout override can silently defeat a component-specific spacing
contract; validate computed geometry under the CI font stack before publishing a release tag.
**Promoted to Lessons Learned:** No — existing cascade and measurement-backed validation guidance
covers the root issue.

---

### [2026-08-14] Add a post-deployment Pages smoke gate

**Context:** The release workflow verified its production artifact before deployment but did not
exercise the public URL, CDN-served assets, or deployed service-worker boundary afterward.
**What happened:**
- Added one isolated Chromium smoke contract with local-preview and explicit deployed-URL modes. It
  cache-busts by revision, seeds no personal content, opens Today and lazy Settings, verifies every
  index and manifest resource, and rejects browser errors, failed same-origin responses, and any
  unexpected outbound request.
- Proved the contract fails against an unreachable target. Its first local production run exposed
  that `navigator.serviceWorker.ready` may resolve while the worker is still `activating`; added an
  explicit activation wait, then required page control after reload.
- Exposed the Pages URL as a deployment-job output and added a dependent smoke job for `main` and
  manual deployments. The job installs Chromium only and retains a dedicated HTML report,
  screenshot, and trace on failure; pull requests retain the existing local-production matrix.
- Documented the published-boundary gate without treating it as a replacement for offline/update,
  native-device, performance, or participant evidence.
**Outcome:** Clean `npm ci` reports zero vulnerabilities. `npm run check` passes 86 files / 685
tests; Playwright passes 258/258; PWA and performance probes pass 1/1. The new smoke contract fails
closed against an invalid URL and passes 1/1 against both fresh local production and public
`v0.1.2`, with no outbound requests.
**Insight:** Worker readiness, worker activation, and page control are distinct deployment states;
the public edge needs its own small gate after the deployment action completes.
**Promoted to Lessons Learned:** Yes — added the post-deployment PWA activation/control contract.

---

### [2026-08-14] Complete P54 release evidence and CI feedback closure

**Context:** The maintenance plan and README named `v0.1.2`, but the active physical-evidence ledger
still presented the older `v0.1.0` freeze, test counts, and workflows as current. Two deterministic
release failures had also taken the full serial browser matrix to report.
**What happened:**
- Reframed the ledger around the immutable `v0.1.2` product tag at `93c804e` and the recorded
  post-release verification/deployment checkpoint at `a082c38`. Updated automated counts and exact
  workflow evidence without relabeling older hardware rows.
- Renamed physical and performance matrices as retained evidence and marked Simulator, Android,
  TalkBack, Safari, and timing rows with their actual pre-`v0.1.2` scope. Current automated passes
  and retained native evidence are now separate claims.
- Added CI-only `maxFailures: 1` to the primary Playwright config. A controlled four-test failure
  exhausted two retries, stopped after one final failure, and left three tests unrun. Local runs
  remain unlimited; the successful CI-mode matrix still ran 258/258.
- Documented the red-run diagnostic tradeoff in the quality gate and maintenance plan. Historical
  release notes, defect rows, and iteration records remain unchanged.
**Outcome:** `npm run check` passes 86 files / 685 tests. CI-mode Playwright passes 258/258; PWA,
performance, and local deployed-boundary probes pass 1/1. No product asset, copy, safety,
persistence, privacy, or interaction behavior changed.
**Insight:** Current automated evidence and retained native evidence need explicit candidate
identities; otherwise a truthful historical pass becomes a misleading current-release claim.
**Promoted to Lessons Learned:** No — the existing one-owner release-documentation lesson already
covers this recurrence.

### [2026-08-18] Independent expert audit and corrective backlog

**Context:** Requested UI/UX, psychological, and architecture audits using three `gpt-5.6-luna`
subagents at maximum reasoning, followed by independent verification of every proposed finding.
**What happened:**
- Reproduced the mobile product in EN/RO, light/dark, at 320px and 393px. Confirmed Privacy switch
  clipping/wrapping, Affect and Plutchik completion actions outside the first viewport, Affect
  origin false precision, absent SVG-dot focus, and 15 selected-chip colors below 4.5:1 contrast.
- Traced multi-parent Word Ladder results to `parents[0]`, chain-load errors to an empty-state
  fallback, and delete-all to stores being cleared without first quiescing the check-in writer.
- Confirmed body inference provenance is flattened in Reflection, crisis save feedback is hidden,
  persisted records lack runtime decoding, safety contacts are duplicated, and CI omits acceptance,
  untranslated-copy, and psychological-copy policy checks.
- Rejected or deferred unsupported proposals: no new backend/router/store/design system, no change
  to Google AI query semantics, no fourth fit answer without participant evidence, and no claimed
  screen-reader defect without native evidence.
- Replaced the stale no-known-defect maintenance status with one bounded P0-P3 corrective sequence.
**Verification:** `npm run test:coverage` passed 86 files / 685 tests; focused mobile layout passed
40/40; specialist runs also passed lint, type-check, copy/i18n/acceptance checks, Mobile Chrome,
Mobile Safari, PWA, and performance budgets. Initial JavaScript is 143,999 / 150,000 gzip bytes.
**Outcome:** No production behavior changed. The next releasable slice is privacy/data-erasure
integrity, followed by core Affect/Plutchik completion accessibility.
**Insight:** Expert review becomes actionable only after each claim is classified as reproduced
defect, source-proven defect, bounded risk, or unvalidated product hypothesis.
**Promoted to Lessons Learned:** Yes — actual interaction paths must own multi-parent provenance.

### [2026-08-18] Complete the P0-P3 corrective pass

**Context:** The independent audit produced a verified, bounded sequence covering privacy races,
core-route visibility, provenance, persistence trust, policy gates, and small maintenance debt.
**What happened:**
- Made delete-all exclusive: new writes pause, obsolete work is aborted and physically drained,
  both stores clear, workflow state resets, and preferences return to defaults. Rebuilt Privacy rows
  as stable label/switch grids with compact bilingual geometry tests.
- Corrected Affect origin language, SVG keyboard focus, dynamic chip contrast, and completion
  reveal. Applied the same reveal boundary to Plutchik. Preserved the actual Word Ladder traversal
  for multi-parent results and gave branch, leaf, completion, and removal actions explicit names.
- Kept the Google AI Mode URL/query contract unchanged while requiring explicit result fit before
  handoff. Exposed qualitative body-match strength, save feedback after crisis resources, and a
  separate journal-exercise load error. Added fail-fast runtime decoders and one crisis-resource
  URL source.
- Consolidated policy checks in CI, repaired contributor/security/architecture docs, removed the
  unused model bridge, and corrected the missing semantic color token.
- The first browser run caught stale action-name helpers in crisis and Romanian paths. Replaced the
  fourth repeated selector strategy with one visible-option helper while keeping dedicated
  accessible-name assertions. A later launch-only failure was macOS sandbox process denial; the
  unrestricted single-worker rerun separated environment failure from product behavior.
**Verification:** `npm run check` passed 88 files / 695 tests, policy audits, production build, and
asset budgets. Focused Chromium/WebKit paths passed 56/56; the full matrix passed 274/274. PWA
offline/update, local deployed smoke, and production mobile performance each passed 1/1. Initial
JavaScript is 145,022 / 150,000 gzip bytes; production assets are 895,465 / 960,000 bytes.
**Outcome:** P0-P3 are complete. No backend, telemetry, router/state migration, AI-query change, or
unsupported psychological feature was added. Next work is exact-commit corrective release closure.
**Insight:** Logical cancellation is insufficient for erasure; deletion must wait for physical
persistence settlement. Shared test helpers should select visible domain options, while separate
tests own exact assistive action-name contracts.
**Promoted to Lessons Learned:** Yes — destructive storage operations must quiesce physical writes.

### [2026-08-18] Close the v0.1.3 corrective release

**Context:** P0-P3 were green and deployed on `fb28bf3`, but package metadata and the public release
identity still named `v0.1.2`.
**What happened:**
- Bumped package and lockfile metadata together, added one bounded release note, and advanced the
  README, maintenance plan, and candidate-bound evidence owner without rewriting historical rows.
- Kept the external evidence waivers explicit and retained every native/physical result under its
  actual older candidate.
- Defined the next automated-only slice as one static release-identity consistency check rather
  than another release framework or product refactor.
**Verification:** The release commit passed `npm run check`, the complete Chromium/WebKit matrix,
PWA lifecycle, production performance, Pages deployment, public deployed smoke, and CodeQL before
the immutable `v0.1.3` tag and GitHub release were created.
**Outcome:** `v0.1.3` is the released identity for the August corrective pass. No product behavior
changed in the release-only commit.
**Insight:** Release facts already have enough owners; the next improvement is a read-only
consistency gate across them, not another manifest.
**Promoted to Lessons Learned:** No — the existing one-owner release-documentation lesson covers
this release.

### [2026-08-18] Enforce release identity consistency and publish v0.1.4

**Context:** `v0.1.3` required coordinated manual edits across package metadata, README, release
notes, and the active maintenance plan. Each file was correct, but no deterministic gate prevented
future partial updates.
**What happened:**
- Began with failing Node fixtures, then added one pure validator and a thin repository-reading CLI.
- Enforced package/lockfile versions, the README release URL, numeric latest-note identity/title,
  and the maintenance-plan release-scope link through `check:policy`.
- Kept live GitHub tags/releases outside candidate validation because they do not exist before the
  candidate passes and is published.
- Advanced the release owners and candidate evidence ledger together without relabeling older
  native, physical, assistive-technology, or participant evidence.
- Diagnosed a Mac-local long-lived WebKit blank-navigation timeout as browser transport: the exact
  case passed 3/3 alone, the CI retry recovered, and all 137 WebKit checks passed first-attempt
  across three fresh-browser shards. No product assertion failed.
**Verification:** Eight drift fixtures, the live repository check, clean install/audit, `npm run
check`, all 137 Chromium and 137 WebKit checks, PWA lifecycle, production performance, Pages
deployment, public smoke, and CodeQL passed before the immutable `v0.1.4` tag and GitHub release
were created.
**Outcome:** Release identity drift now fails locally and in CI with structured diagnostics. The
application bundle, user behavior, Google handoff, safety semantics, and evidence waivers are
unchanged.
**Insight:** Candidate-time consistency should validate existing release owners without querying
post-candidate publishing systems or adding another manifest.
**Promoted to Lessons Learned:** No — the existing one-owner release-documentation lesson already
covers the architectural boundary.

### [2026-08-18] Correct Romanian spelling across model-owned copy

**Context:** The Plutchik compassion result displayed `compașiune`, while the controlled need label
already used the standard Romanian `compasiune`. Existing translation parity and copy-policy gates
did not detect spelling defects in model-owned Romanian fields.
**What happened:**
- Audited every Romanian translation and model JSON value with the Romanian CSpell dictionary,
  then manually reviewed its remaining proper-name, placeholder, borrowed-word, and valid
  inflection flags.
- Corrected the compassion label and 22 legacy Body Compass fields with missing diacritics or
  malformed spellings, including `încleștare` and `împământare`.
- Centralized the assembled Romanian product-copy inventory in the existing language-quality test,
  pinned `compasiune` exactly, and rejected the confirmed malformed forms across translations,
  generated synthesis, catalog copy, model metadata, body-region data, and somatic display labels.
- Changed the existing Romanian Plutchik browser journey to render the reported compassion result
  and assert both the correct spelling and absence of the malformed form.
**Verification:** The post-fix dictionary audit contains no confirmed typo. `npm run check` passes
88 files / 696 tests, all policy gates, production build, and performance budgets. The focused
Romanian Plutchik regression passes in Mobile Chrome and Mobile Safari.
**Outcome:** Both user-facing Romanian occurrences now use `compasiune`; internal English
`compassion` IDs remain unchanged. No application behavior, English copy, or psychological/safety
semantics changed.
**Insight:** Translation parity is not a spelling inventory when localized copy also lives in model
data.
**Promoted to Lessons Learned:** Yes — model-owned localized copy must share the spelling gate.

### [2026-08-18] Publish v0.1.5 Romanian copy maintenance

**Context:** The spelling correction was committed, deployed, and green on `b3669bb`, while the
public release identity still named `v0.1.4`.
**What happened:**
- Advanced package and lockfile metadata, README, maintenance-plan scope, release notes, and the
  candidate-bound evidence ledger to `v0.1.5`.
- Scoped the patch release to Romanian spelling and its deterministic unit/browser guards; retained
  older native, physical, assistive-technology, participant, and low-tier evidence under the
  candidates that produced it.
- Kept the existing external evidence waivers explicit and added no product behavior, dependency,
  release framework, backend, telemetry, or external network behavior.
**Verification:** Release consistency, `npm run check`, the complete Mobile Safari and Mobile
Chrome matrix, production PWA lifecycle, mobile performance, Pages deployment, public smoke, and
CodeQL passed before the immutable `v0.1.5` tag and GitHub release were created.
**Outcome:** `v0.1.5` is the released identity for the Romanian copy correction. Internal emotion
IDs, English copy, psychological behavior, safety semantics, and Google handoff behavior remain
unchanged.
**Insight:** No new reusable process insight; the existing release-owner and evidence-retention
rules handled the patch without another abstraction.
**Promoted to Lessons Learned:** No.

### [2026-08-19] Fix uppercase-induced TalkBack spelling

**Context:** Exact `v0.1.5` physical testing became available again on the Pixel 6a. The full
automated TalkBack matrix passed, while owner swipe exploration heard the Reflection eyebrow as
individual characters and Romanian controls through the device's English voice profile.
**What happened:**
- Ran J1-J9 in EN/RO and light/dark against the clean `v0.1.5` local production build: 36/36
  `SUPPORTING_PASS`, with bound TalkBack, touch exploration, native activation, TTS dispatch, and
  route postconditions.
- Reproduced that `.screen-eyebrow` transformed sentence-case DOM text to uppercase; removing the
  transform in the live Pixel page changed `O posibilitate, nu un verdict` from character spelling
  to normal speech.
- Removed only that visual transform and added a bilingual browser regression for exact copy and
  computed sentence case.
- Separated the remaining voice behavior from the product fix: Android, Chrome, and TalkBack were
  `en-US`; Romanian visible/AX content and `html lang="ro"` were correct; explicit control-level
  `lang="ro"` did not change the English control voice.
**Verification:** `npm run check` passes 88 files / 696 tests and all policy/build/budget gates;
Mobile Safari + Mobile Chrome pass 274/274; the focused accessibility suite passes 16/16; the
corrected physical J8 RO light/dark run passes 2/2. The owner confirmed normal eyebrow speech in
the live CSS experiment. TalkBack, touch exploration, stay-awake, server, and ADB forwards were
restored afterward.
**Outcome:** Prose-like screen eyebrows remain visually sentence case and are no longer exposed as
acronym-like speech. No copy, safety order, language metadata, emotion logic, or persistence changed.
The complete human J1-J9 waiver and `en-US` TalkBack pronunciation limitation remain explicit.
**Insight:** CSS capitalization can affect physical assistive speech even when source text and
document language are correct.
**Promoted to Lessons Learned:** Yes — avoid transformed uppercase on screen-reader-visible prose.

### [2026-08-19] Apply Romanian language before the first UI mount

**Context:** During the physical Romanian TalkBack follow-up, the owner identified a precise
cluster spoken with the English voice: the initial Today title, primary actions, quick-section
heading and six choices, recent-thread heading, and bottom navigation.
**What happened:**
- Added a failing browser probe that captured `html.lang` at the first localized Today DOM mutation;
  it reproduced `en` even though every visible string and accessible name was Romanian.
- Traced the ordering defect to the static `index.html` fallback and the Language provider's
  post-render effect.
- Centralized initial-language resolution, applied it before `createRoot`, passed that exact value
  into the provider, and made runtime language changes update document semantics before rerender.
- Extended the regression across every reported initial heading/control and verified inherited
  Romanian language in Mobile Chromium and WebKit.
- Recorded the finding and corrected physical evidence without claiming Romanian pronunciation:
  the Pixel's Android, Chrome, and TalkBack profiles remain `en-US`.
**Verification:** The regression failed before implementation (`en` vs `ro`) and passes afterward
in both browser projects. `npm run check` passes 88 files / 696 tests plus every policy, i18n,
psychological-copy, release, build, and performance gate. Playwright passes 276/276; PWA lifecycle
passes 1/1. Pixel 6a Android 17 / TalkBack 17 passes J9 RO light/dark 2/2 against exact local assets.
TalkBack, touch exploration, stay-awake, and ADB forwarding were restored afterward.
**Outcome:** Initial Romanian UI now exists under Romanian document semantics from its first DOM
commit. No copy, styling, workflow, safety, persistence, AI handoff, or network behavior changed.
The complete human TalkBack matrix and Romanian pronunciation check remain unclaimed.
**Insight:** Post-render language synchronization is too late for initial assistive-technology
metadata even when sighted localization appears correct.
**Promoted to Lessons Learned:** Yes — initialize document language before mounting localized UI.

### [2026-08-19] Attribute Romanian TalkBack voice to Chrome locale

**Context:** The owner returned for the listening pass left open after the pre-mount language fix.
The exact reported Today headings and controls still sounded English under the original device
configuration.
**What happened:**
- Reproduced the complete initial Today surface on `fbf039e` with pre-mount `html lang="ro"` and
  confirmed that the owner heard the `Cum te simți?` text itself, not only its role, in English.
- Correlated the observation with TTS logs alternating `ro-RO` and `en-US`; Android was `en-US`, and
  Chrome and TalkBack had no per-app locale and therefore inherited it.
- Temporarily selected Chrome `ro-RO`; the owner accepted Android's language dialog, leaving Chrome
  normalized to app locale `ro`.
- Repeated the exact title and full heading/button swipe sequence through `Jurnal`. The owner
  confirmed all Emot-ID content was now spoken in Romanian. TalkBack's own `double tap to activate`
  hint remained English under its inherited `en-US` locale.
- Restored TalkBack, touch exploration, stay-awake, ADB forwarding/reverse, and the local server;
  retained the owner-selected Romanian Chrome locale.
**Verification:** Owner-observed Romanian app-content speech passed across every initially reported
Today heading/control after Chrome was set to `ro`. Device settings afterward: accessibility `0`,
touch exploration `0`, stay-awake `0`, no ADB forwards/reverses.
**Outcome:** No further product change is justified. The app owns Romanian text and document
semantics; Chrome/TalkBack own voice selection and AT action hints. The bootstrap regression remains
valid, but it is not represented as the physical pronunciation fix.
**Insight:** A correct web language boundary cannot force a browser/AT voice policy. Compare the
same node before and after the browser app locale, and distinguish page text from AT-generated
roles and instructions.
**Promoted to Lessons Learned:** No — the existing TalkBack source/language attribution lesson
already covers this boundary.

### [2026-08-23] Publish v0.1.6 TalkBack accessibility maintenance

**Context:** Two verified accessibility corrections and the browser-locale attribution were green
and deployed after `v0.1.5`, while package metadata and the immutable release identity still named
the earlier Romanian spelling release.
**What happened:**
- Advanced package and lockfile metadata, README, maintenance-plan scope, release notes, and the
  candidate-bound evidence ledger to `v0.1.6`.
- Scoped the patch release to sentence-case screen eyebrows and pre-mount/runtime document-language
  ordering. Added no new copy, product behavior, dependency, network path, or release framework.
- Kept the exact `v0.1.5` physical TalkBack baseline and corrected J8/J9 follow-ups under their
  recorded commits instead of relabeling them as exact `v0.1.6` evidence.
- Recorded the owner-confirmed platform boundary: Romanian app content passes when Chrome uses app
  locale `ro`; TalkBack-generated hints continue to follow the AT/device `en-US` locale.
**Verification:** Clean `npm ci` and `npm audit` report zero vulnerabilities. Release fixtures pass
8/8; `npm run check` passes 88 files / 696 tests and all policy/build/budget gates. Mobile Safari
and Mobile Chrome pass 276/276; PWA lifecycle, production performance, and local deployed-boundary
smoke each pass 1/1. The exact release commit passed hosted CI, Pages deployment, public smoke, and
CodeQL before the immutable tag and GitHub release were created.
**Outcome:** `v0.1.6` is the released identity for the TalkBack casing and document-language
corrections. Existing external evidence waivers remain explicit; no unsupported human J1-J9,
low-tier device, participant, or native Safari claim was added.
**Insight:** No new release abstraction was needed; the existing consistency gate and
candidate-bound evidence ledger covered the patch.
**Promoted to Lessons Learned:** No.

### [2026-09-05] Direct UX and psychological audit of v0.1.6

**Context:** Owner requested current major problems and a prioritized remediation plan, explicitly
without subagents. Browser review began September 4.
**What happened:** Inspected main source and traversed isolated Chromium mobile journeys in
Romanian/light and English/dark, with complementary settings/theme and compact-width samples.
Reproduced stale session identity overwriting a prior record, rejection lost through revision,
empty revision drafts, a body completion button with no outcome, and journal exercise fields
stored but unavailable for full readback. Production somatic analysis returned no suggestions
for 64 of 183 exposed single-signal cases; no-suggestion is legitimate, silent completion is the
defect. Recorded grouped-result agency, missing educational contrasts, and visual hierarchy
concerns separately from measured behavior.
**Outcome:** Added `docs/ux-psychology-audit-2026-09-04.md` as evidence and updated the active plan
with ordered R1-R6 repairs and acceptance criteria. No product implementation, commit, push, or
release performed. Existing external evidence waivers remain unchanged.
**Verification:** Direct browser interactions, screenshots, source tracing, production analyzer
enumeration, and repository readback of synthetic four-field exercise data. No full test-suite,
physical speech, clinical, or participant validation claimed.
**Insight:** Completed migration and happy-path trust tests do not establish persistence correctness
on revision/exit paths or full readability of saved journal content.
**Promoted to Lessons Learned:** No; existing lifecycle and behavioral-contract lessons cover this.

### [2026-09-05] September R1-R6 implementation and verification

**Context:** Owner authorized implementation, comprehensive verification, and publication to live.
**Changes:** Fixed new quick-entry identity; retained workflow drafts and immediate fit corrections;
kept pending committed writes independent of new drafts and guarded stale exits. Added validated
observation-only body completion without changing scoring. Added full exercise readback and
individual deletion. Added explicit per-result acceptance, shared result derivation for summaries,
and unchanged emotion-name-only Google handoff. Added five bilingual learning contrasts/examples,
a reviewed bittersweetness definition, pre-choice meanings and compact Word Ladder navigation.
Moved introduction language choice to step one; opened guidance directly and retained its step
in browser history. Split the somatic selection guard from scoring to preserve lazy loading.
**Discovered during verification:** Returning to a method menu incorrectly restarted the guide;
fixed by recording its step. New drafts must not cancel already committed corrections; stale
completion callbacks must not close a new session. Browser launch failures with WebKit Abort trap
occurred under sandbox, before app load; rerun outside sandbox, not counted as product evidence.
**Verification so far:** Focused Chromium/WebKit new identity, rejection/revision, body observation,
gratitude-only AI handoff and EN/RO four-entry readback passed. All exposed 183 body combinations
are covered (64 empty). Complete product policy/unit/build/budget gate passed; full final browser,
PWA/performance and hosted publication checks still running. Visual RO/light 393x742 inspection
shows continuation plus three complete child choices. Final outcomes recorded after completion.
**Scope:** No backend, telemetry, new outbound behavior, scoring threshold or crisis-tier change.
No new native speech, physical device, participant or clinical-efficacy claim.

**Final local verification:** `npm run check` passed: 90 files / 710 tests, policy, lint, build,
and budgets (initial JS 149,037 gzip bytes / 150,000 limit). All 298 Chromium/WebKit journeys
passed against the unchanged production build, including EN/RO x light/dark and enlarged text.
Production offline/update preservation and route performance each passed. Development-backed
attempts were invalidated by Fast Refresh reloads, including a LanguageContext invalidation;
release CI now explicitly uses production preview. Native adapters and their selector contract
follow direct guidance and first-step language placement; no native execution is claimed.
The exact pushed candidate must pass hosted build, Pages deployment and public smoke before
publication is reported. Next work: bounded reviewed definitions, not a new architecture.
**Promoted to Lessons Learned:** Final browser verification needs an unchanged candidate.

**Publication follow-up:** Push surfaced new dependency advisories. Read-only triage found seven
underlying advisories in development-only `browserslist`, `fast-uri`, and `@humanfs/node`; npm
propagates them to 96 dependency entries. `npm audit --omit=dev` reports zero. Dependency
remediation now precedes optional content work in the remaining plan. No dependency changes or
automatic/forced audit fix were mixed into this UX pass.
