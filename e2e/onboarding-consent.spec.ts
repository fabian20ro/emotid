import { expect, test } from '@playwright/test'

const cases = [
  { language: 'en', theme: 'light', next: 'Next', heading: 'Privacy & data', saving: 'Save reflections on this device', hint: /stored only on this device/i },
  { language: 'en', theme: 'dark', next: 'Next', heading: 'Privacy & data', saving: 'Save reflections on this device', hint: /stored only on this device/i },
  { language: 'ro', theme: 'light', next: 'Înainte', heading: 'Confidențialitate și date', saving: 'Salvează reflecțiile pe acest dispozitiv', hint: /doar pe acest dispozitiv/i },
  { language: 'ro', theme: 'dark', next: 'Înainte', heading: 'Confidențialitate și date', saving: 'Salvează reflecțiile pe acest dispozitiv', hint: /doar pe acest dispozitiv/i },
] as const

for (const scenario of cases) {
  test(`discloses default-on local saving in ${scenario.language} ${scenario.theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.addInitScript(({ language, theme }) => {
      localStorage.clear()
      localStorage.setItem('emot-id-language', language)
      localStorage.setItem('emot-id-theme', theme)
    }, scenario)
    await page.goto('/')

    await page.getByRole('button', { name: scenario.next }).click()
    await page.getByRole('button', { name: scenario.next }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.theme)
    await expect(page.getByRole('heading', { name: scenario.heading })).toBeFocused()
    const saving = page.getByRole('switch', { name: scenario.saving })
    await expect(saving).toBeChecked()
    await expect(page.getByText(scenario.hint)).toBeVisible()
    await expect(saving).toBeInViewport()
    await expect(page.locator('.onboarding-actions .primary-button')).toBeInViewport()
    expect(await page.locator('body').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)

    await saving.click()
    await expect(saving).not.toBeChecked()
    expect(await page.evaluate(() => localStorage.getItem('emot-id-save-sessions'))).toBe('false')
  })
}
