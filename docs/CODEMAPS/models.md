# Emotion Models Codemap

**Last Updated:** 2026-08-07
**Location:** `src/models/`

## Architecture: Catalog + Overlays

All emotions have one canonical source entry in `src/models/catalog/*.json`. Source entries own
the ID, label, color, and optional distress tier. Only explicitly reviewed descriptions and
controlled guidance decisions are stored. At module load, the catalog resolves reviewed need IDs
through `guidance/need-options.json`; `needId: null` and missing provenance both expose no inferred
need, while preserving distinct source-level audit states.

```
catalog/*.json  -> fail-closed copy hydration -> canonical runtime emotion
    |
model/index.ts  -> getCanonicalEmotion(id) + overlay -> hydrated ModelEmotion
```

## Type Hierarchy

```
BaseEmotion { id, label, description?, needs?, color, intensity? }
  |
  +-- PlutchikEmotion  { category, intensity, opposite?, spawns[], components? }
  +-- WheelEmotion     { level, parents[], children? }
  +-- SomaticRegion    { svgRegionId, group, commonSensations[], emotionSignals[] }
  |    |
  |    +-- SomaticSelection  { selectedSensation, selectedIntensity }  (runtime enrichment)
  +-- DimensionalEmotion  { valence, arousal, quadrant }
```

## Model Concepts

| Model | Concept | Visualization |
|-------|---------|---------------|
| **Plutchik** | 8 primaries spawn related emotions; selected pairs combine into dyads | BubbleField |
| **Wheel** | 3-level hierarchical tree; drill down from general to specific | BubbleField |
| **Somatic** | Compare selected sensations with exploratory word associations | BodyRegionMap |
| **Dimensional** | 2D valence × arousal field; pointer/arrow placement finds nearest emotions | DimensionalField |

## Non-Obvious Design Decisions

### Catalog is the single source of truth

The Today quick-start emotions resolve directly from the catalog. Catalog loading rejects duplicate
IDs, key/ID mismatches, raw per-entry needs, unknown need references, and descriptions without
explicit reviewed provenance.

### Safety rules are versioned data

`safety-rules.json` is the single source for the explicit high-distress inventory and tier-3/tier-4
combinations. `distress.ts` evaluates it deterministically after deduplicating selected IDs.
The same inventory drives catalog extraction. These tiers control support-prompt prominence; they
are not severity, diagnosis, danger, or self-harm assessments.

### Model overlay colors override canonical colors

The canonical color is used for cross-model contexts such as Today and the
journal. Each model overlay provides its own color for model-specific
visualizations.

### Somatic provenance is deliberately narrow

Every signal is marked `curated-hypothesis`. Optional
`basis: "nummenmaa-2014-group-map"` means only that a broad group-level activation/deactivation
pattern informed curation. It does not validate the sensation type, intensity threshold, weight,
cause, or an individual emotional conclusion. Somatic results may use only canonical reviewed
guidance; signals cannot provide local causal descriptions.

### Wheel multi-parent (`parents: string[]`)

Emotions like `embarrassed` appear under multiple L1 branches (both `hurt` and `disapproving`). The overlay uses `parents: string[]` instead of `parent: string`. The `analyze()` method walks `parents[0]` for the hierarchy path. Future: track actual drill-down path via `ModelState.custom.navPath`.

### Suffix dedup

Old suffixed IDs (`embarrassed_sad`, `embarrassed_disg`, `inferior_fear`, etc.) were collapsed into single canonical entries with multiple parents. Level-mismatched pairs (`overwhelmed` L1 vs `overwhelmed_bad` L2, `disappointed_disg` L1 vs `disappointed_sad` L2) remain separate because they serve different structural roles.

### Somatic scoring

Matching signals contribute `weight * selectedIntensity` and are added without a cross-body
coherence multiplier. Match labels compare relative and absolute score floors, but remain
"closer match", "possible match", or "worth exploring". Scores rank curated hypotheses; they are
not confidence values.

### Constriction as Distinct Sensation

Constriction is separate from tension (held muscular effort) and pressure (external force). Constriction = tightening/narrowing, common in throat, chest, stomach during anxiety/shame/grief. Added as the 9th sensation type.

### Numbness Flooding Detection

When numbness is reported across 3+ body groups, the somatic model offers a grounding prompt. This is a safety feature, not just pattern detection.

### Dimensional Quadrant Sparsity Fix

Extra unpleasant-calm emotions were added to reduce quadrant sparsity. `lonely` and `resigned` coordinates were adjusted to reduce overlap in that quadrant.

### Model extension boundary

Add the engine and optional visualization loader to `registry.ts`, then map the
user-facing route in `features/check-in/registry.tsx`. The feature loader owns
screen/model readiness; analyzers remain independent of React and `App` retains
the shared completion and safety boundary. Do not add a plugin framework or
global model-selection state for one new model.

## Related Codemaps

- [Architecture](architecture.md) — Registry wiring, state management, data flow
- [Frontend](frontend.md) — Visualization components that render model data
- [Catalog and Somatic Provenance](../catalog-and-somatic-provenance.md) — Evidence and review limits
