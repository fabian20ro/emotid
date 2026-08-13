import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { parseHumanTalkBackCheckpointArgs } from './android-physical/human-talkback.mjs'

const CDP_URL = 'http://127.0.0.1:9222'
const CANDIDATE_URL = 'http://127.0.0.1:4176/emotid/'
const DEPLOYED_URL = 'https://fabian20ro.github.io/emotid/'
const RUN_TOKEN = 'p51'
const WEBAPK_PACKAGE = 'org.chromium.webapk.a43b49e294110560b_v2'

let checkpoint
try {
  checkpoint = parseHumanTalkBackCheckpointArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

function adb(...args) {
  return execFileSync('adb', args, { encoding: 'utf8', timeout: 30_000 }).trim()
}

async function findTarget(browser) {
  for (const context of browser.contexts()) {
    const target = context.pages().find((page) => {
      const url = new URL(page.url())
      return url.origin === new URL(CANDIDATE_URL).origin
        && url.pathname === new URL(CANDIDATE_URL).pathname
        && url.searchParams.get('human-talkback') === RUN_TOKEN
    })
    if (target) return target
  }
  throw new Error('Exact P51 Chrome target is unavailable')
}

async function reset(page, language, onboarded, candidateUrl = CANDIDATE_URL) {
  await page.goto(`${candidateUrl}manifest.webmanifest?human-talkback-storage=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.evaluate(({ language: selectedLanguage, onboarded: hasOnboarded }) => {
    localStorage.clear()
    localStorage.setItem('emot-id-language', selectedLanguage)
    localStorage.setItem('emot-id-theme', 'light')
    localStorage.setItem('emot-id-save-sessions', 'true')
    localStorage.setItem('emot-id-allow-external-ai', 'true')
    if (hasOnboarded) localStorage.setItem('emot-id-onboarded', 'true')
  }, { language, onboarded })
  await page.goto(`${candidateUrl}?human-talkback=${RUN_TOKEN}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction((selectedLanguage) => (
    document.readyState !== 'loading' && document.documentElement.lang === selectedLanguage
  ), language)
}

async function findInstalledTarget(browser) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const context of [...browser.contexts()].reverse()) {
      for (const page of [...context.pages()].reverse()) {
        if (!page.url().startsWith(DEPLOYED_URL)) continue
        if (await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)) return page
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Installed Emot-ID target is unavailable')
}

async function openWords(page) {
  await page.getByTestId('today-guided-entry').click()
  await page.getByTestId('arrival-words').click()
}

async function prepareOnboarding(page) {
  await reset(page, 'en', false)
  const heading = page.getByTestId('onboarding-heading')
  await heading.waitFor({ state: 'visible' })
  await heading.focus()
  return 'Onboarding heading focused'
}

async function prepareWord(page, language) {
  await reset(page, language, true)
  await openWords(page)
  await page.locator('.word-options button').first().click()
  await page.locator('.word-options button').first().click()
  const intermediary = page.locator('.word-path-levels button').last()
  await intermediary.focus()
  return 'Intermediary emotion focused'
}

async function prepareCrisis(page, language) {
  await reset(page, language, true)
  await openWords(page)
  const labels = language === 'en'
    ? ['Sad', 'Despair', 'Sad', 'Depressed', 'Empty', 'Fearful', 'Weak', 'Worthless']
    : ['Trist', 'Disperare', 'Trist', 'Deprimat', 'Gol', 'Temător', 'Slab', 'Lipsit de valoare']
  const choose = async (label) => page.locator('.word-options button')
    .filter({ hasText: new RegExp(`^${label}`, 'i') }).first().click()
  await choose(labels[0])
  await choose(labels[1])
  await page.locator('.word-path-levels button').last().click()
  for (const label of labels.slice(2)) await choose(label)
  await page.locator('.route-action button').click()
  const alert = page.getByRole('alert')
  await alert.waitFor({ state: 'visible' })
  await alert.focus()
  return 'Crisis support alert focused'
}

async function prepareInstalled(browser, language) {
  adb('shell', 'am', 'force-stop', WEBAPK_PACKAGE)
  adb('shell', 'monkey', '-p', WEBAPK_PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
  const page = await findInstalledTarget(browser)
  await reset(page, language, true, DEPLOYED_URL)
  const heading = page.getByRole('heading', { level: 1 }).first()
  await heading.waitFor({ state: 'visible' })
  await heading.focus()
  return { page, prepared: 'Installed Today heading focused' }
}

const browser = await chromium.connectOverCDP(CDP_URL)
try {
  const language = checkpoint.endsWith('-ro') ? 'ro' : 'en'
  let page
  let prepared
  if (checkpoint.startsWith('installed-')) {
    ({ page, prepared } = await prepareInstalled(browser, language))
  } else {
    page = await findTarget(browser)
    prepared = checkpoint === 'onboarding-en'
      ? await prepareOnboarding(page)
      : checkpoint.startsWith('word-')
        ? await prepareWord(page, language)
        : await prepareCrisis(page, language)
  }
  console.log(JSON.stringify({ checkpoint, prepared, url: page.url(), foreground: adb('shell', 'dumpsys', 'window', 'windows').includes('com.android.chrome') }))
} finally {
  await browser.close()
}
