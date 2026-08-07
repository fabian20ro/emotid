import { test, expect } from '@playwright/test'
import { expectAccessibleTextContrast } from './contrast'
import { openApp, openArrival } from './helpers'

test.describe('Word Ladder route', () => {
  test('protects the draft and returns one hierarchy level at a time', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()

    await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Playful' }).click()
    await expect(page.getByText('This word can be your answer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Playful' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Happy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Playful' })).toBeVisible()

    await page.getByRole('button', { name: 'Back one level' }).click()
    await expect(page.getByRole('button', { name: 'Add Happy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Playful' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Playful' })).toBeVisible()

    await page.getByRole('button', { name: 'Back one level' }).click()
    await expect(page.getByRole('button', { name: 'Happy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back one level' })).toHaveCount(0)
  })

  test('finishes from an intermediary word with one explicit action', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Playful' }).click()
    await page.getByRole('button', { name: 'Continue with Playful' }).click()

    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText('Playful')
    await expect(page.locator('.session-save-status')).toContainText('Check-in saved')
  })

  test('selects a broad path level and keeps Reflection interruption-free', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Playful' }).click()
    await page.getByRole('button', { name: 'Add Happy' }).click()

    const selected = page.getByRole('region', { name: 'Selected words' })
    await expect(selected).toContainText('Happy')
    await page.getByRole('button', { name: 'Compare nearby words' }).click()
    await page.getByRole('button', { name: 'Compare with Sad' }).click()
    const comparison = page.getByRole('group', { name: 'Happy and Sad' })
    await expect(comparison).toContainText('Happy')
    await expect(comparison).toContainText('Sad')
    await expect(page.getByText('Notice which description, if either, feels closer.')).toBeVisible()
    const action = page.getByRole('button', { name: 'Continue with Happy' })
    const comparisonBox = await page.getByRole('region', { name: 'Compare nearby words' }).boundingBox()
    const actionBox = await action.boundingBox()
    expect(actionBox!.y).toBeGreaterThanOrEqual(comparisonBox!.y + comparisonBox!.height - 1)
    await expect(action).toBeEnabled()
    await action.click()

    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText('Happy')
    await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  test('compares a selected intermediary only within its complete sibling group', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Playful' }).click()
    await page.getByRole('button', { name: 'Add Playful' }).click()

    await page.getByRole('button', { name: 'Compare nearby words' }).click()
    await expect(page.getByRole('button', { name: 'Compare with Sad' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Compare with Content' }).click()

    const comparison = page.getByRole('group', { name: 'Playful and Content' })
    await expect(comparison).toContainText('Playful')
    await expect(comparison).toContainText('Content')
    await expect(page.getByRole('button', { name: 'Continue with Playful' })).toBeEnabled()
    const overflow = await page.locator('.app-shell').evaluate((element) => element.scrollWidth - element.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('does not offer comparison for a leaf group without complete reviewed descriptions', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Playful' }).click()
    await page.getByRole('button', { name: 'Energized' }).click()

    await expect(page.getByRole('button', { name: 'Compare nearby words' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Continue with Energized' })).toBeEnabled()
  })

  test('localizes hierarchy controls and stays within the mobile viewport', async ({ page }) => {
    await openApp(page, { language: 'ro', theme: 'dark' })
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Fericit' }).click()

    await expect(page.getByRole('button', { name: 'Adăugați Fericit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Înapoi cu un nivel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jucăuș' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mulțumit' })).toBeVisible()
    await page.getByRole('button', { name: 'Adăugați Fericit' }).click()
    await page.getByRole('button', { name: 'Comparați cuvinte apropiate' }).click()
    await page.getByRole('button', { name: 'Comparați cu Trist' }).click()
    await expect(page.getByRole('group', { name: 'Fericit și Trist' })).toBeVisible()
    await expectAccessibleTextContrast(page, 'Romanian Word Ladder comparison')
    const overflow = await page.locator('.app-shell').evaluate((element) => element.scrollWidth - element.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    const comparisonButton = await page.getByRole('button', { name: 'Comparați cu Trist' }).boundingBox()
    expect(comparisonButton!.height).toBeGreaterThanOrEqual(44)
  })
})
