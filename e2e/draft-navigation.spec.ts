import { expect, test } from '@playwright/test'
import { completeQuick, openApp } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

for (const language of ['en', 'ro'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    const copy = language === 'en' ? en : ro
    const t = copy.reflectionScreen
    const chain = copy.chainAnalysis
    test(`reflection Back and Forward traverse steps without losing choices: ${language} ${theme}`, async ({ page }) => {
      await openApp(page, { language, theme })
      await completeQuick(page, 'anxiety')
      await page.getByRole('button', { name: t.yes, exact: true }).click()
      await page.getByRole('button', { name: t.exploreMore }).click()
      const need = page.getByRole('group', { name: t.needPrompt }).getByRole('button').first()
      await need.click()
      await page.getByRole('button', { name: t.nextStep }).click()
      const step = t.stepWrite
      await page.getByRole('button', { name: step, exact: true }).click()
      await page.goBack()
      await expect(page.getByTestId('reflection-exploration-screen')).toBeVisible()
      await expect(need).toHaveAttribute('aria-pressed', 'true')
      await page.goForward()
      await expect(page.getByRole('button', { name: step, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await expect(page.getByTestId('reflection-exploration-screen')).toBeVisible()
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await expect(page.getByTestId('reflection-explore-more')).toBeFocused()
      await page.goBack()
      await expect(page.getByTestId('today-screen')).toBeVisible()
      await page.goForward()
      await expect(page.getByTestId('reflection-screen')).toBeVisible()
      await page.goForward()
      await expect(need).toHaveAttribute('aria-pressed', 'true')
      await page.goForward()
      await expect(page.getByRole('button', { name: step, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: t.keepStep }).click()
      await expect(page.getByTestId('today-screen')).toBeVisible()
      await page.goBack()
      await expect(page.getByTestId('today-screen')).toBeVisible()
      await page.goForward()
      await expect(page.getByTestId('today-screen')).toBeVisible()
      await completeQuick(page, 'joy')
      await expect(page.getByRole('button', { name: t.yes, exact: true })).toHaveAttribute('aria-pressed', 'false')
      await page.getByRole('button', { name: t.exploreMore }).click()
      await page.getByRole('button', { name: t.nextStep }).click()
      await expect(page.getByRole('button', { name: step, exact: true })).toHaveAttribute('aria-pressed', 'false')
    })

    test(`exercise draft survives leaving for Journal and returning: ${language} ${theme}`, async ({ page }, testInfo) => {
      await openApp(page, { language, theme })
      await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
      await page.getByRole('button', { name: copy.journalScreen.unpack }).click()
      await page.getByRole('textbox', { name: chain.situation }).fill('Unfinished thought')
      await page.getByRole('textbox', { name: chain.noticed }).fill('Tension')
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await expect(page.getByTestId('journal-screen')).toBeVisible()
      await page.getByRole('button', { name: copy.journalScreen.unpack }).click()
      await expect(page.getByRole('textbox', { name: chain.situation })).toHaveValue('Unfinished thought')
      await expect(page.getByRole('textbox', { name: chain.noticed })).toHaveValue('Tension')
      await page.getByRole('button', { name: chain.save }).click()
      await page.getByRole('button', { name: chain.done, exact: true }).click()
      await page.getByRole('button', { name: /Unfinished thought/ }).click()
      await page.getByRole('button', { name: chain.newEntry }).click()
      await expect(page.getByRole('textbox', { name: chain.situation })).toHaveValue('')
      await page.getByRole('textbox', { name: chain.situation }).fill('Discard only this')
      await page.getByRole('button', { name: chain.discardDraft }).click()
      await page.getByRole('button', { name: chain.cancel }).click()
      await expect(page.getByRole('button', { name: chain.discardDraft })).toBeFocused()
      await expect.poll(() => page.getByRole('button', { name: chain.discardDraft }).evaluate((button) => {
        const icon = button.querySelector('svg')!.getBoundingClientRect()
        const label = document.createRange()
        label.selectNodeContents(button.lastChild!)
        const text = label.getBoundingClientRect()
        return Math.abs(icon.y + icon.height / 2 - text.y - text.height / 2)
      })).toBeLessThan(3)
      await page.getByRole('button', { name: chain.discardDraft }).click()
      await expect(page.getByRole('dialog').getByRole('button', { name: chain.discardDraft })).toBeInViewport()
      await expect(page.getByRole('dialog').getByRole('button', { name: chain.cancel })).toBeFocused()
      await page.screenshot({ path: testInfo.outputPath('discard-draft.png') })
      await page.getByRole('dialog').getByRole('button', { name: chain.discardDraft }).click()
      await expect(page.getByRole('textbox', { name: chain.situation })).toHaveValue('')
      await expect(page.getByRole('textbox', { name: chain.situation })).toBeFocused()
      await page.getByRole('button', { name: chain.readEntries }).click()
      await expect(page.getByRole('button', { name: /Unfinished thought/ })).toBeVisible()
    })
  }
}
