import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = pathname => `${basePath}${pathname}`
const catalog = JSON.parse(readFileSync(new URL('../../generated/audio.json', import.meta.url), 'utf8'))
const fixtureBuild = Boolean(catalog.test_only)
const player = page => page.getByRole('complementary', { name: '音声プレイヤー' })
const media = page => page.locator('audio[data-library-audio]')

// Test-only PCM: real browser decoding and media events, not generated learning content.
function fixtureWav() {
  const rate = 8000
  const dataSize = rate * 60 * 2
  const bytes = Buffer.alloc(44 + dataSize)
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + dataSize, 4); bytes.write('WAVE', 8)
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28)
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(dataSize, 40)
  for (let sample = 0; sample < dataSize / 2; sample++) bytes.writeInt16LE(Math.round(100 * Math.sin(sample * 2 * Math.PI * 220 / rate)), 44 + sample * 2)
  return bytes
}
async function interceptAudio(page) {
  const body = fixtureWav()
  await page.route('https://github.com/pero3dev/ai-agent-library/releases/download/audio-test/*.mp3', async request => {
    const range = request.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/)
    const start = range ? Number(range[1]) : 0
    const end = range?.[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1
    await request.fulfill({ status: range ? 206 : 200, contentType: 'audio/wav', body: body.subarray(start, end + 1), headers: {
      'accept-ranges': 'bytes', 'content-length': String(end - start + 1),
      ...(range ? { 'content-range': `bytes ${start}-${end}/${body.length}` } : {})
    } })
  })
}

test('audio library reports real coverage and has a keyboard skip target', async ({ page }) => {
  await page.goto(route('/audio'))
  await expect(page.getByRole('heading', { name: '音声で学ぶ', exact: true })).toBeVisible()
  await expect(page.locator('.audio-library-summary')).toContainText(`${new Set(catalog.episodes.map(item => item.article_path)).size}`)
  await expect(media(page)).toHaveCount(1)
  expect(await media(page).evaluate(audio => audio.paused && !audio.getAttribute('src'))).toBe(true)
  if (!catalog.episodes.length) {
    await expect(page.getByText('音声は現在準備中です。', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: '音声で聴く', exact: true })).toHaveCount(0)
  }
  await page.keyboard.press('Tab')
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
  test.beforeEach(async ({ page }) => { await interceptAudio(page) })

  test('starts from article, navigates without replacing audio, seeks chapters and resumes after reload', async ({ page }, testInfo) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(route('/docs/concepts/agent-loop'))
    await page.getByRole('region', { name: 'この記事の音声' }).getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
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
    await page.reload()
    await expect(player(page)).toBeVisible()
    await expect(player(page).getByLabel('再生速度')).toHaveValue('1.5')
    expect(await media(page).evaluate(audio => audio.paused && !audio.getAttribute('src'))).toBe(true)
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

  test('failed media requests are retryable without losing the selected episode', async ({ page }) => {
    const pattern = 'https://github.com/pero3dev/ai-agent-library/releases/download/audio-test/*.mp3'
    const failRequest = request => request.abort('failed')
    await page.route(pattern, failRequest)
    await page.goto(route('/docs/concepts/agent-loop'))
    await page.getByRole('region', { name: 'この記事の音声' }).getByRole('button', { name: '音声で聴く', exact: true }).click()
    await expect(player(page).getByRole('alert')).toBeVisible()
    await page.unroute(pattern, failRequest)
    await player(page).getByRole('button', { name: '再試行', exact: true }).click()
    await expect.poll(() => media(page).evaluate(audio => !audio.paused && audio.readyState > 0)).toBe(true)
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
