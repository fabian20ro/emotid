import { createStore, set, del, keys, values } from 'idb-keyval'
import type { ChainAnalysisEntry } from './types'
import { decodeChainEntries } from './record-validation'

const store = createStore('emot-id-chain-analysis', 'entries')

export async function saveChainAnalysis(entry: ChainAnalysisEntry): Promise<void> {
  await set(entry.id, entry, store)
}

export async function getAllChainAnalyses(): Promise<ChainAnalysisEntry[]> {
  const allValues = await values<unknown>(store)
  const entries = decodeChainEntries(allValues)
  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export async function clearAllChainAnalyses(): Promise<void> {
  const allKeys = await keys(store)
  for (const key of allKeys) {
    await del(key, store)
  }
}
