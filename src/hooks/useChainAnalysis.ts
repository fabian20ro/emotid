import { useState, useEffect, useCallback } from 'react'
import {
  getAllChainAnalyses,
  saveChainAnalysis,
  clearAllChainAnalyses,
  deleteChainAnalysis,
} from '../data/chain-analysis-repo'
import type { ChainAnalysisEntry } from '../data/types'

export function useChainAnalysis() {
  const [entries, setEntries] = useState<ChainAnalysisEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAllChainAnalyses()
      .then((loaded) => {
        setEntries(loaded)
        setError(false)
      })
      .catch((loadError) => {
        console.warn('Failed to load journal exercises:', loadError)
        setEntries([])
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (entry: ChainAnalysisEntry) => {
    await saveChainAnalysis(entry)
    setEntries((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)])
  }, [])

  const clearAll = useCallback(async () => {
    await clearAllChainAnalyses()
    setEntries([])
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteChainAnalysis(id)
    setEntries((previous) => previous.filter((entry) => entry.id !== id))
  }, [])

  return {
    entries,
    loading,
    error,
    save,
    clearAll,
    remove,
  }
}
