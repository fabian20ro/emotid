import type { AnalysisResult, BaseEmotion } from '../models/types'
import type { CrisisTier } from '../models/distress'
import type { NextStepId } from '../data/reflection-choices'
import type { NeedOptionId } from '../models/catalog/guidance/need-options'

export type AppTab = 'today' | 'explore' | 'journal'
export type CheckInRoute = 'quick' | 'body' | 'affect' | 'words' | 'plutchik'
export type ReflectionAnswer = 'yes' | 'partly' | 'no'
export type ReflectionView = 'result' | 'exploration' | 'step'
export type ReflectionSaveOutcome = 'saved' | 'not-saved'
export type SessionSaveState = 'saving' | 'saved' | 'error' | 'disabled'

export interface ReflectionDetail {
  selectedResultIds?: string[]
  reflectionAnswer?: ReflectionAnswer
  selectedNeed?: string
  selectedNeedId?: NeedOptionId
  nextStep?: string
  nextStepId?: NextStepId
}

export type AppDestination =
  | { name: AppTab }
  | { name: 'arrival'; guideStep?: 'closed' | 'body' | 'placement' }
  | { name: 'check-in'; route: Exclude<CheckInRoute, 'quick'> }
  | { name: 'reflection'; view?: ReflectionView; sessionId?: string }
  | { name: 'session'; sessionId: string }
  | { name: 'settings' }
  | { name: 'privacy' }
  | { name: 'support' }
  | { name: 'granularity' }
  | { name: 'chain'; view?: 'entries' }

export interface CheckInCompletion {
  outcome?: 'body-observation'
  route: CheckInRoute
  modelId: string
  selections: BaseEmotion[]
  results: AnalysisResult[]
  crisisTier: CrisisTier
}
