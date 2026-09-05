import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

test('refreshing the language provider preserves the document and current selection', { timeout: 60000 }, async () => {
  const providerPath = fileURLToPath(new URL('../src/context/LanguageContext.tsx', import.meta.url))
  let revision = 0
  const server = await createServer({
    server: { host: '127.0.0.1', port: 0, open: false },
    plugins: [{
      name: 'language-refresh-regression',
      enforce: 'pre',
      transform(code, id) {
        // A controlled source edit without mutating the user's working tree.
        if (id.split('?')[0] === providerPath) return `${code}\n// refresh probe ${revision}\n`
      },
    }],
  })
  let browser
  try {
    await server.listen()
    browser = await chromium.launch()
    const page = await browser.newPage()
    const logs = []
    page.on('console', (message) => logs.push(message.text()))
    await page.addInitScript(() => {
      localStorage.setItem('emot-id-onboarded', 'true')
      localStorage.setItem('emot-id-language', 'ro')
      localStorage.setItem('emot-id-theme', 'dark')
    })
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/emotid/`)
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByTestId('quick-continue').waitFor({ state: 'visible' })
    await page.evaluate(async () => {
      window.__languageRefreshDocument = true
      const { createHotContext } = await import('/emotid/@vite/client')
      createHotContext('/language-refresh-probe').on('vite:afterUpdate', () => {
        window.__languageRefreshUpdated = true
      })
    })
    revision++
    server.watcher.emit('change', providerPath)
    await page.waitForFunction(() => window.__languageRefreshUpdated || !window.__languageRefreshDocument)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.equal(await page.evaluate(() => window.__languageRefreshDocument), true, logs.join('\n'))
    assert.equal(logs.some((line) => line.includes('[vite] invalidate')), false, logs.join('\n'))
    assert.equal(await page.locator('html').getAttribute('lang'), 'ro')
    assert.equal(await page.getByTestId('quick-feeling-anxiety').getAttribute('aria-pressed'), 'true')
    assert.equal(await page.getByTestId('quick-continue').isEnabled(), true)
  } finally {
    await browser?.close()
    await server.close()
  }
})
