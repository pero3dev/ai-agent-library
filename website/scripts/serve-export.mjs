// ローカル回帰検査専用。ビルド済み out/ だけを loopback へ配信する。
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../out/', import.meta.url))
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm'
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404).end()
      return
    }
    const relative = pathname.slice(basePath.length).replace(/^\/+/, '')
    const candidate = path.resolve(root, relative || 'index.html')
    if (candidate !== path.resolve(root) && !candidate.startsWith(`${path.resolve(root)}${path.sep}`)) {
      response.writeHead(403).end()
      return
    }
    let file
    for (const option of [candidate, `${candidate}.html`, path.join(candidate, 'index.html')]) {
      if (await stat(option).then(s => s.isFile(), () => false)) {
        file = option
        break
      }
    }
    const body = await readFile(file || path.join(root, '404.html'))
    response.writeHead(file ? 200 : 404, {
      'Content-Type': mime[path.extname(file || '404.html')] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    response.end(body)
  } catch {
    response.writeHead(500).end()
  }
})
server.listen(4183, '127.0.0.1')
