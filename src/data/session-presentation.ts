import type { Session } from './types'
import { getCanonicalEmotion } from '../models/catalog'
import type { AnalysisResult } from '../models/types'

export type DisplayLanguage = 'ro' | 'en'

export function getEmotionDisplayLabel(
  emotion: Pick<AnalysisResult, 'id' | 'label'>,
  language: DisplayLanguage,
): string {
  return getCanonicalEmotion(emotion.id)?.label[language] ?? emotion.label[language]
}

export type ResultRelationship = 'named' | 'suggested' | 'fit' | 'partial' | 'rejected' | 'legacy'

export function getResultRelationship(session: Session): ResultRelationship {
  if (session.reflectionAnswer === 'yes') return 'fit'
  if (session.reflectionAnswer === 'partly') return 'partial'
  if (session.reflectionAnswer === 'no') return 'rejected'
  if (session.entryRoute === 'quick' || session.entryRoute === 'words') return 'named'
  if (session.entryRoute) return 'suggested'
  return 'legacy'
}

export function isSessionEligibleForPatterns(session: Session): boolean {
  const relationship = getResultRelationship(session)
  return relationship === 'named' || relationship === 'fit' || relationship === 'legacy'
}
