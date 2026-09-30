import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { alignment, runAlignmentChecks } from './alignment-checks.mjs'
import { foundations } from './foundations-checks.mjs'
import { inference } from './inference-checks.mjs'
import { training } from './training-checks.mjs'
import { pretraining } from './pretraining-checks.mjs'
import { isKnownRootFavicon404 } from './known-site-observations.mjs'

// Local adapter has no public CLI, release SHA, artifact or deployment arguments.
// It calls the same 16 case callbacks through Playwright's real local test fixtures.
export function createLocalAlignmentAdapter({ browser, expect, baseURL, basePath = '', outputPath, report }) {
  const parsed = new URL(baseURL)
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname), 'Local adapter only accepts loopback')
  assert.equal(parsed.protocol, 'http:'); assert.equal(parsed.pathname, '/')
  assert.ok(basePath === '' || /^\/[A-Za-z0-9_-]+$/.test(basePath), 'One optional local basePath segment')
  assert.equal(typeof outputPath, 'function'); assert.equal(report.evidenceClass, 'localhost-static-export-browser')
  const base = parsed.origin + basePath
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  const rootOf = (page, id) => page.locator(`.reading-figure[data-diagram-id="${id}"]`)
  const panelOf = (page, id) => rootOf(page, id).locator('.aw-sticky > .aw-diagram')
  const assetURLs = new Set()
const variants = [
  { id: 'attention-kv-sharing', labels: ['長さ', 'KV式', 'MHA', 'GQA', '比較'], steps: [0, 1, 4], marker: 'ATTENTION / KV SHARING' },
  { id: 'attention-compute-memory', labels: ['疎', '特徴写像', '結合則', 'タイル', '引継ぎ', 'IO'], steps: [0, 1, 2, 3, 4, 5], marker: 'ATTENTION VARIANTS / COMPUTE & MEMORY' },
  { id: 'attention-context-range', labels: ['学習範囲', '外挿', '補間', '確認'], steps: [0, 2], marker: 'ATTENTION / CONTEXT RANGE' }
]
const transformers = [
  { id: 'transformer-io', labels: ['全体', '埋込', '出力', '共有'], steps: [0, 1, 2, 3], marker: 'TRANSFORMER / INPUT & OUTPUT' },
  { id: 'transformer-position', labels: ['絶対', '相対', 'RoPE', '位置差'], steps: [0, 2, 3], marker: 'TRANSFORMER / POSITION' },
  { id: 'self-attention', labels: ['入力', 'Q / K / V', 'スコア', 'マスク', '重み', '混合'], steps: [0, 1, 2, 3, 4], marker: 'SELF-ATTENTION' },
  { id: 'transformer-block', labels: ['射影', '連結', 'FFN', 'ゲート', '残差', 'RMS', '配置', '1層', '全体'], steps: [0, 1, 2, 3, 4, 5, 6, 7, 8], marker: 'TRANSFORMER / BLOCK & WEIGHTS' }
]
const moe = [
  { id: 'moe-routing-load', labels: ['全体', 'ゲート', 'top-k', '合算', '選ぶ向き', '集中', '容量', '学習'], steps: [0, 1, 2, 3, 4, 5, 7], marker: 'MOE / ROUTING & LOAD' },
  { id: 'moe-parameters-communication', labels: ['保持', '使用', '配置', '送出', '返送', '確認'], steps: [0, 1, 2, 5], marker: 'MoE / PARAMETERS & COMMUNICATION' }
]

  const sceneMarkers = [...alignment, ...pretraining, ...training, ...inference, ...foundations, ...variants, ...transformers, ...moe].map(item => item.marker).concat(['AGENT LOOP / CONTROL FLOW', 'WORKFLOW / AGENT'])
  const markers = sceneMarkers.concat(['ReadingFigure requires at least one stage'])
function observe(page) {
  const state = { resources: [], failures: [], consoleErrors: [], pageErrors: [], pending: [] }
  page.on('pageerror', error => state.pageErrors.push(error.message))
  page.on('console', message => {
    if (message.type() !== 'error') return
    const item = { text: message.text(), url: message.location().url }
    state.consoleErrors.push(item)
  })
  page.on('requestfailed', request => {
    if (['script', 'stylesheet', 'font', 'document'].includes(request.resourceType())) state.failures.push({ url: request.url(), type: request.resourceType(), error: request.failure()?.errorText })
  })
  page.on('response', response => {
    const type = response.request().resourceType(), url = response.url()
    if (!['script', 'stylesheet', 'font', 'document'].includes(type)) return
    if (type !== 'document') assetURLs.add(url)
    state.pending.push((async () => {
      const contentType = response.headers()['content-type'] || ''
      const mimeOK = type === 'document' ? /text\/html/i.test(contentType) : type === 'stylesheet' ? /text\/css/i.test(contentType)
        : type === 'font' ? /(font\/|application\/(?:font|x-font|vnd.ms-fontobject))/i.test(contentType) : /(java|ecma)script/i.test(contentType)
      const item = { url, type, status: response.status(), contentType, mimeOK, markers: [] }
      try {
        const body = await response.body()
        item.bytes = body.length; item.sha256 = sha(body)
        if (type === 'script') item.markers = markers.filter(marker => body.toString('utf8').includes(marker))
      } catch (error) { item.bodyError = error.message }
      state.resources.push(item)
    })())
  })
  return state
}

async function finishNetwork(state, result, noJS) {
  for (let count = -1; count !== state.pending.length;) { count = state.pending.length; await Promise.all(state.pending) }
  const expectedBlockedScripts = state.failures.filter(item => noJS && item.type === 'script' && /^(csp|net::ERR_BLOCKED_BY_CSP)$/i.test(item.error || ''))
  const expectedNoJSCspConsole = state.consoleErrors.filter(item => noJS && /(?:refused to (?:load|execute).*script|script-src)/i.test(item.text) && /content security policy/i.test(item.text))
  const knownRootFavicon404 = state.consoleErrors.filter(item => isKnownRootFavicon404(item, state.declaredIcons))
  result.network = { ...state, pending: undefined, expectedBlockedScripts, expectedNoJSCspConsole, knownRootFavicon404,
    knownSiteObservation: 'This release declares a mandatory basePath SVG icon. The previous root favicon 404 exception is disabled unconditionally; all icon/console failures are errors.',
    noJSCspNote: 'Only script CSP refusals in a JavaScript-disabled context are classified as expected. They remain recorded separately; normal contexts and CSS failures have no exemption.' }
  assert.deepEqual(state.pageErrors, [], 'page errors')
  assert.deepEqual(state.consoleErrors.filter(item => !expectedNoJSCspConsole.includes(item) && !knownRootFavicon404.includes(item)), [], 'unexpected console errors')
  assert.deepEqual(state.failures.filter(item => !expectedBlockedScripts.includes(item)), [], 'unexpected script/CSS/font/document failures')
  assert.deepEqual(state.resources.filter(item => item.status !== 200 || item.bodyError || !item.bytes || !item.mimeOK), [], 'bad resource HTTP/MIME/body responses')
}

async function usePage(result, options, operation) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce', ...options })
  const page = await context.newPage(), network = observe(page)
  page.setDefaultTimeout(15_000); page.setDefaultNavigationTimeout(45_000)
  let failure
  try { await operation(page); result.url = page.url() } catch (error) { failure = error }
  try {
    for (const url of await page.locator('script[src],link[rel="stylesheet"],link[rel="preload"][as="script"],link[rel="modulepreload"],link[rel="preload"][as="font"]').evaluateAll(nodes => nodes.map(node => node.src || node.href))) assetURLs.add(url)
    network.declaredIcons = await page.locator('link[rel~="icon"],link[rel="manifest"]').evaluateAll(nodes => nodes.map(node => ({ rel: node.rel, href: node.href })))
    await finishNetwork(network, result, options.javaScriptEnabled === false)
  } catch (error) { if (failure) result.networkCheckError = error.stack; else failure = error }
  finally { await context.close() }
  if (failure) throw failure
}

async function open(page, route, figures, result, { theme = 'light', noJS = false } = {}) {
  if (!noJS) await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(base + route, { waitUntil: noJS ? 'load' : 'networkidle' })
  assert.equal(response.status(), 200); assert.ok(response.headers()['content-type']?.includes('text/html'))
  const body = await response.body()
  result.localDocument = { url: response.url(), status: response.status(), contentType: response.headers()['content-type'], sha256: sha(body), identityClass: 'localhost-static-export-only' }
  for (const figure of figures) await expect(rootOf(page, figure.id)).toHaveAttribute('data-ready', noJS ? 'false' : 'true')
  if (!noJS) {
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
    for (const chart of await page.locator('article [data-mermaid-renderer="strict"]').all()) {
      await chart.scrollIntoViewIfNeeded(); await expect(chart.locator('svg .nodes').last()).toBeVisible()
    }
  }
  await page.evaluate(() => document.fonts.ready)
  const icons = await page.locator('link[rel~="icon"]').evaluateAll(nodes => nodes.map(node => ({ href: node.href, type: node.type })))
  const svgIcons = icons.filter(icon => icon.href === base + '/favicon.svg' && icon.type === 'image/svg+xml')
  assert.ok(svgIcons.length > 0, 'Missing explicit basePath SVG favicon declaration')
  result.declaredSVGIcons = svgIcons
}

async function structure(page, figures, equations, result, headings = 11) {
  const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
  assert.equal(new Set(ids).size, ids.length, 'duplicate article anchors')
  assert.deepEqual(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId)), figures.map(item => item.id))
  await expect(page.locator('article h3')).toHaveCount(headings)
  await expect(page.locator('article .katex-display')).toHaveCount(equations)
  await expect(page.locator('.rf-article-toc')).toHaveCount(1)
  const toc = page.locator('.rf-article-toc')
  await toc.locator('summary').click(); await expect(toc.locator('ol')).toBeVisible()
  assert.ok(await toc.getByRole('link').count() >= headings)
  assert.deepEqual(await toc.locator('a').evaluateAll(links => links.filter(link => !document.getElementById(decodeURIComponent(link.hash.slice(1)))).map(link => link.hash)), [])
  await toc.locator('summary').click()
  result.structure = { figures: figures.map(item => item.id), h3: headings, displayMath: equations, steps: {} }
  for (const figure of figures) {
    const steps = await rootOf(page, figure.id).locator('.aw-prose [data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))
    assert.deepEqual(steps, figure.steps); result.structure.steps[figure.id] = steps
    await expect(panelOf(page, figure.id).getByRole('group', { name: '図解の段階', exact: true }).getByRole('button')).toHaveCount(figure.labels.length)
  }

}

function sceneDelivery(result, expected) {
  const delivered = result.network.resources.flatMap(item => item.markers)
  for (const figure of expected) assert.ok(delivered.includes(figure.marker), `missing delivered scene ${figure.id}`)
  const unwanted = delivered.filter(marker => sceneMarkers.includes(marker) && !expected.some(figure => figure.marker === marker))
  result.unrelatedHeavyScenes = unwanted
  assert.deepEqual(unwanted, [], 'scene code from another article was delivered')
}

async function stage(panel, figure, index) {
  const button = panel.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button', { name: figure.labels[index], exact: true })
  if (index === 0) {
    // Scrolling to another figure can update its reading stage and move its controls.
    await button.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
    await expect.poll(() => button.evaluate(async node => {
      const sample = () => {
        const rect = node.getBoundingClientRect()
        return {
          stage: node.closest('.aw-diagram').dataset.stage,
          scrollY,
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          inView: node.isConnected && rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth
        }
      }
      const initial = sample()
      if (!initial.inView) return false
      const key = JSON.stringify(initial)
      for (let frame = 0; frame < 3; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve))
        if (JSON.stringify(sample()) !== key) return false
      }
      return true
    }), { intervals: [50, 100, 100] }).toBe(true)
  }
  await button.click(); await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(panel).toHaveAttribute('data-stage', String(index))
  await expect(panel).toHaveAttribute('data-mode', 'manual')
  await expect(panel.getByRole('slider', { name: '図解の再生位置', exact: true })).toHaveValue(String(index))
}

async function phase(panel, value) {
  await panel.getByRole('slider').evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next))
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await expect(panel).toHaveAttribute('data-stage', String(Math.round(value)))
  await expect(panel.getByRole('slider')).toHaveValue(String(value))
}

async function geometry(page, panel) {
  await panel.scrollIntoViewIfNeeded()
  const result = await panel.locator('svg.aw-scene').evaluate(svg => {
    const inverse = svg.getScreenCTM().inverse(), view = svg.viewBox.baseVal
    const visible = [...svg.querySelectorAll('text')].filter(element => {
      for (let node = element; node && node !== svg; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      return true
    })
    const outside = visible.filter(element => {
      const r = element.getBBox(), matrix = inverse.multiply(element.getScreenCTM())
      return [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
        .some(p => p.x < -1 || p.y < -1 || p.x > view.width + 1 || p.y > view.height + 1)
    }).map(element => element.textContent)
    const panel = svg.closest('.aw-diagram'), bounds = panel.getBoundingClientRect(), sticky = panel.parentElement
    const controlsOutside = [...panel.querySelectorAll('button,input,select')].filter(control => {
      const r = control.getBoundingClientRect()
      return r.width && r.height && (r.left < bounds.left - 1 || r.right > bounds.right + 1)
    }).map(control => control.getAttribute('aria-label') || control.textContent)
    return { outside, controlsOutside, minSVGFontPx: Math.min(...visible.map(node => parseFloat(getComputedStyle(node).fontSize))),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sticky: { position: getComputedStyle(sticky).position, top: parseFloat(getComputedStyle(sticky).top) || 0, height: sticky.getBoundingClientRect().height, viewport: innerHeight } }
  })
  assert.deepEqual(result.outside, [], 'SVG text outside viewBox'); assert.deepEqual(result.controlsOutside, [], 'controls escape panel'); assert.ok(result.overflow <= 1, 'horizontal page overflow')
  if (result.sticky.position === 'sticky') assert.ok(result.sticky.height + result.sticky.top <= result.sticky.viewport + 1, 'sticky panel cannot fit')
  await expect(panel.locator('svg.aw-scene')).toBeVisible()
  return result
}

async function screenshot(page, name, region = null) {
  const file = outputPath(name + '.png')
  if (region) {
    const originalScroll = await region.evaluate(node => ({ x: scrollX, y: scrollY, dialogTop: node.closest('dialog[open]')?.scrollTop ?? null }))
    let bounds, clip, deviceScaleFactor, pixels, captureScroll
    try {
      // Supplemental glyph evidence: scroll the unchanged SVG below the site header.
      await region.evaluate(node => {
        if (node.closest('dialog[open]')) node.scrollIntoView({ block: 'center', behavior: 'instant' })
        else scrollTo({ top: scrollY + node.getBoundingClientRect().top - 86, behavior: 'instant' })
      })
      bounds = await region.boundingBox()
      const screen = await region.evaluate(node => ({ width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio, headerBottom: node.closest('dialog[open]') ? 0 : (document.querySelector('.nextra-navbar')?.getBoundingClientRect().bottom ?? 0), x: scrollX, y: scrollY }))
      deviceScaleFactor = screen.deviceScaleFactor; captureScroll = { x: screen.x, y: screen.y }
      assert.ok(bounds && bounds.width > 0 && bounds.height > 0, 'Screenshot region must have visible dimensions')
      assert.ok(bounds.x >= 0 && bounds.y >= Math.max(0, screen.headerBottom) && bounds.x + bounds.width <= screen.width && bounds.y + bounds.height <= screen.height, 'Complete scene must fit in the unchanged viewport below the header')
      clip = { x: Math.floor(bounds.x), y: Math.floor(bounds.y), width: Math.ceil(bounds.x + bounds.width) - Math.floor(bounds.x), height: Math.ceil(bounds.y + bounds.height) - Math.floor(bounds.y) }
      const png = await page.screenshot({ path: file, fullPage: false, clip })
      pixels = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
      assert.deepEqual(pixels, { width: clip.width * deviceScaleFactor, height: clip.height * deviceScaleFactor }, 'PNG must contain the complete integer viewport clip at the requested scale')
    } finally {
      await region.evaluate((node, original) => {
        scrollTo({ left: original.x, top: original.y, behavior: 'instant' })
        if (original.dialogTop !== null) node.closest('dialog[open]').scrollTop = original.dialogTop
      }, originalScroll)
    }
    report.screenshots.push({ name, file, capture: 'element', purpose: 'supplemental-full-scene-glyph-review', bounds, clip, deviceScaleFactor, pixels, originalScroll, captureScroll, scrollRestored: true, stylesModified: false })
  } else {
    await page.screenshot({ path: file, fullPage: false }); report.screenshots.push({ name, file })
  }
}

  return { usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect }
}

export async function alignmentLocalCases() {
  const cases = []
  await runAlignmentChecks({ check: async (name, operation) => cases.push({ name, operation }) })
  assert.equal(cases.length, 16)
  return cases
}
