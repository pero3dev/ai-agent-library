import { test as base, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { createServer } from 'node:http'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = pathname => `${basePath}${pathname}`
const catalog = JSON.parse(readFileSync(new URL('../../generated/audio.json', import.meta.url), 'utf8'))
const fixtureBuild = Boolean(catalog.test_only)
const player = page => page.getByRole('complementary', { name: '音声プレイヤー' })
const media = page => page.locator('audio[data-library-audio]')
const releasePrefix = 'https://github.com/pero3dev/ai-agent-library/releases/download/audio-test/'
const fixtureMp3 = readFileSync(new URL('./fixtures/tone-60s.mp3', import.meta.url))
const fixtureBundles = new Map()
if (fixtureBuild) {
  const chunks = new URL('../../out/_next/static/chunks/', import.meta.url)
  for (const filename of readdirSync(chunks).filter(name => name.endsWith('.js'))) {
    const body = readFileSync(new URL(filename, chunks), 'utf8')
    if (body.includes(releasePrefix)) fixtureBundles.set(filename, body)
  }
}

const test = base.extend({
  fixtureAudio: async ({ page }, use) => {
    const state = { releaseRequests: [], assetRequests: [], failAssetRequests: false, releasePrefix: '', rewrittenBundles: 0 }
    // Native WebKit media requests can bypass Playwright routing. Both release
    // redirects and asset responses therefore use actual loopback HTTP servers.
    const server = createServer((request, response) => {
      state.assetRequests.push({ url: request.url, range: request.headers.range })
      const headers = {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="tone-60s.mp3"',
        'accept-ranges': 'bytes',
        'cache-control': 'no-store'
      }
      if (state.failAssetRequests) {
        response.writeHead(503, { ...headers, 'content-length': '0' })
        return response.end()
      }
      const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/)
      const suffix = range && !range[1]
      const start = range ? (suffix ? Math.max(fixtureMp3.length - Number(range[2]), 0) : Number(range[1])) : 0
      const end = range && !suffix && range[2] ? Math.min(Number(range[2]), fixtureMp3.length - 1) : fixtureMp3.length - 1
      if (request.headers.range && (!range || (!range[1] && !range[2]) || start > end || start >= fixtureMp3.length)) {
        response.writeHead(416, { ...headers, 'content-range': `bytes */${fixtureMp3.length}`, 'content-length': '0' })
        return response.end()
      }
      response.writeHead(range ? 206 : 200, {
        ...headers,
        'content-length': String(end - start + 1),
        ...(range ? { 'content-range': `bytes ${start}-${end}/${fixtureMp3.length}` } : {})
      })
      response.end(request.method === 'HEAD' ? undefined : fixtureMp3.subarray(start, end + 1))
    })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const assetOrigin = `http://127.0.0.1:${server.address().port}`
    const releases = createServer((request, response) => {
      state.releaseRequests.push(request.url)
      // Separate extensionless asset URLs preserve episode identity after redirect.
      const assetId = request.url.endsWith('/agent-loop.mp3') ? 'asset-1' : 'asset-2'
      response.writeHead(302, { location: `${assetOrigin}/${assetId}`, 'cache-control': 'no-store', 'content-length': '0' })
      response.end()
    })
    await new Promise((resolve, reject) => {
      releases.once('error', reject)
      releases.listen(0, '127.0.0.1', resolve)
    })
    state.releasePrefix = `http://127.0.0.1:${releases.address().port}/releases/download/audio-test/`
    try {
      expect(fixtureBundles.size, 'The isolated build must contain fixture catalog URLs').toBeGreaterThan(0)
      // Rewrite only fixture data in the exported JS, not HTMLMediaElement APIs.
      // This gives native media backends reachable URLs without external traffic.
      await page.route('**/_next/static/chunks/*.js', async request => {
        const filename = new URL(request.request().url()).pathname.split('/').at(-1)
        const body = fixtureBundles.get(filename)
        if (!body) return request.continue()
        state.rewrittenBundles += 1
        await request.fulfill({ contentType: 'text/javascript', body: body.replaceAll(releasePrefix, state.releasePrefix) })
      })
      await use(state)
      expect(state.rewrittenBundles, 'Playback must use the local fixture catalog URLs').toBeGreaterThan(0)
    } finally {
      server.closeAllConnections()
      releases.closeAllConnections()
      await new Promise((resolve, reject) => releases.close(error => error ? reject(error) : resolve()))
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  }
})

test('audio library reports real coverage and has a keyboard skip target', async ({ page }) => {
  await page.goto(route('/audio'))
  await expect(page.getByRole('heading', { name: '音声で学ぶ', exact: true })).toBeVisible()
  await expect(page.locator('.audio-library-summary')).toContainText(`${new Set(catalog.episodes.map(item => item.article_path)).size}`)
  await expect(media(page)).toHaveCount(1)
  expect(await media(page).evaluate(audio => audio.paused && !audio.getAttribute('src'))).toBe(true)
  await expect(media(page).locator('source[src]')).toHaveCount(0)
  if (!catalog.episodes.length) {
    await expect(page.getByText('音声は現在準備中です。', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: '音声で聴く', exact: true })).toHaveCount(0)
  } else {
    const article = catalog.episodes[0].article_path
    const matching = catalog.episodes.filter(episode => episode.article_path === article)
    const published = new Date(Math.max(...matching.map(episode => Date.parse(episode.published_at))))
    const card = page.locator('.audio-library-list > li').filter({ has: page.locator(`a[href="${route(catalog.episodes[0].route)}"]`) })
    await expect(card).toContainText('音声公開日:')
    await expect(card.locator('time')).toHaveAttribute('datetime', published.toISOString())
  }
  // Enter keyboard modality, then focus explicitly because WebKit's default
  // Tab policy may skip ordinary links. Enter must still activate the skip link.
  await page.keyboard.press('Tab')
  await page.locator('a[href="#nextra-skip-nav"]').focus()
  await expect(page.locator('a[href="#nextra-skip-nav"]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#nextra-skip-nav')).toBeFocused()
})

test('article audio entry matches its canonical route under a deployment prefix', async ({ page }) => {
  await page.goto(route('/docs/concepts/agent-loop'))
  const entry = page.getByRole('region', { name: 'この記事の音声' })
  await expect(entry).toBeVisible()
  await expect(entry.getByRole('link', { name: '音声の一覧・再生リストへ' })).toHaveAttribute('href', route('/audio'))
  const episode = catalog.episodes.find(item => item.article_path === 'docs/01-concepts/agent-loop.md')
  if (episode) {
    await expect(entry.getByRole('button', { name: '音声で聴く', exact: true })).toBeVisible()
    if (episode.stale) await expect(entry).toContainText('記事より古い内容です')
  } else await expect(entry).toContainText('この記事の音声は準備中です')
})

test('mobile navigation keeps roadmap, glossary, and tags reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(route('/audio'))
  for (const pathname of ['/roadmap', '/glossary', '/tags']) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const link = page.locator(`.nextra-mobile-nav a[href="${route(pathname)}"]`).first()
    await link.scrollIntoViewIfNeeded()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${pathname}$`))
  }
})

test.describe('isolated fixture audio playback', () => {
  test.skip(!fixtureBuild, 'Run the isolated AUDIO_TEST_CATALOG build to test playback; the production catalog contains no demo media.')
  test.beforeEach(async ({ fixtureAudio }) => { expect(fixtureAudio.assetRequests).toHaveLength(0) })

  test('starts redirected MP3 from article, navigates, seeks chapters and restores without requesting media', async ({ page, fixtureAudio }, testInfo) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(route('/docs/concepts/agent-loop'))
    await page.getByRole('region', { name: 'この記事の音声' }).getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    await expect(media(page).locator('source')).toHaveAttribute('type', 'audio/mpeg')
    const episode = catalog.episodes.find(item => item.id === 'audio-test-agent-loop-v1')
    await expect(media(page).locator('source')).toHaveAttribute('src', episode.audio_url.replace(releasePrefix, fixtureAudio.releasePrefix))
    expect(fixtureAudio.releaseRequests.length).toBeGreaterThan(0)
    expect(fixtureAudio.assetRequests.length).toBeGreaterThan(0)
    expect(fixtureAudio.assetRequests.every(request => request.url === '/asset-1')).toBe(true)
    await media(page).evaluate(audio => { audio.dataset.identity = 'keep-me' })
    await player(page).getByRole('button', { name: '15秒進む' }).click()
    await expect.poll(() => media(page).evaluate(audio => audio.currentTime)).toBeGreaterThan(14)
    await player(page).getByRole('button', { name: '15秒戻る' }).click()
    await expect.poll(() => media(page).evaluate(audio => audio.currentTime)).toBeLessThan(5)
    await player(page).getByLabel('再生速度').selectOption('1.5')
    await expect.poll(() => media(page).evaluate(audio => audio.playbackRate)).toBe(1.5)
    await player(page).getByRole('button', { name: '章・再生リスト' }).click()
    await player(page).getByRole('button', { name: '0:20 試験用の仕組み' }).click()
    await expect.poll(() => media(page).evaluate(audio => audio.currentTime)).toBeGreaterThanOrEqual(20)
    const reportUrl = new URL(await player(page).getByRole('link', { name: '内容の問題を報告' }).getAttribute('href'))
    expect(reportUrl.searchParams.get('body')).toContain('audio-test-agent-loop-v1')
    await page.screenshot({ path: testInfo.outputPath('audio-desktop.png') })
    await player(page).getByRole('link', { name: '音声の一覧へ' }).click()
    await expect(page).toHaveURL(/\/audio$/)
    await expect(media(page)).toHaveAttribute('data-identity', 'keep-me')
    expect(await media(page).evaluate(audio => audio.paused)).toBe(false)
    await player(page).getByRole('button', { name: '一時停止', exact: true }).click()
    const position = await media(page).evaluate(audio => audio.currentTime)
    fixtureAudio.releaseRequests.length = 0
    fixtureAudio.assetRequests.length = 0
    await page.reload()
    await expect(player(page)).toBeVisible()
    await expect(player(page).getByLabel('再生速度')).toHaveValue('1.5')
    expect(await media(page).evaluate(audio => audio.paused && !audio.getAttribute('src'))).toBe(true)
    await expect(media(page).locator('source[src]')).toHaveCount(0)
    expect(fixtureAudio.releaseRequests).toEqual([])
    expect(fixtureAudio.assetRequests).toEqual([])
    await player(page).getByRole('button', { name: '再生', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => audio.currentTime)).toBeGreaterThanOrEqual(position - 1)
    expect(errors).toEqual([])
  })

  test('queue can be reordered before playing, auto advances, and removes the current item without autoplay', async ({ page }) => {
    await page.goto(route('/audio'))
    await page.getByLabel('公開済みだけ表示').check()
    const cards = page.locator('.audio-library-list > li')
    await expect(cards).toHaveCount(2)
    await cards.nth(0).getByRole('button', { name: '再生リストに追加', exact: true }).click()
    await cards.nth(1).getByRole('button', { name: '再生リストに追加', exact: true }).click()
    const queue = page.getByRole('region', { name: '保存した再生リスト' })
    await queue.getByRole('button', { name: '再生試験: ツール使用を上へ' }).click()
    await expect(queue.locator('li').first()).toContainText('ツール使用')
    expect(await media(page).evaluate(audio => audio.paused)).toBe(true)
    await page.getByRole('button', { name: 'リストを再生', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    await expect(player(page).locator('.audio-player-title')).toContainText('ツール使用')
    await media(page).evaluate(audio => { audio.currentTime = 59.7 })
    await expect(player(page).locator('.audio-player-title')).toContainText('Agent ループ')
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    await queue.getByRole('button', { name: '再生試験: Agent ループをリストから外す' }).click()
    await expect(player(page).locator('.audio-player-title')).toContainText('ツール使用')
    expect(await media(page).evaluate(audio => audio.paused)).toBe(true)
  })

  test('mobile player fits the viewport and storage failures leave playback available', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new DOMException('storage disabled', 'QuotaExceededError') }
    })
    await page.goto(route('/docs/concepts/agent-loop'))
    await page.getByRole('region', { name: 'この記事の音声' }).getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    await player(page).getByRole('button', { name: '章・再生リスト' }).click()
    await expect(player(page)).toContainText('このブラウザーでは再生位置を保存できません')
    const logo = await page.getByRole('link', { name: 'Home page', exact: true }).first().boundingBox()
    expect(logo.height).toBeLessThan(40)
    expect(await player(page).evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(player(page).getByRole('button', { name: '15秒戻る' })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('audio-mobile.png') })
  })

  test('failed redirected media requests are retryable without losing the selected episode', async ({ page, fixtureAudio }) => {
    fixtureAudio.failAssetRequests = true
    await page.goto(route('/docs/concepts/agent-loop'))
    await page.getByRole('region', { name: 'この記事の音声' }).getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect(player(page).getByRole('alert')).toBeVisible()
    expect(fixtureAudio.assetRequests.length).toBeGreaterThan(0)
    const failedRequests = fixtureAudio.assetRequests.length
    fixtureAudio.failAssetRequests = false
    await player(page).getByRole('button', { name: '再試行', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    expect(fixtureAudio.assetRequests.length).toBeGreaterThan(failedRequests)
    await expect(player(page).getByRole('alert')).toHaveCount(0)
    await expect(player(page).locator('.audio-player-title')).toContainText('Agent ループ')
  })

  test('unavailable old version does not transfer its position into replacement audio', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-agent-library.audio.v1', JSON.stringify({ schema_version: 1,
        queue: ['audio-test-agent-loop-old'], currentId: 'audio-test-agent-loop-old',
        positions: { 'audio-test-agent-loop-old': 45 }, rate: 1
      }))
    })
    await page.goto(route('/audio'))
    await expect(page.getByText('更新・公開終了した音声を再生リストから外しました。', { exact: false })).toBeVisible()
    await expect(player(page)).toHaveCount(0)
    await page.getByLabel('公開済みだけ表示').check()
    await page.locator('.audio-library-list > li').first().getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
    expect(await media(page).evaluate(audio => audio.currentTime)).toBeLessThan(5)
  })
})
