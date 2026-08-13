import { storage, type PreferenceSnapshot } from './storage'
import { getAllChainAnalyses } from './chain-analysis-repo'
import { getAllSessions } from './session-repo'
import type { ChainAnalysisEntry, Session } from './types'

export interface UserDataExport {
  schemaVersion: 3
  exportedAt: string
  sessions: Session[]
  chainEntries: ChainAnalysisEntry[]
  preferences: PreferenceSnapshot
}

export function buildUserDataExport(
  sessions: Session[],
  chainEntries: ChainAnalysisEntry[],
  preferences: PreferenceSnapshot = storage.getPreferenceSnapshot(),
  exportedAt = new Date().toISOString(),
): UserDataExport {
  return {
    schemaVersion: 3,
    exportedAt,
    sessions,
    chainEntries,
    preferences,
  }
}

export function exportUserDataJSON(
  sessions: Session[],
  chainEntries: ChainAnalysisEntry[],
  preferences?: PreferenceSnapshot,
): string {
  return JSON.stringify(buildUserDataExport(sessions, chainEntries, preferences), null, 2)
}

export async function exportStoredUserDataJSON(): Promise<string> {
  const [sessions, chainEntries] = await Promise.all([
    getAllSessions(),
    getAllChainAnalyses(),
  ])
  return exportUserDataJSON(sessions, chainEntries)
}
