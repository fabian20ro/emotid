# Frontend Codemap

**Last Updated:** 2026-08-13

## Component Tree

```
App (src/App.tsx)
 +-- Onboarding                   # 3-step first-run overlay with local-save choice
 +-- AppShell                     # Persistent header, content, bottom tabs
 +-- TodayScreen                  # Explicit quick commitment and recent reflection
 +-- CheckInFlowHost*             # Arrival, check-in, Reflection workflow
 |    +-- ArrivalScreen           # Guided-first route chooser
 +-- ModelCheckInScreen           # Affect map and Plutchik flows
 |    +-- Visualization**
 |         +-- PlutchikWheel      # Stable two-emotion combination wheel
 |         +-- DimensionalField   # Affect map
 +-- WordLadderScreen             # Hierarchical emotion vocabulary
 +-- BodyCompassScreen            # Somatic route
 |    +-- BodyRegionMap           # Lazy-loaded, presentation-only region map
 +-- ReflectionScreen             # Results, crisis support, needs, next step
 +-- ExploreScreen                # Route and practice entry points
 +-- JournalScreen                # Sessions, evidence-gated summaries, chain entry
 +-- SessionDetailScreen          # Saved reflection details and one-entry deletion*
 +-- SettingsScreen               # Language, appearance, utility routes
 +-- PrivacyDataScreen            # Storage, export, destructive confirmation*
 +-- SupportScreen                # Crisis and product boundaries
 +-- GranularityTraining          # Full-screen practice flow
 +-- ChainAnalysis                # Four-part optional Journal reflection
```

`*` Destructive confirmations use `ModalShell`, portaled to `document.body` with focus trapping.
`**` Generic visualizations resolve through the model registry. The somatic route owns
`BodyRegionMap` directly because region activation must continue through its staged flow.

Today is eager. `CheckInFlowHost`, Arrival, route implementations, Reflection,
and utility destinations are deferred. Route implementations load through
`CheckInFeatureBoundary`; host and utility destinations use
`LazyRouteBoundary`. Both boundaries expose bilingual loading/failure states,
and delayed destination headings receive route focus after their chunk renders.

`*` `useCheckInWorkflow` owns completion and persistence state outside the
presentation host so every input route, including Quick, reaches one auditable
safety and write boundary.

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
nonvisual keyboard instructions and a visible semantic focus ring. Before placement, a centered
prompt makes the otherwise empty progressive field visibly actionable; axis labels use a readable
mobile scale.

### Journal Evidence and Deletion

`getJournalEvidence` owns three metric-local thresholds. Vocabulary requires three chosen or
confirmed result entries, current-week valence requires three eligible entries with valence data,
and body observations require three somatic entries with selected regions. Unrelated entries can
never unlock another metric. The policy controls presentation only; it adds no derived history.

`ChainAnalysisEntry` is a discriminated union. New entries use the version-2 four-part shape
(`situation`, `noticed`, `response`, `outcome`); old seven-field records remain readable and are
exported unchanged. The single-page form requires only the situation. Clearing journal exercises
uses the same portaled, focus-trapped confirmation contract as other destructive actions.

Session Detail delegates one-entry deletion to the existing `useSessionHistory.remove` operation.
The destructive confirmation is portaled and focus-trapped, reports repository failures in place,
and returns to Journal only after the exact record is deleted. `App` owns that navigation change;
the detail screen owns confirmation state.

## Related Codemaps

- [Architecture](architecture.md)
- [Emotion Models](models.md)
