import { describe, expect, it } from 'vitest'
import negativeHigh from '../models/catalog/negative-high.json'
import en from '../i18n/en.json'
import ro from '../i18n/ro.json'
import { synthesize } from '../models/synthesis'
import { emotionCatalog } from '../models/catalog'
import type { AnalysisResult } from '../models/types'

const expectedReviewedDescriptionIds = [
  'anxiety',
  'rage',
  'terror',
  'grief',
  'shame',
  'despair',
  'angry',
  'frustrated',
  'stressed',
  'tense',
  'nervous',
  'distressed',
]

const forbiddenEnglish = [
  /\byou (are experiencing|need)\b/i,
  /\byour (body|mind|system) (is asking|reacts|tells|signals)\b/i,
  /\b(is|are) (an? )?(alarm |physical )?signal that\b/i,
  /\b(is|are) the (response|point|energy) that\b/i,
  /\brequires? (human|professional|a safe)\b/i,
  /\bnatural and healthy\b/i,
]

const forbiddenRomanian = [
  /\b(ai|aveți) nevoie\b/i,
  /\bcorpul (tău|vostru) (îți|vă) (cere|spune|semnalează)\b/i,
  /\b(este|sunt) (un )?semnal(ul)? că\b/i,
  /\b(este|sunt) răspunsul\b/i,
  /\bnecesită (conexiune|sprijin|un spațiu)\b/i,
  /\bnaturală și sănătoasă\b/i,
]

function makeResult(
  id: string,
  options: Partial<AnalysisResult> = {},
): AnalysisResult {
  return {
    id,
    label: { en: id, ro: id },
    color: '#000',
    ...options,
  }
}

describe('psychological copy contract', () => {
  it('keeps reviewed descriptions short, observational, and separate from advice', () => {
    const instructionPatterns = {
      en: [/\b(try|seek|notice whether|may help|can help|could help|worth considering|you|your)\b/i],
      ro: [
        /\b(încercați|căutați|observați dacă|poate ajuta|pot ajuta|ar putea ajuta|merită luat(?:ă)? în considerare)\b/i,
        /(?:^|\s)(?:voi|vouă|vă|vi|v-ar)(?=\s|[,.!?])/iu,
      ],
    }

    for (const emotion of Object.values(emotionCatalog).filter(({ description }) => description)) {
      for (const language of ['en', 'ro'] as const) {
        const description = emotion.description![language]
        const words = description.trim().split(/\s+/u)
        expect(words.length, `${emotion.id}:${language} is too short`).toBeGreaterThanOrEqual(10)
        expect(words.length, `${emotion.id}:${language} is too long`).toBeLessThanOrEqual(45)
        for (const pattern of instructionPatterns[language]) {
          expect(description, `${emotion.id}:${language} contains advice or direct address`).not.toMatch(pattern)
        }
      }
    }
  })

  it('keeps the bounded reviewed-description inventory explicit', () => {
    expect(Object.keys(negativeHigh)).toEqual(expectedReviewedDescriptionIds)
    for (const emotion of Object.values(negativeHigh)) {
      expect(emotion.descriptionStatus).toBe('reviewed')
    }
  })

  it('keeps every high-distress description tentative in English and Romanian', () => {
    for (const emotion of Object.values(negativeHigh)) {
      expect(emotion.description.en, emotion.id).toMatch(/\b(can|may|might|could|if|different)\b/i)
      expect(emotion.description.ro, emotion.id).toMatch(/\b(poate|pot|ar putea|dacă|diferit)\b/i)

      for (const pattern of forbiddenEnglish) {
        expect(emotion.description.en, `${emotion.id}: ${pattern}`).not.toMatch(pattern)
      }
      for (const pattern of forbiddenRomanian) {
        expect(emotion.description.ro, `${emotion.id}: ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('does not copy unreviewed catalog descriptions into generated synthesis', () => {
    const marker = 'UNREVIEWED_CAUSAL_CLAIM'
    const text = synthesize([
      makeResult('joy', {
        description: { en: marker, ro: marker },
        needs: { en: 'quiet', ro: 'liniște' },
      }),
    ], 'en')

    expect(text).not.toContain(marker)
    expect(text).toContain('one possible word')
    expect(text).toContain('Keep it only if it fits')
  })

  it('keeps representative generated narratives tentative in both languages', () => {
    const scenarios: AnalysisResult[][] = [
      [makeResult('anxiety', { arousal: 0.9, valence: -0.7 })],
      [makeResult('serenity', { arousal: 0.1, valence: 0.6 })],
      [
        makeResult('joy', { valence: 0.8 }),
        makeResult('sadness', { valence: -0.7 }),
      ],
      [
        makeResult('rage', { valence: -0.9, needs: { en: 'space', ro: 'spațiu' } }),
        makeResult('terror', { valence: -0.9, needs: { en: 'support', ro: 'sprijin' } }),
      ],
    ]

    for (const scenario of scenarios) {
      const english = synthesize(scenario, 'en')
      const romanian = synthesize(scenario, 'ro')

      expect(english).toMatch(/\b(may|can|could|if|notice|suggestions)\b/i)
      expect(romanian).toMatch(/\b(poate|pot|dacă|observă|sugestii)\b/i)
      for (const pattern of forbiddenEnglish) expect(english).not.toMatch(pattern)
      for (const pattern of forbiddenRomanian) expect(romanian).not.toMatch(pattern)
    }
  })

  it('keeps onboarding exploratory rather than causal or universal', () => {
    expect(en.onboarding.screen2Title).toBe('Your context matters')
    expect(en.onboarding.screen2Body).toBe('A feeling can have more than one meaning. Notice what fits your experience and leave the rest.')
    expect(ro.onboarding.screen2Title).toBe('Contextul tău contează')
    expect(ro.onboarding.screen2Body).toBe('O trăire poate avea mai multe sensuri. Păstrează ce se potrivește experienței tale și lasă deoparte restul.')
  })

  it('uses non-evaluative, model-accurate language on key decision surfaces', () => {
    expect(en.privacyData.saving).toBe('Save reflections on this device')
    expect(ro.privacyData.saving).toBe('Salvează reflecțiile pe acest dispozitiv')
    expect(ro.today.placeFeeling).not.toContain('verificare')
    expect(en.plutchik.lede).toContain('starting emotions from this model')
    expect(ro.plutchik.lede).toContain('emoții de pornire din acest model')
    expect(en.analyze.exploreAI).toBe('Explore in Google AI Mode')
    expect(ro.analyze.exploreAI).toBe('Explorează în Google AI Mode')
  })

  it('does not describe historical labels as a reason for present crisis prominence', () => {
    expect(en.crisis).not.toHaveProperty('temporalNote')
    expect(ro.crisis).not.toHaveProperty('temporalNote')
  })

  it('keeps vocabulary uncertainty neutral instead of assuming every option fits', () => {
    expect(en.granularity.notSure).toBe('Not sure yet')
    expect(ro.granularity.notSure).toBe('Nu știu încă')
    expect(en.granularity.feedbackNotSure).toBe('You can continue without choosing among these words.')
    expect(ro.granularity.feedbackNotSure).toBe('Poți continua fără să alegi dintre aceste cuvinte.')
  })

  it('does not present a rejected suggestion as a user-confirmed label', () => {
    expect(en.reflectionScreen.finishWithoutLabel).toBe('Finish without confirming this label')
    expect(ro.reflectionScreen.finishWithoutLabel).toBe('Încheie fără să confirmi această etichetă')
    expect(en.today.rejectedResult).toBe('Suggested result: {result}')
    expect(ro.today.rejectedResult).toBe('Rezultat sugerat: {result}')
    expect(en.journalScreen.rejectedResult).toBe('Suggested result: {result}')
    expect(ro.journalScreen.rejectedResult).toBe('Rezultat sugerat: {result}')
    expect(en.sessionDetail.relationship.rejected).toBe('Suggested result that did not fit')
    expect(ro.sessionDetail.relationship.rejected).toBe('Rezultat sugerat care nu s-a potrivit')
  })
})
