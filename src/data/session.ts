import { getCrisisTier } from '../models/distress'
import type { AnalysisResult, BaseEmotion } from '../models/types'
import type { CheckInRoute, ReflectionDetail } from '../navigation/types'
import type { SerializedSelection, Session } from './types'

interface SessionInput {
  route: CheckInRoute
  modelId: string
  selections: BaseEmotion[]
  results: AnalysisResult[]
}

interface SessionIdentity {
  id: string
  timestamp: number
}

function serializeSelections(selections: BaseEmotion[]): SerializedSelection[] {
  return selections.map((selection) => {
    const item: SerializedSelection = { emotionId: selection.id, label: selection.label }
    if ('selectedSensation' in selection && 'selectedIntensity' in selection) {
      item.extras = {
        sensationType: (selection as BaseEmotion & { selectedSensation: string }).selectedSensation,
        intensity: (selection as BaseEmotion & { selectedIntensity: number }).selectedIntensity,
      }
    }
    return item
  })
}

export function createSession(input: SessionInput, identity?: SessionIdentity): Session {
  return {
    id: identity?.id ?? crypto.randomUUID(),
    timestamp: identity?.timestamp ?? Date.now(),
    modelId: input.modelId,
    entryRoute: input.route,
    ...(input.route === 'body' && input.results.length === 0 ? { outcome: 'body-observation' as const } : {}),
    selections: serializeSelections(input.selections),
    results: input.results,
    crisisTier: getCrisisTier(input.results.map((result) => result.id)),
  }
}

export function addReflectionDetail(session: Session, detail: ReflectionDetail): Session {
  return {
    ...session,
    reflectionAnswer: detail.reflectionAnswer,
    selectedResultIds: detail.selectedResultIds,
    selectedNeed: detail.selectedNeed,
    nextStep: detail.nextStep,
  }
}
