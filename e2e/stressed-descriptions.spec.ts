import { expect, test } from '@playwright/test'
import { openApp } from './helpers'
import { expectAccessibleTextContrast } from './contrast'
import leaves from '../src/models/catalog/wheel-leaves.json' with { type: 'json' }
import negative from '../src/models/catalog/negative-high.json' with { type: 'json' }

const entries = [leaves.overwhelmed_bad, leaves.out_of_control, negative.tense, leaves.burned_out, leaves.on_edge, leaves.irritable]

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`Stressed meanings and voluntary comparison (${language}/${theme})`, async ({ page }, testInfo) => {
    const ro = language === 'ro'
    await page.setViewportSize({ width: 393, height: 742 })
    await openApp(page, { language, theme })
    await page.getByRole('button', { name: ro ? 'Explorează' : 'Explore', exact: true }).click()
    await page.getByTestId('explore-words').click()
    await page.getByRole('button', { name: ro ? 'Explorează cuvinte mai precise sub Rău' : 'Explore more specific words under Bad' }).click()
    await page.getByRole('button', { name: ro ? 'Explorează cuvinte mai precise sub Stresat' : 'Explore more specific words under Stressed' }).click()
    await expect(page.getByRole('button', { name: ro ? 'Continuă cu Stresat' : 'Continue with Stressed', exact: true })).toBeEnabled()
    const meanings = page.getByText(ro ? 'Sensurile acestor cuvinte' : 'Meanings of these words', { exact: true })
    await meanings.focus()
    await page.keyboard.press('Enter')
    for (const entry of entries) await expect(page.getByText(entry.description[language], { exact: true })).toBeVisible()
    await expectAccessibleTextContrast(page, `Stressed meanings ${language}/${theme}`)
    await page.getByText(leaves.out_of_control.description[language], { exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath('meanings.png') })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.getByTestId('words-screen').evaluate((root) => {
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')]
      const sizes = elements.map((element) => parseFloat(getComputedStyle(element).fontSize))
      elements.forEach((element, index) => { (element as HTMLElement).style.fontSize = `${sizes[index] * 2}px` })
    })
    expect(await page.locator('.app-content').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: ro ? 'Alege Copleșit' : 'Select Overwhelmed', exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Compară cuvinte apropiate' : 'Compare nearby words', exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Compară cu Irascibil' : 'Compare with Irritable', exact: true }).click()
    const comparison = page.getByRole('group', { name: ro ? 'Copleșit și Irascibil' : 'Overwhelmed and Irritable' })
    await expect(comparison.getByText(leaves.irritable.description[language], { exact: true })).toBeVisible()
    expect(await page.locator('.app-content').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    const selected = page.getByRole('region', { name: ro ? 'Cuvinte alese' : 'Selected words' })
    await expect(selected).not.toContainText(leaves.irritable.label[language])
    await page.getByRole('button', { name: ro ? 'Continuă cu Copleșit' : 'Continue with Overwhelmed', exact: true }).click()
    await expect(page.getByTestId('reflection-screen')).toBeVisible()
    await expect(page.locator('.emotion-heading')).toContainText(leaves.overwhelmed_bad.label[language])
    await expect(page.locator('.emotion-heading')).not.toContainText(leaves.irritable.label[language])
    await page.locator('.screen-back').click()
    await expect(selected).toContainText(leaves.overwhelmed_bad.label[language])
    await page.getByRole('button', { name: ro ? 'Continuă cu Copleșit' : 'Continue with Overwhelmed', exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Da' : 'Yes', exact: true }).click()
    await page.getByRole('button', { name: ro ? 'Explorează mai mult' : 'Explore further', exact: true }).click()
    const link = page.getByRole('link', { name: ro ? 'Explorează în Google AI Mode' : 'Explore in Google AI Mode', exact: true })
    const url = new URL((await link.getAttribute('href'))!)
    expect(url.searchParams.get('udm')).toBe('50')
    expect(url.searchParams.get('q')?.toLocaleLowerCase()).toContain(leaves.overwhelmed_bad.label[language].toLocaleLowerCase())
    expect(url.searchParams.get('q')?.toLocaleLowerCase()).not.toContain(leaves.irritable.label[language].toLocaleLowerCase())
  })
}
