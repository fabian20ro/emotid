import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'
import { TodayScreen } from '../screens/TodayScreen'

function renderToday(language: 'en' | 'ro' = 'en') {
  storage.set('language', language)
  const onPlaceFeeling = vi.fn()
  const onHelpChoose = vi.fn()
  const onQuickComplete = vi.fn()
  render(
    <LanguageProvider>
      <TodayScreen
        sessions={[]}
        saveSessions
        onPlaceFeeling={onPlaceFeeling}
        onHelpChoose={onHelpChoose}
        onQuickComplete={onQuickComplete}
        onOpenJournal={vi.fn()}
      />
    </LanguageProvider>,
  )
  return { onPlaceFeeling, onHelpChoose, onQuickComplete }
}

describe('TodayScreen quick commitment', () => {
  beforeEach(() => localStorage.clear())

  it('selects first and commits only through the explicit continue action', async () => {
    const user = userEvent.setup()
    const { onQuickComplete } = renderToday()
    const anxiety = screen.getByTestId('quick-feeling-anxiety')

    await user.click(anxiety)
    expect(anxiety).toHaveAttribute('aria-pressed', 'true')
    expect(onQuickComplete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Continue with anxiety' }))
    expect(onQuickComplete).toHaveBeenCalledOnce()
    expect(onQuickComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'anxiety' }),
      expect.objectContaining({ id: 'anxiety' }),
    )
  })

  it('allows correction before commitment and normalizes visible casing', async () => {
    const user = userEvent.setup()
    renderToday()

    expect(screen.getByTestId('quick-feeling-numb')).toHaveTextContent('numb')
    await user.click(screen.getByTestId('quick-feeling-anxiety'))
    await user.click(screen.getByTestId('quick-feeling-joy'))

    expect(screen.getByTestId('quick-feeling-anxiety')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('quick-feeling-joy')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Continue with joy' })).toBeVisible()
  })

  it('provides the same explicit commitment in Romanian', async () => {
    const user = userEvent.setup()
    renderToday('ro')

    await user.click(screen.getByTestId('quick-feeling-anxiety'))
    expect(screen.getByRole('button', { name: 'Continuați cu anxietate' })).toBeVisible()
  })

  it('starts placement directly and keeps route guidance separate', async () => {
    const user = userEvent.setup()
    const { onPlaceFeeling, onHelpChoose } = renderToday()

    const place = screen.getByRole('button', { name: 'Place the feeling' })
    const help = screen.getByRole('button', { name: 'Help me choose' })
    expect(place.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(place)
    expect(onPlaceFeeling).toHaveBeenCalledOnce()
    expect(onHelpChoose).not.toHaveBeenCalled()

    await user.click(help)
    expect(onHelpChoose).toHaveBeenCalledOnce()
  })

  it('exposes the direct and guided actions in Romanian', () => {
    renderToday('ro')

    expect(screen.getByRole('button', { name: 'Plasați starea' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ajutați-mă să aleg' })).toBeVisible()
  })
})
