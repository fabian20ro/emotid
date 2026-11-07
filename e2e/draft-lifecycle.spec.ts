import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp, openArrival } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }

async function holdWriteAcknowledgment(page: Page, store = 'entries') {
  await page.evaluate((store) => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      const request = original.call(this, value, key)
      if (this.name === store) {
        IDBObjectStore.prototype.put = original
        const tx = this.transaction
        const complete = tx.oncomplete
        tx.oncomplete = (event) => {
          Object.assign(window, { releaseWrite: () => complete?.call(tx, event) })
        }
      }
      return request
    }
  }, store)
}

async function releaseWrite(page: Page) {
  await page.evaluate(() => (window as unknown as { releaseWrite: () => void }).releaseWrite())
}

async function openExercise(page: Page) {
  await openApp(page)
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment' }).click()
}

test('exercise pending state survives Journal navigation and saves only once', async ({ page }) => {
  await openExercise(page)
  await page.locator('#chain-situation').fill('Pending across navigation')
  await holdWriteAcknowledgment(page)
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await page.waitForFunction(() => 'releaseWrite' in window)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment' }).click()
  await expect(page.locator('#chain-situation')).toHaveValue('Pending across navigation')
  await expect(page.locator('#chain-situation')).toBeDisabled()
  await releaseWrite(page)
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible()
  await expect(page.locator('.guided-recent-list button')).toHaveCount(1)
})

test('failed exercise retains editable text across navigation and retry', async ({ page }) => {
  await openExercise(page)
  await page.locator('#chain-situation').fill('Retry this text')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'entries') {
        IDBObjectStore.prototype.put = original
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      }
      return original.call(this, value, key)
    }
  })
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment' }).click()
  await expect(page.locator('#chain-situation')).toHaveValue('Retry this text')
  await expect(page.locator('#chain-situation')).toBeEnabled()
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible()
})

test('exercise-only erasure invalidates an already saved confirmation', async ({ page }) => {
  await openExercise(page)
  await page.locator('#chain-situation').fill('Erase this record')
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete journal exercises', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete exercises', exact: true }).click()
  await expect(page.locator('#chain-situation')).toHaveValue('')
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toHaveCount(0)
})

test('exercise-only erasure invalidates a delayed acknowledgment but preserves unrelated drafts', async ({ page }) => {
  await openExercise(page)
  await page.locator('#chain-situation').fill('First record')
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await page.getByRole('button', { name: 'Read saved reflections' }).click()
  await page.getByRole('button', { name: 'Write a new reflection' }).click()
  await page.locator('#chain-situation').fill('Pending record')
  await holdWriteAcknowledgment(page)
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await page.waitForFunction(() => 'releaseWrite' in window)
  await expect(page.locator('#chain-situation')).toBeDisabled()
  await page.getByRole('button', { name: 'Delete journal exercises', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete exercises', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await releaseWrite(page)
  await expect(page.locator('#chain-situation')).toHaveValue('')
  await expect(page.locator('#chain-situation')).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toHaveCount(0)
  await page.locator('#chain-situation').fill('One saved record')
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await page.getByRole('button', { name: 'Read saved reflections' }).click()
  await page.getByRole('button', { name: 'Write a new reflection' }).click()
  await page.locator('#chain-situation').fill('Keep this unsaved draft')
  await page.getByRole('button', { name: 'Delete journal exercises', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete exercises', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#chain-situation')).toHaveValue('Keep this unsaved draft')
})

test('rejected reflection cannot reenter hidden exploration through Forward', async ({ page }) => {
  await openApp(page)
  await completeQuick(page, 'anxiety')
  await page.getByRole('button', { name: 'Explore further' }).click()
  await page.getByRole('button', { name: 'Try one small step' }).click()
  await page.goBack()
  await expect(page.getByTestId('reflection-exploration-screen')).toBeVisible()
  await page.goBack()
  await page.getByRole('button', { name: en.reflectionScreen.no, exact: true }).click()
  await page.evaluate(() => new Promise<void>((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true })
    window.history.forward()
  }))
  await expect.poll(() => page.evaluate(() => {
    const state = window.history.state.emotIdNavigation
    return state?.stack?.at(-1)?.view ?? 'result'
  })).toBe('result')
  await page.getByRole('button', { name: 'Yes', exact: true }).click()
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
  await expect(page.getByTestId('reflection-exploration-screen')).toHaveCount(0)
})

test('browser Back leaves a failed optional save without losing the choices', async ({ page }) => {
  await openApp(page)
  await completeQuick(page, 'anxiety')
  await expect(page.getByTestId('session-save-status')).toHaveClass(/is-saved/)
  await page.getByRole('button', { name: 'Explore further' }).click()
  await page.getByRole('button', { name: 'Try one small step' }).click()
  const choice = page.getByRole('button', { name: en.reflectionScreen.stepWrite, exact: true })
  await choice.click()
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'sessions') {
        IDBObjectStore.prototype.put = original
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      }
      return original.call(this, value, key)
    }
  })
  await page.getByRole('button', { name: 'Keep this step' }).click()
  await expect(page.getByTestId('reflection-save-error-screen')).toBeVisible()
  await page.goBack()
  await expect(page.getByTestId('reflection-exploration-screen')).toBeVisible()
  const need = page.getByRole('group', { name: en.reflectionScreen.needPrompt }).getByRole('button').first()
  const selectedNeed = await need.textContent()
  await need.click()
  await page.getByRole('button', { name: 'Try one small step' }).click()
  await expect(choice).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: en.reflectionScreen.keepStep }).click()
  await expect(page.getByTestId('today-screen')).toBeVisible()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.locator('.journal-list button').click()
  await expect(page.getByTestId('session-detail-screen')).toContainText(selectedNeed!)
})

test('a delayed finalization cannot close a newer same-session revision', async ({ page }) => {
  await openApp(page)
  await openArrival(page)
  await page.getByTestId('arrival-body').click()
  await page.getByRole('button', { name: 'Chest', exact: true }).click()
  await page.getByRole('button', { name: 'Warmth', exact: true }).click()
  await page.getByRole('button', { name: /moderate/i }).click()
  await page.locator('.route-action button').click()
  await expect(page.getByTestId('session-save-status')).toHaveClass(/is-saved/)
  await holdWriteAcknowledgment(page, 'sessions')
  await page.getByRole('button', { name: en.reflectionScreen.done }).click()
  await page.waitForFunction(() => 'releaseWrite' in window)
  await page.goBack()
  await page.getByRole('button', { name: 'Edit Chest', exact: true }).click()
  await page.getByRole('button', { name: 'Heaviness', exact: true }).click()
  await page.getByRole('button', { name: /strong/i }).click()
  await page.locator('.route-action button').click()
  await expect(page.getByRole('checkbox')).toHaveCount(2)
  await releaseWrite(page)
  await expect(page.getByTestId('session-save-status')).toHaveClass(/is-saved/)
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(2)
})

test('privacy clear discards the exercise draft and ignores its delayed acknowledgment', async ({ page }) => {
  await openExercise(page)
  await page.locator('#chain-situation').fill('Private erased draft')
  await holdWriteAcknowledgment(page)
  await page.getByRole('button', { name: en.chainAnalysis.save, exact: true }).click()
  await page.waitForFunction(() => 'releaseWrite' in window)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Privacy & data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete everything', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Local data was deleted')
  await releaseWrite(page)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-screen')).not.toContainText('Private erased draft')
  await page.getByRole('button', { name: 'Unpack a moment' }).click()
  await expect(page.locator('#chain-situation')).toHaveValue('')
  await expect(page.locator('#chain-situation')).toBeEnabled()
  await page.reload()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-screen')).not.toContainText('Private erased draft')
})
