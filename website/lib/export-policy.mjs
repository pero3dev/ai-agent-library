import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

export function addSecurityMeta(html, { audioFixture = false } = {}) {
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes, body]) => !/\bsrc=/.test(attributes) && body.trim())
    .map(([, , body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  const csp = [`default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval' ${[...new Set(hashes)].join(' ')}`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self' data:`, `connect-src 'self'`, `media-src 'self' https://github.com https://release-assets.githubusercontent.com https://objects.githubusercontent.com${audioFixture ? ' http://127.0.0.1:*' : ''}`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`].join('; ')
  return html.replace(/<head>/i, `<head><meta http-equiv="Content-Security-Policy" content="${csp.replaceAll('"', '&quot;')}"/><meta name="referrer" content="strict-origin-when-cross-origin"/>`)
}

export function initialScriptBudget(html, readScript, basePath = '') {
  const sources = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]))]
  let raw = 0, gzip = 0
  for (const source of sources) {
    const content = readScript(source.replace(new RegExp(`^${basePath}`), ''))
    raw += Buffer.byteLength(content); gzip += gzipSync(content).byteLength
    for (const marker of ['react-flow__', 'glossary-filter', 'audio-library-summary', 'route-persona']) {
      if (content.includes(marker)) throw new Error(`記事の初期JSにページ専用実装が混入: ${marker}`)
    }
  }
  if (gzip > 320 * 1024) throw new Error(`記事初期JS gzip予算320KiB超過: ${gzip}`)
  return { scripts: sources.length, raw_bytes: raw, gzip_bytes: gzip }
}
