import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { WordLadderScreen } from '../screens/WordLadderScreen'
import type { AnalysisResult, BaseEmotion } from '../models/types'
import { wheelModel } from '../models/wheel'

function renderScreen() {
  const onBack = vi.fn()
  const onComplete = vi.fn<(modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void>()
  render(
    <LanguageProvider>
      <WordLadderScreen model={wheelModel} onBack={onBack} onComplete={onComplete} />
    </LanguageProvider>,
  )
  return { onBack, onComplete }
}

describe('WordLadderScreen', () => {
  it('keeps an earlier selected word when finishing at another intermediate word', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Choose Happy as the answer' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Sad' }))
    await user.click(screen.getByRole('button', { name: 'Continue with Sad' }))
    expect(onComplete.mock.calls[0][1].map((emotion) => emotion.id)).toEqual(['happy', 'sad'])
  })
  beforeEach(() => window.localStorage.clear())

  it('starts at broad words without showing a premature completion action', () => {
    renderScreen()

    expect(screen.getByTestId('words-screen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explore more specific words under Happy' })).toBeInTheDocument()
    expect(screen.queryByText(/broad pleasant state/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use my current choice' })).not.toBeInTheDocument()
  })

  it('returns exactly one hierarchy level at a time', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    expect(screen.getByRole('button', { name: 'Choose Happy as the answer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose Playful as the answer' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back one level' }))
    expect(screen.getByRole('button', { name: 'Choose Happy as the answer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Choose Playful as the answer' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explore more specific words under Playful' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back one level' }))
    expect(screen.queryByRole('button', { name: 'Back one level' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explore more specific words under Happy' })).toBeInTheDocument()
  })

  it('selects any path level and completes through the wheel analyzer', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    await user.click(screen.getByRole('button', { name: 'Choose Happy as the answer' }))

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

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))

    expect(screen.getByRole('button', { name: 'Choose Playful as the answer' })).toHaveTextContent('Playful')
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

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    await user.click(screen.getByRole('button', { name: 'Select Energized' }))

    const selected = screen.getByRole('region', { name: 'Selected words' })
    await user.click(within(selected).getByRole('button', { name: /energized/i }))
    expect(screen.queryByRole('region', { name: 'Selected words' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compare nearby words' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use my current choice' })).not.toBeInTheDocument()
  })

  it('distinguishes expandable branches from addable leaves before selection', async () => {
    const user = userEvent.setup()
    renderScreen()

    expect(screen.getByRole('button', { name: 'Explore more specific words under Happy' }).querySelector('.lucide-chevron-right')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))

    const leaf = screen.getByRole('button', { name: 'Select Energized' })
    expect(leaf.querySelector('.lucide-plus')).toBeInTheDocument()
    expect(leaf.querySelector('.lucide-check')).not.toBeInTheDocument()
  })

  it('compares a broad selection with a user-chosen word from the same level', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    await user.click(screen.getByRole('button', { name: 'Choose Happy as the answer' }))
    await user.click(screen.getByRole('button', { name: 'Compare nearby words' }))

    expect(screen.queryByRole('button', { name: 'Compare with Happy' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Compare with Sad' }))

    const comparison = screen.getByRole('group', { name: 'Happy and Sad' })
    expect(within(comparison).getByRole('heading', { name: 'Happy' })).toBeInTheDocument()
    expect(within(comparison).getByRole('heading', { name: 'Sad' })).toBeInTheDocument()
    expect(within(comparison).getAllByText(/\S+/).length).toBeGreaterThan(2)
    expect(screen.getByText('Notice which description, if either, feels closer.')).toBeInTheDocument()
  })

  it('compares a reviewed intermediary with a sibling from the same root family', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    await user.click(screen.getByRole('button', { name: 'Choose Playful as the answer' }))
    await user.click(screen.getByRole('button', { name: 'Compare nearby words' }))

    expect(screen.queryByRole('button', { name: 'Compare with Sad' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Compare with Content' }))
    expect(screen.getByRole('group', { name: 'Playful and Content' })).toBeInTheDocument()
  })

  it('does not offer comparison for a sibling group without complete reviewed descriptions', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Happy' }))
    await user.click(screen.getByRole('button', { name: 'Explore more specific words under Playful' }))
    await user.click(screen.getByRole('button', { name: 'Select Energized' }))
    expect(screen.queryByRole('button', { name: 'Compare nearby words' })).not.toBeInTheDocument()
  })

  it('localizes hierarchy controls in Romanian', async () => {
    window.localStorage.setItem('emot-id-language', 'ro')
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Explorează cuvinte mai precise sub Fericit' }))
    expect(screen.getByRole('button', { name: 'Alege Fericit ca răspuns' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Înapoi cu un nivel' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alege Fericit ca răspuns' }))
    await user.click(screen.getByRole('button', { name: 'Compară cuvinte apropiate' }))
    await user.click(screen.getByRole('button', { name: 'Compară cu Trist' }))
    expect(screen.getByRole('group', { name: 'Fericit și Trist' })).toBeInTheDocument()
    expect(screen.getByText('Observă care descriere, dacă vreuna, pare mai apropiată.')).toBeInTheDocument()
  })
})
