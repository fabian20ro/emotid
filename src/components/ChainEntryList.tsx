import { memo } from 'react'
import type { Language } from '../context/language-bootstrap'
import { getChainEntryPreview } from '../data/chain-presentation'
import type { ChainAnalysisEntry } from '../data/types'

interface ChainEntryListProps {
  entries: ChainAnalysisEntry[]
  onSelect: (id: string) => void
  language: Language
}

export const ChainEntryList = memo(function ChainEntryList({ entries, onSelect, language }: ChainEntryListProps) {
  const format = new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return <div className="guided-recent-list">
    {entries.map((entry) => {
      const preview = getChainEntryPreview(entry)
      return <button type="button" key={entry.id} onClick={() => onSelect(entry.id)}>
        <small>{format.format(entry.timestamp)}</small>
        <strong>{preview.title}</strong>
        {preview.detail && <span>{preview.detail}</span>}
      </button>
    })}
  </div>
})
