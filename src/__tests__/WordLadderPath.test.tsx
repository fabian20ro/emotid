import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { wheelModel } from '../models/wheel'
import { WordLadderScreen } from '../screens/WordLadderScreen'

describe('Word Ladder path provenance', () => {
  it('commits the branch the user actually traversed for a multi-parent leaf', () => {
    const onComplete = vi.fn()
    render(
      <LanguageProvider>
        <WordLadderScreen model={wheelModel} onBack={vi.fn()} onComplete={onComplete} />
      </LanguageProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Explore more specific words under Sad' }))
    fireEvent.click(screen.getByRole('button', { name: 'Explore more specific words under Vulnerable' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select Helpless' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Helpless' }))

    const results = onComplete.mock.calls[0][2]
    expect(results[0].hierarchyPath.map((item: { en: string }) => item.en))
      .toEqual(['Sad', 'Vulnerable', 'Helpless'])
  })
})
