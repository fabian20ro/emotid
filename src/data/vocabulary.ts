import type { Session } from './types'
import { isSessionEligibleForPatterns } from './session-presentation'

export interface VocabularyStats {
  uniqueEmotionCount: number
  activeUniqueEmotionCount: number
  passiveUniqueEmotionCount: number
  perModel: Record<string, number>
  modelsUsed: number
  totalSessions: number
  milestone: VocabularyMilestone | null
  topActiveEmotions: { id: string; count: number; label: { ro: string; en: string } }[]
}

export type VocabularyMilestone =
  | { type: 'emotions'; count: number }
  | { type: 'models'; count: number }

const EMOTION_MILESTONES = [5, 10, 15, 25, 40, 60]
const MODEL_MILESTONES = [2, 3, 4]

export function computeVocabulary(sessions: Session[]): VocabularyStats {
  const activeEmotionIds = new Set<string>()
  const selectedEmotionIds = new Set<string>()
  const activeEmotionCounts = new Map<string, { count: number; label: { ro: string; en: string } }>()
  const perModelIds: Record<string, Set<string>> = {}
  const modelIds = new Set<string>()

  for (const session of sessions) {
    if (!isSessionEligibleForPatterns(session)) continue

    modelIds.add(session.modelId)
    if (!perModelIds[session.modelId]) {
      perModelIds[session.modelId] = new Set()
    }
    for (const selection of session.selections) {
      selectedEmotionIds.add(selection.emotionId)
    }
    for (const result of session.results) {
      activeEmotionIds.add(result.id)
      perModelIds[session.modelId].add(result.id)
      const existing = activeEmotionCounts.get(result.id)
      if (existing) {
        existing.count += 1
      } else {
        activeEmotionCounts.set(result.id, {
          count: 1,
          label: result.label,
        })
      }
    }
  }

  const perModel: Record<string, number> = {}
  for (const [model, ids] of Object.entries(perModelIds)) {
    perModel[model] = ids.size
  }

  const activeUniqueEmotionCount = activeEmotionIds.size
  const passiveUniqueEmotionCount = Array.from(selectedEmotionIds).filter((id) => !activeEmotionIds.has(id)).length
  const uniqueEmotionCount = activeUniqueEmotionCount
  let milestone: VocabularyMilestone | null = null

  for (const m of EMOTION_MILESTONES) {
    if (uniqueEmotionCount >= m) {
      milestone = { type: 'emotions', count: m }
    }
  }

  for (const m of MODEL_MILESTONES) {
    if (modelIds.size >= m) {
      const modelMilestone: VocabularyMilestone = { type: 'models', count: m }
      if (!milestone || (milestone.type === 'emotions' && milestone.count < 10)) {
        milestone = modelMilestone
      }
    }
  }

  const topActiveEmotions = Array.from(activeEmotionCounts.entries())
    .map(([id, value]) => ({ id, count: value.count, label: value.label }))
    .sort((a, b) => b.count - a.count || a.label.en.localeCompare(b.label.en))
    .slice(0, 15)

  return {
    uniqueEmotionCount,
    activeUniqueEmotionCount,
    passiveUniqueEmotionCount,
    perModel,
    modelsUsed: modelIds.size,
    totalSessions: sessions.length,
    milestone,
    topActiveEmotions,
  }
}
