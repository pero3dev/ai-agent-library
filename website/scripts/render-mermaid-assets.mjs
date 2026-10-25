import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { svgDimensions } from '../lib/mermaid-dimensions.mjs'

const defaultRoot = fileURLToPath(new URL('../', import.meta.url))

export async function renderMermaidAssets({ root = defaultRoot, render = renderPendingAssets } = {}) {
  const assetDir = path.join(root, 'public/_mermaid')
  const charts = JSON.parse(await readFile(path.join(root, 'generated/mermaid-charts.json'), 'utf8'))
  await mkdir(assetDir, { recursive: true })
  const pending = []
  for (const key of Object.keys(charts).sort()) {
    if (!/^[a-f0-9]{24}$/.test(key)) throw new Error(`Invalid Mermaid diagram key: ${key}`)
    for (const theme of ['light', 'dark']) {
      try { await access(path.join(assetDir, `${key}-${theme}.svg`)) }
      catch { pending.push({ key, chart: charts[key], theme }) }
    }
  }
  if (pending.length) await render(pending, { root, assetDir })
  // Cached SVGs need metadata too: a checkout can restore the asset cache while
  // generated/ is empty, and SSR must reserve the image size before lazy load.
  const diagrams = {}
  for (const key of Object.keys(charts).sort()) {
    diagrams[key] = {}
    for (const theme of ['light', 'dark']) {
      const file = `${key}-${theme}.svg`
      diagrams[key][theme] = svgDimensions(await readFile(path.join(assetDir, file), 'utf8'), file)
    }
  }
  await writeFile(path.join(root, 'generated/mermaid-dimensions.json'), `${JSON.stringify({ schema_version: 1, diagrams }, null, 2)}\n`)
  return { diagrams: Object.keys(charts).length, generated: pending.length }
}

async function renderPendingAssets(pending, { root, assetDir }) {
  // Serve only Mermaid's local distribution, with no repository files or remote scripts.
  const dist = path.join(root, 'node_modules/mermaid/dist')
  const server = createServer(async (request, response) => {
    if (request.url === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><html><body></body></html>'); return }
    const file = path.resolve(dist, `.${decodeURIComponent(new URL(request.url, 'http://local').pathname)}`)
    if (!file.startsWith(`${dist}${path.sep}`)) { response.writeHead(403).end(); return }
    try { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile(file)) }
    catch { response.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    const origin = `http://127.0.0.1:${server.address().port}`
    await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort())
    await page.goto(origin)
    await page.evaluate(async () => { window.mermaid = (await import('/mermaid.esm.min.mjs')).default })
    for (const { key, chart, theme } of pending) {
      const svg = await page.evaluate(async ({ key, chart, theme }) => {
        const container = document.createElement('div')
        document.body.append(container)
        try {
          mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, theme: theme === 'dark' ? 'dark' : 'default', fontFamily: 'Arial, sans-serif', flowchart: { htmlLabels: false } })
          const { svg } = await mermaid.render(`m${key}${theme}`, chart.replaceAll('\\n', '\n'), container)
          const holder = document.createElement('div')
          holder.innerHTML = svg
          // Mermaid returns HTML serialization with XHTML <br> in foreignObject.
          // Standalone SVG must use XML serialization (<br />), otherwise image
          // decoders reject the document even though inline SVG renders.
          const root = holder.querySelector('svg')
          const bounds = root.getAttribute('viewBox')?.split(/\s+/).map(Number)
          if (bounds?.length === 4 && bounds.slice(2).every(size => Number.isFinite(size) && size > 0)) {
            root.setAttribute('width', String(bounds[2])); root.setAttribute('height', String(bounds[3]))
          }
          const serialized = new XMLSerializer().serializeToString(root)
          const xml = new DOMParser().parseFromString(serialized, 'image/svg+xml')
          if (xml.querySelector('parsererror')) throw new Error('Mermaid asset is not valid XML')
          return serialized
        } finally { container.remove() }
      }, { key, chart, theme })
      // Strict sanitization is rendered in an isolated document; files are shown
      // as images, so any SVG event handler or foreignObject can never execute.
      if (/<script\b|\son[a-z]+\s*=/i.test(svg)) throw new Error(`Mermaid SVG unsafe output: ${key}`)
      await writeFile(path.join(assetDir, `${key}-${theme}.svg`), svg, 'utf8')
    }
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await renderMermaidAssets()
    console.log(`Mermaid: ${result.generated} SVG生成、${result.diagrams} 図 × 2テーマの寸法を保存(閲覧時Mermaid JS不要)`)
  } catch (error) {
    console.error(`Mermaid asset build failed: ${error.message}`)
    process.exitCode = 1
  }
}
