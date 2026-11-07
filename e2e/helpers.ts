import { expect, type Locator, type Page } from '@playwright/test'

export async function pressTab(page: Page) {
  // macOS WebKit uses Option+Tab to include native buttons in keyboard traversal.
  const key = process.platform === 'darwin' && page.context().browser()?.browserType().name() === 'webkit'
    ? 'Alt+Tab' : 'Tab'
  await page.keyboard.press(key)
}

export async function tabTo(target: Locator) {
  await expect(target).toBeVisible()
  for (let step = 0; step < 60; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await pressTab(target.page())
  }
  throw new Error(`Target not reachable after 60 sequential Tab presses: ${target}`)
}

export async function openApp(page: Page, options: { language?: 'en' | 'ro'; saveSessions?: boolean; theme?: 'light' | 'dark' } = {}) {
  const language = options.language ?? 'en'
  const saveSessions = options.saveSessions ?? true
  const theme = options.theme ?? 'light'
  await page.addInitScript(({ language: lang, save, selectedTheme }) => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', lang)
    localStorage.setItem('emot-id-save-sessions', String(save))
    localStorage.setItem('emot-id-theme', selectedTheme)
  }, { language, save: saveSessions, selectedTheme: theme })
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('today-screen')).toBeVisible()
}

export async function openArrival(page: Page) {
  await page.getByRole('button', { name: /help me choose|ajută-mă să aleg/i }).click()
  await expect(page.getByTestId('arrival-screen')).toBeVisible()
  await page.locator('.guide-all-routes').click()
}

export async function chooseWordOption(
  page: Page,
  name: string | RegExp,
  language: 'en' | 'ro' = 'en',
) {
  const listName = language === 'ro' ? 'Alege o direcție' : 'Choose one direction'
  await page.getByRole('list', { name: listName }).getByRole('button').filter({ hasText: name }).first().click()
}

export async function completeQuick(page: Page, emotionId = 'anxiety') {
  await page.getByTestId(`quick-feeling-${emotionId}`).click()
  await page.getByTestId('quick-continue').click()
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
}

export async function finishReflection(page: Page) {
  await page.getByRole('button', { name: /done for now|gata pentru acum/i }).click()
  await expect(page.getByTestId('today-screen')).toBeVisible()
}
