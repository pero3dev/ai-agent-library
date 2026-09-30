import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { getDiagramArticleAcceptance } from '../website/lib/diagram-article-acceptance.mjs'

// Bounded capture diagnosis. Execute only after the root's independent source check.
// No real browser profile, install, product/kit/Git edit, CSS zoom/transform,
// deviceScaleFactor override, CDP page scale, or all-stage acceptance is used.
if (process.argv.length !== 2) throw new Error('This fixed-scope probe accepts no arguments')
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = 'http://127.0.0.1:4183/ai-agent-library'
const route = '/docs/llm-foundations/reasoning-models'
const targetUrl = base + route
const article = 'docs/10-llm-foundations/reasoning-models.md'
const expectedBuildId = 'ay8Xdd-uRIpIwdWdgy70j'
const output = await fs.mkdtemp(path.join(os.tmpdir(), 'reasoning-native-zoom-capture-probe-'))
const profile = path.join(output, 'isolated-profile')
const extension = path.join(output, 'local-extension')
const imagesDir = path.join(output, 'images')
for (const directory of [profile, extension, imagesDir]) await fs.mkdir(directory)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const stamp = () => new Date().toISOString()
const report = {
  schemaVersion: 1, kind: 'bounded-local-native-browser-zoom-capture-diagnosis', status: 'running', startedAt: stamp(), output,
  priorRun: { file: 'C:/Users/81906/AppData/Local/Temp/reasoning-native-zoom-probe-1yEOID/result.json', sha256: 'ab951bf7b1abaac8ed4ee1c75a9796b85f10501e54828cab51f86d82464ea05a', immutable: true, rootObservation: 'Native API/layout probe passed, but root visually found white Playwright200 viewport and wrong text/table region in Playwright200 scene clip; visual acceptance rejected; cause not established.' },
  scope: { targetUrl, article, expectedBuildId, diagram: 'reasoning-sequence', stage: 2, plannedZoomSequence: [1, 2, 1], productAcceptance: false, wholeArticleStageAcceptance: false, independentImageReview: 'pending', actualImagesViewed: 0, physicalDeviceAcceptance: false },
  method: { nativeApi: 'chrome.tabs.setZoom/getZoom', zoomSettings: { mode: 'automatic', scope: 'per-tab' }, viewport: null, deviceScaleFactorOverride: null, pageScaleFactorOverride: null, cssChanges: false, userProfileTouched: false, installs: false, settingsOnlyInIsolatedProfile: true },
  primaryReferences: [
    { url: 'https://playwright.dev/docs/chrome-extensions', checkedDate: '2026-09-30', basis: 'Bundled Chromium persistent context; chromium channel supports headless extensions.' },
    { url: 'https://developer.chrome.com/docs/extensions/reference/api/tabs', checkedDate: '2026-09-30', basis: 'setZoom/getZoom and automatic per-tab handling are native browser APIs; manual mode would not apply native rendering.' },
    { url: 'https://playwright.dev/docs/api/class-cdpsession', checkedDate: '2026-09-30', basis: 'context.newCDPSession(page) and session.send use raw CDP.' },
    { url: 'https://chromedevtools.github.io/devtools-protocol/tot/Page/', checkedDate: '2026-09-30', basis: 'Page.captureScreenshot and Page.getLayoutMetrics; exact parameter comments confirmed in installed Playwright1.63.0 types/protocol.d.ts because web viewer requires client rendering.' }
  ],
  environment: { platform: os.platform(), osRelease: os.release(), arch: os.arch(), node: process.version, profile, extension },
  steps: [], captures: [], console: [], pageErrors: [], requestFailures: [], responseErrors: [], fatalErrors: [], cleanup: {},
}
let context, page, worker, tabId, expect, cdp
let phase = 'prepare', closing = false
const save = () => fs.writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
const fileHash = async file => sha(await fs.readFile(file))
const recordError = error => ({ at: stamp(), phase, name: error.name, message: error.message, stack: error.stack })
async function identity(label) {
  const buildId = (await fs.readFile(path.join(repo, 'website/.next/BUILD_ID'), 'utf8')).trim()
  const localHtml = await fs.readFile(path.join(repo, 'website/out' + route + '.html'))
  const response = await fetch(targetUrl, { signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' })
  const servedHtml = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(path.join(output, `${label}-served.html`), servedHtml)
  const buildIds = [...new Set([...servedHtml.toString().replaceAll('\\"', '"').matchAll(/"b":"([A-Za-z0-9_-]+)"/g)].map(match => match[1]))]
  const value = { checkedAt: stamp(), buildId, expectedBuildId, status: response.status, responseUrl: response.url, responseHeaders: Object.fromEntries(response.headers), localHtmlSha256: sha(localHtml), servedHtmlSha256: sha(servedHtml), servedHtmlBytes: servedHtml.length, buildIds, inputDigest: getDiagramArticleAcceptance({ repoRoot: repo, article }).inputDigest, packageLockSha256: await fileHash(path.join(repo, 'website/package-lock.json')) }
  report[label] = value; await save()
  assert.equal(buildId, expectedBuildId, 'Local build is not the reviewed D2 candidate')
  assert.equal(response.status, 200)
  assert.equal(value.localHtmlSha256, value.servedHtmlSha256, 'Served HTML differs from local static export')
  assert.deepEqual(buildIds, [expectedBuildId])
  return value
}
async function browserMetrics() {
  return page.evaluate(() => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } }
    const figure = document.querySelector('.reading-figure[data-diagram-id="reasoning-sequence"]')
    const panel = figure?.querySelector('.aw-sticky > .aw-diagram')
    const scene = panel?.querySelector('svg.reasoning-sequence-scene')
    return {
      at: new Date().toISOString(), url: location.href, innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio,
      visualViewport: visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop } : null,
      screen: { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollY, cssZoom: getComputedStyle(document.documentElement).zoom, cssTransform: getComputedStyle(document.documentElement).transform, bodyCssZoom: getComputedStyle(document.body).zoom, bodyCssTransform: getComputedStyle(document.body).transform },
      diagram: panel ? { stage: Number(panel.dataset.stage), mode: panel.dataset.mode, phase: panel.querySelector('input[type=range]')?.value, bounds: rect(panel), scene: scene ? rect(scene) : null,
        sceneText: scene?.textContent, sceneStyle: scene ? { display: getComputedStyle(scene).display, visibility: getComputedStyle(scene).visibility, opacity: getComputedStyle(scene).opacity, transform: getComputedStyle(scene).transform, zoom: getComputedStyle(scene).zoom } : null,
        sceneCenterHit: scene ? (() => { const r = scene.getBoundingClientRect(); const x = Math.max(0, Math.min(innerWidth - 1, r.x + r.width / 2)); const y = Math.max(0, Math.min(innerHeight - 1, r.y + r.height / 2)); return { x, y, nodes: document.elementsFromPoint(x, y).slice(0, 8).map(n => ({ tag: n.tagName, class: n.getAttribute('class'), inTargetScene: Boolean(n.closest?.('svg.reasoning-sequence-scene')) })) } })() : null
      } : null
    }
  })
}
async function apiState() {
  return worker.evaluate(async id => ({ at: new Date().toISOString(), tabId: id, factor: await chrome.tabs.getZoom(id), settings: await chrome.tabs.getZoomSettings(id) }), tabId)
}
async function setZoomAndObserve(factor, label) {
  phase = label
  const operation = { label, requested: factor, startedAt: stamp(), before: await apiState() }
  report.steps.push(operation); await save()
  await worker.evaluate(async ({ id, value }) => { await chrome.tabs.setZoom(id, value) }, { id: tabId, value: factor })
  operation.after = await apiState(); await save()
  assert.equal(operation.after.factor, factor, 'Native API did not confirm requested zoom')
  assert.equal(operation.after.settings.mode, 'automatic')
  assert.equal(operation.after.settings.scope, 'per-tab')
  await page.evaluate(async () => { await document.fonts.ready; for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame) })
  await page.waitForTimeout(200)
  operation.metrics = await browserMetrics(); operation.completedAt = stamp(); await save()
  assert.equal(operation.metrics.url, targetUrl)
  assert.equal(operation.metrics.diagram?.stage, 2)
  assert.equal(operation.metrics.diagram?.mode, 'manual')
  assert.ok(Math.abs(operation.metrics.visualViewport.scale - 1) < 0.001, 'Visual viewport scaling is not native layout zoom')
  const scene = page.locator('.reading-figure[data-diagram-id="reasoning-sequence"] .aw-sticky > .aw-diagram svg.reasoning-sequence-scene')
  await scene.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
  await page.waitForTimeout(200)
  if (label === 'zoom-100-before') return operation // One200 capture comparison and one restored100 control only.
  for (const capture of ['cdp-before-playwright', 'playwright-viewport', 'cdp-after-playwright']) {
    const file = path.join(imagesDir, `${label}-${capture}.png`)
    const before = { api: await apiState(), metrics: await browserMetrics(), cdpLayoutMetrics: await cdp.send('Page.getLayoutMetrics') }
    const parameters = capture === 'playwright-viewport' ? { fullPage: false } : { format: 'png', captureBeyondViewport: false, fromSurface: true }
    if (capture === 'playwright-viewport') await page.screenshot({ path: file, ...parameters })
    else {
      // No clip, emulation change, CSS rewrite, pixel manipulation or cropping.
      const screenshot = await cdp.send('Page.captureScreenshot', parameters)
      await fs.writeFile(file, Buffer.from(screenshot.data, 'base64'), { flag: 'wx' })
    }
    const after = { api: await apiState(), metrics: await browserMetrics(), cdpLayoutMetrics: await cdp.send('Page.getLayoutMetrics') }
    const bytes = await fs.readFile(file)
    report.captures.push({ file, relativeFile: path.relative(output, file).replaceAll('\\', '/'), sha256: sha(bytes), bytes: bytes.length, pngWidth: bytes.readUInt32BE(16), pngHeight: bytes.readUInt32BE(20), capture, parameters, imageManipulation: false, zoom: factor, stage: 2, actuallyViewed: false, before, after })
    await save()
    assert.equal(after.api.factor, factor)
    assert.equal(after.metrics.innerWidth, before.metrics.innerWidth, 'Capture altered viewport')
    assert.equal(after.metrics.innerHeight, before.metrics.innerHeight, 'Capture altered viewport')
    assert.equal(after.metrics.devicePixelRatio, before.metrics.devicePixelRatio)
    assert.equal(after.metrics.document.scrollY, before.metrics.document.scrollY, 'Capture changed page scroll')
    assert.equal(after.metrics.diagram.stage, 2)
    assert.equal(after.metrics.diagram.mode, 'manual')
  }
  return operation
}
try {
  report.environment.helperSha256 = await fileHash(fileURLToPath(import.meta.url))
  assert.equal(await fileHash(report.priorRun.file), report.priorRun.sha256, 'Original run was changed')
  report.before = await identity('before')
  const require = createRequire(path.join(repo, 'website/package.json'))
  const { chromium, expect: baseExpect } = require('@playwright/test')
  expect = baseExpect.configure({ timeout: 15000 })
  const installedVersion = require('@playwright/test/package.json').version
  const lock = JSON.parse(await fs.readFile(path.join(repo, 'website/package-lock.json'), 'utf8'))
  report.environment.playwright = { installedVersion, coreVersion: require('playwright-core/package.json').version, lockedVersion: lock.packages['node_modules/@playwright/test'].version, executablePath: chromium.executablePath() }
  assert.equal(installedVersion, report.environment.playwright.lockedVersion)
  assert.equal(installedVersion, report.environment.playwright.coreVersion)
  await fs.access(report.environment.playwright.executablePath) // No fallback or install if missing.
  const manifest = { manifest_version: 3, name: 'Isolated native zoom probe', version: '1.0.0', host_permissions: ['http://127.0.0.1/*'], background: { service_worker: 'background.js' } }
  const background = "chrome.runtime.onInstalled.addListener(() => {});\n"
  await fs.writeFile(path.join(extension, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
  await fs.writeFile(path.join(extension, 'background.js'), background, { flag: 'wx' })
  report.extension = { manifest, manifestSha256: await fileHash(path.join(extension, 'manifest.json')), backgroundSha256: sha(background) }
  const launch = { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', timeout: 20000, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, '--window-size=1440,1000'] }
  report.environment.launch = launch; phase = 'launch-isolated-bundled-chromium'; await save()
  context = await chromium.launchPersistentContext(profile, launch)
  context.setDefaultTimeout(15000); context.setDefaultNavigationTimeout(20000)
  report.environment.browserVersion = context.browser()?.version() ?? null
  worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 15000 })
  assert.ok(worker.url().startsWith('chrome-extension://'))
  report.extension.serviceWorkerUrl = worker.url()
  page = context.pages()[0] || await context.newPage()
  cdp = await context.newCDPSession(page)
  report.method.cdpCommands = ['Page.getLayoutMetrics', 'Page.captureScreenshot']
  report.method.captureOrder = 'native200 CDP(raw,no clip) before Playwright viewport then CDP(raw,no clip) after; repeat only at restored100. Same paused scene, no intervening scroll or CSS change between each triple.'
  page.on('console', message => report.console.push({ at: stamp(), phase, closing, type: message.type(), text: message.text(), location: message.location() }))
  page.on('pageerror', error => report.pageErrors.push({ at: stamp(), phase, closing, message: String(error) }))
  page.on('requestfailed', request => report.requestFailures.push({ at: stamp(), phase, closing, url: request.url(), method: request.method(), resourceType: request.resourceType(), failure: request.failure() }))
  page.on('response', response => { if (response.status() >= 400) report.responseErrors.push({ at: stamp(), phase, closing, url: response.url(), status: response.status(), resourceType: response.request().resourceType() }) })
  phase = 'open-current-d2'; const navigation = await page.goto(targetUrl, { waitUntil: 'load' })
  assert.equal(navigation.status(), 200)
  const navigationBytes = await navigation.body()
  report.navigation = { at: stamp(), url: navigation.url(), status: navigation.status(), htmlSha256: sha(navigationBytes) }
  assert.equal(report.navigation.htmlSha256, report.before.servedHtmlSha256)
  await page.evaluate(() => document.fonts.ready)
  const figure = page.locator('.reading-figure[data-diagram-id="reasoning-sequence"]')
  await expect(figure).toHaveAttribute('data-ready', 'true')
  const panel = figure.locator('.aw-sticky > .aw-diagram')
  const stageButton = panel.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button').nth(2)
  await stageButton.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
  await stageButton.click()
  await expect(panel).toHaveAttribute('data-stage', '2'); await expect(panel).toHaveAttribute('data-mode', 'manual')
  const tabs = await worker.evaluate(async target => (await chrome.tabs.query({})).filter(tab => tab.url === target).map(tab => ({ id: tab.id, url: tab.url, windowId: tab.windowId })), targetUrl)
  assert.equal(tabs.length, 1, 'The extension must resolve exactly the isolated target tab')
  tabId = tabs[0].id; report.targetTab = tabs[0]
  report.originalZoom = await apiState()
  await worker.evaluate(async id => { await chrome.tabs.setZoomSettings(id, { mode: 'automatic', scope: 'per-tab' }) }, tabId)
  const one = await setZoomAndObserve(1, 'zoom-100-before')
  const two = await setZoomAndObserve(2, 'zoom-200')
  const restored = await setZoomAndObserve(1, 'zoom-100-restored')
  report.comparison = { widthRatio: one.metrics.innerWidth / two.metrics.innerWidth, heightRatio: one.metrics.innerHeight / two.metrics.innerHeight, dprRatio: two.metrics.devicePixelRatio / one.metrics.devicePixelRatio, visualViewportScales: [one.metrics.visualViewport.scale, two.metrics.visualViewport.scale, restored.metrics.visualViewport.scale], cssZoomAndTransform: [one.metrics.document, two.metrics.document, restored.metrics.document].map(({ cssZoom, cssTransform, bodyCssZoom, bodyCssTransform }) => ({ cssZoom, cssTransform, bodyCssZoom, bodyCssTransform })) }
  await save()
  assert.ok(Math.abs(one.metrics.innerWidth - 2 * two.metrics.innerWidth) <= 2, 'Layout width did not halve at native zoom 2')
  assert.ok(Math.abs(one.metrics.innerHeight - 2 * two.metrics.innerHeight) <= 2, 'Layout height did not halve at native zoom 2')
  assert.ok(Math.abs(report.comparison.dprRatio - 2) < 0.001, 'DPR did not double with native browser zoom')
  assert.equal(restored.metrics.innerWidth, one.metrics.innerWidth)
  assert.equal(restored.metrics.innerHeight, one.metrics.innerHeight)
  assert.equal(restored.metrics.devicePixelRatio, one.metrics.devicePixelRatio)
  assert.deepEqual(report.comparison.cssZoomAndTransform[1], report.comparison.cssZoomAndTransform[0])
  report.nativeApiProbe = 'passed-1-to-2-to-1-with-layout-and-dpr-evidence'
  report.captureDiagnosis = 'Raw files saved; image content requires actual visual review. No cause asserted by this helper.'
} catch (error) {
  report.fatalErrors.push(recordError(error))
  if (page && !page.isClosed()) try {
    const file = path.join(imagesDir, 'failure-viewport.png')
    await page.screenshot({ path: file, timeout: 5000 })
    report.failureCapture = { file, sha256: await fileHash(file), actuallyViewed: false }
  } catch (captureError) { report.fatalErrors.push(recordError(captureError)) }
} finally {
  phase = 'cleanup-restore-isolated-tab'
  if (worker && Number.isInteger(tabId)) try {
    await worker.evaluate(async id => { await chrome.tabs.setZoom(id, 1) }, tabId)
    report.cleanup.zoomRestored = await apiState()
    assert.equal(report.cleanup.zoomRestored.factor, 1)
  } catch (error) { report.fatalErrors.push(recordError(error)) }
  if (context) try { closing = true; await context.close(); report.cleanup.contextClosed = true } catch (error) { report.fatalErrors.push(recordError(error)) }
  phase = 'final-identity'
  try {
    report.after = await identity('after')
    for (const key of ['buildId', 'localHtmlSha256', 'servedHtmlSha256', 'inputDigest', 'packageLockSha256']) assert.equal(report.after[key], report.before[key], `Identity changed: ${key}`)
    assert.equal(await fileHash(fileURLToPath(import.meta.url)), report.environment.helperSha256)
    assert.equal(await fileHash(report.priorRun.file), report.priorRun.sha256)
  } catch (error) { report.fatalErrors.push(recordError(error)) }
  const criticalTypes = new Set(['document', 'script', 'stylesheet', 'font'])
  report.criticalResourceFailures = [...report.requestFailures, ...report.responseErrors].filter(item => !item.closing && criticalTypes.has(item.resourceType))
  report.unclassifiedNoncriticalNetworkObservations = [...report.requestFailures, ...report.responseErrors].filter(item => !criticalTypes.has(item.resourceType))
  report.consoleErrors = report.console.filter(item => item.type === 'error')
  report.status = report.fatalErrors.length || report.pageErrors.length || report.criticalResourceFailures.length || report.consoleErrors.length || !report.nativeApiProbe ? 'failed' : 'passed-bounded-probe-only'
  report.completedAt = stamp(); await save()
  console.log(JSON.stringify({ status: report.status, result: path.join(output, 'result.json'), nativeApiProbe: report.nativeApiProbe ?? null, captures: report.captures.length, failureCount: report.fatalErrors.length, networkObservations: report.requestFailures.length + report.responseErrors.length }, null, 2))
  if (report.status === 'failed') process.exitCode = 1
}
