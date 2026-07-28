# Catalog and Somatic Provenance

**Date:** 2026-07-29

## Product Claim

Emot-ID offers vocabulary for reflection. Catalog descriptions and Body Compass results are
possibilities a user can accept, revise, or reject. They do not identify an emotion, cause,
diagnosis, severity, danger, or needed intervention.

## Catalog

The runtime catalog contains 288 entries:

- 12 bilingual descriptions are explicitly marked `reviewed`;
- 276 entries receive a short `generated` description from their translated label and needs field;
- unreviewed source descriptions are rejected during catalog loading and `npm run check-copy`;
- duplicate IDs and source key/ID mismatches fail during catalog assembly.

Generated descriptions deliberately avoid defining the emotion. They name one word to consider,
show associated needs as options, and return authority to the user. Adding reviewed prose requires
both languages, explicit `descriptionStatus: "reviewed"`, and copy-contract tests.

## Body Compass

All body-region signals are `curated-hypothesis`. Some also record
`basis: "nummenmaa-2014-group-map"`. That basis has a narrow meaning: group-level self-reported
activation or deactivation patterns informed curation.

It does not establish:

- a sensation type such as tension, pressure, or tingling;
- a minimum intensity or numerical weight;
- a body-side interpretation;
- an individual emotional state, cause, or diagnosis.

Scoring adds matching `weight * selectedIntensity` contributions. There is no cross-body
"coherence" multiplier. Scores only order the app's hypotheses; they are not probabilities or
clinical confidence.

The evidence boundary appears before users request possible words and is asserted in English and
Romanian browser tests.

## Safety Rules

`src/models/safety-rules.json` is the versioned source for high-distress words and prompt
combinations. The evaluator deduplicates selected IDs and is invariant to order and unrelated
words. Tiers only alter support visibility and ordering. Selected words never establish immediate
danger or self-harm intent.

Any rule, threshold, combination, order, or gate change requires explicit invariant tests and
separate safety review.

## Evidence

- [Nummenmaa et al. (2014), Bodily maps of emotions](https://pmc.ncbi.nlm.nih.gov/articles/PMC3896150/)
  reports group-level, self-reported bodily activation and deactivation maps.
- [Volynets et al. (2020), Bodily maps of emotions are culturally universal](https://pubmed.ncbi.nlm.nih.gov/31259590/)
  studies self-reported activity maps across 3,954 participants in 101 countries.
- [WHO, Psychological first aid](https://www.who.int/publications-detail-redirect/9789241548205)
  informs dignity, practical support, and respect for agency.

These sources inform boundaries and interaction principles. They do not validate Emot-ID's
catalog definitions, sensation types, signal weights, thresholds, rankings, or crisis rules.
