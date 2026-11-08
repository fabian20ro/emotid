import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { chooseWordOption, finishReflection, openApp, openArrival } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

test.use({ serviceWorkers: 'block' })

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`a multi-parent word keeps its chosen path, relationship and support metadata (${language}/${theme})`, async ({ page }, testInfo) => {
    const copy = language === 'en' ? en : ro
    await openApp(page, { language, theme })
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    for (const word of language === 'en' ? ['Sad', 'Vulnerable', 'Helpless'] : ['Trist', 'Vulnerabil', 'Neajutorat']) {
      await chooseWordOption(page, word, language)
    }
    await page.getByRole('button', { name: language === 'en' ? 'Continue with Helpless' : 'Continuă cu Neajutorat', exact: true }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await finishReflection(page)
    await page.reload()
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    await page.locator('.journal-list button').click()
    const detail = page.getByTestId('session-detail-screen')
    await expect(detail).toContainText(copy.sessionDetail.relationship.named)
    await expect(detail).toContainText(language === 'en' ? 'Helpless' : 'Neajutorat')
    await page.screenshot({ path: testInfo.outputPath('named-word-detail.png') })
    await page.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
    await page.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
    const downloaded = page.waitForEvent('download')
    await page.getByRole('button', { name: copy.privacyData.export, exact: true }).click()
    const data = JSON.parse(await readFile((await (await downloaded).path())!, 'utf8'))
    expect(data.sessions).toHaveLength(1)
    expect(data.sessions[0]).toMatchObject({ entryRoute: 'words', modelId: 'wheel', crisisTier: 'tier1' })
    expect(data.sessions[0].outcome).toBeUndefined()
    expect(data.sessions[0].results[0].hierarchyPath).toEqual([
      { en: 'Sad', ro: 'Trist' }, { en: 'Vulnerable', ro: 'Vulnerabil' }, { en: 'Helpless', ro: 'Neajutorat' },
    ])
  })
}
