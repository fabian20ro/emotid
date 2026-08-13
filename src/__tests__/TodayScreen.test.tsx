import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'
import { TodayScreen } from '../screens/TodayScreen'

function renderToday(language: 'en' | 'ro' = 'en', sessions: React.ComponentProps<typeof TodayScreen>['sessions'] = []) {
  storage.set('language', language)
  const onPlaceFeeling = vi.fn()
  const onHelpChoose = vi.fn()
  const onQuickComplete = vi.fn()
  render(
    <LanguageProvider>
      <TodayScreen
        sessions={sessions}
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

  it('reveals the commitment action after selection without moving focus or submitting', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoView

    try {
      const { onQuickComplete } = renderToday()
      const anxiety = screen.getByTestId('quick-feeling-anxiety')

      await user.click(anxiety)

      const commitment = screen.getByRole('button', { name: 'Continue with anxiety' })
      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
      })
      expect(anxiety).toHaveFocus()
      expect(commitment).not.toHaveFocus()
      expect(onQuickComplete).not.toHaveBeenCalled()
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView
    }
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

  it('keeps a rejected recent result visibly framed as a suggestion', () => {
    renderToday('en', [{
      id: 'rejected',
      timestamp: 1,
      modelId: 'quick-check-in',
      entryRoute: 'quick',
      selections: [],
      results: [{ id: 'anxiety', label: { en: 'anxiety', ro: 'anxietate' }, color: '#000' }],
      crisisTier: 'none',
      reflectionAnswer: 'no',
    }])

    const recent = document.querySelector('.recent-thread')!
    expect(within(recent).getByText('Suggested result: anxiety')).toBeInTheDocument()
    expect(within(recent).queryByText('anxiety', { exact: true })).not.toBeInTheDocument()
  })
})
