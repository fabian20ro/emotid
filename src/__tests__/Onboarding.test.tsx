import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from '../components/Onboarding'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'

function renderOnboarding(onComplete = vi.fn()) {
  return {
    ...render(<LanguageProvider><Onboarding onComplete={onComplete} /></LanguageProvider>),
    onComplete,
  }
}

let setItemSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(storage.KEYS.language, 'en')
  setItemSpy = vi.spyOn(window.localStorage, 'setItem')
})

afterEach(() => setItemSpy.mockRestore())

describe('Onboarding', () => {
  it('frames the experience as exploration rather than a test', () => {
    renderOnboarding()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText(/not a test/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Introduction progress' })).toHaveAttribute('aria-valuenow', '1')
  })

  it('moves through purpose and local privacy in three steps', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await waitFor(() => expect(screen.getByRole('heading', { name: /not a test/i })).toHaveFocus())
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    const next = screen.getByRole('button', { name: /next/i })
    next.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('heading', { name: /emotions can be explored with curiosity/i })).toHaveFocus())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')

    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('heading', { name: /privacy & data/i })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-step]')).toHaveLength(3)
  })

  it('completes without requiring a model choice', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderOnboarding()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    const finish = screen.getByRole('button', { name: /get started/i })
    expect(finish).toBeEnabled()
    await user.click(finish)

    expect(onComplete).toHaveBeenCalledOnce()
    expect(setItemSpy).toHaveBeenCalledWith(storage.KEYS.onboarded, 'true')
  })

  it('does not expose model names or a skip action', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.queryByText(/Plutchik/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Emotion Wheel/i)).not.toBeInTheDocument()
  })

  it('supports Back without losing the flow', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/not a test/i)).toBeInTheDocument()
  })

  it('can set Romanian before completion', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    const languageGroup = screen.getByRole('group', { name: 'Language' })
    const english = screen.getByRole('button', { name: 'English' })
    const romanian = screen.getByRole('button', { name: 'Română' })
    expect(languageGroup).toContainElement(english)
    expect(english).toHaveAttribute('aria-pressed', 'true')
    expect(romanian).toHaveAttribute('aria-pressed', 'false')

    await user.click(romanian)
    expect(romanian).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /începeți/i })).toBeInTheDocument()
    expect(setItemSpy).toHaveBeenCalledWith(storage.KEYS.language, 'ro')
  })

  it('replays without rewriting first-run state and can be dismissed', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onClose = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    render(
      <LanguageProvider>
        <button type="button">Replay trigger</button>
        <Onboarding mode="replay" onComplete={onComplete} onClose={onClose} />
      </LanguageProvider>,
      { container: host },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: /not a test/i })).toHaveFocus())
    expect(screen.getByRole('dialog').parentElement).toBe(document.body)
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close introduction' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(setItemSpy).not.toHaveBeenCalledWith(storage.KEYS.onboarded, 'true')
    host.remove()
  })
})
