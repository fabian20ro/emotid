import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { storage } from '../data/storage'
import { LanguageProvider } from '../context/LanguageContext'
import App from '../App'

const history = vi.hoisted(() => ({ loading: false, error: false }))
vi.mock('../hooks/useSessionHistory', () => ({ useSessionHistory: () => ({
  sessions: [], ...history, save: vi.fn(), remove: vi.fn(), clearAll: vi.fn(),
}) }))
vi.mock('../hooks/useChainAnalysis', () => ({ useChainAnalysis: () => ({
  entries: [], loading: false, error: false, save: vi.fn(), remove: vi.fn(), clearAll: vi.fn(),
}) }))
afterEach(cleanup)

it.each(['en', 'ro'] as const)('distinguishes pending, failed and empty history in %s without blocking Quick', (language) => {
  storage.set('onboarded', 'true')
  storage.set('language', language)
  HTMLElement.prototype.scrollTo = vi.fn()
  history.loading = true
  history.error = false
  const view = render(<LanguageProvider><App /></LanguageProvider>)
  expect(document.querySelector('.recent-thread [role="status"]')).toHaveTextContent(language === 'ro' ? 'Se încarcă' : 'Loading')
  fireEvent.click(screen.getByTestId('quick-feeling-joy'))
  expect(screen.getByTestId('quick-continue')).toBeEnabled()
  history.loading = false
  history.error = true
  view.rerender(<LanguageProvider><App /></LanguageProvider>)
  expect(document.querySelector('.recent-thread')).toHaveTextContent(language === 'ro' ? 'nu înseamnă că au fost șterse' : 'does not mean they were deleted')
  history.error = false
  view.rerender(<LanguageProvider><App /></LanguageProvider>)
  expect(document.querySelector('.recent-thread')).toHaveTextContent(language === 'ro' ? 'Reflecțiile pot rămâne aici' : 'Your reflections can stay here')
})
