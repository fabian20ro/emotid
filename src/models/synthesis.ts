import type { AnalysisResult } from './types'
import { HIGH_DISTRESS_IDS } from './distress'
import {
  pleasantCombinationCopy,
  synthesisCopy,
  type SynthesisLanguage,
} from './synthesis-copy'

interface ValenceProfile {
  hasPositive: boolean
  hasNegative: boolean
  isMixed: boolean
  avgValence: number
}

interface IntensityProfile {
  avgArousal: number
  isHigh: boolean
  isLow: boolean
}

function getLabel(result: AnalysisResult, lang: SynthesisLanguage): string {
  return result.label[lang] || result.label.en || result.id
}

function detectValence(results: AnalysisResult[]): ValenceProfile {
  const valences = results
    .map((r) => r.valence)
    .filter((v): v is number => v !== undefined)

  if (valences.length === 0) {
    return { hasPositive: false, hasNegative: false, isMixed: false, avgValence: 0 }
  }

  const hasPositive = valences.some((v) => v > 0.1)
  const hasNegative = valences.some((v) => v < -0.1)
  const avgValence = valences.reduce((sum, v) => sum + v, 0) / valences.length

  return {
    hasPositive,
    hasNegative,
    isMixed: hasPositive && hasNegative,
    avgValence,
  }
}

function detectIntensity(results: AnalysisResult[]): IntensityProfile {
  const arousals = results
    .map((r) => r.arousal)
    .filter((a): a is number => a !== undefined)

  if (arousals.length === 0) {
    return { avgArousal: 0.5, isHigh: false, isLow: false }
  }

  const avg = arousals.reduce((sum, a) => sum + a, 0) / arousals.length
  return {
    avgArousal: avg,
    isHigh: avg > 0.65,
    isLow: avg < 0.35,
  }
}

function collectNeeds(results: AnalysisResult[], lang: SynthesisLanguage): string[] {
  return results
    .map((r) => r.needs?.[lang])
    .filter((n): n is string => !!n)
}

function findPleasantCombo(ids: string[], lang: SynthesisLanguage): string | null {
  const sorted = [...ids].sort()
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const key = `${sorted[i]}+${sorted[j]}`
      const combo = pleasantCombinationCopy[key]
      if (combo) return combo[lang]
    }
  }
  return null
}

/**
 * Synthesize a narrative paragraph from analysis results.
 * Pure function — no side effects, no diagnostic language.
 */
export function synthesize(results: AnalysisResult[], language: SynthesisLanguage): string {
  if (results.length === 0) return ''

  const t = synthesisCopy[language]
  const names = results.map((r) => getLabel(r, language))
  const valence = detectValence(results)
  const intensity = detectIntensity(results)
  const needs = collectNeeds(results, language)
  const sentences: string[] = []

  // Detect if results contain high-distress emotions
  const isSevere = results.filter((r) => HIGH_DISTRESS_IDS.has(r.id)).length >= 2

  // 1. Complexity framing
  if (results.length === 1) {
    sentences.push(t.singleClear(names[0]))
  } else if (results.length >= 3) {
    sentences.push(t.complexityMultiple(results.length))
  }

  if (results.length >= 2) {
    if (valence.isMixed) {
      sentences.push(t.mixedValence(names))
    } else if (valence.hasPositive && !valence.hasNegative) {
      const pleasantCombo = findPleasantCombo(results.map((r) => r.id), language)
      sentences.push(pleasantCombo ?? t.concordantPleasant(names))
    } else if (valence.hasNegative && !valence.hasPositive) {
      const template = isSevere ? t.concordantUnpleasantSevere : t.concordantUnpleasant
      sentences.push(template(names))
    }
  }

  if (results.length === 1) {
    if (intensity.isHigh) {
      sentences.push(t.singleHighIntensity(names[0]))
    } else if (intensity.isLow) {
      sentences.push(t.singleLowIntensity(names[0]))
    }
  } else if (intensity.isHigh) {
    sentences.push(t.highIntensityGroup)
  } else if (intensity.isLow) {
    sentences.push(t.lowIntensityGroup)
  }

  if (needs.length > 0) {
    const closingTemplate = isSevere ? t.needsClosingSevere : t.needsClosing
    sentences.push(closingTemplate(needs))
  }

  return sentences.join(' ')
}
