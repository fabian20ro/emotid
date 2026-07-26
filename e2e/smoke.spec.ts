import { test, expect } from '@playwright/test'
import { completeQuick, finishReflection, openApp, openArrival } from './helpers'

test.describe('First run and shell', () => {
  test('completes onboarding without selecting a theory', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('dialog')).toContainText(/exploration, not a test/i)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('dialog')).toContainText(/every emotion has a purpose/i)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Privacy & data' })).toBeVisible()
    await expect(page.getByRole('dialog')).not.toContainText(/Plutchik|Emotion Wheel/)
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
  })

  test('navigates Today, Explore, Journal and supports browser Back', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Start a check-in' }).click()
    await expect(page.getByTestId('arrival-screen')).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId('today-screen')).toBeVisible()

    await page.getByRole('button', { name: 'Explore' }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByTestId('journal-screen')).toBeVisible()
  })

  test('switches language and shows offline state', async ({ page, context }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RO' }).click()
    await expect(page.getByRole('heading', { name: 'Setări' })).toBeVisible()
    await page.getByRole('button', { name: 'Înapoi' }).click()
    await expect(page.getByRole('button', { name: 'Astăzi' })).toBeVisible()

    await context.setOffline(true)
    await expect(page.getByRole('status')).toContainText(/offline/i)
    await context.setOffline(false)
  })
})

test.describe('Primary check-in routes', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('quick feeling reaches Meaning + Need and saves to Journal', async ({ page }) => {
    await completeQuick(page, 'anxiety')
    await expect(page.getByRole('heading', { name: 'What may be here' })).toBeVisible()
    await expect(page.getByText(/best judge of what fits/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'grounding, breath, and present focus' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Yes' }).click()
    await finishReflection(page)

    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByTestId('journal-screen')).toContainText(/anxiety/i)
    await page.getByRole('button', { name: /open reflection: anxiety/i }).click()
    await expect(page.getByTestId('session-detail-screen')).toContainText(/yes/i)
    await expect(page.getByTestId('session-detail-screen')).toContainText('grounding, breath, and present focus')
  })

  test('does not persist when local saving is disabled', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Privacy & data' }).click()
    await page.getByRole('switch', { name: 'Save completed check-ins' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await completeQuick(page, 'joy')
    await finishReflection(page)
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByText('No saved reflections yet')).toBeVisible()
  })

  test('Body Compass collects region, sensation, intensity and reflects', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-body').click()
    await expect(page.getByTestId('body-screen')).toBeVisible()
    expect(await page.locator('.app-content').evaluate((element) => element.scrollTop)).toBe(0)
    await page.getByRole('button', { name: 'Front', exact: true }).click()

    await page.locator('[data-region="chest"]').first().click({ force: true })
    await expect(page.getByRole('heading', { name: 'What do you feel here?' })).toBeVisible()
    await page.getByRole('button', { name: 'Tension' }).click()
    await page.getByRole('button', { name: /moderate/i }).click()
    await expect(page.getByRole('heading', { name: 'Review your body signals' })).toBeVisible()
    await page.getByRole('button', { name: 'See what might fit' }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Affect Map reveals suggestions after placement', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-affect').click()
    const plot = page.getByTestId('dimensional-plot-container').locator('svg')
    await expect(plot).toBeVisible()
    const box = await plot.boundingBox()
    expect(box).not.toBeNull()
    await plot.click({ position: { x: box!.width * 0.7, y: box!.height * 0.25 }, force: true })
    await expect(page.getByTestId('affect-readout')).toBeVisible()
    const tray = page.getByTestId('dimensional-suggestion-tray')
    const firstSuggestion = tray.locator('.dimensional-suggestion-chip').first()
    await expect(firstSuggestion).toBeInViewport()
    await firstSuggestion.click()
    await expect(firstSuggestion).toHaveAttribute('aria-pressed', 'true')
    await expect(tray).toBeVisible()
    await page.getByRole('button', { name: 'Reflect on these words' }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Word Ladder moves broad to precise and reflects', async ({ page }) => {
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    const options = page.getByRole('list', { name: 'Choose one direction' })
    await options.getByRole('button').first().click()
    await options.getByRole('button').first().click()
    await options.getByRole('button').first().click()
    await expect(page.locator('.route-action button')).toBeEnabled()
    await page.locator('.route-action button').click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
  })

  test('Plutchik combines two primary emotions in a stable wheel', async ({ page }) => {
    await page.getByRole('button', { name: 'Explore' }).click()
    await page.getByTestId('explore-plutchik').click()
    const wheel = page.getByRole('group', { name: 'Eight primary emotions arranged as a wheel' })
    await expect(wheel).toBeVisible()
    await expect(page.getByTestId(/^plutchik-emotion-/)).toHaveCount(8)
    await page.getByTestId('plutchik-emotion-joy').click()
    await page.getByTestId('plutchik-emotion-trust').click()
    await expect(page.getByTestId('plutchik-combination')).toContainText(/joy \+ trust.*love/i)
    await expect(page.getByTestId('plutchik-emotion-anger')).toBeDisabled()
    await expect(page.locator('.route-action button')).toBeEnabled()
  })
})

test.describe('Safety behavior through the UI', () => {
  test('tier 4 support is first and gates reflection details', async ({ page }) => {
    await openApp(page)
    await page.evaluate(() => localStorage.setItem('emot-id-allow-external-ai', 'true'))
    await page.reload()
    await openArrival(page)
    await page.getByTestId('arrival-words').click()

    const choose = async (name: RegExp) => page.getByRole('list', { name: 'Choose one direction' }).getByRole('button', { name }).click()

    await choose(/^sad/i)
    await choose(/^despair/i)
    await page.getByRole('button', { name: 'Use Despair' }).click()

    await choose(/^sad/i)
    await choose(/^depressed/i)
    await choose(/^empty/i)

    await choose(/^fearful/i)
    await choose(/^weak/i)
    await choose(/^worthless/i)

    await page.locator('.route-action button').click()
    await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(page.locator('.emotion-heading')).not.toBeVisible()
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toHaveCount(0)
    await expect(alert).toContainText(/do not tell Emot-ID whether you are in danger/i)
    await expect(alert.getByRole('link', { name: /deprehub/i })).toHaveAttribute('href', 'tel:+40374456420')
    await expect(page.getByRole('button', { name: 'Continue to reflection' })).toBeVisible()

    const alertBox = await alert.boundingBox()
    const ackBox = await page.getByRole('button', { name: 'Continue to reflection' }).boundingBox()
    expect(alertBox!.y).toBeLessThan(ackBox!.y)

    await page.getByRole('button', { name: 'Continue to reflection' }).click()
    await expect(page.locator('.emotion-heading')).toContainText(/despair/i)
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toBeVisible()
  })
})

test.describe('Privacy and support destinations', () => {
  test('allows the existing Google AI Mode link by default and persists opt-out', async ({ page }) => {
    await openApp(page)
    await completeQuick(page, 'anxiety')
    const link = page.getByRole('link', { name: 'Explore with AI' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
    const href = await link.getAttribute('href')
    const url = new URL(href!)
    expect(url.origin + url.pathname).toBe('https://www.google.com/search')
    expect(url.searchParams.get('udm')).toBe('50')
    expect(url.searchParams.get('q')).toBe(
      'I feel anxiety. What does this emotion mean and how can I understand it better?',
    )
    await expect(page.getByText(/opens Google AI Mode with a fixed question/i)).toBeVisible()
    await expect(page.getByText(/not a substitute for professional support/i)).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Privacy & data' }).click()
    const aiSwitch = page.getByRole('switch', { name: 'Allow external AI search links' })
    await expect(aiSwitch).toBeChecked()
    await aiSwitch.click()
    await expect(aiSwitch).not.toBeChecked()

    await page.reload()
    await completeQuick(page, 'joy')
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toHaveCount(0)
    await expect(page.getByText(/external AI search is off/i)).toBeVisible()
  })

  test('settings separates privacy and support from product navigation', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Privacy & data' }).click()
    await expect(page.getByTestId('privacy-screen')).toContainText(/no account, analytics, or cloud sync/i)
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Support' }).click()
    await expect(page.getByTestId('support-screen')).toContainText('0374 456 420')
  })
})
