import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { NATIVE_SAFARI_SEED_HTML } from './seed.mjs'

const host = '127.0.0.1'
const port = 4176
const root = resolve('dist')
const seedPath = '/__native-safari-seed.html'

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
  if (url.pathname === seedPath) {
    send(
      response,
      200,
      NATIVE_SAFARI_SEED_HTML,
      'text/html; charset=utf-8',
    )
    return
  }
  if (!url.pathname.startsWith('/emotid/')) {
    send(response, 404, 'Not found')
    return
  }

  const relativePath = decodeURIComponent(url.pathname.slice('/emotid/'.length)) || 'index.html'
  let filePath = resolve(root, relativePath)
  if (!filePath.startsWith(`${root}${sep}`) && filePath !== root) {
    send(response, 403, 'Forbidden')
    return
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = resolve(root, 'index.html')
  }

  const extension = extname(filePath)
  response.writeHead(200, {
    'Cache-Control': filePath.endsWith('sw.js') ? 'no-store' : 'no-cache',
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
    ...(filePath.endsWith('sw.js') ? { 'Service-Worker-Allowed': '/emotid/' } : {}),
  })
  createReadStream(filePath).pipe(response)
})

server.listen(port, host)

function close() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', close)
process.on('SIGTERM', close)
