import { test, expect } from '@playwright/test'
import { completeQuick, finishReflection, openApp, openArrival } from './helpers'

async function completeAffectAt(
  page: import('@playwright/test').Page,
  emotionId: string,
  position: { x: number; y: number },
) {
  await openArrival(page)
  await page.getByTestId('arrival-affect').click()
  const plot = page.getByTestId('dimensional-plot-container').locator('svg')
  const box = await plot.boundingBox()
  expect(box).not.toBeNull()
  await plot.click({
    position: { x: box!.width * position.x, y: box!.height * position.y },
    force: true,
  })
  const suggestion = page.getByTestId(`dimensional-suggestion-chip-${emotionId}`)
  await expect(suggestion).toBeVisible()
  await suggestion.click()
  await page.getByRole('button', { name: 'Reflect on these words' }).click()
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
}

async function completePlutchikPair(
  page: import('@playwright/test').Page,
  firstId: string,
  secondId: string,
  resultId: string,
) {
  await page.getByRole('button', { name: 'Explore' }).click()
  await page.getByTestId('explore-plutchik').click()
  await page.getByTestId(`plutchik-emotion-${firstId}`).click()
  await page.getByTestId(`plutchik-emotion-${secondId}`).click()
  await expect(page.getByTestId('plutchik-combination')).toContainText(
    new RegExp(resultId, 'i'),
  )
  await page.locator('.route-action button').click()
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
}

test('reveals a newly reviewed Quick need only after explicit exploration', async ({ page }) => {
  await openApp(page)
  await completeQuick(page, 'anger')

  const needs = page.getByRole('group', { name: 'What feels most needed right now?' })
  await expect(needs).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore further' }).click()
  await expect(needs.getByRole('button', { name: 'boundaries', exact: true })).toBeVisible()
})

test('reveals reviewed Affect guidance only after explicit exploration', async ({ page }) => {
  await openApp(page)
  await completeAffectAt(page, 'afraid', { x: 0.24, y: 0.19 })

  const needs = page.getByRole('group', { name: 'What feels most needed right now?' })
  await expect(needs).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore further' }).click()
  await expect(needs.getByRole('button', { name: 'a sense of safety', exact: true })).toBeVisible()
})

test('keeps reviewed no-suggestion Affect guidance absent during exploration', async ({ page }) => {
  await openApp(page)
  await completeAffectAt(page, 'happy', { x: 0.76, y: 0.32 })

  await page.getByRole('button', { name: 'Explore further' }).click()
  await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
})

test('reveals reviewed Plutchik guidance only after explicit exploration', async ({ page }) => {
  await openApp(page)
  await completePlutchikPair(page, 'joy', 'trust', 'love')

  const needs = page.getByRole('group', { name: 'What feels most needed right now?' })
  await expect(needs).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore further' }).click()
  await expect(needs.getByRole('button', { name: 'safe connection', exact: true })).toBeVisible()
})

test('keeps reviewed no-suggestion Plutchik guidance absent during exploration', async ({ page }) => {
  await openApp(page)
  await completePlutchikPair(page, 'joy', 'anticipation', 'optimism')

  await page.getByRole('button', { name: 'Explore further' }).click()
  await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
})

test('chooses one of several inferred needs and persists it to Journal', async ({ page }) => {
  await openApp(page)
  await openArrival(page)
  await page.getByTestId('arrival-words').click()

  const level = page.getByRole('list', { name: 'Choose one direction' })
  const choose = async (name: string) => level.getByRole('button', { name, exact: true }).click()

  await choose('Sad')
  await choose('despair')
  await choose('grief')
  await choose('Bad')
  await choose('Stressed')
  await choose('Tense')
  await page.locator('.route-action button').click()

  await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore further' }).click()
  const needs = page.getByRole('group', { name: 'What feels most needed right now?' })
  const support = needs.getByRole('button', { name: 'support', exact: true })
  const physicalEase = needs.getByRole('button', { name: 'physical ease', exact: true })
  await expect(support).toHaveAttribute('aria-pressed', 'false')
  await expect(physicalEase).toHaveAttribute('aria-pressed', 'false')

  await physicalEase.scrollIntoViewIfNeeded()
  const careBox = await physicalEase.boundingBox()
  const groupBox = await needs.boundingBox()
  expect(careBox!.height).toBeGreaterThanOrEqual(48)
  expect(careBox!.x).toBeGreaterThanOrEqual(groupBox!.x - 1)
  expect(careBox!.x + careBox!.width).toBeLessThanOrEqual(groupBox!.x + groupBox!.width + 1)

  await physicalEase.focus()
  await page.keyboard.press('Enter')
  await expect(physicalEase).toHaveAttribute('aria-pressed', 'true')
  await expect(support).toHaveAttribute('aria-pressed', 'false')
  await finishReflection(page)

  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: /open check-in:.*grief.*tense/i }).click()
  await expect(page.getByTestId('session-detail-screen')).toContainText('physical ease')
})
