import { expect, it } from 'vitest'
import { buildCheckInCompletion } from '../features/check-in/workflow/build-completion'
import { createSession } from '../data/session'
import type { CheckInRoute } from '../navigation/types'
import type { CrisisTier } from '../models/distress'
import { somaticRegions } from '../models/somatic'

const routes: [CheckInRoute, string][] = [
  ['quick', 'quick-check-in'], ['words', 'wheel'], ['affect', 'dimensional'],
  ['body', 'somatic'], ['plutchik', 'plutchik'],
]
const tiers: [CrisisTier, string[]][] = [
  ['none', ['happy']], ['tier1', ['despair']], ['tier2', ['rage', 'panicked']],
  ['tier3', ['despair', 'helpless']], ['tier4', ['despair', 'worthless', 'empty']],
]
const selection = { id: 'happy', label: { en: 'Happy', ro: 'Fericit' }, color: '#000' }

for (const [route, modelId] of routes) it.each(tiers)(`${route} carries %s metadata from completion into history`, (crisisTier, ids) => {
  const completion = buildCheckInCompletion({ route, modelId, selections: [selection],
    results: ids.map((id) => ({ ...selection, id })),
  })
  const before = structuredClone(completion)
  expect(completion.crisisTier).toBe(crisisTier)
  expect(completion.outcome).toBeUndefined()
  expect(createSession(completion, { id: 'kept', timestamp: 123 })).toEqual({
    id: 'kept', timestamp: 123, entryRoute: route, modelId, crisisTier,
    selections: [{ emotionId: 'happy', label: selection.label }], results: completion.results,
  })
  expect(completion).toEqual(before)
})

it('serializes observation-only completion and clears its metadata on an explicit revision', () => {
  const signal = { ...somaticRegions.chest, selectedSensation: 'pressure', selectedIntensity: 1 }
  const observation = buildCheckInCompletion({ route: 'body', modelId: 'somatic', selections: [signal], results: [] })
  const original = createSession(observation, { id: 'kept', timestamp: 123 })
  expect(original).toMatchObject({ outcome: 'body-observation', crisisTier: 'none', results: [],
    selections: [{ emotionId: 'chest', extras: { sensationType: 'pressure', intensity: 1 } }],
  })
  const revised = createSession(buildCheckInCompletion({ route: 'body', modelId: 'somatic', selections: [signal], results: [selection] }), original)
  expect(revised).toMatchObject({ id: 'kept', timestamp: 123, crisisTier: 'none' })
  expect(revised.outcome).toBeUndefined()
  expect(original.outcome).toBe('body-observation')
})
