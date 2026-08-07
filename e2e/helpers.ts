import { expect, type Page } from '@playwright/test'

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
  await page.getByRole('button', { name: /start a check-in|începeți o verificare/i }).click()
  await expect(page.getByTestId('arrival-screen')).toBeVisible()
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
