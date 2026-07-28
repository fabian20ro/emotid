import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp, openArrival } from './helpers'

type InstrumentedWindow = Window & { __sessionPutAttempts: number }

async function instrumentSessionWrites(page: Page, failures: number) {
  await page.addInitScript(({ failureCount }) => {
    const target = window as InstrumentedWindow
    const originalPut = IDBObjectStore.prototype.put
    let remainingFailures = failureCount
    target.__sessionPutAttempts = 0

    IDBObjectStore.prototype.put = function put(value: unknown, key?: IDBValidKey) {
      target.__sessionPutAttempts += 1
      if (remainingFailures < 0 || remainingFailures > 0) {
        if (remainingFailures > 0) remainingFailures -= 1
        throw new DOMException('Simulated local save failure', 'QuotaExceededError')
      }
      return originalPut.call(this, value, key)
    }
  }, { failureCount: failures })
}

async function failSessionWriteAttempts(page: Page, failedAttempts: number[]) {
  await page.addInitScript(({ attempts }) => {
    const target = window as InstrumentedWindow
    const originalPut = IDBObjectStore.prototype.put
    target.__sessionPutAttempts = 0

    IDBObjectStore.prototype.put = function put(value: unknown, key?: IDBValidKey) {
      target.__sessionPutAttempts += 1
      if (attempts.includes(target.__sessionPutAttempts)) {
        throw new DOMException('Simulated local save failure', 'QuotaExceededError')
      }
      return originalPut.call(this, value, key)
    }
  }, { attempts: failedAttempts })
}

async function delayTransactionCompletion(page: Page, delayMs: number) {
  await page.addInitScript(({ delay }) => {
    const descriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, 'oncomplete')
    if (!descriptor?.get || !descriptor.set) return

    Object.defineProperty(IDBTransaction.prototype, 'oncomplete', {
      configurable: true,
      get() {
        return descriptor.get!.call(this)
      },
      set(handler: ((this: IDBTransaction, event: Event) => unknown) | null) {
        descriptor.set!.call(
          this,
          handler
            ? function delayedCompletion(this: IDBTransaction, event: Event) {
                window.setTimeout(() => handler.call(this, event), delay)
              }
            : null,
        )
      },
    })
  }, { delay: delayMs })
}

async function putAttempts(page: Page) {
  return page.evaluate(() => (window as InstrumentedWindow).__sessionPutAttempts)
}

test.describe('Reflection persistence trust', () => {
  test('keeps the one-tap exit visible on a compact mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await openApp(page)
    await completeQuick(page, 'anxiety')

    const done = page.getByRole('button', { name: 'Done for now' })
    await expect(done).toBeVisible()
    await expect(done).toBeInViewport()
    await expect(page.locator('.need-choice button[aria-pressed="true"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Try one small step' })).toBeVisible()
  })

  test('captures the check-in before optional reflection and ignores rapid duplicate submissions', async ({ page }) => {
    await instrumentSessionWrites(page, 0)
    await delayTransactionCompletion(page, 500)
    await openApp(page)
    await completeQuick(page, 'anxiety')

    await expect(page.locator('.session-save-status')).toContainText('Saving your check-in')
    await expect.poll(() => putAttempts(page)).toBe(1)
    await expect(page.locator('.session-save-status')).toContainText('Check-in saved')

    await page.getByRole('button', { name: 'Done for now' }).evaluate((button) => {
      for (let index = 0; index < 4; index += 1) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    })

    await expect(page.getByTestId('reflection-screen')).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await expect.poll(() => putAttempts(page)).toBe(2)
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
  })

  test('offers an inline retry when the early capture fails', async ({ page }) => {
    await instrumentSessionWrites(page, 1)
    await openApp(page)
    await completeQuick(page, 'anxiety')

    await expect(page.locator('.session-save-status')).toContainText('latest selection has not been saved yet')
    await page.getByRole('button', { name: 'Try saving again' }).click()
    await expect(page.locator('.session-save-status')).toContainText('Check-in saved')
    await expect.poll(() => putAttempts(page)).toBe(2)

    await page.getByRole('button', { name: 'Done for now' }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await expect.poll(() => putAttempts(page)).toBe(3)
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
  })

  test('continues without false success after a Romanian save failure', async ({ page }) => {
    await instrumentSessionWrites(page, -1)
    await openApp(page, { language: 'ro' })
    await completeQuick(page, 'anxiety')

    await expect(page.locator('.session-save-status')).toContainText('nu a fost încă salvată')
    await page.getByRole('button', { name: 'Gata pentru acum' }).click()
    await expect(page.getByRole('heading', { name: 'Această verificare nu a fost salvată' })).toBeVisible()
    await expect(page.getByTestId('reflection-save-error-screen')).toContainText('Nu s-a trimis nimic online')
    await page.getByRole('button', { name: 'Continuați fără salvare' }).click()

    await expect(page.getByTestId('today-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Jurnal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(0)
  })

  test('completes immediately without touching IndexedDB when saving is disabled', async ({ page }) => {
    await instrumentSessionWrites(page, -1)
    await openApp(page, { saveSessions: false })
    await completeQuick(page, 'joy')

    await expect(page.locator('.session-save-status')).toContainText('Saving is off')
    expect(await putAttempts(page)).toBe(0)
    await page.getByRole('button', { name: 'Done for now' }).click()

    await expect(page.getByTestId('today-screen')).toBeVisible()
    await expect(page.getByTestId('reflection-save-error-screen')).toHaveCount(0)
    expect(await putAttempts(page)).toBe(0)
  })

  test('revising a check-in updates one stable journal entry', async ({ page }) => {
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Continue with Happy' }).click()
    await expect(page.locator('.session-save-status')).toContainText('Check-in saved')

    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Sad' }).click()
    await page.getByRole('button', { name: 'Continue with Sad' }).click()
    await expect(page.locator('.session-save-status')).toContainText('Check-in saved')
    await page.getByRole('button', { name: 'Done for now' }).click()

    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
    await expect(page.locator('.journal-list button')).toContainText('Sad')
    await expect(page.locator('.journal-list button')).not.toContainText('Happy')
  })

  test('does not treat an older saved choice as capture of a failed revision', async ({ page }) => {
    await failSessionWriteAttempts(page, [2, 3])
    await delayTransactionCompletion(page, 500)
    await openApp(page)
    await openArrival(page)
    await page.getByTestId('arrival-words').click()
    await page.getByRole('button', { name: 'Happy' }).click()
    await page.getByRole('button', { name: 'Continue with Happy' }).click()

    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Sad' }).click()
    await page.getByRole('button', { name: 'Continue with Sad' }).click()
    await expect(page.locator('.session-save-status')).toContainText('latest selection has not been saved yet')

    await page.getByRole('button', { name: 'Done for now' }).click()
    const errorScreen = page.getByTestId('reflection-save-error-screen')
    await expect(page.getByRole('heading', { name: 'This check-in was not saved' })).toBeVisible()
    await expect(errorScreen).toContainText('The local save did not finish')
    await expect(page.getByRole('button', { name: 'Continue without saving' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Finish without these details' })).toHaveCount(0)
  })
})
