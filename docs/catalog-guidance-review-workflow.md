# Catalog Guidance Review Workflow

P26 treats model output as candidate material, never psychological approval. Runtime guidance stays
absent until a candidate has passed deterministic validation, an explicit domain review, and a
source change marked `reviewed`.

## Boundaries

- Client catalog only. No model invocation from the application.
- One deterministic batch and prompt builder for every provider.
- English and Romanian reviewed together.
- Exactly one highest-impact change or `none` per emotion: a controlled `needId`, a bilingual
  description, or removal.
- Generated status is always `candidate`; only a separate human/domain decision may update catalog
  provenance.
- Crisis rules, persistence, and user history are outside this workflow.

## Prepare The First Batch

```bash
npm run prepare:catalog-review
```

Generated, ignored artifacts:

- `.reports/catalog-guidance/p26-negative-high-01/batch.json`
- `.reports/catalog-guidance/p26-negative-high-01/prompt.txt`

The first batch contains the 12 entries in `negative-high.json` and the controlled bilingual need
options once per batch. Later batches should use the same utility with an explicit source, batch ID,
and output directory. Use `--ids` to prepare only disputed entries.

## Invoke A Provider

Provider execution remains outside the utility so quotas, credentials, and vendor changes cannot
affect the catalog contract. Supply the generated prompt as one non-interactive request and retain
the raw JSON response beside the batch as `result.json`.

Gemini first pass:

```bash
agy --model gemini-3.6-flash-high --effort high --mode plan --sandbox \
  -p "$(cat .reports/catalog-guidance/p26-negative-high-01/prompt.txt)"
```

Luna escalation for disputed or high-risk candidates:

```bash
node scripts/catalog-guidance-review.mjs prepare \
  --source negative-high.json \
  --ids despair,terror \
  --batch-id p26-negative-high-descriptions-01 \
  --out-dir .reports/catalog-guidance/p26-negative-high-descriptions-01

codex exec --ephemeral -s read-only -m gpt-5.6-luna \
  -c 'model_reasoning_effort="max"' \
  "$(cat .reports/catalog-guidance/p26-negative-high-descriptions-01/prompt.txt)"
```

Do not run both providers by default. Start with Gemini; reserve Luna for cases that deterministic
checks or domain review flag.

## Validate

```bash
node scripts/catalog-guidance-review.mjs validate \
  --batch .reports/catalog-guidance/p26-negative-high-01/batch.json \
  --result .reports/catalog-guidance/p26-negative-high-01/result.json
```

Validation rejects wrong schema or batch IDs, automatic `reviewed` status, unknown, duplicate, or
missing emotions, unsupported fields, unknown `needId` values, incomplete bilingual descriptions,
and content attached to a `none` decision. Passing validation means structurally reviewable, not
psychologically approved.

## First Batch Status

The initial Gemini Flash High run returned all 12 required candidate decisions and passed the
structural and shared forbidden-copy checks. Domain review did not approve the batch for catalog
application:

- `angry`, `distressed`, `frustrated`, and `stressed` primarily proposed orthographic changes that
  should be handled once through the controlled need vocabulary, not repeated in source entries.
- `anxiety`, `grief`, `nervous`, `rage`, `shame`, and `tense` need meaning or natural-language
  adjudication; the model missed the maximal claim in `unconditional acceptance`.
- `despair` and `terror` correctly identified that urgent instructions belong to the crisis
  boundary, but the proposed copy needs revision. The Romanian despair candidate contains a typo.

The reviewed implementation uses 10 controlled bilingual need options and maps all 12 entries with
explicit `needId` provenance. Raw per-entry needs are rejected. Runtime hydration exposes neither a
need nor a description for the remaining 276 entries.

One Luna Max call reviewed only `despair` and `terror`. Its raw result was rejected because it used
a forbidden generated-finding pattern for terror. No retry was spent. Domain review retained the
useful separation between descriptive copy and deterministic crisis support, then applied revised
bilingual descriptions rather than the provider text.

The next batch should target the unreviewed emotions reachable through Quick and Body Compass,
deduplicate them by canonical ID, and expand the controlled vocabulary only when no current option
fits. Provider escalation remains exception-only.

## Quick And Body Compass Batch Status

`npm run prepare:catalog-review:quick-body` derives the union from the six canonical Quick IDs and
all Body Compass signal data, resolves each ID across catalog files, removes duplicates, and skips
existing reviewed decisions. The initial union contained 32 IDs: three already reviewed and 29
requiring a decision.

One bounded Luna Max psychologist review challenged a draft mapping rather than generating prose.
Domain review accepted 13 mappings, added only `rest / odihnă`, and made the existing safety option
more natural as `a sense of safety / un sentiment de siguranță`. Sixteen ambiguous cases received
an explicit reviewed `needId: null`, including Quick `joy` and `numb`. Rejected mappings would have
treated activities as needs, implied moral correction, presumed wrongdoing or threat, or pushed
connection/expression where withdrawal may be protective.

The regenerated batch contains zero unresolved entries. This is intentional: source-level null
decisions prevent repeat review while hydration exposes no empty or inferred guidance.

## Affect Map Batch Status

`npm run prepare:catalog-review:affect` derives its inventory directly from the production
dimensional overlay, resolves every ID through the canonical catalog, and skips reviewed decisions.
The first batch contained 38 reachable IDs: nine already reviewed and 29 requiring a decision.

Surface batches declare `editableFields: ["needId", "none"]`. Their prompt and validator reject
description proposals so need review cannot silently expand into a prose audit.

One bounded Luna Max psychologist pass challenged a conservative draft. Domain review retained
only five new mappings: `afraid -> safety`, `lonely -> connection`, `sad -> compassion`,
`tender -> connection`, and `tired -> rest`. The other 24 entries received explicit reviewed
`needId: null`. No new need option was justified; in particular, positive states, alertness,
apathy, boredom, longing, nostalgia, lethargy, and broad low-mood labels did not establish one
specific need.

The regenerated Affect batch contains zero unresolved entries. Across all 38 Affect emotions,
11 reviewed mappings are visible at runtime and 27 expose no inferred need.
