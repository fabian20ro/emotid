import type { BaseEmotion } from '../models/types'
import type { CheckInCompletion, ReflectionDetail } from '../navigation/types'
import type { SerializedSelection, Session } from './types'

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

export function createSession(input: CheckInCompletion, identity?: SessionIdentity): Session {
  return {
    id: identity?.id ?? crypto.randomUUID(),
    timestamp: identity?.timestamp ?? Date.now(),
    modelId: input.modelId,
    entryRoute: input.route,
    ...(input.outcome ? { outcome: input.outcome } : {}),
    selections: serializeSelections(input.selections),
    results: input.results,
    crisisTier: input.crisisTier,
  }
}

export function addReflectionDetail(session: Session, detail: ReflectionDetail): Session {
  return {
    ...session,
    reflectionAnswer: detail.reflectionAnswer,
    selectedResultIds: detail.selectedResultIds,
    selectedNeed: detail.selectedNeed,
    selectedNeedId: detail.selectedNeedId,
    nextStep: detail.nextStep,
    nextStepId: detail.nextStepId,
  }
}
