# Emot-ID: Multi-Perspective Psychological Analysis

**Date:** 2026-02-07
**Codebase version:** Post Pixel 9a layout hotfixes (Phase 0.1-0.3 completed)
**Target device:** Pixel 9a (393×742 effective Chrome viewport; 412×915 physical)

> Historical baseline audit. File references and implementation findings describe the February
> 2026 codebase; current migration status is tracked in `docs/mobile-rehaul-remaining-plan.md`.

## Current Disposition — August 2026

This document is retained as the original multidisciplinary audit, not as current architecture or
an executable backlog. Its component names, line references, test counts, phase order, and proposed
files must not be used to plan changes without checking the current source and migration plan.

| Baseline recommendation | Current disposition |
|---|---|
| Tier-4 support, temporal disclosure, graduated crisis access | Implemented through one deterministic shared workflow; safety semantics remain explicitly tested. |
| Quick check-in, emotional granularity practice, and chain analysis | Implemented as optional routed experiences. |
| Model-first navigation and first-launch model choice | Superseded by experience-first Arrival and Quick entry; named theories remain optional Explore tools. |
| Modal result/history/settings workspace | Replaced by Today, Reflection, Journal, Settings, and utility screens with typed navigation. |
| Lazy model loading and offline visibility | Implemented with explicit feature boundaries, production budgets, and PWA lifecycle tests. |
| Progression nudges, reminders, effectiveness tracking, and simple-language mode | Not approved current scope; these require separate product, privacy, and psychological review. |
| Deeper somatic/body redesign | Deferred until navigation truth and physical-device acceptance are complete. |
| Master combination model | Rejected because the underlying emotion frameworks are not interchangeable scoring systems. |

The active sequence and verification evidence live in
[`docs/mobile-rehaul-remaining-plan.md`](docs/mobile-rehaul-remaining-plan.md); current structure
lives in [`docs/CODEMAPS/architecture.md`](docs/CODEMAPS/architecture.md).

---

## Table of Contents

- **Part I: Technical Presentation**
  - [1. Architecture Overview](#1-architecture-overview) — Software Architect
  - [2. Implementation Report](#2-implementation-report) — Senior Developer
  - [3. Mobile UX Report](#3-mobile-ux-report) — UX Engineer
- **Part II: Psychological Analysis**
  - [4. Clinical Psychology](#4-clinical-psychology) — Trauma-informed, DBT/CBT
  - [5. Developmental Psychology](#5-developmental-psychology) — Emotional development
  - [6. Affective Science](#6-affective-science) — Emotion theory, psychophysiology
  - [7. Health & Behavioral Psychology](#7-health--behavioral-psychology) — Behavior change
  - [8. UX Psychology](#8-ux-psychology) — Cognitive load, choice architecture
- **Part III: Cross-Perspective Synthesis**
  - [9.1 Consensus Themes](#91-consensus-themes)
  - [9.2 Conflict Resolution](#92-conflict-resolution)
  - [9.3 Prioritized Action Plan](#93-prioritized-action-plan)
  - [9.4 Improvement Plan Disposition](#94-improvement-plan-disposition)
  - [9.5 Success Metrics](#95-success-metrics)
- **Part IV: Appendices**
  - [A. Pixel 9a Layout Specifications](#appendix-a-pixel-9a-layout-specifications)
  - [B. Crisis Detection Algorithm](#appendix-b-crisis-detection-algorithm)
  - [C. New i18n Keys Required](#appendix-c-new-i18n-keys-required)

---

# Part I: Technical Presentation

## 1. Architecture Overview

**Presenter:** Software Architect

### 1.1 Technology Stack

Emot-ID is a client-only Progressive Web App with zero backend dependencies. The stack:

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 (strict mode) |
| Build | Vite | 7.2 |
| Styling | Tailwind CSS | 4.1 |
| Animation | Framer Motion | 12.29 |
| Storage | IndexedDB (`idb-keyval`) + localStorage | — |
| PWA | `vite-plugin-pwa` | 1.2 |

The zero-backend architecture is a deliberate privacy decision: all data stays on-device. There are no analytics, no accounts, no cloud sync. This means no telemetry — which is both the app's strongest privacy feature and its primary measurement limitation.

### 1.2 Model Registry Pattern

The core architectural pattern is a **model registry** (`src/models/registry.ts`) that maps model IDs to implementations and visualization components:

```
registry: Record<ModelId, { model: EmotionModel, Visualization: ComponentType }>
```

Four models are registered:

| Model ID | Psychological Basis | Visualization | Emotion Count |
|----------|-------------------|---------------|---------------|
| `somatic` | Nummenmaa et al. (2014) body maps | `BodyMap` (SVG) | 30+ via signals |
| `plutchik` | Plutchik's psychoevolutionary theory | `BubbleField` | ~55 (8 primary + spawns + dyads) |
| `wheel` | Parrott's emotion hierarchy | `BubbleField` | ~135 (3-level tree) |
| `dimensional` | Russell's circumplex model | `DimensionalField` (SVG scatter) | ~38 (valence × arousal) |

This registry pattern enables adding new models without modifying existing code — a new model needs only a directory under `src/models/`, an entry in `MODEL_IDS` (`src/models/constants.ts`), and a registration call in the registry.

### 1.3 Data Flow

The complete data flow from user interaction to session persistence:

```
User taps emotion/region/dot
  → App.handleSelect() — dismisses hint, plays sound, vibrates
    → useEmotionModel.handleSelect()
      → model.onSelect(emotion, state, selections)
        ← SelectionEffect { newState, newSelections? }
      → updates modelState + selections

User taps "Analyze"
  → App.analyzeEmotions()
    → model.analyze(selections)
      ← AnalysisResult[]
    → ResultModal opens
      → synthesize(results, language) — narrative generation
      → getCrisisTier(resultIds) — safety tier
      → escalateCrisisTier() — temporal pattern check
      → getOppositeAction() — DBT nudge
      → getInterventionType() — micro-intervention

User closes ResultModal
  → App.handleSessionComplete(reflectionAnswer)
    → if saveSessions=false, returns early
    → serializes selections + results → Session
    → useSessionHistory.save() → IndexedDB
```

**Key design decision:** The somatic model has a unique deselect path. BodyMap intercepts deselect and passes enriched `SomaticSelection` objects (with sensation type and intensity) back upstream, rather than plain region objects. This is because the somatic model needs per-region sensation data that only the BodyMap component holds.

### 1.4 Safety System Architecture

The safety system operates at three layers:

**Layer 1 — Single-session distress detection** (`src/models/distress.ts`):
- `HIGH_DISTRESS_IDS`: 17 emotion IDs flagged as high-distress (despair, rage, terror, grief, shame, loathing, worthless, helpless, apathetic, empty, powerless, abandoned, victimized, numb, violated, depressed, distressed)
- `TIER3_COMBOS`: 10 specific pairs triggering maximum crisis response
- `getCrisisTier()`: Returns `none | tier1 | tier2 | tier3`

**Layer 2 — Temporal pattern escalation** (`src/data/temporal-crisis.ts`):
- `hasTemporalCrisisPattern()`: Detects 3+ tier2/3 sessions in a 7-day rolling window
- `escalateCrisisTier()`: Bumps the current tier by 1 when temporal pattern is active
- Integrated into ResultModal: tier is escalated before display

**Layer 3 — Narrative tone adaptation** (`src/models/synthesis.ts`):
- When 2+ distress results are detected, synthesis shifts from adaptive-function framing to acknowledgment-first tone
- "You may need" becomes "You deserve" for severe cases
- Opposite action suggestions and micro-interventions are available during tier1-3 crisis (DBT tools are most useful during distress)
- Only tier4 (pre-acknowledgment) gates these features behind the acknowledgment wall

**Current gap:** There is no Layer 4 for suicide-specific routing. The system detects severe distress combinations but does not differentiate between general crisis and active suicidal ideation. This is the single most important safety gap (see Section 4).

### 1.5 State Management

No external state library. State is distributed across:

| Location | What | Persistence |
|----------|------|-------------|
| `useModelSelection` hook | Active model ID | localStorage |
| `useEmotionModel` hook | Selections, model state, visible emotions | None (resets on model change) |
| `useHintState` hook | Per-model first-interaction hint | localStorage |
| `useSessionHistory` hook | Session array, CRUD | IndexedDB |
| `LanguageContext` | Language (`ro`/`en`), section accessor | localStorage |
| `useSound` hook | Mute state | localStorage |
| `App` local state | `saveSessions`, menu state, modals | localStorage for save pref |

This is appropriate for the current complexity level. The app has no cross-cutting state that would benefit from Redux/Zustand — each piece of state has a single owner and flows downward through props. The `useEmotionModel` hook acts as a state machine with model-specific transition logic, which is the most complex piece.

### 1.6 Extensibility Assessment

**Well-designed for extension:**
- Model registry: add models without touching existing code
- Bilingual i18n: `{ ro, en }` inline on all emotion data
- Visualization interface: `VisualizationProps` contract for any renderer
- Portal pattern: all fixed overlays use `createPortal(…, document.body)` consistently

**Extension constraints:**
- Adding a third language requires touching every data file (inline labels)
- The `BubbleField` visualization is shared by Plutchik and Wheel but has model-specific sizing logic (`getEmotionSize`)
- Safety system uses hardcoded emotion IDs — new models must map their IDs to the existing distress vocabulary or extend it

---

## 2. Implementation Report

**Presenter:** Senior Developer

### 2.1 Code Quality

**Test coverage:** 402 tests across 52 test files, all passing. Test types:
- Unit tests for all model scoring algorithms, synthesis, distress detection, temporal crisis, vocabulary, somatic patterns, valence ratio
- Component tests with Testing Library for all major UI components
- Integration tests for the full select → analyze → result flow
- E2E tests with Playwright for mobile Safari and Chrome viewports

**TypeScript discipline:**
- Strict mode enabled (`tsc -b`)
- Type-safe i18n via `section()` accessor that returns typed section objects
- All emotion data uses `BaseEmotion` extension hierarchy with model-specific fields
- `SelectionEffect` return type enforces that model state transitions are declarative, not imperative

**Code organization:**
- Flat component directory (no nesting) — appropriate for current ~25 components
- Models organized by directory with types, index, and data files
- Hooks extracted for each concern (model selection, hint state, sound, focus trap, session history)
- Pure functions for scoring (`scoreSomaticSelections`), synthesis (`synthesize`), bridge suggestions (`getModelBridge`), and opposite action (`getOppositeAction`)

### 2.2 Accessibility

**Implemented:**
- `role="dialog"` and `aria-modal="true"` on all modals (ResultModal, DontKnowModal, SettingsMenu, InfoButton, SessionHistory, Onboarding)
- Focus trapping via `useFocusTrap` hook on all modal components (Tab cycles within modal, Escape closes, focus restored on close)
- `aria-label` on all interactive elements, including SVG dots in DimensionalField
- `aria-pressed` state on toggleable emotion dots
- `aria-live="polite"` region for screen reader selection count announcements (`src/App.tsx:301`)
- `<MotionConfig reducedMotion="user">` wrapping entire app respects OS `prefers-reduced-motion`

**Gaps:**
- BodyRegion paths in BodyMap use SVG `<path>` elements — screen readers cannot reliably announce individual regions. The invisible `<rect>` hit areas help touch but don't help screen readers.
- BubbleField's dynamically positioned buttons may create unpredictable focus order
- The breathing exercise in MicroIntervention has no aria-live announcements for phase changes (inhale/hold/exhale) — a screen reader user would miss the timing cues

### 2.3 PWA Capabilities

**Implemented:**
- Service worker via `vite-plugin-pwa` for offline caching
- Manifest with icons, theme color, display mode
- Deployed to GitHub Pages at `/emotid/`

**Not yet implemented:**
- Offline indicator (user doesn't know when they're using cached content)
- Install prompt (relying on browser's native prompt only)
- Background sync (not applicable — no backend)

### 2.4 Performance

**Optimizations present:**
- `React.memo` on visualization components (Bubble, BodyRegion, BubbleField, BodyMap, DimensionalField)
- `useMemo` for computed values (crisis tier, synthesis text, bridge suggestion, intervention type, vocabulary stats, somatic patterns, valence ratio)
- `useCallback` for all handlers passed as props
- Framer Motion `AnimatePresence` with `mode="popLayout"` for efficient enter/exit
- Lazy `AudioContext` initialization in `useSound`

**Not yet implemented:**
- `React.lazy` + `Suspense` for model lazy loading (all 4 models loaded upfront)
- Code splitting for model data files (somatic data.json is the largest at ~500 lines)

### 2.5 Security Posture

**Privacy-by-design:**
- Zero network requests (no analytics, no telemetry, no backend)
- All data stored locally (IndexedDB + localStorage)
- No authentication, no accounts, no cookies
- "Share with therapist" export is user-initiated download only
- Privacy disclosure in SettingsMenu with detailed InfoButton

**Attack surface:**
- The only external navigation is to Google's AI overview (`https://www.google.com/search?udm=50&q=...`) and `findahelpline.com` — both via user-initiated clicks
- `noopener noreferrer` on all external links
- No user-generated content that could enable XSS
- No URL parameters that could be manipulated

---

## 3. Mobile UX Report

**Presenter:** UX Engineer

### 3.1 Viewport Budget

Target: Pixel 9a in Chrome (412×915px physical, ~393×742px visible after browser chrome).

**Chrome budget breakdown (742px visible):**

| Element | Height | Source |
|---------|--------|--------|
| Header (merged) | 48px | `--chrome-height` in `index.css` |
| SelectionBar (when active) | 48px max | `max-h` constraint |
| Bottom bar (analyze + "don't know") | ~78px | `py-1.5` + button + safe area |
| Safe area bottom | ~16px | `env(safe-area-inset-bottom)` |
| **Available for visualization** | **~552px** (with selections) / **~600px** (without) | |

This budget is tight but workable. The Phase K optimizations (merged header, horizontal scroll selection bar, compact bottom bar) recovered ~120px compared to the pre-Phase K layout.

### 3.2 Touch Patterns

**44px minimum enforced everywhere:**
- All buttons use `min-h-[44px]` (SettingsMenu, AnalyzeButton, reflection buttons, intervention buttons)
- SVG regions in BodyMap have enlarged `hitD` paths for small areas (throat, jaw)
- DimensionalField dots have invisible `<circle r={32}>` hit areas behind visible r=11 dots (~46px at mobile scale)
- Sensation buttons in SensationPicker are 44px minimum height
- SelectionBar chips are 44px minimum height

**Gesture support:**
- SettingsMenu: `drag="y"` swipe-to-dismiss (threshold: 100px offset or 500px/s velocity)
- SensationPicker: `drag="y"` swipe-to-dismiss (same thresholds)
- DimensionalField: tap-to-place crosshair with nearest-3 suggestion chips

### 3.3 Model-Specific Layout Behavior

**BubbleField (Plutchik, Wheel):**
- Mobile (<480px): Deterministic wrapped-row layout with even vertical spacing
- Rows distributed vertically: `idealSpacing = (availableVertical - totalContentHeight) / (rows - 1)`, capped at `bubbleHeight * 3`
- Organic jitter: `min(6, floor(rowSpacing * 0.15))` pixels of randomness per bubble
- Grid fallback after 100 placement attempts

**BodyMap (Somatic):**
- SVG viewBox: `-50 -10 300 450`
- Body silhouette centered at x=100
- Labels alternate left (x=0) and right (x=172) by vertical position with anatomical pair constraints
- Back regions (upper-back, lower-back) widened ~15px for visible/clickable slivers
- SensationPicker: bottom sheet with 2-column grid of 9 sensation buttons

**DimensionalField:**
- 500×500 SVG viewBox with 30px padding (INNER=440)
- `aspect-square` CSS constraint fills available width on mobile (~391px on 393px viewport)
- Instructions hidden on mobile (`hidden sm:block`)
- Suggestion chips overlaid at bottom of SVG container with 44px touch targets

### 3.4 Dark Theme

The app is dark-theme-only (`bg-gradient-to-br from-gray-900 to-gray-800`). This is a deliberate choice:
- Reduces screen glare for emotional reflection contexts
- Better OLED battery performance on mobile
- Emotion colors (saturated hues) pop against dark backgrounds
- Crisis resources use amber tones that remain visible and distinct from the dark UI

### 3.5 Animation Budget

All animations use Framer Motion spring physics. Key timing:
- Bubble enter/exit: spring with staggered index
- Modal enter: `scale: 0.9 → 1`, `opacity: 0 → 1`, `y: 20 → 0` (spring, damping=25)
- SettingsMenu: `y: '100%' → 0` (spring, stiffness=400, damping=35)
- Breathing exercise: 4s inhale, 2s hold, 6s exhale (CSS-driven scale 0.9-1.2)
- `<MotionConfig reducedMotion="user">` globally respects `prefers-reduced-motion`

The animation budget is well-managed. There are no heavy layout thrash animations — everything uses `transform` and `opacity` (GPU-composited properties). The one potential issue is BubbleField re-layout when bubbles enter/exit, which triggers a position recalculation, but `AnimatePresence mode="popLayout"` handles this efficiently.

### 3.6 Z-Index Scale

CSS custom properties in `src/index.css` establish a clear stacking order:

```
--z-base: 0
--z-header: 10
--z-dropdown: 20
--z-backdrop: 30
--z-modal: 40
--z-toast: 50
--z-onboarding: 60
```

All components reference these variables instead of raw numbers. The `createPortal(…, document.body)` pattern ensures fixed overlays escape parent stacking contexts (critical for WebKit where `backdrop-filter` on Header creates a new stacking context).

---

# Part II: Psychological Analysis

## 4. Clinical Psychology

**Presenter:** Clinical psychologist specializing in trauma-informed practice, DBT, and CBT

### 4.1 Professional Framework

I evaluate Emot-ID through the lens of:
- **Do No Harm**: Does the app risk exacerbating distress, triggering traumatic material, or pathologizing normal emotions?
- **Safety First**: Are crisis detection and support pathways adequate?
- **DBT Alignment**: Are opposite action suggestions, distress tolerance techniques, and emotional regulation concepts implemented faithfully?
- **Informed Use**: Does the user understand what this app is and is not?

### 4.2 Strengths Observed

**S4.1 — Tiered crisis detection is thoughtfully designed.** The three-tier system (`src/models/distress.ts`) differentiates warm invitation (tier 1), amber alert with grounding (tier 2), and direct acknowledgment (tier 3). The 10 specific combo pairs for tier 3 (`despair + helpless`, `shame + worthless`, etc.) reflect clinically meaningful danger combinations. The temporal escalation layer (`src/data/temporal-crisis.ts`) that detects 3+ high-distress sessions in 7 days adds longitudinal awareness that most self-help apps lack entirely.

**S4.2 — Opposite action implementation is faithful to DBT.** The patterns in `src/data/opposite-action.ts` correctly map shame→approach, fear→gradual exposure, anger→gentle avoidance, sadness→activation, guilt→repair, jealousy→gratitude, loneliness→reach out. These are standard DBT opposite-action pairings. Opposite action is available during tier1-3 crisis (graduated access) — DBT tools are specifically designed for use during distress. Only tier4 (pre-acknowledgment) temporarily gates opposite action behind the acknowledgment wall.

**S4.3 — Narrative synthesis avoids diagnostic language.** The `synthesize()` function (`src/models/synthesis.ts`) never says "you have" or "you suffer from." It uses experiential language: "You are experiencing," "You are holding." For severe distress, it shifts to "What you're experiencing sounds painful. You deserve support" — acknowledging without pathologizing. This is exactly the right clinical tone.

**S4.4 — The "I don't know" pathway is clinically valuable.** The DontKnowModal (`src/components/DontKnowModal.tsx`) normalizes alexithymia ("Many people find it hard to name what they feel — this is normal and a skill that develops with practice") and redirects to body-based (Somatic) or dimensional approaches. This is clinically sophisticated — it recognizes that cognitive emotion labeling requires skills that not everyone has developed, and offers alternative entry points.

**S4.5 — Somatic pause after high intensity is trauma-informed.** The GuidedScan (`src/components/GuidedScan.tsx:149-156`) offers a breathing pause after any intensity-3 selection, and the numbness flooding detection (3+ body groups with numbness) offers a grounding exercise. These are window-of-tolerance interventions that prevent the scan from becoming a re-traumatization vector.

**S4.6 — Graduated exposure for distress results.** ResultCard (`src/components/ResultCard.tsx`) collapses descriptions for high-distress emotions by default with a gentler aria-label, reducing the likelihood that a distressed user is immediately confronted with detailed descriptions of their pain.

### 4.3 Concerns & Risks

**C4.1 — CRITICAL: No explicit suicide risk routing.**
The system detects severe distress combinations (tier 3) but does not differentiate between general crisis and active suicidal ideation. A user who selects `despair + helpless` sees the same crisis banner as someone who selects `rage + helpless`. The current tier 3 message ("What you're describing sounds very painful. You deserve support right now — please consider reaching out") is appropriate for general crisis but insufficient for suicide-specific risk, where the clinical standard is explicit naming and direct routing to emergency services, not "please consider reaching out."

Files: `src/models/distress.ts:12-23`, `src/components/CrisisBanner.tsx:1-47`
Severity: **CRITICAL**

**C4.2 — HIGH: Onboarding skip button bypasses normalization content.**
The onboarding screens (`src/components/Onboarding.tsx:104-112`) include a skip button on screens 1-3. Screen 1 contains the critical normalization message: "There are no right or wrong answers. Emotions are complex and layered." Screen 4 contains the disclaimer and crisis contact. If a user skips at screen 1, they bypass both normalization and the initial crisis contact information. The skip button exists on all screens except the last, but the last screen is "About this app" — the normalization content is on screen 1.

Files: `src/components/Onboarding.tsx:104-112`, `src/i18n/en.json:67-68`
Severity: **HIGH**

**C4.3 — HIGH: Temporal crisis pattern detected silently.**
When `hasTemporalCrisisPattern()` returns true, the crisis tier is silently escalated in the ResultModal (`src/App.tsx:154-157`, `ResultModal.tsx:76-86`). The user is never told that the system is tracking their distress patterns over time and has escalated their crisis tier based on session history. This is a transparency issue: a user may notice that suddenly the crisis banner appears more prominently than expected and not understand why. In clinical practice, any escalation of care should be transparent to the patient.

Files: `src/data/temporal-crisis.ts`, `src/components/ResultModal.tsx:76-86`
Severity: **HIGH**

**C4.4 — MEDIUM: Opposite action could be harmful for justified emotions.**
The guilt pattern (`src/data/opposite-action.ts:39-42`) says "If justified, repair the situation. If unjustified, do what triggered the guilt again mindfully." This is accurate DBT, but the app has no way to assess whether guilt is justified or unjustified. A user experiencing justified guilt after causing harm might interpret "do what triggered the guilt again mindfully" as permission to repeat the harmful behavior. The app cannot make this distinction and should not attempt to.

Files: `src/data/opposite-action.ts:39-42`
Severity: **MEDIUM**

**C4.5 — MEDIUM: No post-intervention check.**
After a micro-intervention (breathing, savoring, curiosity), the user taps "Continue" and returns to the results view. There is no check on whether the intervention helped, harmed, or was neutral. A breathing exercise could paradoxically increase anxiety in some trauma populations (interoceptive distress). Without a post-intervention check, the app cannot learn to stop offering interventions that aren't helping a specific user.

Files: `src/components/MicroIntervention.tsx:103-126`
Severity: **MEDIUM**

**C4.6 — RESOLVED: AI link during crisis — graduated access implemented.**
The AI link is now available during tier1-3 crisis (graduated access principle: the crisis banner *contextualizes* by showing resources, it doesn't *gatekeep* by hiding tools). Information-seeking is a healthy coping mechanism. Only tier4 (pre-acknowledgment) temporarily hides the AI link behind the acknowledgment wall. This graduated approach avoids punishing honest distress disclosure.

Files: `src/components/ResultModal.tsx`
Status: **RESOLVED** (graduated crisis feature access)

### 4.4 Recommendations

**R4.1 (P0) — Add tier-4 crisis response for suicide-specific patterns.**
Define a `SUICIDE_RISK_COMBOS` set containing combinations like `despair + worthless + empty`, `helpless + numb + abandoned`, etc. When triggered, display a distinct tier-4 banner that states the model limitation, offers a verified local support resource and findahelpline.com, and gates reflection detail until explicit acknowledgment. Do not infer self-harm intent from selected emotion labels.

Files to modify: `src/models/distress.ts`, `src/components/CrisisBanner.tsx`
i18n: Requires new keys `crisis.tier4`, `crisis.tier4Acknowledge`
Estimate: ~2 hours

**R4.2 (P0) — Remove onboarding skip button.**
Make the onboarding flow non-skippable. Users must tap through all 4 screens. The current skip button is on screens 1-3 (`src/components/Onboarding.tsx:104-112`) — remove it entirely. The Back button remains for navigation.

Files to modify: `src/components/Onboarding.tsx` (remove lines 104-112)
i18n: Remove `onboarding.skip` key
Estimate: 15 minutes

**R4.3 (P1) — Add temporal escalation disclosure.**
When temporal pattern detection causes a tier escalation, add a brief, non-alarming disclosure to the CrisisBanner: "We noticed this pattern showing up more often recently. That's okay — it's information, not a judgment." This frames the escalation as observation, not surveillance, and maintains the therapeutic alliance.

Files to modify: `src/components/CrisisBanner.tsx`, `src/components/ResultModal.tsx`
i18n: Requires new key `crisis.temporalNote`
Estimate: ~1 hour

**R4.4 (P1) — Add guilt disclaimer to opposite action.**
For the guilt pattern, prepend: "This suggestion works differently depending on whether the guilt feels justified or not. If you're unsure, consider talking to someone you trust." Remove the "do what triggered the guilt again" clause — it is too easily misinterpreted without clinical supervision.

Files to modify: `src/data/opposite-action.ts`
i18n: Bilingual update to guilt suggestion
Estimate: 30 minutes

**R4.5 (P2) — Add post-intervention check.**
After a micro-intervention completes, add a brief check: "How do you feel now?" with options "Better," "About the same," "Worse." If "Worse," suppress future breathing offers for that session and show: "That's important information. Some exercises don't work for everyone. Your experience is valid." Store the response in the session for longitudinal tracking.

Files to modify: `src/components/MicroIntervention.tsx`, `src/components/ResultModal.tsx`, `src/data/types.ts`
i18n: Requires new keys `intervention.checkBetter`, `intervention.checkSame`, `intervention.checkWorse`, `intervention.worseValidation`
Estimate: ~3 hours

**R4.6 (P2) — SUPERSEDED: Graduated crisis feature access.**
Rather than suppressing the AI link entirely during crisis, graduated access was implemented: tier1-3 show all features (AI link, opposite action, micro-interventions) alongside the crisis banner. Only tier4 (pre-acknowledgment) temporarily gates features behind the acknowledgment wall. This avoids the paternalistic pattern of punishing honest distress disclosure.

Files modified: `src/components/ResultModal.tsx`
Status: **IMPLEMENTED** as graduated access (not binary suppression)

---

## 5. Developmental Psychology

**Presenter:** Developmental psychologist specializing in emotional development across the lifespan

### 5.1 Professional Framework

I evaluate Emot-ID through the lens of:
- **Emotional literacy scaffolding**: Does the app support users at different levels of emotional vocabulary?
- **Skill progression**: Does the app help users develop from basic recognition to nuanced differentiation?
- **Age-appropriateness**: Is the emotional complexity manageable for different developmental stages?
- **Growth mindset**: Does the app frame emotional skills as learnable, not fixed?

### 5.2 Strengths Observed

**S5.1 — Multiple entry points honor developmental diversity.** The four models (Somatic, Wheel, Plutchik, Dimensional) offer entry points for different levels of emotional sophistication. Somatic requires no emotional vocabulary at all — just body awareness. The Wheel provides scaffolded granularity (general → specific). Plutchik introduces combinatorial complexity. Dimensional requires abstract spatial reasoning. This progression mirrors developmental stages of emotional literacy, from preverbal body-based awareness to abstract conceptual differentiation.

**S5.2 — Vocabulary tracking gamifies emotional literacy development.** The `computeVocabulary()` function (`src/data/vocabulary.ts`) tracks unique emotions identified and awards milestones at 5, 10, 15, 25, 40, 60 emotions. This is a well-calibrated gamification of emotional vocabulary expansion. The milestones are spaced appropriately — the early milestones (5, 10) come quickly to build motivation, while later milestones (40, 60) require sustained engagement.

**S5.3 — Historical finding, superseded in P13.** The former universal framing ("Every emotion
has a purpose. No emotion is good or bad.") implied certainty and assigned fixed functions.
Onboarding now invites curiosity, names several possible contexts, and returns interpretive
authority to the user.

**S5.4 — The Wheel model's three levels mirror granularity development.** The Emotion Wheel's 3-level hierarchy (7 roots → subcategories → 135 leaf emotions) mirrors how emotional granularity develops: first distinguishing broad categories (happy vs. sad), then subcategories (happy → joyful vs. content), then specific states (content → serene vs. satisfied). The drill-down interaction makes this progression tangible.

**S5.5 — Reflection flow provides metacognitive scaffolding.** The 3-state reflection ("Does this resonate?" → "yes/partly/no" → warm close or follow-up) develops metacognitive monitoring — the ability to evaluate whether an emotion label fits one's experience. The "Not really" path with validation ("Your felt experience is the best guide. Emotion labels are approximations") teaches that self-knowledge supersedes any model's output.

### 5.3 Concerns & Risks

**C5.1 — HIGH: No explicit progression guidance between models.**
The four models are presented as equal options in the ModelBar and SettingsMenu. A user with low emotional literacy may start with Plutchik (which requires understanding of combinatorial dyads) and become overwhelmed, or may stay with Somatic indefinitely and never develop labeling vocabulary. There is no guidance on which model is appropriate for their current skill level, and no encouragement to try new models as they develop.

Files: `src/components/SettingsMenu.tsx:110-131`, `src/components/Header.tsx`
Severity: **HIGH**

**C5.2 — MEDIUM: Vocabulary milestones are count-based, not quality-based.**
The milestone system (`src/data/vocabulary.ts:15-16`) rewards identifying 5, 10, 15... unique emotions. But emotional granularity isn't just about breadth — it's about discrimination. A user who identifies 20 emotions but always picks the same 3-4 emotions in actual sessions hasn't developed granularity. The system doesn't track whether vocabulary is actively used versus passively collected.

Files: `src/data/vocabulary.ts`
Severity: **MEDIUM**

**C5.3 — MEDIUM: No scaffolding for emotional complexity.**
When a user selects 3+ emotions simultaneously, the synthesis says "You are holding multiple emotional threads simultaneously — this complexity is common and healthy." This is accurate but doesn't scaffold the next developmental step: understanding how these emotions relate, which came first, or which is most central. The app normalizes complexity but doesn't help the user develop skills for navigating it.

Files: `src/models/synthesis.ts:103-104`
Severity: **MEDIUM**

**C5.4 — LOW: Guided scan assumes body awareness.**
The GuidedScan offers "What do you notice in your {region}?" — but many users, especially those with alexithymia or dissociative tendencies, genuinely cannot identify bodily sensations. The skip button and "Nothing here" messaging help, but there is no guidance on how to develop interoceptive awareness for users who consistently report nothing.

Files: `src/components/GuidedScan.tsx:269-272`
Severity: **LOW**

### 5.4 Recommendations

**R5.1 (P1) — Add soft model progression nudges.**
In SessionHistory, after 3+ sessions with a single model, show a dismissible suggestion: "Ready to try something new?" with a brief explanation of what the suggested model offers. For example, after 3 somatic sessions: "You've been exploring body sensations. The Emotion Wheel can help you put names to what you've noticed." The nudge should be:
- Soft (dismissible, not blocking)
- Directional (suggests a specific next model)
- Framed as growth ("you're ready"), not deficiency ("you should try")

Files to modify: `src/components/SessionHistory.tsx`
i18n: Requires new keys `history.suggestNext`, `history.suggestSomatic`, etc. (already partially defined in `en.json:192-196`)
Estimate: ~3 hours
IMPROVEMENT_PLAN.md: Implements E.2

**R5.2 (P2) — Add emotional granularity training mode.**
Create a focused mode where the app presents 2-3 similar emotions (e.g., irritation, frustration, anger) and asks the user to differentiate: "Which of these best describes what you feel?" This trains discrimination, not just recognition. Could be offered as an optional "practice mode" in the SettingsMenu.

Files to create: new component, new data file for emotion triads
i18n: New section
Estimate: ~8 hours
IMPROVEMENT_PLAN.md: Implements E.3

**R5.3 (P2) — Add interoception development guidance.**
For users who frequently skip in GuidedScan (tracked via `skipCount`), offer gentle interoception development tips: "Body awareness is like a muscle — it develops with practice. Try placing your hand on your stomach and just noticing the temperature." This converts a skip pattern from failure into a learning opportunity.

Files to modify: `src/components/GuidedScan.tsx` (complete phase, when `skipCount >= 6`)
i18n: New keys for interoception tips
Estimate: ~2 hours

**R5.4 (P3) — Track active vs. passive vocabulary.**
Extend `computeVocabulary()` to distinguish between emotions that were identified in analysis results (active vocabulary) versus emotions that were merely selected but didn't result in analysis matches (passive). Surface this in SessionHistory as "Your 15 most-identified emotions" rather than just a count.

Files to modify: `src/data/vocabulary.ts`, `src/components/SessionHistory.tsx`
Estimate: ~4 hours

---

## 6. Affective Science

**Presenter:** Affective scientist specializing in emotion theory, psychophysiology, and computational modeling of emotion

### 6.1 Professional Framework

I evaluate Emot-ID through the lens of:
- **Model fidelity**: Do the implementations faithfully represent the theoretical models they claim to embody?
- **Data quality**: Are the emotion-to-body mappings, dimensional coordinates, and combination rules empirically grounded?
- **Scoring validity**: Does the somatic scoring algorithm produce results consistent with psychophysiological research?
- **Construct coverage**: Are the four models collectively sufficient to capture the range of human emotional experience?

### 6.2 Strengths Observed

**S6.1 — Plutchik implementation captures dyadic theory correctly.** The Plutchik model implements the spawning mechanic (primaries reveal related emotions) and dyadic combination (two primaries combine into a named dyad). The data corrections noted in CLAUDE.md are scientifically sound: using `[serenity, sadness]` for nostalgia (not `[joy, sadness]`) to differentiate from bittersweetness, and `[trust, sadness]` for compassion (not `[love, sadness]`) to ensure reachability from primaries.

**S6.2 — Dimensional model faithfully represents Russell's circumplex.** The 38 emotions in `dimensional/data.json` are placed on valence (-1 to +1) × arousal (-1 to +1) axes, consistent with Russell's (1980) circumplex model. The five emotions added to fill the unpleasant-calm quadrant (apathetic, melancholic, resigned, pensive, contemplative) address a known limitation of the original circumplex — that it underrepresents low-arousal negative states, which are clinically important for depression detection.

**S6.3 — Historical finding, corrected in P13.** Nummenmaa et al. (2014) supports group-level
self-reported activation/deactivation maps. It does not validate this app's sensation types,
weights, thresholds, expanded emotion mappings, or individual conclusions. Signals are now marked
as curated hypotheses, with a narrow optional group-map basis.

**S6.4 — Historical finding, corrected in P13.** The unsupported cross-body multiplier was
removed. Matching contributions are additive and rank only the app's curated hypotheses.

**S6.5 — Match labels use relative and absolute floors.** The labels are now "closer match",
"possible match", and "worth exploring." Floors affect ordering language but are not psychometric
confidence measures.

### 6.3 Concerns & Risks

**C6.1 — HIGH: Somatic signal weights are not empirically calibrated.**
The emotion signal weights in `somatic/data.json` (e.g., anger-pressure-head: 0.8, anger-warmth-head: 0.7) appear to be expert-assigned rather than empirically calibrated against population data. Nummenmaa et al. (2014) provide activation maps but not quantitative signal weights. The current weights determine which emotions surface as results, making them the most consequential data in the app, yet their provenance is unclear.

Files: `src/models/somatic/data.json` (all `weight` fields)
Severity: **HIGH**

**C6.2 — HIGH: Constriction sensation lacks empirical grounding.**
The constriction sensation type was added as distinct from tension and pressure. While the phenomenological distinction (tightening/narrowing vs. held muscular effort vs. external force) is reasonable, there is no published psychophysiological research that specifically isolates "constriction" as a distinct sensation modality. Users may not be able to reliably discriminate constriction from tension, reducing scoring precision.

Files: `src/models/somatic/types.ts`, `src/models/somatic/data.json`
Severity: **HIGH**

**C6.3 — MEDIUM: Plutchik dyad names include non-standard terms.**
Several dyad names in the Plutchik data deviate from Plutchik's published dyad nomenclature. For example, `ruthlessness` replacing `aggressiveness` (noted as "was duplicate of aggression") changes the construct being measured. The original Plutchik dyads have specific theoretical definitions — substitutions should be documented with rationale.

Files: `src/models/plutchik/data.json`
Severity: **MEDIUM**

**C6.4 — MEDIUM: Dimensional model lacks circumplex structure enforcement.**
Russell's circumplex model posits that emotions form a circular structure in valence-arousal space, not merely that they can be placed on these axes. The current implementation treats the space as a free scatter plot without enforcing or testing circularity. Emotions that violate circumplex structure (e.g., high-arousal neutral-valence states) could distort nearest-neighbor suggestions.

Files: `src/models/dimensional/data.json`, `src/components/DimensionalField.tsx`
Severity: **MEDIUM**

**C6.5 — LOW: Wheel model uses Parrott's hierarchy without attribution.**
The Emotion Wheel model implements a 3-level hierarchy consistent with Parrott's (2001) classification but the model name is "Emotion Wheel" rather than "Parrott's Emotion Wheel." While this may be a deliberate simplification for users, it obscures the theoretical basis and makes it harder for users to research the model independently.

Files: `src/models/wheel/data.json`
Severity: **LOW**

### 6.4 Recommendations

**R6.1 (P1) — Completed with a narrower provenance claim.**
Every signal is `curated-hypothesis`; some record group-map influence separately. No weight is
described as directly research-derived or clinical. See
`docs/catalog-and-somatic-provenance.md`.

**R6.2 (P2) — Consider merging constriction into tension.**
Given the lack of empirical evidence for constriction as a distinct sensation modality, consider merging it back into tension with a qualifier. Alternatively, run a small user study (N=20) asking users to distinguish tension, pressure, and constriction in their chest area. If discrimination is poor, merge.

Files to modify: `src/models/somatic/types.ts`, `src/models/somatic/data.json`
Estimate: ~6 hours (if merging)

**R6.3 (P2) — Add theoretical attribution to model descriptions.**
Update model descriptions in the registry to include theoretical attribution: "Based on Plutchik's psychoevolutionary theory (1980)," "Based on Russell's circumplex model (1980)," "Based on Parrott's emotion classification (2001)," "Based on Nummenmaa et al.'s body map research (2014)."

Files to modify: Model `description` fields in each model's `index.ts`
i18n: Bilingual description updates
Estimate: ~1 hour

**R6.4 (P3) — Validate scoring against Nummenmaa activation maps.**
Implement a test suite that compares the app's somatic scoring output against the published Nummenmaa et al. (2014) activation maps. For each emotion that Nummenmaa studied, create a synthetic selection matching the published activation pattern and verify that the scoring algorithm ranks that emotion in the top results.

Files to create: New test file `src/__tests__/somatic-validation.test.ts`
Estimate: ~8 hours

---

## 7. Health & Behavioral Psychology

**Presenter:** Health psychologist specializing in behavior change, habit formation, and micro-interventions

### 7.1 Professional Framework

I evaluate Emot-ID through the lens of:
- **Behavior change theory**: Does the app follow established models (Fogg Behavior Model, Transtheoretical Model) for habit formation?
- **Micro-intervention effectiveness**: Are the breathing, savoring, and curiosity exercises evidence-based and appropriately dosed?
- **Engagement mechanics**: Does the app support sustained use without creating dependence or compulsive checking?
- **Outcome measurement**: Can the app demonstrate whether it's helping?

### 7.2 Strengths Observed

**S7.1 — Micro-interventions are appropriately brief and evidence-based.** The breathing exercise (4-2-6 pattern, 3 cycles) is a well-validated vagal tone technique. The 4-second inhale is long enough to activate the parasympathetic response; the 6-second exhale extends this further. Three cycles total ~36 seconds — brief enough to be completable in almost any context. The savoring exercise (4 steps, 4 seconds each) draws on Positive Psychology savoring research (Bryant & Veroff, 2007). The curiosity prompt is a standard ACT (Acceptance and Commitment Therapy) defusion technique.

**S7.2 — Session history enables self-monitoring without judgment.** The SessionHistory component provides emotional vocabulary tracking, valence ratio, and somatic patterns. The valence ratio bar explicitly notes "Neither is right or wrong" — avoiding the common health-app trap of implying that more positive emotions = better outcome. This aligns with the DBT concept of "both/and" emotional experience.

**S7.3 — The reflection flow creates a feedback loop.** The yes/partly/no reflection after analysis is a form of Ecological Momentary Assessment (EMA). Over time, these reflection responses create data about the app's accuracy for each user, and the "Not really" path validates the user's subjective experience over the model's output — preventing the app from becoming an authority on the user's emotions.

**S7.4 — Export-for-therapist feature bridges self-help and professional care.** The "Share with therapist" export (`src/data/export.ts`) generates a structured text summary that a therapist can review. Including crisis tier information, reflection responses, and somatic patterns gives the therapist clinically relevant context. The export includes a clear disclaimer: "This data is not a clinical diagnosis."

### 7.3 Concerns & Risks

**C7.1 — HIGH: No measurement of intervention effectiveness.**
The micro-interventions are offered and completed but there is no pre/post measurement. The breathing exercise might reduce arousal — or it might not. Without even a simple "How do you feel now?" check, the app cannot demonstrate effectiveness, and it cannot stop offering interventions that don't help a specific user.

Files: `src/components/MicroIntervention.tsx`
Severity: **HIGH**
Note: This overlaps with C4.5.

**C7.2 — MEDIUM: No habit formation scaffolding.**
The app has no reminder system, no streaks, no check-in prompts. Users who would benefit most from regular emotional check-ins are exactly the users least likely to remember to use the app without external prompts. The PWA could send notifications, but this is not implemented.

Files: N/A (feature not present)
Severity: **MEDIUM**

**C7.3 — MEDIUM: Quick check-in mode is missing.**
The current flow (select model → select emotions → analyze) takes 60-120 seconds minimum. For daily habit formation, behavioral science suggests the initial behavior should take <30 seconds (Fogg Behavior Model: ability threshold). A quick check-in mode that presents 8-12 emotion words and asks "Which of these describe how you feel right now?" would dramatically lower the activation energy for daily use.

Files: N/A (feature not present)
Severity: **MEDIUM**

**C7.4 — LOW: Valence ratio lacks temporal trend.**
The valence ratio in SessionHistory shows a single week's snapshot. Without week-over-week trend data, users cannot see whether their emotional experience is shifting over time — which is the primary outcome measure for emotional regulation interventions.

Files: `src/data/valence-ratio.ts`, `src/components/SessionHistory.tsx`
Severity: **LOW**

### 7.4 Recommendations

**R7.1 (P1) — Add post-intervention check.**
Same as R4.5. Add "How do you feel now?" (Better/Same/Worse) after micro-interventions. Store response in session data. This enables:
- Individual: Stop offering breathing to users who report "Worse"
- Population: Aggregate effectiveness data in exports
- Clinical: Therapist can see which interventions help their client

Files to modify: `src/components/MicroIntervention.tsx`, `src/data/types.ts`
Estimate: ~3 hours

**R7.2 (P1) — Implement quick check-in mode.**
Create a <30-second check-in that presents a curated grid of 8-12 common emotions. User taps 1-3, sees a brief synthesis, done. No model selection, no visualization navigation. Accessible from a prominent button or gesture (e.g., long-press the analyze button from the home screen).

**Safety guardrail:** The quick check-in must still route through crisis detection. If the user taps `despair` from the quick grid, the tier system must activate.

Files to create: New component `QuickCheckIn.tsx`, new data file for curated emotion list
Files to modify: `src/App.tsx`, `src/models/distress.ts` (ensure crisis detection works with quick-mode selections)
i18n: New section `quickCheckIn`
Estimate: ~8 hours
IMPROVEMENT_PLAN.md: Implements E.1

**R7.3 (P2) — Add weekly trend to valence ratio.**
Extend `computeValenceRatio()` to return 4 weeks of data instead of 1. Display as a simple sparkline or 4 stacked bars in SessionHistory. This enables users to see whether their emotional landscape is shifting.

Files to modify: `src/data/valence-ratio.ts`, `src/components/SessionHistory.tsx`
Estimate: ~4 hours

**R7.4 (P3) — Consider optional check-in reminders.**
If the PWA notification API is available, offer an optional daily reminder in SettingsMenu. Default: off. Frequency: once daily. Dismissable. This is a sensitive feature — emotional check-in reminders could become intrusive — so it should be very clearly opt-in with easy opt-out.

Files to create: Notification service module
Files to modify: `src/components/SettingsMenu.tsx`
i18n: New section `reminders`
Estimate: ~6 hours

---

## 8. UX Psychology

**Presenter:** UX psychologist specializing in cognitive load theory, decision architecture, and ethical design patterns

### 8.1 Professional Framework

I evaluate Emot-ID through the lens of:
- **Cognitive load**: Does the interface minimize extraneous cognitive load while maximizing germane load (learning)?
- **Choice architecture**: Does the presentation of choices influence which emotions users select?
- **Emotional priming**: Does the UI create or amplify emotional states rather than neutrally measuring them?
- **Dark patterns**: Does the app manipulate, pressure, or deceive?
- **User autonomy**: Does the user maintain control over their data, their experience, and their interpretation?

### 8.2 Strengths Observed

**S8.1 — Model-specific interaction paradigms reduce cognitive load.** Each model uses a distinct interaction pattern matched to its theoretical basis: tap-to-explore (Plutchik), drill-down tree (Wheel), body-region tap (Somatic), spatial placement (Dimensional). This means users learn one paradigm per model rather than a one-size-fits-all interaction that would poorly serve all models.

**S8.2 — Selection count in AnalyzeButton provides progress feedback.** The "Analyze (3)" count badge gives users clear feedback on their selection state without requiring them to parse the SelectionBar. This reduces cognitive load and provides a simple decision criterion: "Have I selected enough?"

**S8.3 — No gamification of emotional states.** The app does not use streaks, points, or achievements tied to emotional outcomes (e.g., no "7-day happiness streak"). The vocabulary milestones reward exploration breadth, not emotional valence. This avoids the dark pattern of incentivizing users to report positive emotions to maintain a streak.

**S8.4 — Reflection buttons use neutral, equitable styling.** All three reflection options ("Yes," "Somewhat," "Not really") use identical styling (`bg-gray-600/20 border border-gray-600/50`). None is highlighted or larger. This avoids pressuring users toward a "correct" answer, which would compromise the EMA data quality.

**S8.5 — Privacy framing builds trust without surveillance anxiety.** The privacy section uses warm, personal language ("Your emotional life is deeply personal. That's why Emot-ID keeps everything on your device") rather than technical language ("Data stored locally in IndexedDB"). This frames privacy as care, not as a feature checkbox.

**S8.6 — "For self-exploration, not diagnosis" disclaimer is always visible.** The micro-disclaimer appears in ResultModal footer (`src/i18n/en.json:81`) — the point where users are most likely to over-interpret results. This is excellent placement from a cognitive perspective.

### 8.3 Concerns & Risks

**C8.1 — HIGH: BubbleField layout may create primacy/recency bias.**
In BubbleField (Plutchik, Wheel), emotions are laid out in rows. On mobile, the deterministic wrapped-row layout places emotions in a consistent order. Research on choice architecture shows that items in the top-left receive disproportionate attention and selection (F-pattern reading, Gutenberg diagram). Users may be biased toward selecting whichever emotions appear in the top-left region.

Files: `src/components/BubbleField.tsx`, `src/components/bubble-layout.ts`
Severity: **HIGH**

**C8.2 — MEDIUM: Emotion colors may create valence associations.**
Emotions are assigned specific colors (anger=red, sadness=blue, joy=yellow/gold). While these are culturally common associations, they create a visual priming effect: red-colored emotions may be perceived as more intense or negative than their actual content warrants. A user scanning the BubbleField may unconsciously avoid red bubbles if they're seeking positive emotions, or be drawn to them if they're in a negative state.

Files: All model `data.json` files (color assignments)
Severity: **MEDIUM**

**C8.3 — MEDIUM: DimensionalField axis labels may prime responses.**
The axis labels "Unpleasant ← → Pleasant" and "Calm ← → Intense" provide orientation but also prime the user to think in these dimensions. A user who is confused about their emotional state may anchor on the axes and construct a response that fits the dimensional framework rather than reporting their genuine experience. This is a fundamental limitation of the circumplex model, not a bug per se, but the UI could mitigate it.

Files: `src/components/DimensionalField.tsx:148-159`
Severity: **MEDIUM**

**C8.4 — MEDIUM: Somatic model default status may create anchoring.**
Somatic is the default model (`defaultModelId = 'somatic'` in `src/models/registry.ts`). Default bias means most users will start with Somatic. If the default is wrong for a user (e.g., someone with alexithymia or chronic pain), their first impression of the app will be frustrating. The DontKnowModal offers alternative routing, but it requires the user to recognize and admit they don't know what they're feeling.

Files: `src/models/registry.ts`
Severity: **MEDIUM**

**C8.5 — LOW: SensationPicker 2-column grid may create anchoring.**
The 9 sensation types are presented in a 2-column grid. The first sensation (typically "tension") receives primacy bias. If users consistently start from the top-left, tension may be over-reported relative to its actual prevalence.

Files: `src/components/SensationPicker.tsx`
Severity: **LOW**

### 8.4 Recommendations

**R8.1 (P1) — Randomize bubble order on each render.**
In BubbleField, shuffle the emotion order before layout calculation. The current deterministic layout makes the same emotions appear in the same positions every time, amplifying primacy bias. Shuffling on each render (not on each frame) introduces enough variation to mitigate positional bias while maintaining visual stability within a single session.

Note: The current `bubble-layout.ts` already uses random placement on desktop. Extend the mobile deterministic layout to shuffle the input order before wrapping into rows.

Files to modify: `src/components/bubble-layout.ts`
Estimate: ~1 hour

**R8.2 (P2) — Randomize sensation order in SensationPicker.**
Shuffle the `commonSensations` array before rendering in both SensationPicker and GuidedScan. This mitigates primacy bias toward tension/pressure.

Files to modify: `src/components/SensationPicker.tsx`, `src/components/GuidedScan.tsx`
Estimate: 30 minutes

**R8.3 (P2) — Consider removing axis labels from DimensionalField on mobile.**
On mobile, where the instructions are already hidden, consider also hiding axis labels after the user's first interaction (or after first session). Users who understand the axes don't need labels; users who don't understand them are being primed by them.

Files to modify: `src/components/DimensionalField.tsx`
Estimate: ~1 hour

**R8.4 (P3) — A/B test default model.**
Consider showing the model selection (or DontKnowModal) on first launch instead of defaulting to Somatic. This removes the default bias and lets users self-select their entry point. The onboarding screen 3 already describes the models — it could transition directly into model selection.

Files to modify: `src/components/Onboarding.tsx`, `src/App.tsx`
Estimate: ~4 hours

---

# Part III: Cross-Perspective Synthesis

## 9.1 Consensus Themes

Five themes emerged across all perspectives:

### Theme 1: Safety Strengthening
All five psychologists flagged the absence of suicide-specific routing (C4.1). The clinical perspective rates this as CRITICAL; the developmental and health perspectives concur that the current crisis system, while thoughtful, has a ceiling that must be raised.

### Theme 2: Scaffolding Gaps
The developmental (C5.1) and health (C7.3) perspectives independently identified the lack of progression guidance and quick entry mode. Users need scaffolding both to develop skills (developmental) and to form habits (health). The UX perspective adds that the default model creates an anchoring bias that compounds the scaffolding gap.

### Theme 3: Somatic Validation
The affective science perspective (C6.1, C6.2) raises the most technically precise concern: the somatic model's signal weights are not empirically calibrated, and the constriction sensation lacks published grounding. This doesn't mean the model is wrong — it means its accuracy cannot be verified.

### Theme 4: Autonomy Preservation
The strongest consensus strength: all perspectives praised the app's respect for user autonomy. No gamification of emotional valence (UX), no diagnostic language (clinical), no surveillance anxiety (UX), neutral reflection options (UX), "your felt experience is the best guide" messaging (developmental). This is rare in emotion-related apps and should be protected in all future development.

### Theme 5: Measurement Gaps
Health psychology (C7.1) and clinical (C4.5) both flag the absence of intervention effectiveness measurement. Without pre/post checks on micro-interventions, the app cannot demonstrate that it helps, and it cannot stop doing things that don't help.

## 9.2 Conflict Resolution

### Conflict 1: Opposite Action (Clinical vs. Developmental)

**Clinical (R4.4):** Remove the ambiguous guilt opposite-action clause because it could be misinterpreted.
**Developmental:** Opposite action is a skill that develops with practice — removing it reduces learning opportunity.

**Resolution:** Keep the opposite action system but add a preamble to the guilt suggestion that acknowledges the complexity: "Guilt is complex. If you caused harm, the action is repair. If the guilt doesn't fit the situation, this is important self-knowledge." This preserves the learning opportunity while reducing misinterpretation risk.

### Conflict 2: Model Progression (Developmental vs. UX)

**Developmental (R5.1):** Add nudges to try new models after repeated use of one model.
**UX (C8.4):** The current default model creates anchoring bias that should be removed.

**Resolution:** Both are right. Implement R5.1 (soft progression nudges in SessionHistory) AND R8.4 (model selection on first launch). The nudges address longitudinal progression; the model selection addresses first-impression anchoring. They are complementary, not competing.

### Conflict 3: Quick Check-In (Health vs. Clinical)

**Health (R7.2):** Quick check-in mode (<30 seconds) for daily habit formation.
**Clinical (R4.1):** Any mode that surfaces emotions must route through crisis detection.

**Resolution:** The quick check-in mode must include crisis detection. This is not a conflict — it's a constraint. The curated emotion grid for quick check-in should include distress emotions (`despair`, `helpless`, `worthless`) so the crisis system can activate even in the abbreviated flow. The quick check-in is implemented with a simplified visualization but the full safety pipeline.

## 9.3 Prioritized Action Plan

### Phase 0 — Safety-Critical (implement before any other work)

| # | Action | Source | Est. | Files |
|---|--------|--------|------|-------|
| 0.1 | Add tier-4 suicide risk routing | R4.1 | 2h | `distress.ts`, `CrisisBanner.tsx` |
| 0.2 | Remove onboarding skip button | R4.2 | 15m | `Onboarding.tsx` |
| 0.3 | Add temporal escalation disclosure | R4.3 | 1h | `CrisisBanner.tsx`, `ResultModal.tsx` |
| 0.4 | Graduated crisis feature access | R4.6 | 15m | `ResultModal.tsx` |

### Phase 1 — High-Value (next development cycle)

| # | Action | Source | Est. | Files |
|---|--------|--------|------|-------|
| 1.1 | Post-intervention effectiveness check | R4.5, R7.1 | 3h | `MicroIntervention.tsx`, `types.ts` |
| 1.2 | Quick check-in mode with safety | R7.2 | 8h | New `QuickCheckIn.tsx`, `App.tsx` |
| 1.3 | Model progression nudges | R5.1 | 3h | `SessionHistory.tsx` |
| 1.4 | Randomize bubble order | R8.1 | 1h | `bubble-layout.ts` |
| 1.5 | Fix guilt opposite action | R4.4 | 30m | `opposite-action.ts` |
| 1.6 | Document signal weight provenance | R6.1 | 4h | `somatic/data.json` |

### Phase 2 — Enhancement (backlog)

| # | Action | Source | Est. | Files |
|---|--------|--------|------|-------|
| 2.1 | Emotional granularity training | R5.2 | 8h | New component + data |
| 2.2 | Randomize sensation order | R8.2 | 30m | `SensationPicker.tsx`, `GuidedScan.tsx` |
| 2.3 | Consider constriction merge | R6.2 | 6h | `somatic/types.ts`, `somatic/data.json` |
| 2.4 | Add theoretical attribution | R6.3 | 1h | Model descriptions |
| 2.5 | Weekly valence trend | R7.3 | 4h | `valence-ratio.ts`, `SessionHistory.tsx` |
| 2.6 | Hide DimensionalField labels after first use | R8.3 | 1h | `DimensionalField.tsx` |
| 2.7 | Interoception development guidance | R5.3 | 2h | `GuidedScan.tsx` |

### Phase 3 — Long-Term

| # | Action | Source | Est. | Files |
|---|--------|--------|------|-------|
| 3.1 | Validate scoring against Nummenmaa | R6.4 | 8h | New test file |
| 3.2 | Active vs. passive vocabulary tracking | R5.4 | 4h | `vocabulary.ts`, `SessionHistory.tsx` |
| 3.3 | Model selection on first launch | R8.4 | 4h | `Onboarding.tsx`, `App.tsx` |
| 3.4 | Optional check-in reminders | R7.4 | 6h | New notification service |

## 9.4 Improvement Plan Disposition

### Phase E Items

**E.1 Quick check-in mode — 30-sec grid of 8-12 words**
**Decision: KEEP (modified)**
Implement as described in R7.2 with the critical constraint from the Clinical-Health conflict resolution: quick check-in must route through full crisis detection pipeline. The curated emotion grid must include distress emotions.
Action plan reference: Phase 1, item 1.2

**E.2 Model progression & scaffolding**
**Decision: KEEP (modified)**
Implement as soft, dismissible nudges in SessionHistory (R5.1), not as hard gates or mandatory progression. The developmental and UX perspectives agree that gentle directional suggestions are better than enforced sequences. Combined with R8.4 (model selection on first launch) from Phase 3.
Action plan reference: Phase 1, item 1.3; Phase 3, item 3.3

**E.3 Emotional granularity training**
**Decision: KEEP as-is**
The developmental perspective (R5.2) supports this as a focused discrimination exercise. Implementation as an optional practice mode in SettingsMenu.
Action plan reference: Phase 2, item 2.1

**E.5 Master combination model**
**Decision: DROP**
The affective science perspective provides the strongest argument against this: the four models represent fundamentally different theoretical frameworks (categorical, hierarchical, somatic, dimensional). A "master combination" conflates incommensurable constructs. There is no theoretical basis for averaging Plutchik dyad scores with Russell circumplex positions. Cross-model insights are better served by the existing model-bridge system (`src/components/model-bridges.ts`), which suggests contextual next steps without attempting to merge frameworks.

**E.7 Chain analysis mode (DBT)**
**Decision: KEEP (expanded)**
The clinical perspective supports chain analysis as a powerful DBT tool for understanding emotion sequences. Implementation requires a skill-building UI that walks users through: triggering event → vulnerability factors → prompting event → emotion → urge → action → consequence. This is a significant feature that should wait until the foundation (quick check-in, progression nudges, intervention checks) is solid.
Action plan reference: Not yet scheduled (requires Phase 1 completion first)

**E.8 Simple language mode**
**Decision: KEEP as-is**
The developmental perspective supports this for users with lower emotional vocabulary or cognitive accessibility needs. Implementation as a language-level toggle that substitutes simpler labels and shorter descriptions.
Action plan reference: Not yet scheduled (Phase 3+)

### Phase F Items

**F.4 Lazy loading models — `React.lazy` + `Suspense`**
**Decision: KEEP as-is**
The architecture assessment (Section 1) confirms that all 4 models are loaded upfront. Lazy loading would reduce initial bundle size, particularly for the somatic data.json. No psychological perspective objects.
Action plan reference: Not yet scheduled (technical debt)

**F.7 PWA improvements — offline indicator, install prompt**
**Decision: KEEP (partial)**
Implement offline indicator only. The install prompt is browser-native and adding a custom one creates UI clutter. The offline indicator addresses a real UX concern: users don't know when they're using cached content.
Action plan reference: Not yet scheduled (technical debt)

## 9.5 Success Metrics

All metrics are local-only — no telemetry. Measured via session data stored in IndexedDB.

### Safety Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| Crisis detection coverage | % of sessions where tier >= 1 that receive crisis resources | 100% |
| Tier-4 activation rate | Number of tier-4 activations per 100 sessions | Track (no target — any activation is a success) |
| Temporal escalation transparency | % of escalated sessions that show disclosure | 100% |
| Post-intervention "Worse" rate | % of intervention completions rated "Worse" | < 10% (investigate if higher) |

### Engagement Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| Session frequency | Sessions per week (from timestamps) | Increase over first month |
| Quick check-in adoption | % of sessions using quick check-in mode | > 30% after introduction |
| Model diversity | Unique models used per user (from modelId) | Increase over time (2+ by month 2) |
| Reflection completion | % of sessions with reflection answer | > 50% |

### Quality Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| Reflection accuracy | % of "Yes" + "Somewhat" responses | > 60% (indicates model outputs resonate) |
| Vocabulary growth | Unique emotions per 10 sessions (from vocabulary.ts) | Increasing trend |
| Intervention effectiveness | % of "Better" responses to post-intervention check | > 50% |
| Export usage | Number of text exports (proxy for therapist engagement) | Track (no target) |

---

# Part IV: Appendices

## Appendix A: Pixel 9a Layout Specifications

### Device Specifications

| Spec | Value |
|------|-------|
| Physical resolution | 1080 × 2424px |
| CSS resolution (3× DPR) | 412 × 915px (documented in plan) |
| Chrome visible viewport | ~393 × 742px (varies with address bar state) |
| Safe area insets | Top: ~48px (status bar), Bottom: ~16px (gesture bar) |
| Aspect ratio | 9:17 (approximately 1:1.89) |

Note: The plan references 412×915px as the target. Chrome's visible viewport after browser chrome is smaller. The layout budget in Section 3.1 uses ~393×742px as the working area.

### Chrome Budget

```
┌────────────────────────────────────────────────────┐
│ Status bar                              (~24px)    │
│ Browser chrome (address bar)            (~56px)    │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ Header (MenuButton + ModelBar)        48px     │ │
│ ├────────────────────────────────────────────────┤ │
│ │ SelectionBar (when active)          0-48px     │ │
│ ├────────────────────────────────────────────────┤ │
│ │                                                │ │
│ │          Visualization Area                    │ │
│ │         552-600px available                    │ │
│ │                                                │ │
│ ├────────────────────────────────────────────────┤ │
│ │ AnalyzeButton + "I don't know"       ~62px     │ │
│ │ Safe area bottom                     ~16px     │ │
│ └────────────────────────────────────────────────┘ │
│ Gesture navigation bar                  (~16px)    │
└────────────────────────────────────────────────────┘
```

### Touch Target Requirements

All interactive elements: `min-h-[44px] min-w-[44px]`
- Buttons: achieved via `min-h-[44px]` class
- SVG regions: achieved via invisible `<rect>` or `<circle>` hit areas
- List items: achieved via `min-h-[44px]` on button/anchor elements
- Close buttons: 44×44px via explicit width/height classes

### Responsive Breakpoints

| Breakpoint | CSS | Usage |
|------------|-----|-------|
| <480px | `MOBILE_BREAKPOINT` | Compact phone: deterministic bubble layout, short model names |
| ≥480px | `min-[480px]:` | Standard phone: random bubble layout, full model names |
| ≥640px | `sm:` | Desktop: instructions visible, larger padding |

## Appendix B: Crisis Detection Algorithm

### Current Implementation (Tiers 1-3)

```
Input: resultIds — array of emotion IDs from analysis

getCrisisTier(resultIds):
  distressIds = resultIds.filter(id ∈ HIGH_DISTRESS_IDS)

  if |distressIds| = 0: return 'none'

  for (a, b) in TIER3_COMBOS:
    if a ∈ distressIds AND b ∈ distressIds:
      return 'tier3'

  if |distressIds| ≥ 2: return 'tier2'
  return 'tier1'
```

**HIGH_DISTRESS_IDS** (17): despair, rage, terror, grief, shame, loathing, worthless, helpless, apathetic, empty, powerless, abandoned, victimized, numb, violated, depressed, distressed

**TIER3_COMBOS** (10 pairs): despair+helpless, despair+worthless, despair+empty, grief+helpless, grief+worthless, shame+loathing, shame+worthless, rage+helpless, depressed+helpless, depressed+worthless

### Temporal Escalation

```
hasTemporalCrisisPattern(sessions):
  cutoff = now - 7 days
  recentHigh = sessions.filter(s.timestamp ≥ cutoff AND s.crisisTier ∈ {tier2, tier3})
  return |recentHigh| ≥ 3

escalateCrisisTier(currentTier, sessions):
  if NOT hasTemporalCrisisPattern(sessions): return currentTier
  none → tier1, tier1 → tier2, tier2 → tier3, tier3 → tier3
```

### Proposed Tier-4 (R4.1)

```
SUICIDE_RISK_COMBOS (proposed):
  despair + worthless + empty
  helpless + numb + abandoned
  despair + helpless + numb
  shame + worthless + empty
  depressed + worthless + helpless

getCrisisTier(resultIds) — updated:
  ... existing tier3 check ...

  // New: Check tier4 triples
  for (a, b, c) in SUICIDE_RISK_COMBOS:
    if a ∈ distressIds AND b ∈ distressIds AND c ∈ distressIds:
      return 'tier4'

  ... continue to tier3/tier2/tier1 ...
```

**Tier-4 response characteristics:**
- Red banner (not amber) — visual distinction from tiers 1-3
- Explicit language: "If you are thinking about ending your life, please reach out now."
- Helpline numbers at top, prominent and tappable
- Acknowledgment required before viewing results
- AI link, opposite action, and micro-intervention gated behind acknowledgment (available after user acknowledges)

**Graduated access principle (tiers 1-3):**
- Crisis banner contextualizes (shows resources) but does not gatekeep (hide tools)
- AI link, opposite action, and micro-interventions remain available during tier1-3
- DBT tools are specifically designed for use during distress — hiding them defeats their purpose

### Integration Points

Tier-4 integrates at the same points as existing tiers:
- `ResultModal.tsx`: Check tier before rendering results
- `CrisisBanner.tsx`: New tier-4 variant
- `App.tsx:196`: Include in session `crisisTier` field
- `temporal-crisis.ts`: Tier-4 sessions count toward temporal pattern

## Appendix C: New i18n Keys Required

### Phase 0 (Safety-Critical)

```json
{
  "crisis": {
    "tier4": "If you are thinking about ending your life, please reach out now. You deserve help.",
    "tier4Acknowledge": "I understand — show my results",
    "temporalNote": "We noticed this pattern showing up more often recently. That's okay — it's information, not a judgment."
  },
  "onboarding": {
    // Remove: "skip" key (no longer needed)
  }
}
```

Romanian equivalents:
```json
{
  "crisis": {
    "tier4": "Daca te gandesti sa iti pui capat vietii, te rugam sa ceri ajutor acum. Meriti sprijin.",
    "tier4Acknowledge": "Am inteles — arata rezultatele",
    "temporalNote": "Am observat ca acest tipar apare mai des recent. E in regula — e informatie, nu o judecata."
  }
}
```

### Phase 1 (High-Value)

```json
{
  "intervention": {
    "checkPrompt": "How do you feel now?",
    "checkBetter": "Better",
    "checkSame": "About the same",
    "checkWorse": "Worse",
    "worseValidation": "That's important information. Some exercises don't work for everyone. Your experience is valid."
  },
  "quickCheckIn": {
    "title": "Quick check-in",
    "prompt": "What describes how you feel right now?",
    "done": "Done"
  },
  "history": {
    "progressionNudge": "Ready to try something new?",
    "progressionSomatic": "You've been exploring body sensations. The Emotion Wheel can help you put names to what you've noticed.",
    "progressionWheel": "You've been naming emotions. The Body Map can show you where they live in your body.",
    "progressionPlutchik": "You've been exploring combinations. The Emotional Space can show you the bigger picture.",
    "progressionDimensional": "You've been mapping your emotional space. The Body Map connects these feelings to physical sensations."
  }
}
```

Romanian equivalents:
```json
{
  "intervention": {
    "checkPrompt": "Cum te simti acum?",
    "checkBetter": "Mai bine",
    "checkSame": "La fel",
    "checkWorse": "Mai rau",
    "worseValidation": "Aceasta este o informatie importanta. Unele exercitii nu functioneaza pentru toata lumea. Experienta ta este valida."
  },
  "quickCheckIn": {
    "title": "Check-in rapid",
    "prompt": "Ce descrie cum te simti acum?",
    "done": "Gata"
  },
  "history": {
    "progressionNudge": "Esti gata sa incerci ceva nou?",
    "progressionSomatic": "Ai explorat senzatiile corporale. Roata Emotiilor te poate ajuta sa le numesti.",
    "progressionWheel": "Ai numit emotii. Harta Corporala iti poate arata unde le simti in corp.",
    "progressionPlutchik": "Ai explorat combinatii. Spatiul Emotional iti poate arata imaginea de ansamblu.",
    "progressionDimensional": "Ai explorat spatiul emotional. Harta Corporala conecteaza aceste sentimente la senzatii fizice."
  }
}
```

### Phase 2 (Enhancement)

```json
{
  "granularity": {
    "title": "Emotional granularity",
    "prompt": "Which of these best describes what you feel?",
    "notSure": "I'm not sure — they all fit",
    "practice": "Practice mode"
  },
  "somatic": {
    "interoceptionTip": "Body awareness is like a muscle — it develops with practice. Try placing your hand on your stomach and just noticing the temperature.",
    "interoceptionTip2": "You can practice noticing sensations during everyday activities: the warmth of a cup, the weight of your feet on the floor.",
    "interoceptionTip3": "If nothing comes up, that's okay. Sometimes the signal is 'neutral' — and noticing neutral is also body awareness."
  }
}
```

Romanian equivalents:
```json
{
  "granularity": {
    "title": "Granularitate emotionala",
    "prompt": "Care dintre acestea descrie cel mai bine ce simti?",
    "notSure": "Nu sunt sigur — toate se potrivesc",
    "practice": "Mod de practica"
  },
  "somatic": {
    "interoceptionTip": "Constientizarea corporala este ca un muschi — se dezvolta cu practica. Incearca sa iti pui mana pe stomac si sa observi temperatura.",
    "interoceptionTip2": "Poti practica observarea senzatiilor in activitati zilnice: caldura unei cesti, greutatea picioarelor pe podea.",
    "interoceptionTip3": "Daca nu simti nimic, e in regula. Uneori semnalul este 'neutru' — si a observa neutrul este tot constientizare corporala."
  }
}
```

---

*This analysis was produced by a multi-perspective panel comprising: Software Architect, Senior Developer, UX Engineer, Clinical Psychologist (trauma-informed, DBT/CBT), Developmental Psychologist, Affective Scientist, Health & Behavioral Psychologist, and UX Psychologist. All recommendations cite specific files in the Emot-ID codebase and are prioritized P0-P3 with effort estimates.*
