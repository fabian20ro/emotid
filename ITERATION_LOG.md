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
