import type { ChainAnalysisEntry, ChainReflectionEntry } from './types'

function isCurrentEntry(entry: ChainAnalysisEntry): entry is ChainReflectionEntry {
  return 'version' in entry && entry.version === 2
}

export function getChainEntryPreview(entry: ChainAnalysisEntry): { title: string; detail: string } {
  if (isCurrentEntry(entry)) {
    return {
      title: entry.situation,
      detail: entry.outcome || entry.response || entry.noticed,
    }
  }
  return { title: entry.emotion, detail: entry.consequence }
}

export function getLatestChainEntry(entries: ChainAnalysisEntry[]): ChainAnalysisEntry | undefined {
  return entries.reduce<ChainAnalysisEntry | undefined>(
    (latest, entry) => !latest || entry.timestamp > latest.timestamp ? entry : latest,
    undefined,
  )
}
