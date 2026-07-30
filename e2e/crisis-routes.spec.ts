import { expect, test, type Page } from '@playwright/test'
import { openApp, openArrival } from './helpers'

async function expectSupportBoundary(page: Page, options: { tier4?: boolean } = {}) {
  const alert = page.getByRole('alert')
  const support = page.locator('.crisis-banner')
  await expect(alert).toBeVisible()
  await expect(support.getByRole('link', { name: /deprehub/i })).toHaveAttribute('href', 'tel:+40374456420')
  await expect(support.getByRole('link', { name: /findahelpline/i })).toHaveAttribute('href', 'https://findahelpline.com')
  await expect(support).toContainText(/immediate danger/i)
  await expect(alert.getByRole('link')).toHaveCount(0)

  const acknowledge = page.getByRole('button', { name: 'Continue to reflection' })
  if (options.tier4) {
    await expect(support).toContainText(/do not tell Emot-ID whether you are in danger/i)
    await expect(page.locator('.emotion-heading')).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
    await expect(acknowledge).toBeVisible()
    await acknowledge.click()
  } else {
    await expect(acknowledge).toHaveCount(0)
  }

  await expect(page.locator('.emotion-heading')).toBeVisible()
  await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toBeVisible()
}

async function chooseWord(page: Page, name: string | RegExp) {
  await page
    .getByRole('list', { name: 'Choose one direction' })
    .getByRole('button', { name })
    .click()
}

test.describe('Crisis boundary by completion route', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('Quick routes a high-distress word through support', async ({ page }) => {
    await page.getByTestId('quick-feeling-numb').click()
    await page.getByTestId('quick-continue').click()
    await expect(page.locator('.emotion-heading')).toContainText('Numb')
    await expectSupportBoundary(page)
  })

  test('Body routes a high-distress somatic result through support', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-body').click()
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.getByRole('button', { name: 'Heaviness' }).click()
    await page.getByRole('button', { name: /strong/i }).click()
    await page.locator('.route-action button').click()

    await expect(page.locator('.emotion-heading')).toContainText('grief')
    await expectSupportBoundary(page)
  })

  test('Affect routes a high-distress map suggestion through support', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-affect').click()
    const field = page.getByRole('group', { name: 'Energy and pleasantness map' })
    await field.focus()
    for (let index = 0; index < 4; index++) await page.keyboard.press('ArrowLeft')
    for (let index = 0; index < 3; index++) await page.keyboard.press('ArrowUp')
    await page.getByTestId('dimensional-suggestion-chip-distressed').click()
    await page.getByRole('button', { name: 'Reflect on these words' }).click()

    await expect(page.locator('.emotion-heading')).toContainText(/distressed/i)
    await expectSupportBoundary(page)
  })

  test('Words keeps tier-4 support ahead of reflection details', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-words').click()

    await chooseWord(page, /^sad/i)
    await chooseWord(page, /^despair/i)
    await page.getByRole('button', { name: 'Add Despair' }).click()
    await chooseWord(page, /^sad/i)
    await chooseWord(page, /^depressed/i)
    await chooseWord(page, /^empty/i)
    await chooseWord(page, /^fearful/i)
    await chooseWord(page, /^weak/i)
    await chooseWord(page, /^worthless/i)
    await page.locator('.route-action button').click()

    await expectSupportBoundary(page, { tier4: true })
    await expect(page.locator('.emotion-heading')).toContainText(/despair/i)
  })

  test('Plutchik routes a high-distress dyad through support', async ({ page }) => {
    await page.getByRole('button', { name: 'Explore' }).click()
    await page.getByTestId('explore-plutchik').click()
    await page.getByTestId('plutchik-emotion-fear').click()
    await page.getByTestId('plutchik-emotion-sadness').click()
    await expect(page.getByTestId('plutchik-combination')).toContainText(/despair/i)
    await page.locator('.route-action button').click()

    await expect(page.locator('.emotion-heading')).toContainText(/despair/i)
    await expectSupportBoundary(page)
  })
})
