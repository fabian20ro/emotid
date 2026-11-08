import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChainEntryList } from '../components/ChainEntryList'
import type { ChainReflectionEntry } from '../data/types'

const entry: ChainReflectionEntry = { id: 'first', timestamp: Date.UTC(2026, 10, 8, 12), version: 2,
  situation: 'Saved moment', noticed: 'Observation', response: '', outcome: '' }

describe('saved reflection list', () => {
  it('refreshes records and selection callbacks without retaining deleted rows', async () => {
    const firstSelect = vi.fn()
    const nextSelect = vi.fn()
    const view = render(<ChainEntryList entries={[entry]} language="en" onSelect={firstSelect} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Saved moment/ }))
    expect(firstSelect).toHaveBeenCalledWith('first')
    view.rerender(<ChainEntryList entries={[{ ...entry, id: 'second', situation: 'New moment', outcome: 'Changed outcome' }]} language="en" onSelect={nextSelect} />)
    expect(screen.queryByRole('button', { name: /Saved moment/ })).not.toBeInTheDocument()
    const updated = screen.getByRole('button', { name: /New moment/ })
    expect(updated).toHaveTextContent('Changed outcome')
    await userEvent.setup().click(updated)
    expect(nextSelect).toHaveBeenCalledWith('second')
    expect(firstSelect).toHaveBeenCalledTimes(1)
  })

  it('reformats the same entries when language changes', () => {
    const entries = [entry]
    const onSelect = vi.fn()
    const view = render(<ChainEntryList entries={entries} language="en" onSelect={onSelect} />)
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } as const
    expect(view.container.querySelector('small')).toHaveTextContent(new Date(entry.timestamp).toLocaleString('en-US', options))
    view.rerender(<ChainEntryList entries={entries} language="ro" onSelect={onSelect} />)
    expect(view.container.querySelector('small')).toHaveTextContent(new Date(entry.timestamp).toLocaleString('ro-RO', options))
  })
})
