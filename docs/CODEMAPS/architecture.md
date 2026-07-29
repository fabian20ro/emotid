# Architecture Codemap

**Last Updated:** 2026-07-30

## Component Tree

```
main.tsx -> StrictMode > LanguageProvider > App
                                             |
              AppShell -> active screen selected by useAppNavigation
                 |
     Today / Arrival / Check-in / Reflection / Explore / Journal
       / Session detail / Settings / Privacy / Support / Practice
```

Check-in rendering is split by route: affect and Plutchik share
`ModelCheckInScreen`; words use `WordLadderScreen`; body uses
`BodyCompassScreen`. The typed check-in feature registry loads each screen and
its concrete model together, then injects the model into the screen. Visualizations
are resolved from the model registry. Other non-primary destinations are React
lazy entries; `App` remains the eager completion, crisis, reflection, and
persistence controller.

## Non-Obvious Patterns

### Somatic Route Boundary

`BodyRegionMap` is presentation-only and hands a complete `SomaticRegion` to
`BodyCompassScreen`. The screen owns side, sensation, intensity, review, edit,
and removal state, then sends enriched `SomaticSelection` objects through the
shared model analyzer. Somatic is intentionally not registered as a generic
`ModelVisualization`.

### Portal Requirement for Fixed Overlays

All `position: fixed` overlays must use `createPortal(content, document.body)` to escape parent stacking contexts. WebKit's `backdrop-filter` creates new stacking contexts that can trap z-indexed children behind content.

Active fixed dialogs use `ModalShell`, which portals to `document.body` and
provides focus trapping. Migrated workflows render as screens, not dialogs.

### Graduated Crisis Access

Tier1-3 show crisis support alongside the reflection workflow. Only tier4
pre-acknowledgment gates the rest of reflection behind an acknowledgment wall.
Do not reintroduce binary suppression; the graduated model is intentional.
Playwright exercises this shared boundary through Quick, Body, Affect, Words,
and Plutchik completion rather than testing only one route.

### Model Loading Strategy

Every model has one promise-cached dynamic loader. The check-in feature boundary
loads the route screen, model, and applicable visualization in parallel and
injects the loaded model explicitly. Screens never depend on hidden cache timing.
Today imports a bounded six-emotion catalog view rather than hydrating the full
288-entry model catalog. Production manifest budgets assert the feature chunks
remain deferred.

Deferred screen fallback copy remains bilingual. `AppShell` observes delayed
content and focuses the real destination heading when it appears instead of
leaving focus on a temporary loading status.

## Related Codemaps

- [Frontend Components](frontend.md)
- [Emotion Models](models.md)
