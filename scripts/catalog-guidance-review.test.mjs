import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildAffectReviewBatch,
  buildDescriptionPilotBatch,
  buildPlutchikReviewBatch,
  buildPsychologistPrompt,
  buildQuickBodyReviewBatch,
  buildReviewBatch,
  buildWordLadderIntermediateDescriptionBatch,
  buildWordLadderReviewBatch,
  validateReviewResult,
} from './catalog-guidance-review.mjs'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const catalogDir = path.resolve(scriptsDir, '../src/models/catalog')
const dimensionalOverlayPath = path.resolve(scriptsDir, '../src/models/dimensional/overlay.json')
const plutchikOverlayDir = path.resolve(scriptsDir, '../src/models/plutchik/overlays')
const somaticDir = path.resolve(scriptsDir, '../src/models/somatic/data')
const wheelOverlayDir = path.resolve(scriptsDir, '../src/models/wheel/overlays')
const wheelRootIdsPath = path.resolve(scriptsDir, '../src/models/wheel/root-ids.json')

test('builds the exact 66-entry reviewed description inventory with one complete root comparison group', () => {
  const batch = buildDescriptionPilotBatch({
    batchId: 'p27-description-pilot-01',
    catalogDir,
    wheelRootIdsPath,
  })

  assert.deepEqual(batch.editableFields, ['description'])
  assert.equal(batch.needOptions, undefined)
  assert.ok(batch.entries.every((entry) => !Object.hasOwn(entry, 'guidance')))
  assert.deepEqual(batch.surfaces, ['shared-reflection', 'word-ladder-root-comparison'])
  assert.deepEqual(batch.comparisonGroups, [{ parentId: null, ids: [
    'happy', 'surprised', 'bad', 'fearful', 'angry', 'disgusted', 'sad',
  ] }])
  assert.deepEqual(batch.entries.map(({ id }) => id), [
    'accepted',
    'aggressive',
    'amazed',
    'anger',
    'angry',
    'anxiety',
    'anxious',
    'awful',
    'bad',
    'bitter',
    'bittersweetness',
    'bored',
    'burned_out',
    'confused',
    'content',
    'critical',
    'depressed',
    'despair',
    'disappointed_disg',
    'disapproving',
    'disgusted',
    'distant',
    'distressed',
    'excited',
    'fearful',
    'frustrated',
    'grief',
    'guilty',
    'happy',
    'humiliated',
    'hurt',
    'insecure',
    'interested',
    'irritable',
    'joy',
    'let_down',
    'lonely',
    'mad',
    'nervous',
    'numb',
    'on_edge',
    'optimistic',
    'out_of_control',
    'overwhelmed',
    'overwhelmed_bad',
    'peaceful',
    'playful',
    'powerful',
    'proud',
    'rage',
    'rejected',
    'repelled',
    'sad',
    'sadness',
    'scared',
    'shame',
    'startled',
    'stressed',
    'surprised',
    'tense',
    'terror',
    'threatened',
    'tired',
    'trusting',
    'vulnerable',
    'weak',
  ])

  const prompt = buildPsychologistPrompt(batch)
  assert.doesNotMatch(prompt, /controlled vocabulary/i)
  assert.doesNotMatch(prompt, /needId proposal/i)
})

test('builds all 41 Word Ladder intermediates as seven atomic comparison groups', () => {
  const batch = buildWordLadderIntermediateDescriptionBatch({
    batchId: 'p27-word-intermediate-descriptions-01',
    catalogDir,
    wheelOverlayDir,
    wheelRootIdsPath,
  })

  assert.deepEqual(batch.editableFields, ['description'])
  assert.equal(batch.needOptions, undefined)
  assert.ok(batch.entries.every((entry) => !Object.hasOwn(entry, 'guidance')))
  assert.deepEqual(batch.surfaces, ['shared-reflection', 'word-ladder-intermediate-comparison'])
  assert.deepEqual(batch.scope, { intermediateCount: 41, reviewedCount: 41 })
  assert.deepEqual(batch.comparisonGroups, [
    { parentId: 'happy', ids: ['playful', 'content', 'interested', 'proud', 'accepted', 'powerful', 'peaceful', 'trusting', 'optimistic'] },
    { parentId: 'surprised', ids: ['startled', 'confused', 'amazed', 'excited'] },
    { parentId: 'bad', ids: ['tired', 'stressed', 'overwhelmed', 'bored'] },
    { parentId: 'fearful', ids: ['scared', 'anxious', 'insecure', 'weak', 'rejected', 'threatened'] },
    { parentId: 'angry', ids: ['let_down', 'humiliated', 'bitter', 'mad', 'aggressive', 'frustrated', 'distant', 'critical'] },
    { parentId: 'disgusted', ids: ['disapproving', 'disappointed_disg', 'awful', 'repelled'] },
    { parentId: 'sad', ids: ['hurt', 'depressed', 'guilty', 'despair', 'vulnerable', 'lonely'] },
  ])
  assert.deepEqual(batch.entries.map(({ id }) => id), [
    'accepted', 'aggressive', 'amazed', 'anxious', 'awful', 'bitter', 'bored', 'confused',
    'content', 'critical', 'depressed', 'despair', 'disappointed_disg', 'disapproving',
    'distant', 'excited', 'frustrated', 'guilty', 'humiliated', 'hurt', 'insecure',
    'interested', 'let_down', 'lonely', 'mad', 'optimistic', 'overwhelmed', 'peaceful',
    'playful', 'powerful', 'proud', 'rejected', 'repelled', 'scared', 'startled', 'stressed',
    'threatened', 'tired', 'trusting', 'vulnerable', 'weak',
  ])
})

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

test('finds no unresolved Word Ladder guidance across every confirmable graph node', () => {
  const batch = buildWordLadderReviewBatch({
    batchId: 'p26-word-ladder-needs-01',
    catalogDir,
    wheelOverlayDir,
    wheelRootIdsPath,
  })

  assert.equal(batch.scope.reachableCount, 214)
  assert.equal(batch.scope.reviewedCount, 214)
  assert.deepEqual(batch.entries, [])
  assert.deepEqual(batch.surfaces, ['word-ladder'])
  assert.deepEqual(batch.editableFields, ['needId', 'none'])
  for (const id of ['happy', 'playful', 'aroused']) {
    assert.ok(batch.scope.reachableIds.includes(id), `${id} must remain reachable`)
  }
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
  assert.match(prompt, /exactly one decision/i)
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
      en: Array.from({ length: 46 }, () => 'option').join(' '),
      ro: Array.from({ length: 46 }, () => 'opțiune').join(' '),
    },
  }

  const violations = validateReviewResult(batch, result)

  assert.ok(violations.some((message) => message.includes('English matches forbidden pattern')))
  assert.ok(violations.some((message) => message.includes('Romanian matches forbidden pattern')))
  assert.ok(violations.some((message) => message.includes('description exceeds 45 words')))
})
