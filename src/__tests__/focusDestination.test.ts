import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusDestination } from '../utils/focusDestination'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('focusDestination', () => {
  it('focuses without scrolling when the destination is inside the visual viewport', () => {
    vi.stubGlobal('visualViewport', { offsetTop: 20, height: 500 })
    const element = {
      focus: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ top: 100, bottom: 150 })),
      scrollIntoView: vi.fn(),
    } as unknown as HTMLElement

    focusDestination(element)

    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(element.scrollIntoView).not.toHaveBeenCalled()
  })

  it('reveals a focused destination clipped by Safari page zoom', () => {
    vi.stubGlobal('visualViewport', { offsetTop: 0, height: 137 })
    const element = {
      focus: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ top: 174, bottom: 264 })),
      scrollIntoView: vi.fn(),
    } as unknown as HTMLElement

    focusDestination(element)

    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'start', inline: 'nearest' })
  })
})
