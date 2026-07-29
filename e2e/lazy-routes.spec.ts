import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test('deferred utility destinations replace loading state and focus their real heading', async ({ page }) => {
  await openApp(page)

  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.getByTestId('explore-screen')).toBeVisible()
  await expect(page.getByTestId('route-loading')).toHaveCount(0)
  await expect(page.locator('#screen-title')).toBeFocused()

  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-screen')).toBeVisible()
  await expect(page.getByTestId('route-loading')).toHaveCount(0)
  await expect(page.locator('#screen-title')).toBeFocused()

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByTestId('settings-screen')).toBeVisible()
  await expect(page.getByTestId('route-loading')).toHaveCount(0)
  await expect(page.locator('#screen-title')).toBeFocused()
})
