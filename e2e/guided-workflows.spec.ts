import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('Migrated guided workflows', () => {
  test('uses direct Today copy and routes vocabulary practice as a screen', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('heading', { name: 'How are you feeling?' })).toBeVisible()
    await expect(page.getByText('Start with energy and pleasantness, or choose a word that feels close.')).toBeVisible()

    await page.getByRole('button', { name: 'Explore' }).click()
    await page.getByRole('button', { name: /practice emotional vocabulary/i }).click()
    await expect(page.getByTestId('granularity-screen')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Step 1 of 5')).toBeVisible()

    const firstOption = page.getByRole('button', { name: 'anxiety' })
    expect((await firstOption.boundingBox())!.height).toBeGreaterThanOrEqual(54)
    await firstOption.click()
    await expect(page.getByRole('status')).toContainText(/You chose anxiety/i)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
  })

  test('routes Unpack a moment as one optional four-part reflection', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Journal' }).click()
    await page.getByRole('button', { name: 'Unpack a moment' }).click()
    await expect(page.getByTestId('chain-screen')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('textbox')).toHaveCount(4)
    await expect(page.getByText('Optional')).toHaveCount(3)
    const save = page.getByRole('button', { name: 'Save reflection' })
    await expect(save).toBeDisabled()
    await page.getByLabel('What happened?').fill('A difficult message')
    await expect(save).toBeEnabled()
    await page.getByLabel('What did you notice?').fill('Tension and worry')
    await expect(page.getByLabel('What happened?')).toHaveValue('A difficult message')
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('journal-screen')).toBeVisible()
  })

  test('shows the revised Today copy in Romanian', async ({ page }) => {
    await openApp(page, { language: 'ro' })
    await expect(page.getByRole('heading', { name: 'Cum te simți?' })).toBeVisible()
    await expect(page.getByText('Începe cu energia și cât de plăcută este starea sau alege un cuvânt apropiat.')).toBeVisible()
  })
})
