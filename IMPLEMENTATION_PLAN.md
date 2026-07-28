# Implementation Plan: Canonical Emotion Registry

**Date**: 2026-02-27
**Status**: Complete (all 7 phases; provenance amended 2026-07-29)
**Supersedes**: IMPROVEMENT_PLAN.md Multi-Tree section (now part of Phase 5)

## Problem

Each emotion is defined in full (id, label, description, needs, color) in every model that uses it. The same concept gets duplicated with inconsistent descriptions. Adding emotions means editing multiple files. Crisis detection hardcodes IDs disconnected from emotion data. Wheel uses ID suffixes (`helpless_fear`, `helpless_sad`) to fake multi-parent belonging.

## Solution

One canonical catalog (`src/models/catalog/`). Models reference by ID and add only model-specific metadata. Suffix duplicates collapse into single entries with multiple parents.

## Architecture

```
                    catalog/*.json
                         |
                    catalog/index.ts
                   /    |     |     \
            Plutchik  Wheel  Dimen  Somatic     QuickCheckIn  distress.ts
            index.ts  index  index  index.ts    (direct)      (direct)
               |       |      |       |
          Hydrated allEmotions (PlutchikEmotion, WheelEmotion, etc.)
               |       |      |       |
          EmotionModel.allEmotions ← unchanged interface
               |
          All existing UI + hooks unchanged
```

BaseEmotion and EmotionModel interfaces unchanged. The catalog is an internal assembly detail.

## Non-Obvious Decisions

- **Plutchik "joy" ≠ Wheel "happy" ≠ Dimensional "happy"**: Different theoretical constructs → separate canonical entries. Only emotions with the SAME ID and SAME psychological construct share a canonical entry.
- **Model colors override canonical color**: Each model's color scheme serves its visualization. The canonical color is only used in cross-model contexts (Quick Check-in, session history).
- **Somatic provenance**: Signals are curated hypotheses. They cannot carry local descriptions or
  needs; results use the canonical exploratory copy boundary.
- **Wheel `parents: string[]`** replaces `parent: string`. Drill-down tracks navigation path in `ModelState.custom.navPath` to show correct breadcrumbs.
- **Versioned safety rules**: `safety-rules.json` is the explicit source for high-distress IDs and
  tier combinations. Tiers control support-prompt prominence; they are product rules, not clinical
  judgments or conclusions about an individual.

## Phases

1. Catalog foundation (additive, zero risk)
2. Quick Check-in + distress migration
3. Dimensional model → overlays
4. Plutchik model → overlays
5. Wheel model → overlays + multi-parent + suffix dedup
6. Somatic model → signal refactoring
7. Docs (non-obvious things only)

## Conflicts & Future Work

- Wheel breadcrumb ambiguity with multi-parent → track navPath
- Canonical color choice → pick most visually distinctive for cross-model use
- `SomaticRegion extends BaseEmotion` semantic mismatch → not worth fixing for 4 models
- Cross-model session insights ("anger via body + wheel this week") → enabled by canonical IDs, not built yet
