import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrivalScreen, chooseGuidedRoute } from '../screens/ArrivalScreen'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'

function renderArrival(language: 'en' | 'ro' = 'en') {
  storage.set('language', language)
  const onBack = vi.fn()
  const onChoose = vi.fn()
  render(
    <LanguageProvider>
      <ArrivalScreen onBack={onBack} onChoose={onChoose} />
    </LanguageProvider>,
  )
  return { onBack, onChoose }
}

describe('chooseGuidedRoute', () => {
  it.each([
    ['clear', undefined, 'body'],
    ['not-clear', 'can-place', 'affect'],
    ['not-clear', 'need-words', 'words'],
    ['not-clear', undefined, undefined],
    [undefined, 'can-place', undefined],
    [undefined, undefined, undefined],
  ] as const)('maps %s and %s to %s', (bodySignal, placement, expected) => {
    expect(chooseGuidedRoute(bodySignal, placement)).toBe(expected)
  })
})

describe('ArrivalScreen guide', () => {
  beforeEach(() => localStorage.clear())

  it('keeps direct routes unchanged', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Find the words/i }))

    expect(onChoose).toHaveBeenCalledWith('words')
  })

  it('puts guided support first and the placement route before other direct methods', () => {
    renderArrival()
    const routes = screen.getByTestId('arrival-unsure').parentElement
    const routeIds = Array.from(routes?.querySelectorAll('[data-testid]') ?? [])
      .map((element) => element.getAttribute('data-testid'))

    expect(routeIds).toEqual([
      'arrival-unsure',
      'arrival-affect',
      'arrival-words',
      'arrival-body',
    ])
  })

  it('hands a clear body signal directly to Body Compass', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Guide me/i }))
    await user.click(screen.getByRole('button', { name: /Yes, I can point to an area/i }))

    expect(onChoose).toHaveBeenCalledWith('body')
  })

  it('asks one follow-up and hands placement to the Affect Map', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Guide me/i }))
    await user.click(screen.getByRole('button', { name: /Not clearly/i }))
    expect(screen.getByRole('heading', { name: 'Can you roughly place the feeling?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Yes, I can place it/i }))

    expect(onChoose).toHaveBeenCalledWith('affect')
  })

  it('hands the second answer to broad Words', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Guide me/i }))
    await user.click(screen.getByRole('button', { name: /Not clearly/i }))
    await user.click(screen.getByRole('button', { name: /I need broad words first/i }))

    expect(onChoose).toHaveBeenCalledWith('words')
  })

  it('backs up one question and returns to all routes without choosing', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Guide me/i }))
    await user.click(screen.getByRole('button', { name: /Not clearly/i }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: /where you feel something in your body/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all starting points' }))

    expect(screen.getByRole('heading', { name: 'What feels easiest to notice?' })).toBeInTheDocument()
    expect(onChoose).not.toHaveBeenCalled()
  })

  it('uses screen Back to leave the first question without choosing', async () => {
    const user = userEvent.setup()
    const { onChoose, onBack } = renderArrival()

    await user.click(screen.getByRole('button', { name: /Guide me/i }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'What feels easiest to notice?' })).toBeInTheDocument()
    expect(onChoose).not.toHaveBeenCalled()
    expect(onBack).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('supports Romanian copy and keyboard activation', async () => {
    const user = userEvent.setup()
    const { onChoose } = renderArrival('ro')

    await user.click(screen.getByRole('button', { name: /Ghidează-mă/i }))
    const notClear = screen.getByRole('button', { name: /Nu foarte clar/i })
    notClear.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Poți plasa aproximativ starea?' })).toBeInTheDocument()

    const words = screen.getByRole('button', { name: /Am nevoie întâi de termeni generali/i })
    words.focus()
    await user.keyboard(' ')
    expect(onChoose).toHaveBeenCalledWith('words')
  })
})
