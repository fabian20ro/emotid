import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const host = '127.0.0.1'
const port = 4174
const root = resolve('.pwa-test-builds')
const versions = ['v1', 'v2']
let activeVersion = versions[0]

for (const version of versions) {
  execFileSync(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'build', '--outDir', resolve(root, version)],
    {
      env: { ...process.env, VITE_APP_VERSION: version },
      stdio: 'inherit',
    },
  )
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
}

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': type,
  })
  response.end(body)
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${host}:${port}`)

  if (url.pathname === '/__pwa-test/version') {
    if (request.method === 'POST') activeVersion = versions[1]
    send(response, 200, activeVersion)
    return
  }

  if (!url.pathname.startsWith('/emot-id/')) {
    send(response, 404, 'Not found')
    return
  }

  const versionRoot = resolve(root, activeVersion)
  const relativePath = decodeURIComponent(url.pathname.slice('/emot-id/'.length)) || 'index.html'
  let filePath = resolve(versionRoot, relativePath)

  if (!filePath.startsWith(`${versionRoot}${sep}`) && filePath !== versionRoot) {
    send(response, 403, 'Forbidden')
    return
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = resolve(versionRoot, 'index.html')
  }

  const extension = extname(filePath)
  response.writeHead(200, {
    'Cache-Control': filePath.endsWith('sw.js') ? 'no-store' : 'no-cache',
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
    ...(filePath.endsWith('sw.js') ? { 'Service-Worker-Allowed': '/emot-id/' } : {}),
  })
  createReadStream(filePath).pipe(response)
})

server.listen(port, host)

function close() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', close)
process.on('SIGTERM', close)
