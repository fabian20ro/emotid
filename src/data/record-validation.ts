import type { AnalysisResult } from '../models/types'
import type { ChainAnalysisEntry, SerializedSelection, Session } from './types'
import { SENSATION_TYPES } from '../models/somatic/types'

type UnknownRecord = Record<string, unknown>

export class StoredDataValidationError extends Error {
  constructor(recordType: 'session' | 'journal exercise', index: number) {
    super(`Invalid persisted ${recordType} at index ${index}.`)
    this.name = 'StoredDataValidationError'
  }
}

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null
const isString = (value: unknown): value is string => typeof value === 'string'
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isOptionalString = (value: unknown) => value === undefined || isString(value)
const isOptionalFiniteNumber = (value: unknown) => value === undefined || isFiniteNumber(value)
const isLabel = (value: unknown) => isRecord(value) && isString(value.en) && isString(value.ro)
const isOptionalLabel = (value: unknown) => value === undefined || isLabel(value)
const isOptionalLabelList = (value: unknown) => value === undefined || (Array.isArray(value) && value.every(isLabel))

function isSelection(value: unknown): value is SerializedSelection {
  return isRecord(value) && isString(value.emotionId) && isLabel(value.label)
    && (value.extras === undefined || isRecord(value.extras))
}

function isResult(value: unknown): value is AnalysisResult {
  return isRecord(value) && isString(value.id) && isLabel(value.label) && isString(value.color)
    && isOptionalLabel(value.description)
    && isOptionalLabel(value.needs)
    && isOptionalLabel(value.matchStrength)
    && isOptionalLabelList(value.componentLabels)
    && isOptionalLabelList(value.hierarchyPath)
    && isOptionalFiniteNumber(value.valence)
    && isOptionalFiniteNumber(value.arousal)
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false
  const results = value.results
  const crisisTiers = ['none', 'tier1', 'tier2', 'tier3', 'tier4']
  const reflectionAnswers = [undefined, 'yes', 'partly', 'no']
  const interventionResponses = [undefined, 'better', 'same', 'worse']
  const entryRoutes = [undefined, 'quick', 'body', 'affect', 'words', 'plutchik']
  return isString(value.id)
    && isFiniteNumber(value.timestamp)
    && isString(value.modelId)
    && Array.isArray(value.selections) && value.selections.every(isSelection)
    && Array.isArray(results) && results.every(isResult)
    && crisisTiers.includes(String(value.crisisTier))
    && reflectionAnswers.includes(value.reflectionAnswer as undefined | string)
    && interventionResponses.includes(value.interventionResponse as undefined | string)
    && entryRoutes.includes(value.entryRoute as undefined | string)
    && isOptionalString(value.selectedNeed)
    && isOptionalString(value.nextStep)
    && (value.selectedResultIds === undefined || (
      Array.isArray(value.selectedResultIds)
      && new Set(value.selectedResultIds).size === value.selectedResultIds.length
      && value.selectedResultIds.every((id) => isString(id) && results.some((result: AnalysisResult) => result.id === id))
    ))
    && (value.outcome === undefined || (
      value.outcome === 'body-observation' && value.entryRoute === 'body'
      && value.modelId === 'somatic'
      && value.crisisTier === 'none' && value.reflectionAnswer === undefined
      && value.selectedNeed === undefined && value.nextStep === undefined
      && results.length === 0 && value.selections.length > 0
      && value.selections.every((selection) => SENSATION_TYPES.some((type) => type === selection.extras?.sensationType)
        && typeof selection.extras?.intensity === 'number' && [1, 2, 3].includes(selection.extras.intensity))
    ))
}

function isChainEntry(value: unknown): value is ChainAnalysisEntry {
  if (!isRecord(value) || !isString(value.id) || typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) return false
  if (value.version === 2) {
    return ['situation', 'noticed', 'response', 'outcome'].every((key) => isString(value[key]))
  }
  return ['triggeringEvent', 'vulnerabilityFactors', 'promptingEvent', 'emotion', 'urge', 'action', 'consequence']
    .every((key) => isString(value[key]))
}

function decodeRecords<T>(values: unknown[], type: 'session' | 'journal exercise', guard: (value: unknown) => value is T): T[] {
  return values.map((value, index) => {
    if (!guard(value)) throw new StoredDataValidationError(type, index)
    return value
  })
}

export const decodeSessions = (values: unknown[]): Session[] => decodeRecords(values, 'session', isSession)
export const decodeChainEntries = (values: unknown[]): ChainAnalysisEntry[] => decodeRecords(values, 'journal exercise', isChainEntry)
