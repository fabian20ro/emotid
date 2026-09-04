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

export type ResultRelationship = 'named' | 'suggested' | 'fit' | 'partial' | 'rejected' | 'legacy' | 'observation'

export function getResultRelationship(session: Session): ResultRelationship {
  if (session.outcome === 'body-observation') return 'observation'
  if (session.selectedResultIds?.length === 0) return 'rejected'
  if (session.reflectionAnswer === 'yes') return 'fit'
  if (session.reflectionAnswer === 'partly') return 'partial'
  if (session.reflectionAnswer === 'no') return 'rejected'
  if (session.entryRoute === 'quick' || session.entryRoute === 'words') return 'named'
  if (session.entryRoute) return 'suggested'
  return 'legacy'
}

export function getSessionResults(session: Session): AnalysisResult[] {
  return session.selectedResultIds === undefined ? session.results
    : session.results.filter((result) => session.selectedResultIds!.includes(result.id))
}

export function getSessionResultHeading(
  session: Session,
  language: DisplayLanguage,
  rejectedTemplate: string,
): string {
  if (session.outcome === 'body-observation') return session.selections.map((item) => item.label[language]).join(', ')
  const result = (session.selectedResultIds?.length === 0 ? session.results : getSessionResults(session))
    .slice(0, 3)
    .map((item) => getEmotionDisplayLabel(item, language))
    .join(', ')
  return getResultRelationship(session) === 'rejected'
    ? rejectedTemplate.replace('{result}', result)
    : result
}

export function isSessionEligibleForPatterns(session: Session): boolean {
  const relationship = getResultRelationship(session)
  if (relationship === 'rejected' || relationship === 'observation') return false
  if (session.selectedResultIds !== undefined) return session.selectedResultIds.length > 0
  return relationship === 'named' || relationship === 'fit' || relationship === 'legacy'
}
