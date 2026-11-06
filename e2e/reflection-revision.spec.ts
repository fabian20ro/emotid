import { expect, test } from '@playwright/test'
import { completeQuick, openApp, openArrival } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

for (const language of ['en', 'ro'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    const copy = language === 'en' ? en : ro
    const t = copy.reflectionScreen
    for (const answer of ['yes', 'no'] as const) {
      test(`body revision requires renewed ${answer} and persists an unconfirmed result: ${language} ${theme}`, async ({ page }) => {
        await openApp(page, { language, theme })
        await openArrival(page)
        await page.getByTestId('arrival-body').click()
        await page.getByRole('button', { name: language === 'en' ? 'Chest' : 'Piept', exact: true }).click()
        await page.getByRole('button', { name: language === 'en' ? 'Warmth' : 'Căldură', exact: true }).click()
        await page.getByRole('button', { name: /moderate|moderată/i }).click()
        await page.locator('.route-action button').click()
        await expect(page.getByRole('checkbox')).toHaveCount(4)
        await page.getByRole('button', { name: t[answer], exact: true }).click()
        await expect(page.getByTestId('session-save-status')).toHaveClass(/is-saved/)
        await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
        await page.getByRole('button', { name: language === 'en' ? 'Edit Chest' : 'Editează Piept', exact: true }).click()
        await page.getByRole('button', { name: language === 'en' ? 'Heaviness' : 'Greutate', exact: true }).click()
        await page.getByRole('button', { name: /strong|puternică/i }).click()
        await page.locator('.route-action button').click()
        await expect(page.getByRole('checkbox')).toHaveCount(2)
        for (const fit of ['yes', 'partly', 'no'] as const) {
          await expect(page.getByRole('button', { name: t[fit], exact: true })).toHaveAttribute('aria-pressed', 'false')
        }
        await page.getByRole('button', { name: t.exploreMore }).click()
        await expect(page.getByTestId('external-ai-link')).toHaveCount(0)
        await page.getByRole('button', { name: t.done }).click()
        await expect(page.getByTestId('today-screen')).toBeVisible()
        await page.reload()
        await page.getByRole('button', { name: language === 'en' ? 'Journal' : 'Jurnal', exact: true }).click()
        await expect(page.locator('.journal-list button')).toHaveCount(1)
        await page.locator('.journal-list button').click()
        const detail = page.getByTestId('session-detail-screen')
        await expect(detail.getByText(copy.sessionDetail.relationship.suggested, { exact: true })).toBeVisible()
        await expect(detail.getByText(copy.sessionDetail.fit, { exact: true })).toHaveCount(0)
      })
    }

    test(`support remains reachable through exploration and step: ${language} ${theme}`, async ({ page }, testInfo) => {
      await openApp(page, { language, theme })
      await completeQuick(page, 'numb')
      const support = page.locator('.crisis-banner')
      const message = await support.locator('.crisis-message').textContent()
      await page.getByRole('button', { name: t.exploreMore }).click()
      await expect(support.locator('.crisis-message')).toHaveText(message!)
      await page.getByRole('button', { name: t.nextStep }).click()
      await expect(page.getByRole('heading', { name: t.nextStep })).toBeFocused()
      const link = support.getByRole('link', { name: /deprehub/i })
      await link.scrollIntoViewIfNeeded()
      await expect(link).toBeInViewport()
      await expect(link).toHaveAttribute('href', 'tel:+40374456420')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('support-step.png'), fullPage: true })
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await expect(support).toHaveCount(1)
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await expect(page.getByTestId('reflection-explore-more')).toBeFocused()
      await expect(support).toHaveCount(1)
      await expect(page.getByTestId('session-save-status')).toHaveClass(/is-saved/)
      await page.evaluate(() => {
        const originalPut = IDBObjectStore.prototype.put
        IDBObjectStore.prototype.put = function (value, key) {
          if (this.name === 'sessions') throw new DOMException('Synthetic save failure', 'QuotaExceededError')
          return originalPut.call(this, value, key)
        }
      })
      await page.getByRole('button', { name: t.done }).click()
      await expect(page.getByTestId('reflection-save-error-screen')).toBeVisible()
      await expect(page.getByRole('heading', { name: t.detailSaveErrorTitle })).toBeFocused()
      await expect(support.locator('.crisis-message')).toHaveText(message!)
      await link.scrollIntoViewIfNeeded()
      await expect(link).toBeInViewport()
      const exit = page.getByRole('button', { name: t.finishWithoutDetails })
      await exit.scrollIntoViewIfNeeded()
      await expect(exit).toBeInViewport()
      await page.screenshot({ path: testInfo.outputPath('support-save-error.png'), fullPage: true })
      await exit.click()
      await expect(page.getByTestId('today-screen')).toBeVisible()
    })
  }
}
