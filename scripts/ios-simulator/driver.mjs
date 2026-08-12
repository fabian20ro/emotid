const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export function createAppiumClient({
  endpoint = 'http://127.0.0.1:4723',
  fetchImpl = fetch,
  commandTimeoutMs = 30_000,
  sessionTimeoutMs = 180_000,
} = {}) {
  let sessionId

  async function request(method, path, body, { timeoutMs = commandTimeoutMs } = {}) {
    let response
    try {
      response = await fetchImpl(`${endpoint}${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new Error(`Appium ${method} ${path} timed out after ${timeoutMs}ms`, { cause: error })
      }
      throw error
    }
    const payload = await response.json()
    const error = payload?.value?.error
    if (!response.ok || error) {
      const message = payload?.value?.message ?? `HTTP ${response.status}`
      throw new Error(error ? `${error}: ${message}` : message)
    }
    return payload.value
  }

  function sessionPath(path = '') {
    if (!sessionId) throw new Error('Appium session has not been created')
    return `/session/${sessionId}${path}`
  }

  return {
    async createSession({ deviceName, platformVersion, udid, initialUrl }) {
      const value = await request('POST', '/session', {
        capabilities: {
          alwaysMatch: {
            platformName: 'iOS',
            browserName: 'Safari',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': deviceName,
            'appium:platformVersion': platformVersion,
            'appium:udid': udid,
            'appium:noReset': true,
            'appium:newCommandTimeout': 300,
            'appium:includeSafariInWebviews': true,
            'appium:webviewConnectTimeout': 60_000,
            ...(initialUrl ? { 'appium:safariInitialUrl': initialUrl } : {}),
          },
        },
      }, { timeoutMs: sessionTimeoutMs })
      sessionId = value?.sessionId
      if (!sessionId) throw new Error('Appium did not return a session ID')
      return value
    },

    setTimeouts({ script = 15_000, pageLoad = 30_000, implicit = 0 } = {}) {
      return request('POST', sessionPath('/timeouts'), { script, pageLoad, implicit })
    },

    navigate(url) {
      return request('POST', sessionPath('/url'), { url })
    },

    execute(script, args = []) {
      return request('POST', sessionPath('/execute/sync'), { script, args })
    },

    executeAsync(script, args = []) {
      return request('POST', sessionPath('/execute/async'), { script, args })
    },

    getContexts() {
      return request('GET', sessionPath('/contexts'))
    },

    getContext() {
      return request('GET', sessionPath('/context'))
    },

    setContext(name) {
      return request('POST', sessionPath('/context'), { name })
    },

    getOrientation() {
      return request('GET', sessionPath('/orientation'))
    },

    setOrientation(orientation) {
      return request('POST', sessionPath('/orientation'), { orientation })
    },

    async findElement(using, value) {
      const element = await request('POST', sessionPath('/element'), { using, value })
      const id = element?.[ELEMENT_KEY]
      if (!id) throw new Error(`Appium returned no element for ${using}: ${value}`)
      return id
    },

    async findElements(using, value) {
      const elements = await request('POST', sessionPath('/elements'), { using, value })
      return elements.map((element) => element[ELEMENT_KEY]).filter(Boolean)
    },

    async findElementOptional(using, value) {
      const elements = await this.findElements(using, value)
      return elements[0]
    },

    click(elementId) {
      return request('POST', sessionPath(`/element/${elementId}/click`), {})
    },

    getText(elementId) {
      return request('GET', sessionPath(`/element/${elementId}/text`))
    },

    getAttribute(elementId, name) {
      return request('GET', sessionPath(`/element/${elementId}/attribute/${encodeURIComponent(name)}`))
    },

    getRect(elementId) {
      return request('GET', sessionPath(`/element/${elementId}/rect`))
    },

    async tapElement(elementId) {
      const rect = await this.getRect(elementId)
      return this.execute('mobile: tap', [{
        x: Math.round(rect.x + rect.width / 2),
        y: Math.round(rect.y + rect.height / 2),
      }])
    },

    screenshot() {
      return request('GET', sessionPath('/screenshot'))
    },

    source() {
      return request('GET', sessionPath('/source'))
    },

    async waitForElement(using, value, { attempts = 60, delayMs = 250 } = {}) {
      let lastError
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          return await this.findElement(using, value)
        } catch (error) {
          lastError = error
          if (attempt + 1 < attempts) await wait(delayMs)
        }
      }
      throw new Error(`Timed out waiting for ${using}: ${value}`, { cause: lastError })
    },

    async waitForWebContext({ attempts = 80, delayMs = 250 } = {}) {
      let contexts = []
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        contexts = await this.getContexts()
        const webContext = contexts.find((context) => context.startsWith('WEBVIEW'))
        if (webContext) return webContext
        if (attempt + 1 < attempts) await wait(delayMs)
      }
      throw new Error(`Timed out waiting for Safari web context; available: ${contexts.join(', ')}`)
    },

    async close() {
      if (!sessionId) return
      const closingSession = sessionId
      sessionId = undefined
      await request('DELETE', `/session/${closingSession}`)
    },
  }
}
