import { describe, expect, it } from 'vitest'
import { countForm } from '../i18n/count-form'
import en from '../i18n/en.json'
import ro from '../i18n/ro.json'

describe('Journal count grammar', () => {
  it.each([
    [0, 'different words', 'cuvinte diferite', 'entries included', 'înregistrări incluse'],
    [1, 'different word', 'cuvânt diferit', 'entry included', 'înregistrare inclusă'],
    [2, 'different words', 'cuvinte diferite', 'entries included', 'înregistrări incluse'],
    [19, 'different words', 'cuvinte diferite', 'entries included', 'înregistrări incluse'],
    [20, 'different words', 'de cuvinte diferite', 'entries included', 'de înregistrări incluse'],
    [100, 'different words', 'de cuvinte diferite', 'entries included', 'de înregistrări incluse'],
    [101, 'different words', 'cuvinte diferite', 'entries included', 'înregistrări incluse'],
    [1000, 'different words', 'de cuvinte diferite', 'entries included', 'de înregistrări incluse'],
  ])('selects natural EN/RO forms for %i', (count, enWords, roWords, enEntries, roEntries) => {
    expect(countForm(Number(count), 'en', en.history.vocabEmotions)).toBe(enWords)
    expect(countForm(Number(count), 'ro', ro.history.vocabEmotions)).toBe(roWords)
    expect(countForm(Number(count), 'en', en.history.vocabSessions)).toBe(enEntries)
    expect(countForm(Number(count), 'ro', ro.history.vocabSessions)).toBe(roEntries)
  })
})
