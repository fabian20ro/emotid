import type { AnalysisResult, BaseEmotion } from '../models/types'
import type { CrisisTier } from '../models/distress'

export type AppTab = 'today' | 'explore' | 'journal'
export type CheckInRoute = 'quick' | 'body' | 'affect' | 'words' | 'plutchik'
export type ReflectionAnswer = 'yes' | 'partly' | 'no'
export type ReflectionSaveOutcome = 'saved' | 'not-saved'
export type SessionSaveState = 'saving' | 'saved' | 'error' | 'disabled'

export interface ReflectionDetail {
  selectedResultIds?: string[]
  reflectionAnswer?: ReflectionAnswer
  selectedNeed?: string
  nextStep?: string
}

export type AppDestination =
  | { name: AppTab }
  | { name: 'arrival'; guideStep?: 'closed' | 'body' | 'placement' }
  | { name: 'check-in'; route: Exclude<CheckInRoute, 'quick'> }
  | { name: 'reflection' }
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
