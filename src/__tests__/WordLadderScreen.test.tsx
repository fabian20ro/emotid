import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { WordLadderScreen } from '../screens/WordLadderScreen'
import type { AnalysisResult, BaseEmotion } from '../models/types'

function renderScreen() {
  const onBack = vi.fn()
  const onComplete = vi.fn<(modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void>()
  render(
    <LanguageProvider>
      <WordLadderScreen onBack={onBack} onComplete={onComplete} />
    </LanguageProvider>,
  )
  return { onBack, onComplete }
}

describe('WordLadderScreen', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts at broad words without showing a premature completion action', () => {
    renderScreen()

    expect(screen.getByTestId('words-screen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Happy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use my current choice' })).not.toBeInTheDocument()
  })

  it('returns exactly one hierarchy level at a time', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))
    expect(screen.getByRole('button', { name: 'Add Happy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Playful' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back one level' }))
    expect(screen.getByRole('button', { name: 'Add Happy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add Playful' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Playful' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back one level' }))
    expect(screen.queryByRole('button', { name: 'Back one level' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Happy' })).toBeInTheDocument()
  })

  it('selects any path level and completes through the wheel analyzer', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))
    await user.click(screen.getByRole('button', { name: 'Add Happy' }))

    const selected = screen.getByRole('region', { name: 'Selected words' })
    expect(within(selected).getByRole('button', { name: /happy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compare nearby words' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Continue with Happy' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0]).toBe('wheel')
    expect(onComplete.mock.calls[0][1].map((emotion) => emotion.id)).toEqual(['happy'])
    expect(onComplete.mock.calls[0][2].map((result) => result.id)).toEqual(['happy'])
  })

  it('explains that an intermediary word can finish the check-in in one action', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))

    expect(screen.getByText('Any word in this path can be your answer.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Playful' })).toHaveTextContent('Add Playful')
    expect(screen.getByText('This word can be your answer')).toBeInTheDocument()
    expect(screen.getByText('Or choose a more specific word below.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'This word can be your answer: Playful' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Playful' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Continue with Playful' })).toHaveAccessibleDescription('Or choose a more specific word below.')
    await user.click(screen.getByRole('button', { name: 'Continue with Playful' }))

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete.mock.calls[0][1].map((emotion) => emotion.id)).toEqual(['playful'])
  })

  it('selects a precise leaf and allows removing it', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))
    await user.click(screen.getByRole('button', { name: 'Energized' }))

    const selected = screen.getByRole('region', { name: 'Selected words' })
    await user.click(within(selected).getByRole('button', { name: /energized/i }))
    expect(screen.queryByRole('region', { name: 'Selected words' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compare nearby words' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use my current choice' })).not.toBeInTheDocument()
  })

  it('compares a broad selection with a user-chosen word from the same level', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))
    await user.click(screen.getByRole('button', { name: 'Add Happy' }))
    await user.click(screen.getByRole('button', { name: 'Compare nearby words' }))

    expect(screen.queryByRole('button', { name: 'Compare with Happy' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Compare with Sad' }))

    const comparison = screen.getByRole('group', { name: 'Happy and Sad' })
    expect(within(comparison).getByRole('heading', { name: 'Happy' })).toBeInTheDocument()
    expect(within(comparison).getByRole('heading', { name: 'Sad' })).toBeInTheDocument()
    expect(within(comparison).getAllByText(/\S+/).length).toBeGreaterThan(2)
    expect(screen.getByText('Notice which description, if either, feels closer.')).toBeInTheDocument()
  })

  it('compares a precise leaf only with its visible siblings', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Happy' }))
    await user.click(screen.getByRole('button', { name: 'Playful' }))
    await user.click(screen.getByRole('button', { name: 'Energized' }))
    await user.click(screen.getByRole('button', { name: 'Compare nearby words' }))

    expect(screen.getByRole('button', { name: 'Compare with Cheeky' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compare with Sad' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Compare with Cheeky' }))
    expect(screen.getByRole('group', { name: 'Energized and Cheeky' })).toBeInTheDocument()
  })

  it('localizes hierarchy controls in Romanian', async () => {
    window.localStorage.setItem('emot-id-language', 'ro')
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Fericit' }))
    expect(screen.getByRole('button', { name: /adăugați fericit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Înapoi cu un nivel' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adăugați Fericit' }))
    await user.click(screen.getByRole('button', { name: 'Comparați cuvinte apropiate' }))
    await user.click(screen.getByRole('button', { name: 'Comparați cu Trist' }))
    expect(screen.getByRole('group', { name: 'Fericit și Trist' })).toBeInTheDocument()
    expect(screen.getByText('Observați care descriere, dacă vreuna, pare mai apropiată.')).toBeInTheDocument()
  })
})
