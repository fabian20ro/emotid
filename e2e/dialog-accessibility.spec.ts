import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

type Confirmation = 'privacy' | 'reflection' | 'exercises' | 'exercise' | 'draft'

async function openConfirmation(page: Page, copy: typeof en, kind: Confirmation) {
  if (kind === 'privacy') {
    await page.getByRole('button', { name: copy.settingsScreen.title, exact: true }).click()
    await page.getByRole('button', { name: copy.privacyData.title, exact: true }).click()
  } else {
    if (kind === 'reflection') {
      await completeQuick(page)
      await page.getByRole('button', { name: copy.reflectionScreen.done, exact: true }).click()
    }
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    if (kind === 'reflection') await page.locator('.journal-list button').click()
    else {
      await page.getByRole('button', { name: copy.journalScreen.unpack, exact: true }).click()
      await page.locator('#chain-situation').fill('Synthetic journal exercise')
      if (kind !== 'draft') {
        await page.getByRole('button', { name: copy.chainAnalysis.save, exact: true }).click()
        await expect(page.getByRole('heading', { name: copy.chainAnalysis.savedTitle })).toBeVisible()
        if (kind === 'exercise') await page.locator('.guided-recent-list button').click()
      }
    }
  }
  const names = {
    privacy: [copy.privacyData.clear, copy.privacyData.cancel, copy.privacyData.confirmAction, copy.privacyData.clearError],
    reflection: [copy.sessionDetail.delete, copy.sessionDetail.cancel, copy.sessionDetail.confirmAction, copy.sessionDetail.deleteError],
    exercises: [copy.chainAnalysis.clear, copy.chainAnalysis.cancel, copy.chainAnalysis.confirmAction, copy.chainAnalysis.clearError],
    exercise: [copy.chainAnalysis.deleteOne, copy.chainAnalysis.cancel, copy.chainAnalysis.deleteOne, copy.chainAnalysis.clearError],
    draft: [copy.chainAnalysis.discardDraft, copy.chainAnalysis.cancel, copy.chainAnalysis.discardDraft, ''],
  }[kind]
  const trigger = page.getByRole('button', { name: names[0], exact: true })
  await trigger.click()
  return { trigger, cancel: names[1], confirm: names[2], error: names[3] }
}

async function holdErasureFailure(page: Page, kind: Exclude<Confirmation, 'draft'>) {
  await page.evaluate((kind) => {
    const clear = IDBObjectStore.prototype.clear
    const remove = IDBObjectStore.prototype.delete
    const hold = (store: IDBObjectStore) => {
      if (store.name !== (kind === 'reflection' ? 'sessions' : 'entries')) return
      IDBObjectStore.prototype.clear = clear
      IDBObjectStore.prototype.delete = remove
      const tx = store.transaction
      const abort = tx.onabort
      // Hold notification of a real abort, not the physical transaction itself.
      tx.onabort = (event) => Object.assign(window, { releaseErasureFailure: () => abort?.call(tx, event) })
      tx.abort()
    }
    IDBObjectStore.prototype.clear = function () { const request = clear.call(this); hold(this); return request }
    IDBObjectStore.prototype.delete = function (key) { const request = remove.call(this, key); hold(this); return request }
  }, kind)
}

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  const copy = language === 'en' ? en : ro
  for (const kind of ['privacy', 'reflection', 'exercises', 'exercise', 'draft'] as const) {
    test(`${kind} confirmation: keyboard, short viewport, cancel and focus return (${language}/${theme})`, async ({ page }, testInfo) => {
      await openApp(page, { language, theme })
      const { trigger, cancel, confirm } = await openConfirmation(page, copy, kind)
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('button', { name: cancel, exact: true })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await page.keyboard.press('Enter')
      await page.setViewportSize({ width: 320, height: 256 })
      await expect.poll(() => dialog.evaluate((element) => {
        const box = element.getBoundingClientRect()
        return box.top >= 0 && box.bottom <= window.innerHeight && box.left >= 0 && box.right <= window.innerWidth
      })).toBe(true)
      await page.keyboard.press('Tab')
      const action = dialog.getByRole('button', { name: confirm, exact: true })
      await expect(action).toBeFocused()
      await expect(action).toBeInViewport()
      await page.screenshot({ path: testInfo.outputPath('short-dialog.png') })
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: cancel, exact: true })).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(action).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Enter')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await expect(trigger).toBeInViewport()
    })

    if (kind === 'draft') continue
    test(`${kind} pending erasure: retained focus, error and retry (${language}/${theme})`, async ({ page }, testInfo) => {
      await openApp(page, { language, theme })
      const { cancel, error } = await openConfirmation(page, copy, kind)
      const dialog = page.getByRole('dialog')
      await holdErasureFailure(page, kind)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => 'releaseErasureFailure' in window)
      await expect(dialog).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(dialog).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(dialog).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await page.evaluate(() => (window as unknown as { releaseErasureFailure: () => void }).releaseErasureFailure())
      await expect(dialog.getByRole('alert')).toHaveText(error)
      await page.screenshot({ path: testInfo.outputPath('erasure-error.png') })
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: cancel, exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(dialog).toHaveCount(0)
      if (kind === 'privacy') {
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await expect(page.getByRole('status')).toContainText(en.privacyData.clearSuccess)
      }
      else if (kind === 'reflection') {
        await expect(page.getByTestId('journal-screen')).toBeVisible()
        await expect(page.locator('.journal-list button')).toHaveCount(0)
      } else await expect(page.locator('.guided-recent-list button')).toHaveCount(0)
    })
  }
}
