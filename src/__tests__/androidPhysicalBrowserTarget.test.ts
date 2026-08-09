import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const targetModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/android-physical/browser-target.mjs'),
).href

async function loadTargetModule() {
  return import(targetModuleUrl)
}

function fakePage(url: string, standalone: boolean) {
  return {
    url: () => url,
    evaluate: vi.fn().mockResolvedValue(standalone),
  }
}

describe('Android physical browser targeting', () => {
  it('creates a unique run URL without discarding existing candidate parameters', async () => {
    const { createBrowserRunUrl } = await loadTargetModule()

    const result = new URL(createBrowserRunUrl(
      'https://example.test/emotid/?channel=physical',
      'browser-123',
    ))

    expect(result.pathname).toBe('/emotid/')
    expect(result.searchParams.get('channel')).toBe('physical')
    expect(result.searchParams.get('physical-audit-run')).toBe('browser-123')
  })

  it('selects only the exact run token in browser display mode', async () => {
    const { findBrowserTarget } = await loadTargetModule()
    const stale = fakePage('https://example.test/emotid/', false)
    const wrongMode = fakePage(
      'https://example.test/emotid/?physical-audit-run=browser-123',
      true,
    )
    const exact = fakePage(
      'https://example.test/emotid/?physical-audit-run=browser-123',
      false,
    )
    const browser = {
      contexts: () => [{ pages: () => [stale, wrongMode, exact] }],
    }

    await expect(findBrowserTarget({
      browser,
      candidateUrl: 'https://example.test/emotid/',
      runToken: 'browser-123',
      attempts: 1,
    })).resolves.toBe(exact)
  })

  it('fails instead of falling back to a stale candidate tab', async () => {
    const { findBrowserTarget } = await loadTargetModule()
    const browser = {
      contexts: () => [{ pages: () => [fakePage('https://example.test/emotid/', false)] }],
    }

    await expect(findBrowserTarget({
      browser,
      candidateUrl: 'https://example.test/emotid/',
      runToken: 'missing-run',
      attempts: 1,
    })).rejects.toThrow('No foreground browser candidate for run missing-run')
  })

  it('requires the exact run token in the native Chrome foreground hierarchy', async () => {
    const { verifyForegroundSurface } = await loadTargetModule()

    await expect(verifyForegroundSurface({
      runToken: 'browser-123',
      readHierarchy: async () => '<node resource-id="com.android.chrome:id/url_bar" text="example.test/emotid/?channel=physical&amp;physical-audit-run=browser-123" />',
    })).resolves.toBeUndefined()

    await expect(verifyForegroundSurface({
      runToken: 'browser-123',
      readHierarchy: async () => [
        '<node resource-id="app:id/content" text="physical-audit-run=browser-123" />',
        '<node resource-id="com.android.chrome:id/url_bar" text="example.test/emotid/?physical-audit-run=browser-1234" />',
      ].join(''),
    })).rejects.toThrow('Physical foreground does not match browser run browser-123')
  })
})
