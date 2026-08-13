import type { AnalysisResult } from '../models/types'
import type { CrisisTier } from '../models/distress'

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
  selectedNeed?: string
  nextStep?: string
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
