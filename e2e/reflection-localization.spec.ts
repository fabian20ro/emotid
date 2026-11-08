import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { chooseWordOption, completeQuick, openArrival } from './helpers'
import { expectAccessibleTextContrast } from './contrast'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

test.use({ serviceWorkers: 'block' })

async function openOnce(page: Page, language: 'en' | 'ro', theme: 'light' | 'dark') {
  await page.goto('manifest.webmanifest')
  await page.evaluate(({ language, theme }) => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', language)
    localStorage.setItem('emot-id-theme', theme)
    localStorage.setItem('emot-id-save-sessions', 'true')
  }, { language, theme })
  await page.goto('./')
  await expect(page.getByTestId('today-screen')).toBeVisible()
}

async function switchLanguage(page: Page, from: 'en' | 'ro', to: 'en' | 'ro') {
  await page.getByRole('button', { name: (from === 'en' ? en : ro).navigation.settings, exact: true }).click()
  await page.getByRole('button', { name: to.toUpperCase(), exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', to)
  await page.getByRole('button', { name: (to === 'en' ? en : ro).navigation.back, exact: true }).click()
}

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  const copy = language === 'en' ? en : ro
  const otherLanguage = language === 'en' ? 'ro' : 'en'
  const other = otherLanguage === 'en' ? en : ro
  const need = language === 'en' ? 'grounding' : 'ancorare'
  const translatedNeed = otherLanguage === 'en' ? 'grounding' : 'ancorare'

  test(`saved choice identity survives language switches, reload and export (${language}/${theme})`, async ({ page }, testInfo) => {
    await openOnce(page, language, theme)
    await completeQuick(page)
    await page.getByRole('button', { name: copy.reflectionScreen.yes, exact: true }).click()
    await page.getByRole('button', { name: copy.reflectionScreen.exploreMore }).click()
    await page.getByRole('button', { name: need, exact: true }).click()
    await page.getByRole('button', { name: copy.reflectionScreen.nextStep }).click()
    await page.getByRole('button', { name: copy.reflectionScreen.stepWrite }).click()
    await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
    const chosen = page.getByRole('button', { name: need, exact: true })
    await expect(chosen).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: copy.reflectionScreen.nextStep }).click()
    await expect(page.getByRole('button', { name: copy.reflectionScreen.stepWrite })).toHaveAttribute('aria-pressed', 'true')
    await expectAccessibleTextContrast(page, `localized choices ${language}/${theme}`)
    await page.screenshot({ path: testInfo.outputPath('localized-step.png') })
    await page.getByRole('button', { name: copy.reflectionScreen.keepStep }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await switchLanguage(page, language, otherLanguage)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', otherLanguage)
    await page.getByRole('button', { name: other.navigation.journal, exact: true }).click()
    await page.locator('.journal-list button').click()
    const details = page.getByTestId('session-detail-screen')
    await expect(details).toContainText(translatedNeed)
    await expect(details).toContainText(other.reflectionScreen.stepWrite)
    await switchLanguage(page, otherLanguage, language)
    await expect(details).toContainText(need)
    await expect(details).toContainText(copy.reflectionScreen.stepWrite)
    await page.screenshot({ path: testInfo.outputPath('localized-detail.png') })
    await page.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
    await page.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
    const downloaded = page.waitForEvent('download')
    await page.getByRole('button', { name: copy.privacyData.export, exact: true }).click()
    const data = JSON.parse(await readFile((await (await downloaded).path())!, 'utf8'))
    expect(data.sessions).toHaveLength(1)
    expect(data.sessions[0]).toMatchObject({ selectedNeedId: 'grounding', nextStepId: 'write',
      selectedNeed: need, nextStep: copy.reflectionScreen.stepWrite, reflectionAnswer: 'yes' })
  })

  test(`legacy details and Romanian count grammar remain readable (${language}/${theme})`, async ({ page }, testInfo) => {
    await openOnce(page, language, theme)
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    await expect(page.locator('.journal-stats')).toHaveCount(0)
    await page.goto('manifest.webmanifest')
    await page.evaluate(() => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('emot-id-sessions')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('sessions', 'readwrite')
        for (let index = 0; index < 20; index++) {
          const id = `legacy-${index}`
          tx.objectStore('sessions').put({ id, timestamp: Date.now() - index, modelId: 'wheel', entryRoute: 'words',
            selections: [], crisisTier: 'none', selectedNeed: 'My original need', nextStep: 'My original step',
            results: [{ id, label: { en: id, ro: id }, color: '#176b60' }] }, id)
        }
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onabort = () => { db.close(); reject(tx.error) }
      }
    }))
    await page.goto('./')
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    const stats = page.locator('.journal-stats')
    await expect(stats).toContainText(language === 'en' ? '20 entries included' : '20 de înregistrări incluse')
    await expect(stats).toContainText(language === 'en' ? '20 different words' : '20 de cuvinte diferite')
    await expectAccessibleTextContrast(page, `localized counts ${language}/${theme}`)
    await page.screenshot({ path: testInfo.outputPath('localized-counts.png') })
    await page.locator('.journal-list button').first().click()
    await expect(page.getByTestId('session-detail-screen')).toContainText('My original need')
    await expect(page.getByTestId('session-detail-screen')).toContainText('My original step')
    await switchLanguage(page, language, otherLanguage)
    await expect(page.getByTestId('session-detail-screen')).toContainText('My original need')
    await expect(page.getByTestId('session-detail-screen')).toContainText('My original step')
  })

  test(`repelled is selectable and distinct from rejected (${language}/${theme})`, async ({ page }, testInfo) => {
    await openOnce(page, language, theme)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await chooseWordOption(page, language === 'en' ? 'Disgusted' : 'Dezgustat', language)
    await chooseWordOption(page, language === 'en' ? 'Repelled' : 'Repulsie', language)
    const label = language === 'en' ? 'Repelled' : 'Repulsie'
    const continueButton = page.getByRole('button', { name: new RegExp(`${language === 'en' ? 'Continue with' : 'Continuă cu'} ${label}$`) })
    await expect(continueButton).toBeInViewport()
    await page.screenshot({ path: testInfo.outputPath('repelled-selection.png') })
    await continueButton.click()
    await expect(page.locator('.emotion-heading')).toContainText(label)
    await page.getByRole('button', { name: copy.reflectionScreen.done }).click()
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    await page.locator('.journal-list button').click()
    await expect(page.getByTestId('session-detail-screen')).toContainText(label)
    await expect(page.getByTestId('session-detail-screen')).not.toContainText(language === 'en' ? 'Rejected' : 'Respins')
  })
}
