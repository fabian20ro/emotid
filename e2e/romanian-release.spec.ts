import { expect, test, type Page } from '@playwright/test'
import { finishReflection, openApp, openArrival } from './helpers'

async function openRomanianApp(page: Page) {
  await openApp(page, { language: 'ro' })
}

async function chooseWord(page: Page, name: string | RegExp) {
  await page
    .getByRole('list', { name: 'Alegeți o direcție' })
    .getByRole('button', { name })
    .click()
}

test.describe('Romanian release journeys', () => {
  test('Quick reaches a localized reflection and close state', async ({ page }) => {
    await openRomanianApp(page)
    await page.getByTestId('quick-feeling-anxiety').click()

    await expect(page.getByRole('heading', { name: 'Ce ar putea fi aici' })).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText('anxietate')
    await expect(page.getByText(/păstrați doar cuvintele care se potrivesc experienței voastre/i)).toBeVisible()
    const moreContext = page.locator('.more-context')
    await moreContext.getByText('Mai mult context').click()
    await expect(moreContext).toContainText(/cea mai apropiată potrivire dintre aceste sugestii/i)
    await expect(moreContext).not.toContainText(/experimentezi un semnal|sistemul tău răspunde/i)
    await expect(page.getByRole('button', { name: 'ancorare, respiratie si prezenta' })).toHaveAttribute('aria-pressed', 'false')
    await finishReflection(page)
  })

  test('Body Compass completes in Romanian', async ({ page }) => {
    await openRomanianApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-body').click()

    await page.getByRole('button', { name: 'Piept' }).click()
    await page.getByRole('button', { name: 'Tensiune' }).click()
    await page.getByRole('button', { name: /Moderată/i }).click()
    await expect(page.getByRole('heading', { name: 'Verificați semnalele corpului' })).toBeVisible()
    await expect(page.getByTestId('body-evidence-note')).toContainText(
      'Cuvintele posibile provin din tipare generale de grup și ipoteze selectate.',
    )
    await expect(page.getByTestId('body-evidence-note')).toContainText(
      'Nu pot identifica o cauză, un diagnostic sau ceea ce simțiți.',
    )
    await page.locator('.route-action button').click()

    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ce ar putea fi aici' })).toBeVisible()
  })

  test('Affect Map supports a localized keyboard placement journey', async ({ page }) => {
    await openRomanianApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-affect').click()

    const field = page.getByRole('group', { name: 'Hartă a energiei și caracterului plăcut' })
    await field.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowUp')
    await expect(page.getByRole('status')).toContainText('mai multă energie, mai plăcut')

    const suggestion = page.locator('.dimensional-suggestion-chip').first()
    await suggestion.focus()
    await page.keyboard.press('Enter')
    await expect(suggestion).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Reflectați la aceste cuvinte' }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Word Ladder completes with localized hierarchy controls', async ({ page }) => {
    await openRomanianApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()

    await chooseWord(page, 'Fericit')
    await page.getByRole('button', { name: 'Adăugați Fericit' }).click()
    await page.locator('.route-action button').click()

    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText('Fericit')
  })

  test('Plutchik combines and reflects on two Romanian primary emotions', async ({ page }) => {
    await openRomanianApp(page)
    await page.getByRole('button', { name: 'Explorează' }).click()
    await page.getByTestId('explore-plutchik').click()

    await page.getByTestId('plutchik-emotion-joy').click()
    await page.getByTestId('plutchik-emotion-trust').click()
    await expect(page.getByTestId('plutchik-combination')).toContainText(/bucurie \+ încredere/i)
    await page.locator('.route-action button').click()

    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText(/iubire/i)
  })

  test('Journal opens a saved Romanian reflection', async ({ page }) => {
    await openRomanianApp(page)
    await page.getByTestId('quick-feeling-joy').click()
    await finishReflection(page)

    await page.getByRole('button', { name: 'Jurnal', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Firul vostru emoțional' })).toBeVisible()
    await expect(page.locator('.journal-list')).toContainText(/bucurie/i)
    await page.locator('.journal-list button').click()
    await expect(page.getByTestId('session-detail-screen')).toContainText('Ce ați numit')
  })

  test('Privacy exposes localized defaults and persists save opt-out', async ({ page }) => {
    await openRomanianApp(page)
    await page.getByRole('button', { name: 'Setări' }).click()
    await page.getByRole('button', { name: 'Confidențialitate și date' }).click()

    const saving = page.getByRole('switch', { name: 'Salvați verificările încheiate' })
    const external = page.getByRole('switch', { name: 'Permiteți legături externe de căutare AI' })
    await expect(saving).toBeChecked()
    await expect(external).toBeChecked()
    await saving.click()
    await expect(saving).not.toBeChecked()
    await expect(external).toBeChecked()
    expect(await page.evaluate(() => localStorage.getItem('emot-id-save-sessions'))).toBe('false')
  })

  test('tier-4 safety gates Romanian reflection details until acknowledgement', async ({ page }) => {
    await openRomanianApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()

    await chooseWord(page, /^Trist$/i)
    await chooseWord(page, /^disperare$/i)
    await page.getByRole('button', { name: /Adăugați disperare/i }).click()

    await chooseWord(page, /^Trist$/i)
    await chooseWord(page, /^Deprimat$/i)
    await chooseWord(page, /^Gol$/i)

    await chooseWord(page, /^Temator$/i)
    await chooseWord(page, /^Slab$/i)
    await chooseWord(page, /^Lipsit de valoare$/i)

    await page.locator('.route-action button').click()
    await expect(page.getByRole('alert')).toContainText(
      /nu îi arată aplicației Emot-ID dacă sunteți în pericol/i,
    )
    await expect(page.locator('.emotion-heading')).toHaveCount(0)
    await page.getByRole('button', { name: 'Continuați la reflecție' }).click()
    await expect(page.locator('.emotion-heading')).toContainText(/disperare/i)
  })
})
