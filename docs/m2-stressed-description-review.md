# M2 Stressed Description Review

September 5, 2026. Bounded editorial/domain review by the implementing assistant; no subagents,
participant sessions or clinical validation. This is descriptive vocabulary, not an assessment.

## Scope And Decisions

Production owner: `src/models/wheel/overlays/bad.json`, `stressed.children`.
Five missing bilingual definitions in `wheel-leaves.json`; existing `tense` definition unchanged.

| ID | Distinction reviewed | Boundary |
| --- | --- | --- |
| overwhelmed_bad | Amount of demands, thoughts or feelings to take in | Does not equate overload with loss of control |
| out_of_control | Felt difficulty influencing or steadying events/emotions | Feeling is not proof that control is absent |
| burned_out | Ongoing work-related exhaustion/distance/effectiveness | Occupational context, not a diagnosis from choosing a word |
| on_edge | Uneasy readiness to react | Not identical to annoyance and no danger inferred |
| irritable | Frustrations become unusually bothersome | Feeling does not establish behavior or personality |

EN/RO reviewed together for experiential wording, uncertainty, short length and equivalent scope.
No direct advice, mandatory need, inferred cause or severity ranking. Existing labels, IDs,
guidance (including reviewed-null decisions), scoring and crisis semantics stay unchanged.
`overwhelmed_fear` is deliberately not copied from its same-label counterpart. Its sibling group
remains incomplete, as does Tired. Neither gets comparison merely because Stressed is complete.

## Sources And Limits

- [WHO occupational burnout clarification](https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon):
  constrains the work context and avoids treating burnout as a medical diagnosis. Copy is an
  observational cue, not a reproduction of diagnostic dimensions or a screening instrument.
- [NHS stress overview](https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/):
  cross-checks broad stress experiences including overwhelm, tension, irritability and perceived
  control. It does not validate this Wheel taxonomy or imply that stress is the user's cause.

The distinctions are editorial choices for comparing nearby terms, not empirically validated
boundaries. Source treatment/support advice and UK contact information are not imported.
APA dictionary pages returned no readable definition in this review and are not evidence here.

## Reproducible Verification

Existing preparation utility, no model calls:

```sh
node scripts/catalog-guidance-review.mjs prepare --source wheel-leaves.json --batch-id m2-stressed-descriptions --out-dir .reports/catalog-guidance/m2-stressed-descriptions --ids overwhelmed_bad,out_of_control,burned_out,on_edge,irritable
```

New catalog/group and EN/RO component tests first failed for missing descriptions. After review,
the copy gate required explicit uncertainty for burnout; both translations were corrected.
Exact inventory now contains 66 reviewed descriptions; need-mapping inventory is unchanged.

`e2e/stressed-descriptions.spec.ts` verifies keyboard-opened meanings before commitment, all six
definitions, contrast, enlarged text at 320x568, mobile layout at 393x742, voluntary comparison,
Back/restored selection, and the unchanged selected-word-only Google query. It runs across EN/RO,
light/dark, Chromium and WebKit. Screenshots are test artifacts, not physical AT evidence.
