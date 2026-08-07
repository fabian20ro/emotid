import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildAffectReviewBatch,
  buildPlutchikReviewBatch,
  buildPsychologistPrompt,
  buildQuickBodyReviewBatch,
  buildReviewBatch,
  validateReviewResult,
} from './catalog-guidance-review.mjs'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const catalogDir = path.resolve(scriptsDir, '../src/models/catalog')
const dimensionalOverlayPath = path.resolve(scriptsDir, '../src/models/dimensional/overlay.json')
const plutchikOverlayDir = path.resolve(scriptsDir, '../src/models/plutchik/overlays')
const somaticDir = path.resolve(scriptsDir, '../src/models/somatic/data')

function negativeHighBatch() {
  return buildReviewBatch({
    batchId: 'p26-negative-high-01',
    catalogDir,
    sourceFile: 'negative-high.json',
  })
}

test('builds a deterministic disputed-ID subset and rejects unknown IDs', () => {
  const batch = buildReviewBatch({
    batchId: 'p26-negative-high-descriptions-01',
    catalogDir,
    sourceFile: 'negative-high.json',
    ids: ['terror', 'despair'],
  })

  assert.deepEqual(batch.entries.map(({ id }) => id), ['despair', 'terror'])
  assert.throws(() => buildReviewBatch({
    batchId: 'p26-invalid',
    catalogDir,
    sourceFile: 'negative-high.json',
    ids: ['unknown-emotion'],
  }), /unknown requested ID/)
})

test('finds no unresolved Quick and Body Compass guidance after reviewed decisions', () => {
  const batch = buildQuickBodyReviewBatch({
    batchId: 'p26-quick-body-needs-01',
    catalogDir,
    somaticDir,
  })

  assert.deepEqual(batch.entries, [])
  assert.equal(batch.scope.reachableCount, 32)
  assert.equal(batch.scope.reviewedCount, 32)
  assert.deepEqual(batch.surfaces, ['body-compass', 'quick'])
})

test('finds no unresolved Affect Map guidance after reviewed decisions', () => {
  const batch = buildAffectReviewBatch({
    batchId: 'p26-affect-needs-01',
    catalogDir,
    dimensionalOverlayPath,
  })

  assert.equal(batch.scope.reachableCount, 38)
  assert.equal(batch.scope.reviewedCount, 38)
  assert.deepEqual(batch.surfaces, ['affect-map'])
  assert.deepEqual(batch.editableFields, ['needId', 'none'])
  assert.deepEqual(batch.entries, [])

  const result = validResult({ ...batch, entries: [{ id: 'afraid' }] })
  result.proposals[0] = {
    ...result.proposals[0],
    field: 'description',
    proposal: { en: 'A possibility.', ro: 'O posibilitate.' },
  }
  assert.ok(validateReviewResult(
    { ...batch, entries: [{ id: 'afraid' }] },
    result,
  ).some((message) => message.includes('invalid field "description"')))
})

test('finds no unresolved Plutchik result guidance after reviewed decisions', () => {
  const batch = buildPlutchikReviewBatch({
    batchId: 'p26-plutchik-needs-01',
    catalogDir,
    plutchikOverlayDir,
  })

  assert.equal(batch.scope.reachableCount, 29)
  assert.equal(batch.scope.reviewedCount, 29)
  assert.deepEqual(batch.scope.reachableIds, [
    'aggression',
    'ambivalence',
    'anxiety',
    'awe',
    'bittersweetness',
    'compassion',
    'confusion',
    'contempt',
    'curiosity',
    'cynicism',
    'delight',
    'despair',
    'disapproval',
    'dominance',
    'envy',
    'frozenness',
    'guilt',
    'hope',
    'love',
    'morbidness',
    'optimism',
    'outrage',
    'pessimism',
    'pride',
    'remorse',
    'sentimentality',
    'shame',
    'submission',
    'unbelief',
  ])
  assert.deepEqual(batch.surfaces, ['plutchik'])
  assert.deepEqual(batch.editableFields, ['needId', 'none'])
  assert.deepEqual(batch.entries, [])
})

function validResult(batch) {
  return {
    schemaVersion: 2,
    batchId: batch.batchId,
    status: 'candidate',
    proposals: batch.entries.map(({ id }) => ({
      id,
      field: 'none',
      proposal: null,
      rationale: 'No higher-impact change identified.',
      risk: 'Context may change the interpretation.',
    })),
  }
}

test('builds a stable first batch from the high-exposure catalog source', () => {
  const batch = negativeHighBatch()

  assert.equal(batch.schemaVersion, 2)
  assert.equal(batch.batchId, 'p26-negative-high-01')
  assert.equal(batch.sourceFile, 'negative-high.json')
  assert.deepEqual(
    batch.entries.map(({ id }) => id),
    [
      'angry',
      'anxiety',
      'despair',
      'distressed',
      'frustrated',
      'grief',
      'nervous',
      'rage',
      'shame',
      'stressed',
      'tense',
      'terror',
    ],
  )
  for (const entry of batch.entries) {
    assert.ok(entry.label.en)
    assert.ok(entry.label.ro)
    assert.equal(entry.guidance.status, 'reviewed')
    assert.ok(batch.needOptions[entry.guidance.needId])
    assert.deepEqual(entry.guidance.text, batch.needOptions[entry.guidance.needId])
  }
})

test('builds one reusable psychologist prompt with an advisory-only provenance boundary', () => {
  const batch = negativeHighBatch()
  const prompt = buildPsychologistPrompt(batch)

  assert.match(prompt, /psychologist/i)
  assert.match(prompt, /one highest-impact change or none/i)
  assert.match(prompt, /status.*candidate/i)
  assert.match(prompt, /must not be treated as reviewed/i)
  assert.equal(prompt.split('p26-negative-high-01').length - 1, 1)
})

test('accepts exactly one well-formed candidate decision per batch entry', () => {
  const batch = negativeHighBatch()
  const result = validResult(batch)
  result.proposals[0] = {
    ...result.proposals[0],
    field: 'needId',
    proposal: 'support',
  }

  assert.deepEqual(validateReviewResult(batch, result), [])
})

test('rejects automatic reviewed status, duplicate, unknown, and missing decisions', () => {
  const batch = negativeHighBatch()
  const result = validResult(batch)
  result.status = 'reviewed'
  result.proposals[1] = { ...result.proposals[0] }
  result.proposals.push({
    id: 'unknown-emotion',
    field: 'none',
    proposal: null,
    rationale: 'Unknown.',
    risk: 'Unknown.',
  })

  const violations = validateReviewResult(batch, result)

  assert.ok(violations.some((message) => message.includes('status must be "candidate"')))
  assert.ok(violations.some((message) => message.includes('duplicate proposal')))
  assert.ok(violations.some((message) => message.includes('unknown emotion')))
  assert.ok(violations.some((message) => message.includes('missing proposal for "anxiety"')))
})

test('rejects unknown need IDs, incomplete descriptions, and copy on no-change decisions', () => {
  const batch = negativeHighBatch()
  const result = validResult(batch)
  result.proposals[0] = {
    ...result.proposals[0],
    field: 'needId',
    proposal: 'unknown-need',
  }
  result.proposals[1] = {
    ...result.proposals[1],
    field: 'description',
    proposal: { en: 'Tentative.', ro: '' },
  }
  result.proposals[2] = {
    ...result.proposals[2],
    proposal: { en: 'unexpected', ro: 'neașteptat' },
  }

  const violations = validateReviewResult(batch, result)

  assert.ok(violations.some((message) => message.includes('unknown needId')))
  assert.ok(violations.some((message) => message.includes('bilingual description proposal')))
  assert.ok(violations.some((message) => message.includes('field "none" must have proposal null')))
})

test('rejects psychologically unsafe and mobile-unreadable candidate copy', () => {
  const batch = negativeHighBatch()
  const result = validResult(batch)
  result.proposals[0] = {
    ...result.proposals[0],
    field: 'description',
    proposal: {
      en: 'Your body is telling you that you need professional help.',
      ro: 'Corpul vostru vă spune că aveți nevoie de ajutor profesional.',
    },
  }
  result.proposals[1] = {
    ...result.proposals[1],
    field: 'description',
    proposal: {
      en: Array.from({ length: 81 }, () => 'option').join(' '),
      ro: Array.from({ length: 81 }, () => 'opțiune').join(' '),
    },
  }

  const violations = validateReviewResult(batch, result)

  assert.ok(violations.some((message) => message.includes('English matches forbidden pattern')))
  assert.ok(violations.some((message) => message.includes('Romanian matches forbidden pattern')))
  assert.ok(violations.some((message) => message.includes('description exceeds 80 words')))
})
