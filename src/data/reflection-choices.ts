import type { Strings } from '../context/language-context'
import type { Language } from '../context/language-bootstrap'
import { getNeedOption } from '../models/catalog/guidance/need-options'
import type { Session } from './types'

const nextStepKeys = { pause: 'stepPause', write: 'stepWrite', connect: 'stepConnect' } as const
export type NextStepId = keyof typeof nextStepKeys
export const nextStepIds = Object.keys(nextStepKeys) as NextStepId[]

export function isNextStepId(value: unknown): value is NextStepId {
  return typeof value === 'string' && Object.hasOwn(nextStepKeys, value)
}

export function getNextStepLabel(id: NextStepId | undefined, copy: Strings['reflectionScreen']) {
  return id === undefined ? undefined : copy[nextStepKeys[id]]
}

export function getReflectionChoiceLabels(
  detail: Pick<Session, 'selectedNeedId' | 'selectedNeed' | 'nextStepId' | 'nextStep'>,
  language: Language,
  copy: Strings['reflectionScreen'],
) {
  return {
    need: (detail.selectedNeedId ? getNeedOption(detail.selectedNeedId)?.[language] : undefined) ?? detail.selectedNeed,
    step: getNextStepLabel(detail.nextStepId, copy) ?? detail.nextStep,
  }
}
