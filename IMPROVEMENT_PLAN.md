# Improvement Plan

> Historical plan. The Multi-Tree Emotion Membership work was completed by
> `IMPLEMENTATION_PLAN.md` and is not remaining migration work.

**Status**: Superseded, 2026-02-27.

---

## Multi-Tree Emotion Membership

**Date**: 2026-02-27
**Priority**: High
**Status**: Planned

### Problem

The current wheel architecture assumes each emotion belongs to exactly one parent in one tree. In reality, many emotions naturally span multiple basic emotion families. The current workaround uses ID suffixes (`_sad`, `_disg`, `_fear`) to create "copies" of the same emotion under different parents, which fragments the user's emotional vocabulary and makes analysis less coherent.

### Current Duplicates / Cross-Family Observations

| Emotion | Currently Under | Also Naturally Belongs Under |
|---------|----------------|------------------------------|
| **exposed** | fearful > threatened | sad > vulnerable (raw vulnerability vs threat response) |
| **helpless** | fearful > scared | sad > vulnerable (fear-helpless vs grief-helpless) |
| **overwhelmed** | fearful > anxious, bad > stressed | Multiple families — a universal overflow state |
| **embarrassed** | sad > hurt, disgusted > disapproving | Both shame-sadness and social-disgust registers |
| **inferior** | fearful > insecure, sad > depressed | Both anxiety-inferiority and depressive-inferiority |
| **disappointed** | sad > hurt, disgusted > disappointed_disg | Sadness-disappointment vs disgust-disappointment |
| **depleted** | bad > tired (as "drained"), sad > depressed | Resource exhaustion spans multiple families |
| **numb** | angry > distant | Also fits fearful (freeze) and sad (depression) |
| **judgmental** | disgusted > disapproving | Also fits angry > critical |
| **betrayed** | angry > let_down | Also fits disgusted > disappointed_disg |
| **degraded** | angry > humiliated | Also fits disgusted > awful |

### Proposed Architecture Change

Allow L2 emotions to declare multiple parents via a `parents` array (in addition to or replacing the current single `parent` field):

```typescript
interface WheelEmotion extends BaseEmotion {
  level: number
  parent?: string        // primary parent (backward compat)
  parents?: string[]     // all parents this emotion belongs under
  children?: string[]
}
```

**Benefits**:
- Eliminates ID suffix fragmentation (`exposed_sad`, `embarrassed_disg`, etc.)
- Richer analysis: "You selected 'helpless' — it appeared via both your fear and sadness paths"
- More accurate emotional granularity scoring
- Cleaner data model

**Challenges**:
- Drill-down UI needs to handle an emotion appearing under multiple L1 parents
- Back-navigation becomes ambiguous ("which parent did I come from?")
- Analysis path display needs to track actual navigation route, not just hierarchy
- Existing suffix-based duplicates need migration

### Implementation Notes

- This is a structural change that affects `types.ts`, `index.ts` (onSelect/onDeselect), analysis logic, and all data files
- Should be done as a dedicated PR with thorough testing
- Migration path: keep `parent` for backward compat, add `parents[]`, merge suffix duplicates into single entries with multiple parents

---

## Other Future Improvements

*(Add items below as they arise)*
