# Mobile Rehaul Review

Historical design input for the completed migration; do not use this file as current-state or
remaining-work documentation. Current status lives in `docs/mobile-rehaul-remaining-plan.md`.

Audit target: English UI at `393 x 742`, July 22, 2026.

Review lenses: mobile-first UX, accessibility, affective science, emotional safety.
This is a product-design proposal, not clinical advice.

## Executive Direction

Shift Emot-ID from **model chooser + emotion visualization + analysis** to:

1. **Arrive** - one low-pressure question.
2. **Notice** - body, dimensional, or vocabulary route chosen by the user's current capacity.
3. **Name** - provisional language, never false certainty.
4. **Understand** - adaptive function and context.
5. **Choose** - one small need-aligned next step.
6. **Remember** - optional local reflection, without streak pressure.

The psychological model remains rigorous under the surface. The user should not need to
choose a theory before they can describe an experience.

## What's Good

- Non-judgmental onboarding: exploration, not test; no right/wrong answer.
- Adaptive framing: emotions presented as useful signals rather than problems.
- Multiple access routes: body, dimensions, hierarchy, combinations, quick check-in.
- Local-first privacy and explicit external-link consent.
- Deterministic, inspectable crisis behavior and visible support information.
- Primary controls generally reach 44px; bottom action area remains thumb-accessible.
- Emotion descriptions explain both felt meaning and possible need.
- Body Map offers an important route for users who cannot start with words.

## What's Bad

### Information architecture

- Users must choose a psychological model before expressing how they feel.
- Model choice appears in onboarding, top navigation, and settings.
- Reflection tools (history, granularity practice, chain analysis) look like settings.
- "Quick check-in" reads as a fallback even though it is the clearest entry route.
- Settings combines preferences, navigation, learning tools, history, privacy, support,
  and legal content in one long sheet.

### Mobile interaction

- Four model labels plus menu consume the full top row; Plutchik visibly crowds the edge.
- Main visualizations reserve large empty regions while labels collide elsewhere.
- Dimensional labels are too small and faint for a high-cognition task.
- Floating Wheel bubbles imply spatial meaning that the hierarchy does not actually have.
- Disabled CTA repeats the prompt already shown above the visualization.
- Current 44px controls meet a common minimum, but primary actions should target 48-56px.

### Visual style

- Dark gray + saturated purple dominates every surface and state.
- Glow, blur, gradients, emoji, borders, pills, and cards compete for attention.
- Low-contrast secondary text becomes hardest to read exactly where nuance matters.
- The interface feels like a technical visualization tool more than a reflective companion.
- Emotion colors are decorative in some views and semantic in others.

## What's Ugly

- Onboarding's final screen compresses four theory descriptions into tiny 2-column cards.
- The dimensional field contains overlapping labels and points at `393px`.
- Results begin with long prose cards; the useful reflection/action controls fall below the fold.
- Modal transitions can expose two dialog trees at once; conceptually, the result should replace
  the picker rather than stack above it.
- "Analysis" suggests objective inference. The output is better framed as a reflection or reading.
- Quick check-in mixes lowercase and title case labels, weakening polish and scan rhythm.
- Chronic overwhelm copy jumps quickly to erosion and burnout. Accurate context, but the first
  screen should lead with validation, adaptive function, and immediate agency.

## Psychological Reframe

### Preserve

- Emotions as adaptive signals.
- Provisional, non-diagnostic language.
- Multiple valid models.
- Body awareness and vocabulary-building routes.
- Crisis support without hiding or sensationalizing it.

### Change

- Replace "analyze" with "reflect", "see what fits", or "make sense of this".
- Ask about present experience before teaching taxonomy.
- Reveal one decision at a time; distress reduces working memory and tolerance for ambiguity.
- Use "may", "might", and explicit fit checks to avoid false precision.
- Put need and agency before educational detail.
- Avoid streaks, scores, red alerts, and completion pressure.
- Let users stop after naming; deeper reflection remains optional.

## Six Mixable Directions

### 1. Arrival

**Idea:** one calm home screen asks how the user wants to begin: words, body, or uncertainty.

**Why:** reduces theory-first choice overload; supports autonomy and different levels of
emotional granularity. "I'm not sure" becomes a valid route, not an error state.

**Borrow:** home question, three entry routes, privacy line, bottom navigation.

### 2. Body Compass

**Idea:** guided interoception before emotion labels. Region, sensation, intensity, then words.

**Why:** bodily cues may be more accessible during high activation or low emotional vocabulary.
The UI must avoid claiming that one sensation proves one emotion.

**Borrow:** step indicator, front/back body toggle, sensation tray, skip-to-words action.

### 3. Affect Map

**Idea:** a clean valence/arousal field with four anchors, a draggable focus point, and labels
revealed only after placement.

**Why:** respects the model's continuous nature and removes false categorical boundaries.
Fewer labels reduce visual noise and anchoring bias.

**Borrow:** strong axes, large drag target, semantic readout, suggested words sheet.

### 4. Word Ladder

**Idea:** broad family -> branch -> precise word, shown as a visible path rather than floating bubbles.

**Why:** emotional granularity grows through comparison. Adjacent words can include short
distinctions (for example, grief vs. loneliness) without declaring a single correct answer.

**Borrow:** breadcrumb path, compare-nearby action, one-level-at-a-time disclosure.

### 5. Meaning + Need

**Idea:** result screen leads with a tentative synthesis, adaptive function, possible need, and
one immediate action. Longer theory sits behind "More context".

**Why:** insight without agency can amplify rumination. Need-aligned choices make the experience
useful while preserving the user's authority over meaning.

**Borrow:** "Does this fit?" control, function/need pairing, immediate action, save/discard choice.

### 6. Daily Thread

**Idea:** recommended shell. A light home screen combines fast check-in, optional continuation,
local history, and access to deeper models under Explore.

**Why:** supports continuity without gamified streak pressure. Models become tools selected by
need, not competing top-level destinations.

**Borrow:** Today/Explore/Journal navigation, recent thread, privacy badge, adaptive route.

## Mix-and-Match Matrix

| Layer | Recommended | Alternatives |
| --- | --- | --- |
| App shell | Daily Thread | Arrival for minimal MVP |
| First question | Arrival | Daily Thread quick strip |
| Low-verbal route | Body Compass | Affect Map |
| Word-finding route | Word Ladder | Quick emotion grid |
| Dimensional model | Affect Map | Current data, redesigned canvas |
| Reflection | Meaning + Need | Existing detailed cards behind context |
| History | Daily Thread journal | Current analytics as secondary detail |
| Model education | Explore tab | Context sheet after use |
| Crisis support | Persistent support entry + deterministic banners | Existing logic, new presentation |

## Final Recommendation

Build **Daily Thread as the shell**, **Arrival as the first interaction**, and **Meaning + Need as
the result**. Route "body" into Body Compass, "place it" into Affect Map, and "find the word" into
Word Ladder. Move theory/model names to Explore; keep them out of the first-run decision.

Visual system:

- Neutral daylight background; true dark mode as a preference.
- Ink, teal, coral, mustard, and blue accents; no purple-dominant gradient identity.
- 16px body minimum, 48px controls, 56px primary CTA.
- One border, one elevation, 8px component radius.
- Color always paired with text/state; no glow as meaning.
- Short motion only for continuity and selection feedback.

Suggested delivery sequence:

1. New shell and Arrival route; preserve existing model internals.
2. Meaning + Need result hierarchy; keep crisis logic unchanged and expand tests.
3. Replace Wheel UI with Word Ladder.
4. Replace dimensional canvas presentation.
5. Integrate Body Compass.
6. Reframe history as Journal; keep all storage local.
