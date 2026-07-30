import { escalateCrisisTier, hasTemporalCrisisPattern } from '../../../data/temporal-crisis'
import type { Session } from '../../../data/types'
import { getCrisisTier } from '../../../models/distress'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import type { CheckInCompletion, CheckInRoute } from '../../../navigation/types'

export interface CheckInCompletionInput {
  route: CheckInRoute
  modelId: string
  selections: BaseEmotion[]
  results: AnalysisResult[]
}

export function buildCheckInCompletion(
  input: CheckInCompletionInput,
  sessions: Session[],
  nowMs = Date.now(),
): CheckInCompletion {
  const baseTier = getCrisisTier(input.results.map((result) => result.id))
  const temporalPattern = hasTemporalCrisisPattern(sessions, nowMs)
  const crisisTier = escalateCrisisTier(baseTier, sessions, nowMs)

  return {
    ...input,
    crisisTier,
    temporalEscalation: temporalPattern && crisisTier !== baseTier,
  }
}
