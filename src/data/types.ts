import type { AnalysisResult } from '../models/types'
import type { CrisisTier } from '../models/distress'
import type { NeedOptionId } from '../models/catalog/guidance/need-options'
import type { NextStepId } from './reflection-choices'

export interface SerializedSelection {
  emotionId: string
  label: { ro: string; en: string }
  extras?: Record<string, unknown>
}

export interface Session {
  id: string
  timestamp: number
  modelId: string
  selections: SerializedSelection[]
  results: AnalysisResult[]
  crisisTier: CrisisTier
  reflectionAnswer?: 'yes' | 'partly' | 'no'
  interventionResponse?: 'better' | 'same' | 'worse'
  entryRoute?: 'quick' | 'body' | 'affect' | 'words' | 'plutchik'
  outcome?: 'body-observation'
  selectedResultIds?: string[]
  selectedNeed?: string
  selectedNeedId?: NeedOptionId
  nextStep?: string
  nextStepId?: NextStepId
}

export interface LegacyChainAnalysisEntry {
  id: string
  timestamp: number
  triggeringEvent: string
  vulnerabilityFactors: string
  promptingEvent: string
  emotion: string
  urge: string
  action: string
  consequence: string
}

export interface ChainReflectionEntry {
  id: string
  timestamp: number
  version: 2
  situation: string
  noticed: string
  response: string
  outcome: string
}

export type ChainAnalysisEntry = LegacyChainAnalysisEntry | ChainReflectionEntry
