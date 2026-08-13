import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

const scenarios = [
  {
    language: 'en',
    theme: 'light',
    journal: 'Journal',
    unpack: 'Unpack a moment',
    situation: 'What happened?',
    optional: 'Optional',
    save: 'Save reflection',
    done: 'Done',
    exercises: 'Journal exercises',
    openExercises: 'Open journal exercises',
    recent: 'Recent reflections',
    clear: 'Delete journal exercises',
    confirm: 'Delete journal exercises?',
    cancel: 'Cancel',
    explore: 'Explore',
    practice: /practice emotional vocabulary/i,
    notSure: 'Not sure yet',
    uncertaintyFeedback: 'You can continue without choosing among these words.',
    continue: 'Continue',
    complete: 'Practice session completed',
    removedLabels: ['Clear choices', 'Unsure choices'],
  },
  {
    language: 'en',
    theme: 'dark',
    journal: 'Journal',
    unpack: 'Unpack a moment',
    situation: 'What happened?',
    optional: 'Optional',
    save: 'Save reflection',
    done: 'Done',
    exercises: 'Journal exercises',
    openExercises: 'Open journal exercises',
    recent: 'Recent reflections',
    clear: 'Delete journal exercises',
    confirm: 'Delete journal exercises?',
    cancel: 'Cancel',
    explore: 'Explore',
    practice: /practice emotional vocabulary/i,
    notSure: 'Not sure yet',
    uncertaintyFeedback: 'You can continue without choosing among these words.',
    continue: 'Continue',
    complete: 'Practice session completed',
    removedLabels: ['Clear choices', 'Unsure choices'],
  },
  {
    language: 'ro',
    theme: 'light',
    journal: 'Jurnal',
    unpack: 'Desfaceți un moment',
    situation: 'Ce s-a întâmplat?',
    optional: 'Opțional',
    save: 'Salvați reflecția',
    done: 'Gata',
    exercises: 'Exerciții de jurnal',
    openExercises: 'Deschideți exercițiile de jurnal',
    recent: 'Reflecții recente',
    clear: 'Ștergeți exercițiile din jurnal',
    confirm: 'Ștergeți exercițiile din jurnal?',
    cancel: 'Anulați',
    explore: 'Explorează',
    practice: /exersați vocabularul emoțional/i,
    notSure: 'Nu știu încă',
    uncertaintyFeedback: 'Puteți continua fără să alegeți dintre aceste cuvinte.',
    continue: 'Continuați',
    complete: 'Sesiunea de practică este finalizată',
    removedLabels: ['Alegeri clare', 'Alegeri nesigure'],
  },
  {
    language: 'ro',
    theme: 'dark',
    journal: 'Jurnal',
    unpack: 'Desfaceți un moment',
    situation: 'Ce s-a întâmplat?',
    optional: 'Opțional',
    save: 'Salvați reflecția',
    done: 'Gata',
    exercises: 'Exerciții de jurnal',
    openExercises: 'Deschideți exercițiile de jurnal',
    recent: 'Reflecții recente',
    clear: 'Ștergeți exercițiile din jurnal',
    confirm: 'Ștergeți exercițiile din jurnal?',
    cancel: 'Anulați',
    explore: 'Explorează',
    practice: /exersați vocabularul emoțional/i,
    notSure: 'Nu știu încă',
    uncertaintyFeedback: 'Puteți continua fără să alegeți dintre aceste cuvinte.',
    continue: 'Continuați',
    complete: 'Sesiunea de practică este finalizată',
    removedLabels: ['Alegeri clare', 'Alegeri nesigure'],
  },
] as const

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.body).toBeLessThanOrEqual(1)
}

for (const scenario of scenarios) {
  test(`simplifies Journal and word practice in ${scenario.language} ${scenario.theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await openApp(page, { language: scenario.language, theme: scenario.theme })
    await page.getByRole('button', { name: scenario.journal, exact: true }).click()
    await page.getByRole('button', { name: scenario.unpack }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.theme)
    await expect(page.getByRole('textbox')).toHaveCount(4)
    await expect(page.getByText(scenario.optional, { exact: true })).toHaveCount(3)
    const save = page.getByRole('button', { name: scenario.save })
    await expect(save).toBeDisabled()
    await page.getByLabel(scenario.situation).fill('One specific moment')
    await expect(save).toBeEnabled()
    await expectNoHorizontalOverflow(page)
    await save.click()
    await page.getByRole('button', { name: scenario.done }).click()

    await expect(page.getByTestId('journal-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: scenario.exercises })).toBeVisible()
    await expect(page.getByText('One specific moment')).toBeVisible()
    await expect(page.getByRole('button', { name: new RegExp(`${scenario.openExercises}.*One specific moment`, 'i') })).toBeInViewport()
    await expectNoHorizontalOverflow(page)

    await page.reload()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await page.getByRole('button', { name: scenario.journal, exact: true }).click()
    await expect(page.getByText('One specific moment')).toBeVisible()
    await page.getByRole('button', { name: new RegExp(`${scenario.openExercises}.*One specific moment`, 'i') }).click()
    await expect(page.getByText(scenario.recent)).toBeVisible()
    await expect(page.getByText('One specific moment')).toBeVisible()

    const clear = page.getByRole('button', { name: scenario.clear })
    await clear.click()
    await expect(page.getByRole('dialog', { name: scenario.confirm })).toBeVisible()
    const cancel = page.getByRole('button', { name: scenario.cancel })
    await expect(cancel).toBeFocused()
    await cancel.click()
    await expect(clear).toBeFocused()

    await page.locator('.screen-back').click()
    await expect(page.getByTestId('journal-screen')).toBeVisible()
    await page.getByRole('button', { name: scenario.explore, exact: true }).click()
    await page.getByRole('button', { name: scenario.practice }).click()
    for (let step = 0; step < 5; step += 1) {
      await page.getByRole('button', { name: scenario.notSure }).click()
      await expect(page.getByText(scenario.uncertaintyFeedback)).toBeVisible()
      const continueButton = page.getByRole('button', { name: scenario.continue })
      await expect(continueButton).toBeInViewport()
      await continueButton.click()
    }
    await expect(page.getByRole('heading', { name: scenario.complete })).toBeVisible()
    await expect(page.locator('.guided-summary')).toHaveCount(0)
    for (const label of scenario.removedLabels) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0)
    }
    await expectNoHorizontalOverflow(page)
  })
}
