import { test, expect } from '@playwright/test'
import { finishReflection, openApp, openArrival } from './helpers'

test('chooses one of several inferred needs and persists it to Journal', async ({ page }) => {
  await openApp(page)
  await openArrival(page)
  await page.getByTestId('arrival-words').click()

  const level = page.getByRole('list', { name: 'Choose one direction' })
  const choose = async (name: string) => level.getByRole('button', { name, exact: true }).click()

  await choose('Happy')
  await choose('Content')
  await choose('Free')
  await choose('Sad')
  await choose('Hurt')
  await choose('Wounded')
  await page.locator('.route-action button').click()

  const needs = page.getByRole('group', { name: 'What feels most needed right now?' })
  const autonomy = needs.getByRole('button', { name: 'open space and autonomy' })
  const care = needs.getByRole('button', { name: 'acknowledgment and gentle care' })
  await expect(autonomy).toHaveAttribute('aria-pressed', 'false')
  await expect(care).toHaveAttribute('aria-pressed', 'false')

  await care.scrollIntoViewIfNeeded()
  const careBox = await care.boundingBox()
  const groupBox = await needs.boundingBox()
  expect(careBox!.height).toBeGreaterThanOrEqual(48)
  expect(careBox!.x).toBeGreaterThanOrEqual(groupBox!.x - 1)
  expect(careBox!.x + careBox!.width).toBeLessThanOrEqual(groupBox!.x + groupBox!.width + 1)

  await care.focus()
  await page.keyboard.press('Enter')
  await expect(care).toHaveAttribute('aria-pressed', 'true')
  await expect(autonomy).toHaveAttribute('aria-pressed', 'false')
  await finishReflection(page)

  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: /open check-in:.*free.*wounded/i }).click()
  await expect(page.getByTestId('session-detail-screen')).toContainText('acknowledgment and gentle care')
})
