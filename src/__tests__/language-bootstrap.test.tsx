import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import { storage } from '../data/storage'
import { getInitialLanguage, setDocumentLanguage } from '../context/language-bootstrap'
import { LanguageProvider, useLanguage } from '../context/LanguageContext'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.lang = 'en'
})

it.each([
  ['ro', 'en-US', 'ro'],
  ['en', 'ro-RO', 'en'],
  [null, 'ro-RO', 'ro'],
  [null, 'en-GB', 'en'],
  ['invalid', 'ro', 'ro'],
  ['invalid', 'fr-FR', 'en'],
])('resolves stored %s and browser %s to %s', (saved, browser, expected) => {
  vi.spyOn(storage, 'get').mockReturnValue(saved)
  vi.stubGlobal('navigator', { language: browser })
  expect(getInitialLanguage()).toBe(expected)
  expect(storage.get).toHaveBeenCalledWith('language')
})

it('falls back to English without a window or storage access', () => {
  const read = vi.spyOn(storage, 'get')
  vi.stubGlobal('window', undefined)
  expect(getInitialLanguage()).toBe('en')
  expect(read).not.toHaveBeenCalled()
})

it('applies the document language synchronously', () => {
  setDocumentLanguage('ro')
  expect(document.documentElement.lang).toBe('ro')
  setDocumentLanguage('en')
  expect(document.documentElement.lang).toBe('en')
})

it('preserves explicit bootstrap and sets language before runtime localized commits', () => {
  vi.spyOn(storage, 'get').mockReturnValue('en')
  const persist = vi.spyOn(storage, 'set').mockImplementation(() => {})
  const commits: string[] = []
  function Probe() {
    const { language, setLanguage, t, section } = useLanguage()
    useLayoutEffect(() => { commits.push(`${language}/${document.documentElement.lang}`) }, [language])
    expect(section('today')).toBe(t.today)
    return <button onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}>{language}</button>
  }
  setDocumentLanguage('ro')
  render(<LanguageProvider initialLanguage="ro"><Probe /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'ro' }))
  fireEvent.click(screen.getByRole('button', { name: 'en' }))
  expect(commits).toEqual(['ro/ro', 'en/en', 'ro/ro'])
  expect(persist.mock.calls).toEqual([['language', 'ro'], ['language', 'en'], ['language', 'ro']])
})
