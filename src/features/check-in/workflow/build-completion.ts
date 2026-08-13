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
): CheckInCompletion {
  return {
    ...input,
    crisisTier: getCrisisTier(input.results.map((result) => result.id)),
  }
}
