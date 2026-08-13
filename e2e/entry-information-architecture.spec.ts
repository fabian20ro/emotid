import { expect, test, type Page } from '@playwright/test'
import { openApp } from './helpers'

const variants = [
  { language: 'en' as const, theme: 'light' as const, place: 'Place the feeling', help: 'Help me choose', naming: 'Notice and name', learning: 'Compare and learn' },
  { language: 'en' as const, theme: 'dark' as const, place: 'Place the feeling', help: 'Help me choose', naming: 'Notice and name', learning: 'Compare and learn' },
  { language: 'ro' as const, theme: 'light' as const, place: 'Plasați starea', help: 'Ajutați-mă să aleg', naming: 'Observați și numiți', learning: 'Comparați și explorați' },
  { language: 'ro' as const, theme: 'dark' as const, place: 'Plasați starea', help: 'Ajutați-mă să aleg', naming: 'Observați și numiți', learning: 'Comparați și explorați' },
]

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.locator('.app-shell').evaluate((element) => element.scrollWidth - element.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

for (const variant of variants) {
  test(`${variant.language} ${variant.theme}: direct placement, guidance, and Explore groups`, async ({ page }) => {
    await openApp(page, variant)

    const place = page.getByRole('button', { name: variant.place, exact: true })
    const help = page.getByRole('button', { name: variant.help, exact: true })
    await expect(place).toBeInViewport()
    await expect(help).toBeInViewport()
    await expectNoHorizontalOverflow(page)

    await place.click()
    await expect(page.getByTestId('affect-screen')).toBeVisible()
    await expect(page.locator('#screen-title')).toBeFocused()

    await page.goBack()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await expect(page.locator('#screen-title')).toBeFocused()

    await help.click()
    await expect(page.getByTestId('arrival-screen')).toBeVisible()
    await expect(page.locator('#screen-title')).toBeFocused()

    await page.getByRole('button', { name: variant.language === 'ro' ? 'Explorează' : 'Explore', exact: true }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
    const naming = page.getByRole('region', { name: variant.naming })
    await expect(naming.getByTestId('explore-affect')).toBeVisible()
    await expect(naming.getByTestId('explore-words')).toBeVisible()
    await expect(naming.getByTestId('explore-body')).toBeVisible()
    await expect(naming.getByTestId('explore-plutchik')).toHaveCount(0)

    const learning = page.getByRole('region', { name: variant.learning })
    await expect(learning.getByTestId('explore-plutchik')).toBeVisible()
    await expect(learning.getByTestId('explore-practice')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
}
