import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp } from './helpers'

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
  test('keeps completion pending and ignores rapid duplicate submissions', async ({ page }) => {
    await instrumentSessionWrites(page, 0)
    await delayTransactionCompletion(page, 500)
    await openApp(page)
    await completeQuick(page, 'anxiety')

    await page.getByRole('button', { name: 'Done for now' }).evaluate((button) => {
      for (let index = 0; index < 4; index += 1) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    })

    await expect(page.getByTestId('reflection-saving-screen')).toContainText('Saving on this device')
    await expect(page.getByTestId('reflection-close-screen')).toHaveCount(0)
    await expect.poll(() => putAttempts(page)).toBe(1)
    await expect(page.getByTestId('reflection-close-screen')).toContainText('Saved privately on this device')

    await page.getByRole('button', { name: 'Return to Today' }).click()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
  })

  test('offers retry after failure and saves one reflection on the second attempt', async ({ page }) => {
    await instrumentSessionWrites(page, 1)
    await openApp(page)
    await completeQuick(page, 'anxiety')

    await page.getByRole('button', { name: 'Done for now' }).click()
    const errorScreen = page.getByTestId('reflection-save-error-screen')
    await expect(errorScreen).toContainText('This reflection was not saved')
    await expect(errorScreen).toContainText('Nothing was sent online')
    await expect(page.getByTestId('reflection-close-screen')).toHaveCount(0)

    await page.getByRole('button', { name: 'Try saving again' }).click()
    await expect(page.getByTestId('reflection-close-screen')).toContainText('Saved privately on this device')
    await expect.poll(() => putAttempts(page)).toBe(2)

    await page.getByRole('button', { name: 'Return to Today' }).click()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
  })

  test('continues without false success after a Romanian save failure', async ({ page }) => {
    await instrumentSessionWrites(page, -1)
    await openApp(page, { language: 'ro' })
    await completeQuick(page, 'anxiety')

    await page.getByRole('button', { name: 'Gata pentru acum' }).click()
    await expect(page.getByRole('heading', { name: 'Această reflecție nu a fost salvată' })).toBeVisible()
    await expect(page.getByTestId('reflection-save-error-screen')).toContainText('Nu s-a trimis nimic online')
    await page.getByRole('button', { name: 'Continuați fără salvare' }).click()

    await expect(page.getByTestId('reflection-close-screen')).toContainText('Această verificare nu a fost salvată')
    await page.getByRole('button', { name: 'Reveniți la Astăzi' }).click()
    await page.getByRole('button', { name: 'Jurnal', exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(0)
  })

  test('completes immediately without touching IndexedDB when saving is disabled', async ({ page }) => {
    await instrumentSessionWrites(page, -1)
    await openApp(page, { saveSessions: false })
    await completeQuick(page, 'joy')

    await page.getByRole('button', { name: 'Done for now' }).click()

    await expect(page.getByTestId('reflection-close-screen')).toContainText('This check-in was not saved')
    await expect(page.getByTestId('reflection-save-error-screen')).toHaveCount(0)
    expect(await putAttempts(page)).toBe(0)
  })
})
