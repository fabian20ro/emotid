const RUN_PARAMETER = 'physical-audit-run'

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

function matchesCandidate(pageUrl, candidateUrl, runToken) {
  const page = new URL(pageUrl)
  const candidate = new URL(candidateUrl)
  return page.origin === candidate.origin
    && page.pathname === candidate.pathname
    && page.searchParams.get(RUN_PARAMETER) === runToken
}

function decodeXmlAttribute(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function readChromeUrlBar(hierarchy) {
  for (const match of hierarchy.matchAll(/<node\b[^>]*>/g)) {
    const attributes = new Map()
    for (const attribute of match[0].matchAll(/([\w-]+)="([^"]*)"/g)) {
      attributes.set(attribute[1], decodeXmlAttribute(attribute[2]))
    }
    if (attributes.get('resource-id') === 'com.android.chrome:id/url_bar') {
      return attributes.get('text') ?? ''
    }
  }
  return ''
}

function hasRunToken(urlBarText, runToken) {
  const queryStart = urlBarText.indexOf('?')
  if (queryStart === -1) return false
  const queryEnd = urlBarText.indexOf('#', queryStart)
  const query = urlBarText.slice(queryStart + 1, queryEnd === -1 ? undefined : queryEnd)
  return new URLSearchParams(query).get(RUN_PARAMETER) === runToken
}

export function createBrowserRunUrl(candidateUrl, runToken) {
  const url = new URL(candidateUrl)
  url.searchParams.set(RUN_PARAMETER, runToken)
  return url.href
}

export async function findBrowserTarget({
  browser,
  candidateUrl,
  runToken,
  attempts = 30,
  waitForRetry = () => wait(500),
}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    for (const context of [...browser.contexts()].reverse()) {
      for (const page of [...context.pages()].reverse()) {
        if (!matchesCandidate(page.url(), candidateUrl, runToken)) continue
        const standalone = await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)
        if (!standalone) return page
      }
    }
    if (attempt + 1 < attempts) await waitForRetry()
  }
  throw new Error(`No foreground browser candidate for run ${runToken}`)
}

export async function verifyForegroundSurface({ runToken, readHierarchy }) {
  const hierarchy = await readHierarchy()
  if (!hasRunToken(readChromeUrlBar(hierarchy), runToken)) {
    throw new Error(`Physical foreground does not match browser run ${runToken}`)
  }
}
