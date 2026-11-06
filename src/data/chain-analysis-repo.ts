import { createGuardedStore } from './guarded-store'
import type { ChainAnalysisEntry } from './types'
import { decodeChainEntries } from './record-validation'

const store = createGuardedStore('emot-id-chain-analysis', 'entries')

export async function saveChainAnalysis(entry: ChainAnalysisEntry): Promise<void> {
  await store.put(entry.id, entry)
}

export async function getAllChainAnalyses(): Promise<ChainAnalysisEntry[]> {
  const allValues = await store.values()
  const entries = decodeChainEntries(allValues)
  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export async function clearAllChainAnalyses(): Promise<void> {
  await store.clear()
}

export async function deleteChainAnalysis(id: string): Promise<void> {
  await store.delete(id)
}
