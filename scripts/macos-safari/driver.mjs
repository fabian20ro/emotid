const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export function createWebDriverClient({
  endpoint = 'http://127.0.0.1:4444',
  fetchImpl = fetch,
} = {}) {
  let sessionId

  async function request(method, path, body) {
    const response = await fetchImpl(`${endpoint}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const payload = await response.json()
    const error = payload?.value?.error
    if (!response.ok || error) {
      const message = payload?.value?.message ?? `HTTP ${response.status}`
      throw new Error(error ? `${error}: ${message}` : message)
    }
    return payload.value
  }

  function sessionPath(path = '') {
    if (!sessionId) throw new Error('SafariDriver session has not been created')
    return `/session/${sessionId}${path}`
  }

  return {
    async createSession() {
      const value = await request('POST', '/session', {
        capabilities: { alwaysMatch: { browserName: 'safari' } },
      })
      sessionId = value.sessionId
      if (!sessionId) throw new Error('SafariDriver did not return a session ID')
      return value
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

    async findElement(using, value) {
      const element = await request('POST', sessionPath('/element'), { using, value })
      const id = element?.[ELEMENT_KEY]
      if (!id) throw new Error(`SafariDriver returned no element for ${using}: ${value}`)
      return id
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

    screenshot() {
      return request('GET', sessionPath('/screenshot'))
    },

    async waitForElement(using, value, { attempts = 40, delayMs = 250 } = {}) {
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

    async close() {
      if (!sessionId) return
      const closingSession = sessionId
      sessionId = undefined
      await request('DELETE', `/session/${closingSession}`)
    },
  }
}
