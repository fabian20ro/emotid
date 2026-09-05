import { expect, test } from '@playwright/test'

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test.describe(`Language bootstrap ${language}/${theme}`, () => {
    test.use({ locale: language === 'ro' ? 'en-US' : 'ro-RO' })
    test('applies stored language before content, switches synchronously and survives reload', async ({ page }) => {
      const ro = language === 'ro'
      await page.addInitScript(({ language, theme }) => {
        localStorage.setItem('emot-id-onboarded', 'true')
        if (!localStorage.getItem('emot-id-language')) localStorage.setItem('emot-id-language', language)
        localStorage.setItem('emot-id-theme', theme)
        const state = window as typeof window & { languageCommits: Array<{ text: string; language: string }> }
        state.languageCommits = []
        new MutationObserver(() => {
          const heading = document.querySelector('h1')
          if (heading) state.languageCommits.push({ text: heading.textContent ?? '', language: document.documentElement.lang })
        }).observe(document, { subtree: true, childList: true, characterData: true })
      }, { language, theme })
      await page.goto('./')
      await expect(page.getByRole('heading', { name: ro ? 'Cum te simți?' : 'How are you feeling?', exact: true })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.getByRole('button', { name: ro ? 'Setări' : 'Settings', exact: true }).click()
      await page.getByRole('group', { name: ro ? 'Limbă' : 'Language', exact: true }).getByRole('button', { name: ro ? 'EN' : 'RO', exact: true }).click()
      await expect(page.getByRole('heading', { name: ro ? 'Settings' : 'Setări', exact: true })).toBeVisible()
      const commits = await page.evaluate(() => (window as typeof window & {
        languageCommits: Array<{ text: string; language: string }>
      }).languageCommits)
      const expected = {
        'Cum te simți?': 'ro', 'How are you feeling?': 'en', 'Setări': 'ro', 'Settings': 'en',
        'Opening this space': 'en', 'Se deschide acest spațiu': 'ro',
      }
      expect(commits.length).toBeGreaterThan(0)
      expect(commits).toContainEqual({ text: ro ? 'Cum te simți?' : 'How are you feeling?', language })
      expect(commits).toContainEqual({ text: ro ? 'Settings' : 'Setări', language: ro ? 'en' : 'ro' })
      for (const commit of commits) expect(commit.language, JSON.stringify(commit)).toBe(expected[commit.text as keyof typeof expected])
      await page.reload()
      await expect(page.getByRole('heading', { name: ro ? 'How are you feeling?' : 'Cum te simți?', exact: true })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', ro ? 'en' : 'ro')
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    })
  })
}
