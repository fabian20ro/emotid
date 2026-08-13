import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PlutchikWheel } from '../components/PlutchikWheel'
import { LanguageProvider } from '../context/LanguageContext'
import { plutchikModel } from '../models/plutchik'

const primaryEmotions = Array.from(plutchikModel.initialState.visibleEmotionIds.keys()).map(
  (id) => plutchikModel.allEmotions[id],
)
const sizes = new Map(primaryEmotions.map((emotion) => [emotion.id, 'medium' as const]))

function renderWheel(selections = primaryEmotions.slice(0, 0)) {
  const onSelect = vi.fn()
  const onDeselect = vi.fn()
  render(
    <LanguageProvider>
      <PlutchikWheel
        emotions={primaryEmotions}
        selections={selections}
        sizes={sizes}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    </LanguageProvider>,
  )
  return { onSelect, onDeselect }
}

describe('PlutchikWheel', () => {
  it('renders the eight primary emotions in a stable wheel', () => {
    renderWheel()
    expect(screen.getAllByTestId(/^plutchik-emotion-/)).toHaveLength(8)
    expect(screen.getByRole('group', { name: 'Eight starting emotions from the Plutchik model, arranged as a wheel' })).toBeInTheDocument()
  })

  it('selects an available primary emotion', () => {
    const { onSelect } = renderWheel()
    fireEvent.click(screen.getByTestId('plutchik-emotion-joy'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'joy' }))
  })

  it('keeps selected emotions removable and gates a third choice', () => {
    const { onDeselect } = renderWheel([plutchikModel.allEmotions.joy, plutchikModel.allEmotions.trust])
    expect(screen.getByTestId('plutchik-emotion-anger')).toBeDisabled()
    expect(screen.getByTestId('plutchik-emotion-joy')).not.toBeDisabled()
    fireEvent.click(screen.getByTestId('plutchik-emotion-joy'))
    expect(onDeselect).toHaveBeenCalledWith(expect.objectContaining({ id: 'joy' }))
  })
})
