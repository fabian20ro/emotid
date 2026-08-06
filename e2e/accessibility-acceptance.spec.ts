import { expect, test, type Page } from '@playwright/test'
import { openApp, openArrival } from './helpers'

async function expectScreenSemantics(page: Page, heading: RegExp, navigation = true) {
  const main = page.getByRole('main')
  const title = page.getByRole('heading', { level: 1, name: heading })

  await expect(page.locator('h1')).toHaveCount(1)
  await expect(main).toHaveAttribute('aria-labelledby', 'screen-title')
  await expect(title).toHaveAttribute('id', 'screen-title')
  await expect(title).toBeFocused()
  await expect(page.getByRole('navigation')).toHaveCount(navigation ? 1 : 0)
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.locator('.app-shell').evaluate((element) => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    shell: element.scrollWidth - element.clientWidth,
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.shell).toBeLessThanOrEqual(1)
}

async function placeFeeling(page: Page) {
  const field = page.getByRole('group', { name: /energy and pleasantness map|hartă a energiei și caracterului plăcut/i })
  await field.focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowUp')
  await page.locator('.dimensional-suggestion-chip').first().click()
  await page.getByRole('button', { name: /reflect on these words|reflectați la aceste cuvinte/i }).click()
}

test.describe('Critical journey semantics and focus', () => {
  test('introduction exposes progress and focuses each new explanation', async ({ page }) => {
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'This is an exploration, not a test' })).toBeFocused()
    await expect(dialog.getByRole('progressbar', { name: 'Introduction progress' })).toHaveAttribute('aria-valuenow', '1')
    await dialog.getByRole('button', { name: 'Next' }).click()
    await expect(dialog.getByRole('heading', { name: 'Emotions can be explored with curiosity' })).toBeFocused()
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  })

  for (const language of ['en', 'ro'] as const) {
    test(`${language} announces meaningful destinations through the Affect journey`, async ({ page }) => {
      await openApp(page, { language })
      await expectScreenSemantics(page, /how are you feeling|cum vă simțiți/i)
      await expect(page.getByRole('button', { name: /today|astăzi/i })).toHaveAttribute('aria-current', 'page')

      await openArrival(page)
      await expectScreenSemantics(page, /what feels easiest to notice|ce vă este cel mai ușor să observați/i)

      await page.getByTestId('arrival-affect').click()
      await expectScreenSemantics(page, /place the feeling|plasați starea/i, false)

      await placeFeeling(page)
      await expectScreenSemantics(page, /what seems to fit|ce pare să se potrivească/i, false)
    })
  }

  test('save recovery focuses the new context and limits urgent announcements', async ({ page }) => {
    await page.addInitScript(() => {
      const originalPut = IDBObjectStore.prototype.put
      let attempts = 0
      IDBObjectStore.prototype.put = function put(value: unknown, key?: IDBValidKey) {
        attempts += 1
        if (attempts === 2) {
          throw new DOMException('Simulated local save failure', 'QuotaExceededError')
        }
        return originalPut.call(this, value, key)
      }
    })
    await openApp(page)
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByTestId('quick-continue').click()
    await page.getByRole('button', { name: 'Done for now' }).click()

    await expectScreenSemantics(page, /the latest details were not saved/i, false)
    await expect(page.getByRole('alert')).toHaveCount(1)
    await expect(page.getByRole('alert')).toContainText(/nothing was sent online/i)
    await expect(page.getByRole('alert')).not.toContainText('Try saving again')

    await page.getByRole('button', { name: 'Try saving again' }).click()
    await expectScreenSemantics(page, /how are you feeling/i)
  })

  test('intermediary words focus the direct completion choice', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy', exact: true }).click()
    await page.getByRole('button', { name: 'Playful', exact: true }).click()

    const stop = page.getByRole('region', { name: 'This word can be your answer: Playful' })
    const finish = stop.getByRole('button', { name: 'Continue with Playful' })
    await expect(finish).toBeFocused()
    await expect(finish).toHaveAccessibleDescription('Or choose a more specific word below.')
  })
})

test.describe('200% desktop reflow equivalent', () => {
  test.use({ viewport: { width: 640, height: 400 }, isMobile: false, hasTouch: false })

  test('critical Affect and Reflection screens reflow without two-dimensional scrolling', async ({ page }) => {
    await openApp(page)
    await expectNoHorizontalOverflow(page)
    await openArrival(page)
    await expectNoHorizontalOverflow(page)
    await page.getByTestId('arrival-affect').click()
    await expectNoHorizontalOverflow(page)
    await placeFeeling(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('button', { name: 'Done for now' })).toBeVisible()
  })
})
