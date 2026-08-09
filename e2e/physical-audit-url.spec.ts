import { expect, test } from '@playwright/test'

test('keeps a physical-audit run identifiable through a check-in', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))

  await page.addInitScript(() => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', 'en')
    localStorage.setItem('emot-id-save-sessions', 'true')
    localStorage.setItem('emot-id-theme', 'light')
  })

  const runToken = `browser-${testInfo.project.name.toLowerCase().replaceAll(' ', '-')}`
  await page.goto(`./?channel=physical&physical-audit-run=${runToken}`, {
    waitUntil: 'domcontentloaded',
  })

  await expect(page.getByTestId('today-screen')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('channel')).toBe('physical')
  expect(new URL(page.url()).searchParams.get('physical-audit-run')).toBe(runToken)
  expect(await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)).toBe(false)

  await page.getByTestId('quick-feeling-anxiety').click()
  await page.getByTestId('quick-continue').click()
  await expect(page.getByTestId('reflection-screen')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('physical-audit-run')).toBe(runToken)
  expect(browserErrors).toEqual([])
})
