import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

for (const language of ['en', 'ro'] as const) {
  test(`reads every field of older exercises and deletes only the chosen one (${language})`, async ({ page }) => {
    await openApp(page, { language })
    const ro = language === 'ro'
    const journal = ro ? 'Jurnal' : 'Journal'
    const openExercise = ro ? /Deschide exercițiile/i : /Open journal exercise/i
    await page.getByRole('button', { name: journal, exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Desfă un moment' : 'Unpack a moment' }).click()
    for (let index = 0; index < 4; index++) {
      for (const field of ['situation', 'noticed', 'response', 'outcome']) {
        await page.locator(`#chain-${field}`).fill(`${field} ${index}`)
      }
      await page.getByRole('button', { name: ro ? 'Salvează reflecția' : 'Save reflection', exact: true }).click()
      await page.getByRole('button', { name: ro ? 'Gata' : 'Done', exact: true }).click()
      await page.getByRole('button', { name: openExercise }).click()
      if (index < 3) await page.getByRole('button', { name: ro ? 'Scrie o reflecție nouă' : 'Write a new reflection' }).click()
    }
    await page.reload()
    await page.getByRole('button', { name: journal, exact: true }).click()
    await page.getByRole('button', { name: openExercise }).click()
    await expect(page.locator('.guided-recent-list > button')).toHaveCount(4)
    await page.locator('.guided-recent-list > button').filter({ hasText: 'situation 0' }).click()
    for (const field of ['situation', 'noticed', 'response', 'outcome']) {
      await expect(page.getByTestId('chain-entry-detail')).toContainText(`${field} 0`)
    }
    const remove = ro ? 'Șterge acest exercițiu' : 'Delete this exercise'
    await page.getByRole('button', { name: remove, exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Anulează' : 'Cancel', exact: true }).click()
    await expect(page.getByTestId('chain-entry-detail')).toBeVisible()
    await page.getByRole('button', { name: remove, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: remove, exact: true }).click()
    await expect(page.locator('.guided-recent-list > button')).toHaveCount(3)
    await expect(page.locator('.guided-recent-list')).not.toContainText('situation 0')
  })
}
