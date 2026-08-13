import { expect, test, type Locator, type Page } from '@playwright/test'
import { finishReflection, openApp, openArrival } from './helpers'

async function activate(locator: Locator, key: 'Enter' | 'Space' = 'Enter') {
  await locator.focus()
  await locator.page().keyboard.press(key)
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.locator('.app-shell').evaluate((element) => element.scrollWidth - element.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('Keyboard-only primary journeys', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('Quick and Reflection complete without pointer input', async ({ page }) => {
    await activate(page.getByTestId('quick-feeling-joy'))
    await expect(page.getByTestId('quick-feeling-joy')).toHaveAttribute('aria-pressed', 'true')
    await activate(page.getByTestId('quick-continue'))
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await activate(page.getByRole('button', { name: 'Yes' }), 'Space')
    await activate(page.getByRole('button', { name: 'Done for now' }))
    await expect(page.getByTestId('today-screen')).toBeVisible()
  })

  test('Body Compass completes without pointer input', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Start a reflection' }))
    await activate(page.getByTestId('arrival-body'))
    await activate(page.getByRole('button', { name: 'Chest' }))
    await activate(page.getByRole('button', { name: 'Tension' }), 'Space')
    await activate(page.getByRole('button', { name: /moderate/i }))
    await activate(page.getByRole('button', { name: 'See what might fit' }))
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Affect Map completes without pointer input', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Start a reflection' }))
    await activate(page.getByTestId('arrival-affect'), 'Space')

    const field = page.getByRole('group', { name: 'Energy and pleasantness map' })
    await field.focus()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowUp')
    const suggestion = page.locator('.dimensional-suggestion-chip').first()
    await activate(suggestion)
    await activate(page.getByRole('button', { name: 'Reflect on these words' }))
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Word Ladder completes without pointer input', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Start a reflection' }))
    await activate(page.getByTestId('arrival-words'))
    await activate(page.getByRole('button', { name: 'Happy' }), 'Space')
    await activate(page.getByRole('button', { name: 'Add Happy' }))
    await activate(page.locator('.route-action button'))
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Plutchik completes without pointer input', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Explore' }))
    await activate(page.getByTestId('explore-plutchik'))
    await activate(page.getByTestId('plutchik-emotion-joy'), 'Space')
    await activate(page.getByTestId('plutchik-emotion-trust'))
    await activate(page.locator('.route-action button'))
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })
})

test('destructive confirmation traps focus, closes with Escape, and restores its trigger', async ({ page }) => {
  await openApp(page)
  await activate(page.getByRole('button', { name: 'Settings' }))
  await activate(page.getByRole('button', { name: 'Privacy & data' }))

  const trigger = page.getByRole('button', { name: 'Delete all local data' })
  await activate(trigger)
  const cancel = page.getByRole('button', { name: 'Cancel' })
  const confirm = page.getByRole('button', { name: 'Delete everything' })
  await expect(cancel).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('reduced motion, offline recovery, and save-disabled behavior remain functional', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page)
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)

  const transitionDuration = await page.getByTestId('quick-feeling-joy').evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  )
  const longestTransitionMs = Math.max(...transitionDuration.split(',').map((duration) => {
    const value = Number.parseFloat(duration)
    return duration.trim().endsWith('ms') ? value : value * 1000
  }))
  expect(longestTransitionMs).toBeLessThanOrEqual(0.01)

  await context.setOffline(true)
  await expect(page.getByRole('status')).toContainText(/offline/i)
  await context.setOffline(false)
  await expect(page.getByRole('status')).toHaveCount(0)

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Privacy & data' }).click()
  await page.getByRole('switch', { name: 'Save reflections on this device' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByTestId('quick-feeling-joy').click()
  await page.getByTestId('quick-continue').click()
  await finishReflection(page)
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByText('No saved reflections yet')).toBeVisible()
})

test.describe('desktop sanity viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  test('centers the shell and keeps primary visualizations bounded', async ({ page }) => {
    await openApp(page)
    const shell = await page.locator('.app-shell').boundingBox()
    expect(shell).not.toBeNull()
    expect(shell!.width).toBeLessThanOrEqual(922)
    expect(Math.abs(shell!.x - (1280 - shell!.width) / 2)).toBeLessThanOrEqual(1)
    await expectNoHorizontalOverflow(page)

    await openArrival(page)
    await page.getByTestId('arrival-affect').click()
    const affectStage = await page.locator('.model-stage-affect').boundingBox()
    const affectField = await page.getByRole('group', { name: 'Energy and pleasantness map' }).boundingBox()
    expect(affectField!.x).toBeGreaterThanOrEqual(affectStage!.x)
    expect(affectField!.x + affectField!.width).toBeLessThanOrEqual(affectStage!.x + affectStage!.width + 1)
    await page.getByRole('button', { name: 'Back' }).click()

    await page.getByRole('button', { name: 'Explore' }).click()
    await page.getByTestId('explore-plutchik').click()
    const wheel = await page.locator('.plutchik-wheel').boundingBox()
    const plutchikStage = await page.locator('.model-stage-plutchik').boundingBox()
    expect(wheel!.x).toBeGreaterThanOrEqual(plutchikStage!.x)
    expect(wheel!.x + wheel!.width).toBeLessThanOrEqual(plutchikStage!.x + plutchikStage!.width + 1)
    await expectNoHorizontalOverflow(page)
  })
})
