import type { AnalysisResult } from '../types'
import { getCanonicalEmotion } from '../catalog'
import type { SomaticSelection } from './types'

interface ScoredEmotion extends AnalysisResult {
  score: number
  matchStrength: { ro: string; en: string }
}

const MINIMUM_THRESHOLD = 0.5
const MAX_RESULTS = 4

/** Absolute score floor: if the best score is below this, downgrade all labels */
const STRONG_FLOOR = 1.0
const POSSIBLE_FLOOR = 0.6

function getMatchStrength(score: number, maxScore: number): { ro: string; en: string } {
  const ratio = maxScore > 0 ? score / maxScore : 0
  if (ratio >= 0.7 && score >= STRONG_FLOOR) return { ro: 'potrivire mai apropiată', en: 'closer match' }
  if (ratio >= 0.4 && score >= POSSIBLE_FLOOR) return { ro: 'potrivire posibilă', en: 'possible match' }
  return { ro: 'merită explorat', en: 'worth exploring' }
}

export function scoreSomaticSelections(selections: SomaticSelection[]): ScoredEmotion[] {
  if (selections.length === 0) return []

  const emotionScores = new Map<
    string,
    {
      emotionId: string
      emotionLabel: { ro: string; en: string }
      emotionColor: string
      emotionDescription?: { ro: string; en: string }
      emotionNeeds?: { ro: string; en: string }
      score: number
      contributingRegions: { ro: string; en: string }[]
    }
  >()

  for (const selection of selections) {
    for (const signal of selection.emotionSignals) {
      if (signal.sensationType !== selection.selectedSensation) continue
      if (selection.selectedIntensity < signal.minIntensity) continue

      const contribution = signal.weight * selection.selectedIntensity
      const existing = emotionScores.get(signal.emotionId)

      if (existing) {
        emotionScores.set(signal.emotionId, {
          ...existing,
          score: existing.score + contribution,
          contributingRegions: [...existing.contributingRegions, selection.label],
        })
      } else {
        const canonical = getCanonicalEmotion(signal.emotionId)
        emotionScores.set(signal.emotionId, {
          emotionId: signal.emotionId,
          emotionLabel: canonical?.label ?? { ro: signal.emotionId, en: signal.emotionId },
          emotionColor: canonical?.color ?? '#999999',
          emotionDescription: canonical?.description,
          emotionNeeds: canonical?.needs,
          score: contribution,
          contributingRegions: [selection.label],
        })
      }
    }
  }

  const sorted = Array.from(emotionScores.values())
    .filter((e) => e.score >= MINIMUM_THRESHOLD)
    .sort((a, b) => b.score - a.score)

  const topResults = sorted.slice(0, MAX_RESULTS)
  const maxScore = topResults[0]?.score ?? 0

  return topResults.map((entry) => ({
    id: entry.emotionId,
    label: entry.emotionLabel,
    color: entry.emotionColor,
    description: entry.emotionDescription,
    needs: entry.emotionNeeds,
    componentLabels: entry.contributingRegions,
    score: entry.score,
    matchStrength: getMatchStrength(entry.score, maxScore),
  }))
}
