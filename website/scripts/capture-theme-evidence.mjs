// 同じブラウザー・画面寸法で比較する。生成物を変更せず loopback だけに配信する。
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const options = {}
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  if (!['--export-root', '--output-dir', '--revision'].includes(key) || !process.argv[index + 1]) {
    throw new Error('Usage: node scripts/capture-theme-evidence.mjs --export-root out --output-dir ../.local/theme-evidence/before [--revision <SHA>]')
  }
  options[key.slice(2)] = process.argv[index + 1]
}
if (!options['export-root'] || !options['output-dir']) throw new Error('--export-root and --output-dir are required')
const root = path.resolve(options['export-root'])
const output = path.resolve(options['output-dir'])
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm' }
await stat(path.join(root, 'index.html'))
await mkdir(output, { recursive: true })

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404).end()
      return
    }
    const candidate = path.resolve(root, pathname.slice(basePath.length).replace(/^\/+/, '') || 'index.html')
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end()
      return
    }
    let file
    for (const option of [candidate, `${candidate}.html`, path.join(candidate, 'index.html')]) {
      if (await stat(option).then(value => value.isFile(), () => false)) { file = option; break }
    }
    const body = await readFile(file || path.join(root, '404.html'))
    response.writeHead(file ? 200 : 404, { 'Content-Type': mime[path.extname(file || '404.html')] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body)
  } catch {
    response.writeHead(500).end()
  }
})
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
let browser
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
  const origin = `http://127.0.0.1:${server.address().port}`
  const evidence = []
  for (const [device, viewport] of [['pc', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport, colorScheme: theme, deviceScaleFactor: 1 })
      try {
        await context.addInitScript(value => localStorage.setItem('theme', value), theme)
        await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
        const page = await context.newPage()
        const capture = async (name, pathname, selector, sidebarState) => {
          const response = await page.goto(`${origin}${basePath}${pathname}`)
          if (response.status() !== 200) throw new Error(`${pathname}: HTTP ${response.status()}`)
          await page.locator('main h1').first().waitFor({ state: 'visible' })
          await page.waitForFunction(value => document.documentElement.classList.contains(value), theme)
          await page.waitForFunction(() => document.querySelector('.site-theme-switch')?.disabled === false)
          await page.evaluate(() => document.fonts.ready)
          if (sidebarState) {
            const sidebar = page.locator('aside.nextra-sidebar')
            const scroller = sidebar.locator(':scope > div').first()
            await scroller.evaluate((element, scrolled) => { element.scrollTop = scrolled ? element.scrollHeight : 0 }, sidebarState.scrolled)
            if (sidebarState.collapsed) {
              await sidebar.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
              await page.waitForFunction(() => document.querySelector('aside.nextra-sidebar')?.getBoundingClientRect().width === 80)
            }
            // Finish Nextra's button fade and width transitions before comparing pixels.
            await sidebar.evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))) })
          }
          if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded()
          if (selector === '.practice-checklist') await page.locator('.practice-checklist .checklist-box').first().check()
          const file = `${device}-${theme}-${name}.png`
          const pixels = await page.screenshot({ path: path.join(output, file), animations: 'disabled' })
          const styles = await page.evaluate(() => ({
            theme: document.documentElement.className,
            pageBackground: getComputedStyle(document.documentElement).backgroundColor,
            fog: getComputedStyle(document.body, '::before').backgroundImage,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            sidebar: document.querySelector('aside.nextra-sidebar') ? {
              width: document.querySelector('aside.nextra-sidebar').getBoundingClientRect().width,
              background: getComputedStyle(document.querySelector('aside.nextra-sidebar')).backgroundColor,
              scrollTop: document.querySelector('aside.nextra-sidebar > div').scrollTop,
              scrollHeight: document.querySelector('aside.nextra-sidebar > div').scrollHeight,
              clientHeight: document.querySelector('aside.nextra-sidebar > div').clientHeight,
              menuBackground: getComputedStyle(document.querySelector('aside.nextra-sidebar > div')).backgroundColor,
              footerBackground: getComputedStyle(document.querySelector('.nextra-sidebar-footer')).backgroundColor,
              footerBlur: getComputedStyle(document.querySelector('.nextra-sidebar-footer')).backdropFilter
            } : null
          }))
          evidence.push({ file, pathname, selector: selector || null, sidebar_state: sidebarState || null, theme, viewport, sha256: createHash('sha256').update(pixels).digest('hex'), styles })
        }
        await capture('home', '/')
        await capture('article', '/docs/concepts/agent-loop')
        if (device === 'pc') {
          for (const collapsed of [false, true]) for (const scrolled of [false, true]) {
            await capture(`sidebar-${collapsed ? 'collapsed' : 'open'}-${scrolled ? 'scrolled' : 'top'}`, '/docs/concepts/agent-loop', null, { collapsed, scrolled })
          }
        }
        if (theme === 'dark') {
          await capture('todo', '/docs/concepts/agent-loop', '.todo-callout')
          await capture('antipattern', '/docs/architecture/workflow-vs-agent', '.practice-antipattern')
          await capture('checklist', '/docs/architecture/workflow-vs-agent', '.practice-checklist')
        }
      } finally {
        await context.close()
      }
    }
  }
  const manifest = { schema_version: 1, captured_at: new Date().toISOString(), revision: options.revision || null, pull_request_head: process.env.EVIDENCE_HEAD_SHA || null, browser: 'chromium', browser_version: browser.version(), base_path: basePath, evidence }
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Captured ${evidence.length} theme screenshots and manifest: ${output}`)
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
