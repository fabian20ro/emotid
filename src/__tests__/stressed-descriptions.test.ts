import { expect, it } from 'vitest'
import { getCanonicalEmotion } from '../models/catalog'
import bad from '../models/wheel/overlays/bad.json'
import fearful from '../models/wheel/overlays/fearful.json'

it('provides reviewed bilingual meanings for the complete reachable Stressed choice set', () => {
  expect(bad.stressed.children).toEqual(['overwhelmed_bad', 'out_of_control', 'tense', 'burned_out', 'on_edge', 'irritable'])
  for (const id of bad.stressed.children) {
    const emotion = getCanonicalEmotion(id)!
    expect(emotion.descriptionStatus, id).toBe('reviewed')
    for (const language of ['en', 'ro'] as const) {
      const text = emotion.description?.[language]
      expect(text, `${id}/${language}`).toBeTruthy()
      expect(text!.split(/\s+/).length).toBeLessThanOrEqual(45)
    }
  }
})

it('does not equate same-label variants or silently complete unrelated groups', () => {
  expect(getCanonicalEmotion('overwhelmed_fear')?.description).toBeUndefined()
  expect(fearful.anxious.children.some((id) => !getCanonicalEmotion(id)?.description)).toBe(true)
  expect(bad.tired.children.some((id) => !getCanonicalEmotion(id)?.description)).toBe(true)
  expect(getCanonicalEmotion('out_of_control')?.needs).toBeUndefined()
  expect(getCanonicalEmotion('irritable')?.needs).toBeUndefined()
})
