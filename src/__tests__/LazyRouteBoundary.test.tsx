import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { RouteLoading } from '../components/LazyRouteBoundary'

describe('RouteLoading', () => {
  afterEach(() => vi.useRealTimers())

  it('avoids a fast visual/live-region flash and announces a genuinely slow load', () => {
    vi.useFakeTimers()
    render(
      <LanguageProvider>
        <RouteLoading />
      </LanguageProvider>,
    )

    const loading = screen.getByTestId('route-loading')
    expect(loading).toHaveClass('is-pending')
    expect(loading).not.toHaveAttribute('role')

    act(() => vi.advanceTimersByTime(180))

    expect(loading).not.toHaveClass('is-pending')
    expect(loading).toHaveAttribute('role', 'status')
    expect(loading).toHaveAttribute('aria-live', 'polite')
  })
})
