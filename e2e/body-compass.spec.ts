import { expect, test, type Page } from '@playwright/test'
import { openApp, openArrival } from './helpers'

test('keeps gratitude alone from four body suggestions and hands off only that word', async ({ page }) => {
  await openApp(page)
  await openBodyCompass(page)
  await page.locator('[data-region="chest"]').first().click({ force: true })
  await page.getByRole('button', { name: 'Warmth', exact: true }).click()
  await page.getByRole('button', { name: /^Moderate/ }).click()
  await page.getByRole('button', { name: 'See what might fit' }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(4)
  await page.getByRole('checkbox', { name: 'Gratitude', exact: true }).check()
  await page.getByRole('button', { name: 'Explore further' }).click()
  const link = await page.getByRole('link', { name: 'Explore in Google AI Mode' }).getAttribute('href')
  const url = new URL(link!)
  expect(url.searchParams.get('udm')).toBe('50')
  expect(url.searchParams.get('q')).toMatch(/gratitude/i)
  expect(url.searchParams.get('q')).not.toMatch(/tenderness|pride|love/i)
  await page.getByRole('button', { name: 'Done for now' }).click()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: /^Open reflection: gratitude/i }).click()
  await expect(page.getByTestId('session-detail-screen')).toContainText('Original suggestions')
  await expect(page.getByTestId('session-detail-screen')).toContainText('Tenderness')
})

test('keeps a mild pressure observation without inventing an emotion', async ({ page }) => {
  await openApp(page)
  await openBodyCompass(page)
  await page.locator('[data-region="chest"]').first().click({ force: true })
  await page.getByRole('button', { name: 'Pressure', exact: true }).click()
  await page.getByRole('button', { name: /^Mild/ }).click()
  await page.getByRole('button', { name: 'See what might fit' }).click()
  await expect(page.getByTestId('body-no-suggestion')).toBeVisible()
  await expect(page.getByTestId('body-signal-chest')).toContainText('Pressure - Mild')
  await page.getByRole('button', { name: 'Keep this body observation' }).click()
  await expect(page.getByRole('heading', { name: 'Body observation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Yes', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Done for now' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByText('Body observation', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /open reflection: chest/i }).click()
  await expect(page.getByTestId('session-detail-screen')).toContainText('Pressure')
  await expect(page.getByTestId('session-detail-screen')).toContainText('Mild')
})

async function openBodyCompass(page: Page) {
  await openArrival(page)
  await page.getByTestId('arrival-body').click()
  await expect(page.getByTestId('body-screen')).toBeVisible()
}

async function chooseChestSignal(page: Page) {
  await page.locator('[data-region="chest"]').first().click({ force: true })
  await page.getByRole('button', { name: 'Tension' }).click()
  await page.getByRole('button', { name: /moderate/i }).click()
  await expect(page.getByTestId('body-signal-chest')).toContainText('Tension - Moderate')
}

async function expectBodyLabelContrast(page: Page, state: string) {
  const ratios = await page.locator('[data-region-label]').evaluateAll((groups) => {
    const parse = (value: string) => {
      const channels = value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number)
      return channels?.length === 3 ? channels : null
    }
    const luminance = (color: number[]) => color
      .map((channel) => {
        const normalized = channel / 255
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)

    return groups.map((group) => {
      const foreground = parse(getComputedStyle(group.querySelector('text')!).fill)
      const background = parse(getComputedStyle(group.querySelector('rect:last-of-type')!).fill)
      if (!foreground || !background) return 0
      const first = luminance(foreground)
      const second = luminance(background)
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
    })
  })

  expect(Math.min(...ratios), `${state} body label contrast`).toBeGreaterThanOrEqual(4.5)
}

test.describe('Body Compass staged route', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('moves through area, sensation, and intensity into inline completion and Reflection', async ({ page }) => {
    await openBodyCompass(page)
    await expect(page.locator('.body-progress [aria-current="step"]')).toContainText('Area')

    await page.locator('[data-region="chest"]').first().click({ force: true })
    await expect(page.getByRole('heading', { name: 'What do you feel here?' })).toBeVisible()
    await expect(page.locator('.body-progress [aria-current="step"]')).toContainText('Sensation')

    await page.getByRole('button', { name: 'Tension' }).click()
    await expect(page.getByRole('heading', { name: 'How intense?' })).toBeVisible()
    await expect(page.locator('.body-progress [aria-current="step"]')).toContainText('Intensity')

    await page.getByRole('button', { name: /moderate/i }).click()
    await expect(page.getByRole('heading', { name: 'Where do you notice a body sensation?' })).toBeVisible()
    await expect(page.getByTestId('body-signal-chest')).toBeFocused()
    await expect(page.getByTestId('body-evidence-note')).toContainText(
      'Possible words come from broad group patterns and curated hypotheses.',
    )
    await expect(page.getByTestId('body-evidence-note')).toContainText(
      'They cannot identify a cause, diagnosis, or what you feel.',
    )
    expect(await page.getByTestId('body-evidence-note').evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).fontSize),
    )).toBeGreaterThanOrEqual(14)
    await page.getByRole('button', { name: 'See what might fit' }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.getByTestId('reflection-screen')).toContainText(/anxiety/i)
  })

  test('supports keyboard region activation and semantic light/dark map contrast', async ({ page }) => {
    await openBodyCompass(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expectBodyLabelContrast(page, 'light')

    await page.locator('html').evaluate((element) => {
      element.dataset.theme = 'dark'
    })
    await expectBodyLabelContrast(page, 'dark')

    const chest = page.getByRole('button', { name: 'Chest' })
    await chest.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'What do you feel here?' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('offers a semantic region list without duplicating the visual map', async ({ page }) => {
    await openBodyCompass(page)
    await page.getByRole('button', { name: 'List' }).click()

    await expect(page.getByTestId('bodymap-root')).toHaveCount(0)
    const list = page.getByRole('group', { name: 'Body areas' })
    const chest = list.getByRole('button', { name: 'Chest' })
    await expect(chest).toHaveAttribute('aria-pressed', 'false')
    await chest.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'What do you feel here?' })).toBeVisible()
  })

  test('keeps the inline signal, evidence, and action in document order on compact screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await openBodyCompass(page)
    await page.getByRole('button', { name: 'List' }).click()
    await page.getByRole('group', { name: 'Body areas' }).getByRole('button', { name: 'Chest' }).click()
    await page.getByRole('button', { name: 'Tension' }).click()
    await page.getByRole('button', { name: /moderate/i }).click()

    const signal = page.getByTestId('body-signal-chest')
    const evidence = page.getByTestId('body-evidence-note')
    const action = page.getByRole('button', { name: 'See what might fit' })
    await evidence.scrollIntoViewIfNeeded()
    expect(await action.locator('..').evaluate((element) => getComputedStyle(element).position)).toBe('static')

    const [signalBox, evidenceBox, actionBox] = await Promise.all([
      signal.boundingBox(),
      evidence.boundingBox(),
      action.boundingBox(),
    ])
    expect(signalBox).not.toBeNull()
    expect(evidenceBox).not.toBeNull()
    expect(actionBox).not.toBeNull()
    expect(signalBox!.y + signalBox!.height).toBeLessThanOrEqual(evidenceBox!.y)
    expect(evidenceBox!.y + evidenceBox!.height).toBeLessThanOrEqual(actionBox!.y)
  })

  test('supports body side, step back, draft skip, and a no-signal exit', async ({ page }) => {
    await openBodyCompass(page)
    await page.getByRole('button', { name: 'Back', exact: true }).nth(1).click()
    await expect(page.locator('[data-region="upper-back"]')).toHaveCount(1)
    await page.getByRole('button', { name: 'Front', exact: true }).click()

    await page.locator('[data-region="chest"]').first().click({ force: true })
    await page.getByRole('button', { name: 'Tension' }).click()
    await page.locator('.screen-back').click()
    await expect(page.getByRole('heading', { name: 'What do you feel here?' })).toBeVisible()

    await page.getByRole('button', { name: 'Choose another area' }).click()
    await expect(page.getByRole('heading', { name: 'Where do you notice a body sensation?' })).toBeVisible()
    await page.getByRole('button', { name: 'I do not notice anything right now' }).click()
    await expect(page.getByTestId('arrival-screen')).toBeVisible()
  })

  test('edits and removes signals without duplicating a body region', async ({ page }) => {
    await openBodyCompass(page)
    await chooseChestSignal(page)

    await page.getByRole('button', { name: 'Edit Chest' }).click()
    await page.getByRole('button', { name: 'Warmth' }).click()
    await page.getByRole('button', { name: /strong/i }).click()
    await expect(page.getByTestId('body-signal-chest')).toContainText('Warmth - Strong')
    await expect(page.locator('[data-testid="body-signal-chest"]')).toHaveCount(1)

    await page.getByRole('button', { name: 'Stomach' }).click()
    await page.getByRole('button', { name: 'Tension' }).click()
    await page.getByRole('button', { name: /moderate/i }).click()
    await expect(page.getByTestId('body-signal-stomach')).toBeVisible()

    await page.getByRole('button', { name: 'Remove Stomach' }).click()
    await expect(page.getByTestId('body-signal-stomach')).toHaveCount(0)
    await expect(page.getByTestId('body-signal-chest')).toBeVisible()
  })
})
