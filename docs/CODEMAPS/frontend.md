# Frontend Codemap

**Last Updated:** 2026-07-30

## Component Tree

```
App (src/App.tsx)
 +-- Onboarding                   # 3-step first-run overlay
 +-- AppShell                     # Persistent header, content, bottom tabs
 +-- TodayScreen                  # Quick emotions and recent reflection
 +-- ArrivalScreen                # Route chooser
 +-- ModelCheckInScreen           # Affect map and Plutchik flows
 |    +-- Visualization**
 |         +-- PlutchikWheel      # Stable two-emotion combination wheel
 |         +-- DimensionalField   # Affect map
 +-- WordLadderScreen             # Hierarchical emotion vocabulary
 +-- BodyCompassScreen            # Somatic route
 |    +-- BodyRegionMap           # Lazy-loaded, presentation-only region map
 +-- ReflectionScreen             # Results, crisis support, needs, next step
 +-- ExploreScreen                # Route and practice entry points
 +-- JournalScreen                # Sessions, summaries, chain entry
 +-- SessionDetailScreen          # Saved reflection details
 +-- SettingsScreen               # Language, appearance, utility routes
 +-- PrivacyDataScreen            # Storage, export, destructive confirmation*
 +-- SupportScreen                # Crisis and product boundaries
 +-- GranularityTraining          # Full-screen practice flow
 +-- ChainAnalysis                # Full-screen DBT worksheet
```

`*` Confirmation uses `ModalShell`, portaled to `document.body` with focus trapping.
`**` Generic visualizations resolve through the model registry. The somatic route owns
`BodyRegionMap` directly because region activation must continue through its staged flow.

Today and Arrival are eager. Check-in features load through
`CheckInFeatureBoundary`; Reflection and utility destinations use
`LazyRouteBoundary`. Both boundaries expose bilingual loading/failure states,
and delayed destination headings receive route focus after their chunk renders.

## Non-Obvious Behaviors

### BubbleField Mobile Layout

Mobile placement (<480px) uses deterministic wrapped-row layout with shuffled order each render to reduce positional bias. Vertical distribution evenly spaces rows (`idealSpacing = (availableVertical - totalContentHeight) / (rows - 1)`, capped at `bubbleHeight * 3`). Jitter scales with row spacing (`min(6, floor(rowSpacing * 0.15))`) for organic feel without overlap. Desktop uses random placement with collision detection.

### BodyRegionMap Height-Fit Rendering

BodyRegionMap uses a stable `clamp(420px, 60dvh, 560px)` stage with a
`minmax(0, 1fr)` map row. The SVG remains height-driven (`height: 100%`,
`width: auto`, `max-width: 100%`) so the full front/back figure stays bounded
while labels retain a readable scale. If feet disappear, inspect the sizing
chain via `data-testid="bodymap-root"` and `data-testid="bodymap-canvas"`.

Back regions remain wider than front regions for visible/clickable slivers.
Small regions such as throat and jaw retain expanded `hitD` paths. The route
owns side state and receives complete `SomaticRegion` objects from map
activation; the map owns no sensation, intensity, guided-flow, or scoring state.

### DimensionalField Label Collision

Labels use a greedy sort-and-bump algorithm (sort by y then x, bump by `MIN_GAP=14` when labels overlap within 40px horizontal proximity, clamp to viewBox bounds). Text halo via `paintOrder="stroke"` for readability in dense areas.

Suggestion chips render in a normal-flow tray below the plot (not overlay) to avoid obscuring dots.
Pointer placement and arrow-key placement share `placeAt`, so both update the crosshair, live
directional readout, and same three nearest suggestions. The focusable SVG exposes localized
nonvisual keyboard instructions and a visible semantic focus ring.

### SelectionBar Reserved Height

SelectionBar maintains a fixed `52px` reserved height even when empty, preventing visualization area reflow on first selection.

## Related Codemaps

- [Architecture](architecture.md)
- [Emotion Models](models.md)
