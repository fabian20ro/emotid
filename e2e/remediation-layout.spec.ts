import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`compact word continuation, direct guidance and enlarged text (${language}/${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 742 })
    await openApp(page, { language, theme })
    const ro = language === 'ro'
    await page.getByRole('button', { name: ro ? 'Ajută-mă să aleg' : 'Help me choose', exact: true }).click()
    await expect(page.getByTestId('arrival-guide-body')).toBeVisible()
    await expect(page.locator('#screen-title')).toBeFocused()
    await page.getByRole('button', { name: ro ? 'Explorează' : 'Explore', exact: true }).click()
    await page.getByTestId('explore-words').click()
    await page.getByRole('button', { name: ro ? 'Explorează cuvinte mai precise sub Rău' : 'Explore more specific words under Bad', exact: true }).click()
    const continueButton = page.locator('.word-stop-choice .primary-button')
    const firstChild = page.locator('.word-options > li > button').first()
    await expect(continueButton).toBeInViewport({ ratio: 1 })
    await expect(firstChild).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `output/playwright/remediation-words-${language}-${theme}.png` })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.getByTestId('words-screen').evaluate((root) => {
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')]
      const sizes = elements.map((element) => parseFloat(getComputedStyle(element).fontSize))
      elements.forEach((element, index) => { (element as HTMLElement).style.fontSize = `${sizes[index] * 2}px` })
    })
    expect(await page.locator('.app-content').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    await continueButton.scrollIntoViewIfNeeded()
    await expect(continueButton).toBeInViewport()
    await continueButton.click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })
}
