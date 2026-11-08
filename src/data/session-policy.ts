import type { Session } from './types'
import type { AnalysisResult } from '../models/types'

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

export function isSessionEligibleForPatterns(session: Session): boolean {
  const relationship = getResultRelationship(session)
  if (relationship === 'rejected' || relationship === 'observation') return false
  if (session.selectedResultIds !== undefined) return session.selectedResultIds.length > 0
  return relationship === 'named' || relationship === 'fit' || relationship === 'legacy'
}
