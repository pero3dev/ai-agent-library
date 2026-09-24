import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs, repoRoot, outputRoot, insideExisting, newChild, lockedPlaywright, relativePath } from './portable-paths.mjs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { foundations, runFoundationsChecks } from './foundations-checks.mjs'
import { inference, inferencePath, runInferenceChecks } from './inference-checks.mjs'
import { training, trainingPath, runTrainingChecks } from './training-checks.mjs'

// PUBLIC-ONLY audit. Do not run before the release owner confirms Pages success.
// This script does not read website/out, start a server, invoke Git or deploy.
const args = parseArgs(process.argv.slice(2), ['repo', 'output', 'deployed-sha', 'expected-build-id', 'artifact-evidence', 'browser', 'channel'], ['help', 'release-confirmed'])
const usage = 'After confirmed Pages deployment: node verify-public.mjs --release-confirmed --output=<evidence-directory> --deployed-sha=<40hex> --expected-build-id=<BUILD_ID> --artifact-evidence=<artifact-evidence.json> [--browser=chromium|webkit] [--channel=msedge] [--repo=<repository-root; default cwd>]'
if (args.help) { console.log(usage); process.exit(0) }
if (args['release-confirmed'] !== true || /^0{40}$/.test(args['deployed-sha'] || '') || !/^[a-f0-9]{40}$/.test(args['deployed-sha'] || '') || !/^[A-Za-z0-9_-]+$/.test(args['expected-build-id'] || '') || typeof args['artifact-evidence'] !== 'string') {
  console.error(usage); process.exit(2)
}
const engine = args.browser || 'chromium'
assert.ok(['chromium', 'webkit'].includes(engine), 'Unsupported browser')
assert.ok(engine === 'chromium' || !args.channel, '--channel is Chromium-only')
if (args.channel) assert.equal(args.channel, 'msedge', 'Only the optional msedge channel is supported')
const repo = await repoRoot(args.repo)
const outputDirectory = await outputRoot(args.output, repo)
const evidenceFile = await insideExisting(outputDirectory, args['artifact-evidence'])
const base = 'https://pero3dev.github.io/ai-agent-library'
const moePath = '/docs/llm-internals/mixture-of-experts-internals'
const variantsPath = '/docs/llm-internals/attention-variants-and-long-context'
const transformerPath = '/docs/llm-internals/transformer-architecture'
const controlPath = '/docs/llm-internals/alignment-theory'
const artifactRoutes = [trainingPath, inferencePath, ...foundations.map(item => item.route), moePath, variantsPath, transformerPath]
const artifactEvidence = JSON.parse(await readFile(evidenceFile, 'utf8'))
assert.equal(artifactEvidence.schemaVersion, 1)
assert.equal(artifactEvidence.evidenceClass, 'github-actions-pages-artifact')
assert.equal(artifactEvidence.repository, 'pero3dev/ai-agent-library')
assert.equal(artifactEvidence.baseURL, base)
assert.equal(artifactEvidence.mergeSha, args['deployed-sha'])
assert.equal(artifactEvidence.expectedBuildId, args['expected-build-id'])
assert.equal(artifactEvidence.deploymentState, 'success')
assert.ok(Number.isSafeInteger(artifactEvidence.runId) && artifactEvidence.runId > 0)
assert.ok(Number.isSafeInteger(artifactEvidence.artifactId) && artifactEvidence.artifactId > 0)
assert.deepEqual(artifactEvidence.documents.map(item => item.route).sort(), [...artifactRoutes].sort(), 'Exactly seven independently collected artifact HTML documents are required')
for (const route of artifactRoutes) {
  const documents = artifactEvidence.documents.filter(item => item.route === route)
  assert.equal(documents.length, 1, `Missing/duplicate CI artifact HTML identity for ${route}`)
  assert.match(documents[0].htmlSHA256, /^[a-f0-9]{64}$/)
  assert.equal(documents[0].buildId, args['expected-build-id'])
}
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
const sceneMarkers = [...training, ...inference, ...foundations, ...variants, ...transformers, ...moe].map(item => item.marker).concat(['AGENT LOOP / CONTROL FLOW', 'WORKFLOW / AGENT'])
const markers = sceneMarkers.concat(['ReadingFigure requires at least one stage'])
const playwright = await lockedPlaywright(repo)
const expect = playwright.expect.configure({ timeout: 15_000 })
const output = await newChild(outputDirectory, `public-${engine}-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}`)
const report = {
  evidenceClass: 'live-public-browser-and-http', baseURL: base, expectedDeploymentSha: args['deployed-sha'], expectedBuildId: args['expected-build-id'],
  identityNote: 'collect-deployment.ps1 binds the successful main run, SHA, exact deploy job/status and github-pages artifact. This audit compares public HTML/Flight build IDs and all seven article HTML byte hashes to that independently downloaded CI artifact.',
  artifactEvidenceFile: args['artifact-evidence'], artifactEvidence,
  scope: 'All previous 58 cases and fixed fixtures retained, including PR58 label checks. C1 adds 13 cases for two training diagrams, all 10 stages, nine READ stops, every selector, midpoint boundaries, six screen conditions, keyboard/modal, native-time playback, noJS and print. Seven independently collected CI HTML identities. Unrelated scene markers remain forbidden and alignment-theory remains the no-diagram control.',
  limitation: 'Browser viewport emulation is not physical iPhone Safari. Screenshots need human/agent visual inspection; passing geometry is not semantic visual acceptance.',
  independentVisualReview: { status: 'pending-independent-public-image-review', note: 'Machine case success does not approve readability. Review actual public screenshots, including every recorded text BBox overlap candidate. Local image acceptance does not replace this public check.' },
  expectedCaseCount: 71,
  startedAt: new Date().toISOString(), browser: null, cases: [], assets: [], screenshots: []
}
const save = () => writeFile(join(output, 'result.json'), JSON.stringify({
  ...report,
  portableReferences: {
    relativeTo: 'explicit output directory',
    result: relativePath(outputDirectory, join(output, 'result.json')),
    artifactEvidence: relativePath(outputDirectory, evidenceFile),
    screenshots: report.screenshots.map(item => ({ name: item.name, file: relativePath(outputDirectory, item.file) }))
  }
}, null, 2))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const rootOf = (page, id) => page.locator(`.reading-figure[data-diagram-id="${id}"]`)
const panelOf = (page, id) => rootOf(page, id).locator('.aw-sticky > .aw-diagram')
const assetURLs = new Set()
const { isKnownRootFavicon404 } = await import('./known-site-observations.mjs')
let browser

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

async function check(name, operation) {
  const result = { name, startedAt: new Date().toISOString(), status: 'running' }
  report.cases.push(result)
  try { await operation(result); result.status = 'passed' }
  catch (error) { result.status = 'failed'; result.error = error.stack || String(error) }
  result.finishedAt = new Date().toISOString(); await save(); console.log(`${result.status}: ${name}`)
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
  const body = await response.body(), html = body.toString('utf8'), unescaped = html.replaceAll('\\"', '"')
  const ids = [...new Set([...unescaped.matchAll(/"b":"([A-Za-z0-9_-]+)"/g)].map(match => match[1]))]
  result.publicDocument = { url: response.url(), status: response.status(), contentType: response.headers()['content-type'], sha256: sha(body), observedBuildIds: ids }
  assert.deepEqual(ids, [args['expected-build-id']], 'public HTML/Flight BUILD_ID differs from the confirmed deployment')
  const expectedDocument = artifactEvidence.documents.find(item => item.route === route)
  if (route !== controlPath) assert.ok(expectedDocument, `Missing independent CI artifact identity for ${route}`)
  if (expectedDocument) {
    result.publicDocument.expectedArtifactSHA256 = expectedDocument.htmlSHA256
    assert.equal(sha(body), expectedDocument.htmlSHA256, 'public article HTML bytes differ from the independently downloaded CI artifact')
    result.publicDocument.artifactHTMLMatched = true
  }
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
  if (figures === variants) {
    const ssm = page.locator('article h3').filter({ hasText: 'Transformer を離れる: 状態空間モデル' })
    assert.equal(await ssm.evaluate(node => node.closest('.reading-figure') === null), true, 'SSM must remain outside figures')
  }
  if (figures === moe) {
    await expect(page.locator('article [data-mermaid-renderer="strict"]')).toHaveCount(1)
    const specialization = page.locator('article h3').filter({ hasText: '専門化の実態' })
    assert.equal(await specialization.evaluate(node => node.closest('.reading-figure') === null), true, 'specialization must remain outside figures')
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
  const file = join(output, name + '.png')
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

async function selections(page, result) {
  const kv = panelOf(page, variants[0].id), compute = panelOf(page, variants[1].id), context = panelOf(page, variants[2].id)
  await stage(kv, variants[0], 4)
  for (const [mode, heads, ratio] of [['mha', 4, 1], ['gqa', 2, .5], ['mqa', 1, .25]]) {
    await kv.getByLabel('KVの共有', { exact: true }).selectOption(mode)
    await expect(kv.locator('svg.aw-scene')).toHaveAttribute('data-kv-heads', String(heads)); await expect(kv.locator('svg.aw-scene')).toHaveAttribute('data-cache-ratio', String(ratio)); await expect(kv.locator('[data-query-head]')).toHaveCount(4)
  }
  await stage(compute, variants[1], 0)
  for (const pattern of ['local', 'fixed', 'sink']) for (const layers of ['1', '2']) {
    await compute.getByLabel('接続パターン', { exact: true }).selectOption(pattern); await compute.getByLabel('層数', { exact: true }).selectOption(layers)
    await expect(compute.locator('[data-sparse-pattern]')).toHaveAttribute('data-sparse-pattern', pattern); await expect(compute.locator('[data-reach-layers]')).toHaveAttribute('data-reach-layers', layers)
    if (pattern === 'local' && layers === '2') await expect(compute.locator('[data-reachable="true"]')).toHaveCount(5)
    if (pattern === 'sink') await expect(compute.locator('[data-query="7"][data-key="0"]')).toHaveAttribute('data-connected', 'true')
  }
  for (const value of [1.6, 2.6, 3.6, 4.49, 2.6, 1.6]) {
    await phase(compute, value)
    if (Math.round(value) === 2) { await expect(compute.locator('[data-product-scope]')).toHaveAttribute('data-product-scope', 'unnormalized-noncausal'); await expect(compute.locator('[data-product-order]')).toHaveAttribute('data-product-order', 'kv-first') }
    else await expect(compute.locator('[data-pair-mode]')).toHaveAttribute('data-pair-mode', 'dense-causal')
    if (Math.round(value) === 4) { await expect(compute.locator('[data-row-carry]')).toHaveAttribute('data-row-carry', 'true'); assert.ok([7, 8, 9].includes(Number(await compute.locator('[data-flash-tile]').getAttribute('data-flash-tile')))) }
  }
  const readTokens = () => context.locator('[data-token-id]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.tokenId, input: Number(node.dataset.inputPosition), assigned: Number(node.dataset.assignedPosition) })))
  await stage(context, variants[2], 1); const tokens = await readTokens()
  for (const value of [1.2, 1.49, 1.5, 1.6, 2, 1.6, 1.2]) {
    await phase(context, value); const next = await readTokens(), fraction = Math.max(0, Math.min(1, (value - 1.5) * 2))
    assert.deepEqual(next.map(({ id, input }) => ({ id, input })), tokens.map(({ id, input }) => ({ id, input })))
    for (const token of next) assert.ok(Math.abs(token.assigned - token.input * (1 - fraction / 2)) < 1e-10)
    assert.equal(new Set(next.map(item => item.assigned)).size, 8)
  }
  await stage(context, variants[2], 3)
  for (const value of ['training', 'quality', 'cost']) { await context.getByLabel('確認する対象', { exact: true }).selectOption(value); await expect(context.locator('svg.aw-scene')).toHaveAttribute('data-context-check', value); await expect(context.locator('svg.aw-scene')).toHaveAttribute('data-quality-judgment', 'none') }
  result.selections = ['KV MHA/GQA/MQA and Q count', '3 sparse patterns x 2 layers', 'fractional forward/backward scope and row carry', '8 input identities and injective position mapping', 'training/quality/cost only']
}

async function transformerSelections(page, result) {
  const io = panelOf(page, 'transformer-io'); await stage(io, transformers[0], 3)
  for (const mode of ['untied', 'tied']) { await io.getByLabel('重みの共有', { exact: true }).selectOption(mode); await expect(io.locator('svg.aw-scene')).toHaveAttribute('data-io-tying', mode) }
  const position = panelOf(page, 'transformer-position'); await stage(position, transformers[1], 3)
  await position.getByLabel('位置の比較', { exact: true }).selectOption('shift-together'); await expect(position.locator('[data-pair="k"]')).toHaveAttribute('data-position', 'n + Δ')
  await position.getByLabel('位置の比較', { exact: true }).selectOption('change-gap'); await expect(position.locator('[data-pair="k"]')).toHaveAttribute('data-position', 'n'); await expect(position.locator('svg.aw-scene')).toHaveAttribute('data-value-rotated', 'false')
  const attention = panelOf(page, 'self-attention'); await stage(attention, transformers[2], 5)
  const row = attention.getByRole('button', { name: '位置 1 を追う', exact: true }); await row.click(); await expect(row).toHaveAttribute('aria-pressed', 'true')
  const block = panelOf(page, 'transformer-block'); await stage(block, transformers[3], 1)
  await block.getByLabel('注目するヘッド', { exact: true }).selectOption('h'); await expect(block.locator('[data-concat-head][data-selected="true"]')).toHaveAttribute('data-concat-head', 'h')
  await stage(block, transformers[3], 6); await block.getByLabel('Normの配置', { exact: true }).selectOption('post'); await expect(block.locator('[data-norm-placement]')).toHaveAttribute('data-norm-placement', 'post')
  await stage(block, transformers[3], 8); await block.getByLabel('重みの共有', { exact: true }).selectOption('untied'); await expect(block.locator('.aw-formula')).toContainText('2Vd')
  result.regressionSelectors = ['IO tying', 'RoPE common shift/gap and V unchanged', 'attention row', 'head h', 'Post-LN', 'block untied weights']
}

async function moeSelections(page, result) {
  const routing = panelOf(page, moe[0].id), parameters = panelOf(page, moe[1].id)
  const gateValues = () => routing.locator('[data-gate-expert]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.gateWeight)))
  await stage(routing, moe[0], 1)
  const gates = await gateValues()
  assert.equal(gates.length, 8); assert.ok(gates.every(value => value >= 0)); assert.ok(Math.abs(gates.reduce((sum, value) => sum + value, 0) - 1) < 1e-10)
  await stage(routing, moe[0], 2); assert.deepEqual(await gateValues(), gates, 'top-k must retain the original full-softmax values')
  assert.deepEqual(await routing.locator('[data-expert-selected="true"]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.expertId))), [1, 5])
  await expect(routing.locator('[data-output-experts]')).toHaveAttribute('data-output-experts', '1,5')
  assert.ok(gates[1] + gates[5] < 1)
  await stage(routing, moe[0], 3)
  for (const expert of [1, 5]) await expect(routing.locator('[data-output-experts]')).toContainText(`${gates[expert].toFixed(3)} E${expert + 1}(xA)`)
  await expect(routing.locator('[data-output-experts]')).toHaveAttribute('data-residual-count', '0')
  await expect(routing.locator('[data-residual-token]')).toHaveCount(0)

  const maskOf = async () => (await routing.locator('[data-batch-mask]').getAttribute('data-batch-mask')).split(':').map(row => [...row].map(value => value === '1'))
  const rowCounts = matrix => matrix.map(row => row.filter(Boolean).length)
  const columns = matrix => matrix[0].map((_value, expert) => matrix.reduce((sum, row) => sum + Number(row[expert]), 0))
  const scoresOf = () => routing.locator('[data-batch-token] [data-batch-expert] text').allTextContents()
  await stage(routing, moe[0], 4)
  await routing.getByLabel('選ぶ方式', { exact: true }).selectOption('token')
  const tokenMask = await maskOf(), batchScores = await scoresOf(), loads = columns(tokenMask)
  assert.deepEqual(rowCounts(tokenMask), [2, 2, 2, 2]); assert.deepEqual(loads, [0, 4, 1, 0, 0, 3, 0, 0])
  await routing.getByLabel('選ぶ方式', { exact: true }).selectOption('expert')
  await expect(routing.locator('[data-selection-choice]')).toHaveAttribute('data-selection-choice', 'expert')
  const expertMask = await maskOf()
  assert.notDeepEqual(expertMask, tokenMask); assert.deepEqual(columns(expertMask), Array(8).fill(1))
  assert.ok(new Set(rowCounts(expertMask)).size > 1, 'expert-choice must show variable experts per token')
  assert.deepEqual(await scoresOf(), batchScores, 'changing selection axis must not change the score table')
  assert.deepEqual(await routing.locator('[data-batch-token]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.selectedCount))), rowCounts(expertMask))
  await geometry(page, routing); await screenshot(page, 'moe-routing-expert-choice')
  await stage(routing, moe[0], 5)
  await expect(routing.locator('[data-selection-choice]')).toHaveAttribute('data-selection-choice', 'token')
  await expect(routing.locator('[data-load-counts]')).toHaveAttribute('data-load-counts', loads.join(','))

  await stage(routing, moe[0], 6)
  for (const [token, tokenId, accepted, dropped] of [['0', 'A', [1, 5], 0], ['1', 'B', [2], 1], ['2', 'C', [], 2]]) {
    await routing.getByLabel('同じバッチのトークン', { exact: true }).selectOption(token)
    await expect(routing.locator('svg.aw-scene')).toHaveAttribute('data-selected-token', tokenId)
    assert.deepEqual(await maskOf(), tokenMask, 'capacity selector must choose from the same batch')
    await expect(routing.locator('[data-output-experts]')).toHaveAttribute('data-output-experts', accepted.join(','))
    await expect(routing.locator('[data-output-experts]')).toHaveAttribute('data-residual-count', '1')
    await expect(routing.locator('[data-stopped-route]')).toHaveCount(dropped)
    await expect(routing.locator('[data-residual-token]')).toHaveCount(1)
    await expect(routing.locator('[data-residual-token]')).toHaveAttribute('data-residual-token', tokenId)
    const row = routing.locator(`[data-batch-token="${tokenId}"]`)
    assert.deepEqual(await row.locator('[data-accepted="true"]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.batchExpert))), accepted)
    await expect(row.locator('[data-dropped="true"]')).toHaveCount(dropped)
    for (const expert of accepted) await expect(routing.locator('[data-output-experts]')).toContainText(`${batchScores[Number(token) * 8 + expert]} E${expert + 1}(x${tokenId})`)
    if (!accepted.length) await expect(routing.locator('[data-output-experts]')).toContainText('残差だけを通る')
    await geometry(page, routing)
    await screenshot(page, `moe-capacity-token-${tokenId}`)
  }
  await stage(routing, moe[0], 7)
  await expect(routing.locator('[data-load-counts]')).toHaveAttribute('data-load-counts', loads.join(','))
  await expect(routing.locator('[data-residual-token]')).toHaveCount(0)

  const positions = () => parameters.locator('[data-expert-weight] > rect').evaluateAll(nodes => nodes.map(node => ['x', 'y', 'width', 'height'].map(name => node.getAttribute(name))))
  const sharedPosition = () => parameters.locator('[data-shared-part] > rect').evaluate(node => ['x', 'y', 'width', 'height'].map(name => node.getAttribute(name)))
  await stage(parameters, moe[1], 0)
  const initial = await positions(), shared = await sharedPosition()
  for (const placement of ['distributed', 'single']) {
    await stage(parameters, moe[1], 2)
    await parameters.getByLabel('重みの配置', { exact: true }).selectOption(placement)
    await expect(parameters.locator('[data-device-layout]')).toHaveAttribute('data-device-layout', placement)
    assert.deepEqual(await parameters.locator('[data-expert-weight]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.device))), placement === 'single' ? Array(8).fill(0) : [0, 0, 0, 0, 1, 1, 1, 1])
    for (const [index, payload, direction] of [[3, 'representation', 'dispatch'], [4, 'expert-output', 'return']]) {
      await stage(parameters, moe[1], index)
      assert.deepEqual(await positions(), initial); assert.deepEqual(await sharedPosition(), shared)
      await expect(parameters.locator('[data-expert-weight][data-resident="true"]')).toHaveCount(8)
      assert.deepEqual(await parameters.locator('[data-expert-weight][data-selected="true"]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.expertWeight))), [1, 5])
      await expect(parameters.locator('[data-payload]')).toHaveCount(2)
      await expect(parameters.locator(`[data-payload="${payload}"][data-token-id="A"]`)).toHaveCount(2)
      assert.deepEqual(await parameters.locator('[data-payload-expert]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.payloadExpert))), [1, 5])
      assert.deepEqual(await parameters.locator('[data-parameter-route]').evaluateAll(nodes => nodes.map(node => node.dataset.remote)), placement === 'single' ? ['false', 'false'] : ['false', 'true'])
      await expect(parameters.locator('[data-token-source="A"]')).toHaveCount(1)
      await expect(parameters.locator('[data-token-sum="A"]')).toHaveAttribute('data-gate-applications', '1')
      await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-transfer-direction', direction)
      await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-cross-device-transfers', placement === 'single' ? '0' : '1')
      await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-transferred-weights', '0')
      await geometry(page, parameters)
      await screenshot(page, `moe-payload-${placement}-${direction}`)
    }
  }
  await stage(parameters, moe[1], 2); await parameters.getByLabel('重みの配置', { exact: true }).selectOption('distributed')
  await stage(parameters, moe[1], 5)
  await expect(parameters.getByRole('combobox')).toHaveCount(1)
  for (const target of ['resident', 'active', 'communication', 'load']) {
    await parameters.getByLabel('確認する対象', { exact: true }).selectOption(target)
    await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-parameters-check', target)
    await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-quality-judgment', 'none')
    assert.deepEqual(await positions(), initial)
    await geometry(page, parameters)
    await screenshot(page, `moe-check-${target}`)
  }
  assert.deepEqual(await parameters.locator('[data-load-count]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.loadCount))), loads)

  result.phaseBoundaries = {}
  for (const figure of moe) {
    const panel = panelOf(page, figure.id), values = []
    for (let boundary = .5; boundary < figure.labels.length - 1; boundary++) values.push(boundary - .01, boundary, boundary + .01)
    result.phaseBoundaries[figure.id] = []
    for (const value of [...values, ...values.toReversed()]) {
      await phase(panel, value)
      const expected = Math.round(value)
      await expect(panel.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button', { name: figure.labels[expected], exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(panel.locator('svg.aw-scene')).toHaveAttribute(figure === moe[0] ? 'data-routing-stage' : 'data-parameters-stage', String(expected))
      if (figure === moe[1]) {
        await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-transfer-direction', expected === 3 ? 'dispatch' : expected === 4 ? 'return' : 'none')
        assert.deepEqual(await positions(), initial)
      }
      result.phaseBoundaries[figure.id].push(value)
    }
  }
  result.selections = { gates, selectedExperts: [1, 5], tokenMask, expertMask, expertQuota: columns(expertMask), tokenCounts: rowCounts(expertMask), loads,
    capacity: 'A accepted2 / B accepted1+drop1 / C drop2; each retains exactly one residual', placement: '4/4 or single, same eight weight rectangles', payloads: 'representation -> expert-output, token A, original expert IDs, one combine' }
}

try {
  browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' && args.channel ? { channel: args.channel } : {}) })
  report.browser = { engine, channel: engine === 'chromium' ? args.channel || null : null, version: browser.version() }
  await runFoundationsChecks({ check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect })
  await runInferenceChecks({ check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect })
  await runTrainingChecks({ check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect })
  await check('mandatory basePath SVG favicon: declaration, HTTP 200 and image/svg+xml', async result => {
    await usePage(result, {}, async page => {
      await open(page, inferencePath, inference, result)
      result.icons = []
      for (const icon of result.declaredSVGIcons) {
        const response = await page.request.get(icon.href), bytes = await response.body(), contentType = response.headers()['content-type'] || ''
        assert.equal(response.status(), 200); assert.match(contentType, /image\/svg\+xml/i); assert.match(bytes.toString('utf8'), /<svg[\s>]/)
        result.icons.push({ url: icon.href, status: response.status(), contentType, bytes: bytes.length, sha256: sha(bytes) })
      }
      assert.ok(result.icons.length > 0)
    })
  })
  for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) await check(`MoE all 14 stages: ${width}x${height} ${theme}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme }, async page => {
      await open(page, moePath, moe, result, { theme }); await structure(page, moe, 4, result, 9); result.geometry = {}
      for (const figure of moe) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); const dimensions = await geometry(page, panel)
          assert.ok(dimensions.minSVGFontPx >= 16, 'MoE text must be at least 16 SVG px')
          result.geometry[figure.id].push({ stage: index, ...dimensions })
          if (width === 1440 && theme === 'light') await screenshot(page, `${figure.id}-${index}-${width}-${theme}`)
        }
        const sync = panel.getByRole('button', { name: '本文に連動する', exact: true })
        await sync.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' })); await expect(sync).toBeInViewport({ ratio: 1 })
        if (height === 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
        if (width !== 1440 || theme !== 'light') await screenshot(page, `${figure.id}-${width}x${height}-${theme}`)
      }
      if (width === 1440 && theme === 'light') await moeSelections(page, result)
    })
    sceneDelivery(result, moe)
  })

  await check('MoE: transport, keyboard, expansion, selectors and focus return', async result => {
    await usePage(result, {}, async page => {
      await open(page, moePath, moe, result)
      for (const figure of moe) {
        const panel = panelOf(page, figure.id); await stage(panel, figure, 0)
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        const slider = panel.getByRole('slider'); await slider.focus()
        await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1))
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0')
        await page.keyboard.press('ArrowRight'); assert.ok(Number(await slider.inputValue()) > 0)
        await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1))
        const opener = panel.getByRole('button', { name: '図を拡大', exact: true }); await opener.click()
        const dialog = rootOf(page, figure.id).getByRole('dialog'), large = dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible(); await geometry(page, large)
        await expect(large).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        if (figure === moe[0]) {
          await stage(large, figure, 6); await large.getByLabel('同じバッチのトークン', { exact: true }).selectOption('1')
          await expect(large.locator('[data-output-experts]')).toHaveAttribute('data-output-experts', '2')
          await expect(large.locator('[data-residual-token]')).toHaveAttribute('data-residual-token', 'B')
        } else {
          await large.getByLabel('確認する対象', { exact: true }).selectOption('load')
          await expect(large.locator('[data-parameters-check]')).toHaveAttribute('data-parameters-check', 'load')
        }
        await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused()
        if (figure === moe[0]) await expect(panel.locator('[data-residual-token]')).toHaveAttribute('data-residual-token', 'B')
        else await expect(panel.locator('[data-parameters-check]')).toHaveAttribute('data-parameters-check', 'load')
        await opener.click(); await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused()
      }
    })
  })

  await check('MoE: isolated manual states and every registered reading step', async result => {
    await usePage(result, {}, async page => {
      await open(page, moePath, moe, result)
      for (const figure of moe) await stage(panelOf(page, figure.id), figure, 0)
      result.readingStages = {}
      for (const figure of moe) {
        const panel = panelOf(page, figure.id), other = panelOf(page, moe.find(item => item !== figure).id)
        const before = await other.getByRole('slider').inputValue()
        await stage(panel, figure, figure.labels.length - 1); assert.equal(await other.getByRole('slider').inputValue(), before)
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click(); result.readingStages[figure.id] = []
        for (const index of figure.steps) {
          await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate(node => window.scrollTo({ top: scrollY + node.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
          await expect(panel).toHaveAttribute('data-mode', 'reading'); await expect(panel).toHaveAttribute('data-stage', String(index))
          assert.equal(await other.getByRole('slider').inputValue(), before); result.readingStages[figure.id].push(index)
        }
        await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
      }
    })
  })

  for (const figure of moe) await check(`${figure.id}: actual elapsed play, frozen scene and replay`, async result => {
    await usePage(result, {}, async page => {
      await open(page, moePath, moe, result)
      const panel = panelOf(page, figure.id); await stage(panel, figure, 0); await panel.scrollIntoViewIfNeeded()
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(900)
      const started = Date.now(); await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing')
      await page.waitForTimeout(5200)
      const slider = panel.getByRole('slider'), progressed = Number(await slider.inputValue()); assert.ok(progressed > .6 && progressed < 2)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'manual')
      const paused = await slider.inputValue(), frozen = await panel.locator('svg.aw-scene').evaluate(svg => svg.innerHTML)
      await page.waitForTimeout(1000); assert.equal(await slider.inputValue(), paused); assert.equal(await panel.locator('svg.aw-scene').evaluate(svg => svg.innerHTML), frozen)
      result.playback = { clock: 'native browser time; no fake clock', elapsedMs: Date.now() - started, progressed, paused, frozenScene: true }
      if (figure === moe[1]) {
        await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, 3); await panel.scrollIntoViewIfNeeded()
        const packetPositions = () => panel.locator('[data-payload]').evaluateAll(nodes => nodes.map(node => [node.getAttribute('cx'), node.getAttribute('cy')]))
        const before = await packetPositions(); await page.emulateMedia({ reducedMotion: 'no-preference' })
        await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await page.waitForTimeout(1000)
        await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click()
        const moved = await packetPositions(); assert.notDeepEqual(moved, before); await page.waitForTimeout(700); assert.deepEqual(await packetPositions(), moved)
        result.playback.dispatchPackets = { before, paused: moved, frozen: true }
      }
      await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, figure.labels.length - 1); await page.emulateMedia({ reducedMotion: 'no-preference' })
      await panel.getByRole('button', { name: '図解を最初から再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing')
      await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(.5)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); result.playback.replayFromEnd = true
    })
  })

  await check('MoE noJS and print: original prose, 9 H3, 4 equations, Mermaid and 14 stage descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await open(page, moePath, moe, result, { noJS: true }); await structure(page, moe, 4, result, 9)
      for (const figure of moe) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible(); await expect(root.locator('.rf-static-stages li')).toHaveCount(figure.labels.length)
      }
      await screenshot(page, 'moe-no-javascript'); await page.emulateMedia({ media: 'print' })
      for (const figure of moe) {
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panelOf(page, figure.id).locator('.aw-timeline')).not.toBeVisible()
        await expect(panelOf(page, figure.id).locator('svg.aw-scene')).toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
      }
      await expect(page.locator('article h3')).toHaveCount(9); await expect(page.locator('article .katex-display')).toHaveCount(4); result.print = 'CSS emulation passed'
    })
  })

  for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) await check(`variants all 15 stages: ${width}x${height} ${theme}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme }, async page => {
      await open(page, variantsPath, variants, result, { theme }); await structure(page, variants, 3, result); result.geometry = {}
      for (const figure of variants) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); const layout = await geometry(page, panel); assert.ok(layout.minSVGFontPx >= 16)
          result.geometry[figure.id].push({ stage: index, ...layout })
          if (width === 1440 && theme === 'light') await screenshot(page, `${figure.id}-${index}-${width}-${theme}`)
        }
        const sync = panel.getByRole('button', { name: '本文に連動する', exact: true }); await sync.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' })); await expect(sync).toBeInViewport({ ratio: 1 })
        if (height === 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
        if (width !== 1440 || theme !== 'light') await screenshot(page, `${figure.id}-${width}x${height}-${theme}`)
      }
      if (width === 1440 && theme === 'light') await selections(page, result)
    })
    sceneDelivery(result, variants)
  })

  await check('variants: transport, keyboard, expansion and focus return', async result => {
    await usePage(result, {}, async page => {
      await open(page, variantsPath, variants, result)
      for (const figure of variants) {
        const panel = panelOf(page, figure.id); await stage(panel, figure, 0)
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        const slider = panel.getByRole('slider'); await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1))
        const opener = panel.getByRole('button', { name: '図を拡大', exact: true }); await opener.click()
        const dialog = rootOf(page, figure.id).getByRole('dialog'); await expect(dialog).toBeVisible(); await geometry(page, dialog.locator('.aw-diagram'))
        await expect(dialog.locator('.aw-diagram')).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused()
        await opener.click(); await expect(dialog).toBeVisible(); await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused()
      }
    })
  })

  await check('variants: isolated manual states and every registered reading step', async result => {
    await usePage(result, {}, async page => {
      await open(page, variantsPath, variants, result)
      for (const figure of variants) await stage(panelOf(page, figure.id), figure, 0)
      result.readingStages = {}
      for (const figure of variants) {
        const panel = panelOf(page, figure.id), others = variants.filter(item => item.id !== figure.id)
        const before = await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue()))
        await stage(panel, figure, figure.labels.length - 1)
        assert.deepEqual(await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue())), before)
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click(); result.readingStages[figure.id] = []
        for (const index of figure.steps) {
          await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate(node => window.scrollTo({ top: scrollY + node.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
          await expect(panel).toHaveAttribute('data-mode', 'reading'); await expect(panel).toHaveAttribute('data-stage', String(index)); result.readingStages[figure.id].push(index)
        }
        await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
      }
    })
  })

  for (const figure of variants) await check(`${figure.id}: actual elapsed play and frozen pause`, async result => {
    await usePage(result, {}, async page => {
      await open(page, variantsPath, variants, result)
      const panel = panelOf(page, figure.id); await stage(panel, figure, 0); await panel.scrollIntoViewIfNeeded(); await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(900)
      const started = Date.now(); await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing')
      await page.waitForTimeout(5200); const slider = panel.getByRole('slider'), progressed = Number(await slider.inputValue()); assert.ok(progressed > .6 && progressed < 2)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); const paused = await slider.inputValue(); await expect(panel).toHaveAttribute('data-mode', 'manual'); await page.waitForTimeout(1000); assert.equal(await slider.inputValue(), paused)
      result.playback = { clock: 'native browser time; no fake clock', elapsedMs: Date.now() - started, progressed, paused }
      await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, figure.labels.length - 1); await page.emulateMedia({ reducedMotion: 'no-preference' })
      await panel.getByRole('button', { name: '図解を最初から再生', exact: true }).click()
      await expect(panel).toHaveAttribute('data-mode', 'playing'); await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(.5)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); result.playback.replayFromEnd = true
    })
  })

  await check('variants noJS and print: original prose, 11 H3, 3 display equations and 15 stage descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await open(page, variantsPath, variants, result, { noJS: true }); await structure(page, variants, 3, result)
      for (const figure of variants) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible(); await expect(root.locator('.rf-static-stages li')).toHaveCount(figure.labels.length)
      }
      await screenshot(page, 'variants-no-javascript'); await page.emulateMedia({ media: 'print' })
      for (const figure of variants) {
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panelOf(page, figure.id).locator('.aw-timeline')).not.toBeVisible(); await expect(panelOf(page, figure.id).locator('svg.aw-scene')).toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
      }
      await expect(page.locator('article .katex-display')).toHaveCount(3); result.print = 'CSS emulation passed'
    })
  })

  for (const [width, height, theme] of [[1440, 1000, 'light'], [390, 844, 'dark']]) await check(`Transformer regression: four figures ${width} ${theme}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme }, async page => {
      await open(page, transformerPath, transformers, result, { theme }); await structure(page, transformers, 12, result); result.geometry = {}
      for (const figure of transformers) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) { await stage(panel, figure, index); result.geometry[figure.id].push({ stage: index, ...await geometry(page, panel) }) }
      }
      if (width === 1440) await transformerSelections(page, result)
      await screenshot(page, `transformer-regression-${width}-${theme}`)
    })
    sceneDelivery(result, transformers)
  })

  await check('alignment-theory control: zero heavy figure or shared-frame chunks', async result => {
    await usePage(result, {}, async page => {
      await open(page, controlPath, [], result)
      await expect(page.locator('article h1')).toContainText('アラインメント'); await expect(page.locator('.reading-figure')).toHaveCount(0); await expect(page.locator('.rf-article-toc')).toHaveCount(0)
    })
    const heavy = result.network.resources.filter(item => item.markers.length)
    result.heavyChunks = heavy.length; assert.deepEqual(heavy, [], 'heavy diagram code delivered to control article')
  })

  await check('public assets: HTTP 200, nonempty bodies and matching MIME types', async result => {
    const context = await browser.newContext()
    try {
      for (const url of [...assetURLs].sort()) {
        assert.ok(url.startsWith(base + '/'), `unexpected asset origin/path: ${url}`)
        const response = await context.request.get(url, { timeout: 30_000 }), body = await response.body(), pathname = new URL(url).pathname
        const contentType = response.headers()['content-type'] || ''
        const mimeOK = pathname.endsWith('.css') ? /text\/css/i.test(contentType) : /\.(woff2?|ttf|otf)$/.test(pathname) ? /(font\/|application\/(?:font|x-font|vnd.ms-fontobject))/i.test(contentType) : /(java|ecma)script/i.test(contentType)
        report.assets.push({ url, status: response.status(), contentType, bytes: body.length, sha256: sha(body), mimeOK })
      }
      result.checked = report.assets.length; assert.ok(result.checked > 0)
      assert.deepEqual(report.assets.filter(item => item.status !== 200 || !item.bytes || !item.mimeOK), [], 'bad public assets')
    } finally { await context.close() }
  })
} catch (error) { report.fatalError = error.stack || String(error) }
finally {
  if (browser) await browser.close()
  if (report.cases.length !== report.expectedCaseCount) report.caseCountError = `Expected ${report.expectedCaseCount} cases, observed ${report.cases.length}`
  report.finishedAt = new Date().toISOString(); report.status = report.fatalError || report.caseCountError || report.cases.some(item => item.status !== 'passed') ? 'failed' : 'passed'
  await save(); console.log(JSON.stringify({ output, status: report.status, passed: report.cases.filter(item => item.status === 'passed').length, failed: report.cases.filter(item => item.status !== 'passed').length, assets: report.assets.length, screenshots: report.screenshots.length }))
  if (report.status !== 'passed') process.exitCode = 1
}
