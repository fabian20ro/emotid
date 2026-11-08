import type { Session } from './types'
import { getCanonicalEmotion } from '../models/catalog'
import type { AnalysisResult } from '../models/types'
import { getResultRelationship, getSessionResults } from './session-policy'

export type DisplayLanguage = 'ro' | 'en'

export function getEmotionDisplayLabel(
  emotion: Pick<AnalysisResult, 'id' | 'label'>,
  language: DisplayLanguage,
): string {
  return getCanonicalEmotion(emotion.id)?.label[language] ?? emotion.label[language]
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
