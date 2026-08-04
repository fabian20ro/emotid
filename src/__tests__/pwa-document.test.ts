import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('PWA document metadata', () => {
  it('declares standards and Apple standalone capability once', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
    const parsed = new DOMParser().parseFromString(html, 'text/html')

    const standardTags = parsed.querySelectorAll('meta[name="mobile-web-app-capable"]')
    const appleTags = parsed.querySelectorAll('meta[name="apple-mobile-web-app-capable"]')

    expect(standardTags).toHaveLength(1)
    expect(standardTags[0]?.getAttribute('content')).toBe('yes')
    expect(appleTags).toHaveLength(1)
    expect(appleTags[0]?.getAttribute('content')).toBe('yes')
  })
})
