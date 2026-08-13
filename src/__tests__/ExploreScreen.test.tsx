import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'
import { ExploreScreen } from '../screens/ExploreScreen'

function renderExplore(language: 'en' | 'ro' = 'en') {
  storage.set('language', language)
  const onChoose = vi.fn()
  const onPractice = vi.fn()
  render(
    <LanguageProvider>
      <ExploreScreen onChoose={onChoose} onPractice={onPractice} />
    </LanguageProvider>,
  )
  return { onChoose, onPractice }
}

describe('ExploreScreen information architecture', () => {
  beforeEach(() => localStorage.clear())

  it('separates ways to notice and name from learning activities', () => {
    renderExplore()

    const naming = screen.getByRole('region', { name: 'Notice and name' })
    expect(within(naming).getByTestId('explore-affect')).toBeVisible()
    expect(within(naming).getByTestId('explore-words')).toBeVisible()
    expect(within(naming).getByTestId('explore-body')).toBeVisible()
    expect(within(naming).queryByTestId('explore-plutchik')).not.toBeInTheDocument()

    const learning = screen.getByRole('region', { name: 'Compare and learn' })
    expect(within(learning).getByTestId('explore-plutchik')).toBeVisible()
    expect(within(learning).getByTestId('explore-practice')).toBeVisible()
  })

  it('preserves every route callback', async () => {
    const user = userEvent.setup()
    const { onChoose, onPractice } = renderExplore()

    for (const route of ['affect', 'words', 'body', 'plutchik'] as const) {
      await user.click(screen.getByTestId(`explore-${route}`))
      expect(onChoose).toHaveBeenLastCalledWith(route)
    }
    await user.click(screen.getByTestId('explore-practice'))
    expect(onPractice).toHaveBeenCalledOnce()
  })

  it('localizes both group names in Romanian', () => {
    renderExplore('ro')

    expect(screen.getByRole('region', { name: 'Observați și numiți' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Comparați și explorați' })).toBeVisible()
  })
})
