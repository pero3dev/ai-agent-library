import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = slug => `${basePath}/docs/llm-internals/${slug}`
const stages = ['入力', 'Q / K / V', 'スコア', 'マスク', '重み', '混合']
const walkthrough = page => page.locator('.attention-walkthrough')
const inlineDiagram = page => walkthrough(page).locator('.aw-sticky > .aw-diagram')

async function openAttention(page, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(route('transformer-architecture'))
  expect(response.status()).toBe(200)
  await expect(walkthrough(page)).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
  await page.evaluate(() => document.fonts.ready)
  return inlineDiagram(page)
}

async function selectStage(diagram, index) {
  const button = diagram.getByRole('group', { name: '図解の段階' }).getByRole('button', { name: stages[index], exact: true })
  await button.click()
  await expect(diagram).toHaveAttribute('data-stage', String(index))
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(diagram).toHaveAttribute('data-mode', 'manual')
}

async function scrollToReadingStep(page, index) {
  await walkthrough(page).locator(`[data-attention-step="${index}"]`).evaluate(element => {
    const readingLine = Math.min(innerHeight * 0.4, 340)
    window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - readingLine + 8, behavior: 'instant' })
  })
  // Allow the actual browser scroll event and its scheduled reading frame to
  // settle; no artificial scroll events or direct React state mutations.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function expectNoPageOverflow(page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.documentElement.clientWidth
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.body).toBeLessThanOrEqual(1)
}

async function visibleSceneText(diagram) {
  return diagram.locator('.aw-scene').evaluate(svg => [...svg.querySelectorAll('text')].filter(text => {
    let opacity = 1
    for (let element = text; element && element !== svg; element = element.parentElement) {
      const style = getComputedStyle(element)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      opacity *= Number(style.opacity)
    }
    return opacity > 0.01
  }).map(element => element.textContent))
}

test.describe('self-attention desktop reading', () => {
  test.use({ viewport: { width: 1440, height: 1000 } })

  test('the enhancement is scoped to its article and preserves the source section', async ({ page }) => {
    await page.goto(route('attention-variants-and-long-context'))
    await expect(page.locator('article h1')).toBeVisible()
    await expect(walkthrough(page)).toHaveCount(0)

    const diagram = await openAttention(page)
    await expect(walkthrough(page)).toHaveCount(1)
    await expect(walkthrough(page).locator('[data-attention-step]')).toHaveCount(5)
    await expect(walkthrough(page).locator('.aw-prose .katex-display')).toHaveCount(2)
    await expect(diagram.locator('.katex')).toHaveCount(0)
    await expect(walkthrough(page).locator('.aw-prose')).toContainText('自己注意は Transformer の心臓部です。')
    await expect(walkthrough(page).locator('.aw-prose')).toContainText('softmax は行ごと(各クエリごと)に取り、重みの合計が 1 になります。')
    await expect(diagram.locator('.aw-footnote')).toContainText('実モデルの観測値や、並列計算の時間順を表すものではありません。')
    await expect(diagram).toHaveAttribute('data-mode', 'reading')
  })

  test('all six stages, token rows and the keyboard timeline remain manually controllable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    const formulaCount = await page.locator('article .katex').count()
    for (let stage = 0; stage < stages.length; stage++) {
      await selectStage(diagram, stage)
      await expect(diagram.getByRole('img')).toHaveAccessibleName(new RegExp(`^${stages[stage]}：位置 3 の自己注意`))
    }
    await diagram.getByRole('button', { name: '位置 1 を追う', exact: true }).click()
    await expect(diagram.getByRole('button', { name: '位置 1 を追う', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(diagram.getByRole('button', { name: '位置 3 を追う', exact: true })).toHaveAttribute('aria-pressed', 'false')
    await expect(diagram.getByRole('img')).toHaveAccessibleName(/^混合：位置 1 の自己注意/)

    const timeline = diagram.getByRole('slider', { name: '図解の再生位置' })
    await timeline.focus()
    await page.keyboard.press('Home')
    await expect(timeline).toHaveValue('0')
    await expect(diagram).toHaveAttribute('data-stage', '0')
    await expect(diagram.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
    await page.keyboard.press('End')
    await expect(timeline).toHaveValue('5')
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await expect(diagram.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
    await page.keyboard.press('ArrowLeft')
    await expect(timeline).toHaveValue('4.99')
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await expect(timeline).toHaveAttribute('aria-valuetext', '6 / 6、混合')
    // math.spec compares every formula against Markdown. Here the controls must
    // leave that same rendered article intact through every visualization state.
    await expect(page.locator('article .katex')).toHaveCount(formulaCount)
  })

  test('playback advances, pauses in place, steps back and replays from the beginning', async ({ page }) => {
    const diagram = await openAttention(page)
    await selectStage(diagram, 0)
    // A rounded stage label can become 0 while its transition is still moving.
    await expect(diagram.getByRole('slider')).toHaveValue('0')
    await page.clock.install()
    await diagram.getByRole('button', { name: '図解を再生', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    await page.clock.fastForward(5000)
    await expect(diagram).toHaveAttribute('data-stage', '1')
    await diagram.getByRole('button', { name: '図解を一時停止', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'manual')
    const timeline = diagram.getByRole('slider', { name: '図解の再生位置' })
    const paused = await timeline.inputValue()
    await page.clock.fastForward(5000)
    await expect(timeline).toHaveValue(paused)
    await diagram.getByRole('button', { name: '次の段階', exact: true }).click()
    await page.clock.fastForward(900)
    await expect(diagram).toHaveAttribute('data-stage', '2')
    await diagram.getByRole('button', { name: '前の段階', exact: true }).click()
    await page.clock.fastForward(900)
    await expect(diagram).toHaveAttribute('data-stage', '1')
    await diagram.getByRole('group', { name: '図解の段階' }).getByRole('button', { name: '混合', exact: true }).click()
    await page.clock.fastForward(900)
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await diagram.getByRole('button', { name: '図解を最初から再生', exact: true }).click()
    await page.clock.runFor(100)
    await expect(diagram).toHaveAttribute('data-stage', '0')
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    await page.clock.fastForward(23000)
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await expect(diagram).toHaveAttribute('data-mode', 'manual')
    await expect(diagram.getByRole('button', { name: '図解を最初から再生', exact: true })).toBeEnabled()
  })

  test('reading follows scroll until a manual choice, and resuming sync follows the current text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    for (const index of [0, 1, 2, 3, 4]) {
      await scrollToReadingStep(page, index)
      await expect(diagram).toHaveAttribute('data-stage', String(index))
      await expect(diagram).toHaveAttribute('data-mode', 'reading')
    }
    await selectStage(diagram, 1)
    await scrollToReadingStep(page, 3)
    await expect(diagram).toHaveAttribute('data-stage', '1')
    await expect(diagram).toHaveAttribute('data-mode', 'manual')
    await diagram.getByRole('button', { name: '本文に連動する', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'reading')
    await scrollToReadingStep(page, 3)
    await expect(diagram).toHaveAttribute('data-stage', '3')
    await scrollToReadingStep(page, 1)
    await expect(diagram).toHaveAttribute('data-stage', '1')
  })

  test('resuming reading after playback restores the unchanged reading position', async ({ page }) => {
    // Keep all controls visible when step 0 meets the reading line, so clicking
    // playback does not itself scroll the article to bring the button onscreen.
    await page.setViewportSize({ width: 1440, height: 1400 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    await scrollToReadingStep(page, 0)
    await expect(diagram).toHaveAttribute('data-stage', '0')
    await expect(diagram).toHaveAttribute('data-mode', 'reading')
    const readingScroll = await page.evaluate(() => scrollY)
    await page.clock.install()
    await diagram.getByRole('button', { name: '図解を再生', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    await page.clock.fastForward(23000)
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await expect(diagram).toHaveAttribute('data-mode', 'manual')
    expect(await page.evaluate(() => scrollY)).toBe(readingScroll)
    await diagram.getByRole('button', { name: '本文に連動する', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'reading')
    await expect(diagram).toHaveAttribute('data-stage', '0')
    await expect(diagram.getByRole('slider')).toHaveValue('0')
  })

  test('expanded view shares state, makes the background inert and restores focus on Escape', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    await selectStage(diagram, 4)
    const expand = diagram.getByRole('button', { name: '図を拡大', exact: true })
    // WebKit does not focus buttons on mouse click. Exercise the keyboard path
    // explicitly so the dialog has a focused opener to restore on Escape.
    await expand.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: '自己注意の拡大図', exact: true })
    await expect(dialog).toBeVisible()
    const close = dialog.getByRole('button', { name: '拡大図を閉じる', exact: true })
    await expect(close).toBeFocused()
    expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true)
    await page.keyboard.press('Shift+Tab')
    // Native dialogs may send reverse Tab to browser chrome. BODY then becomes
    // activeElement; background links/buttons must never receive that focus.
    expect(await dialog.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true)
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    const expandedDiagram = dialog.locator('.aw-diagram')
    await expect(expandedDiagram).toHaveAttribute('data-stage', '4')
    await dialog.getByRole('button', { name: '位置 4 を追う', exact: true }).click()
    await selectStage(expandedDiagram, 5)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(expand).toBeFocused()
    await expect(diagram).toHaveAttribute('data-stage', '5')
    await expect(diagram.getByRole('button', { name: '位置 4 を追う', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expand.focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await close.click()
    await expect(dialog).not.toBeVisible()
    await expect(expand).toBeFocused()
  })

  test('reduced motion seeks directly to the requested stage in either direction', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    const buttons = diagram.getByRole('group', { name: '図解の段階' })
    await buttons.getByRole('button', { name: '混合', exact: true }).click()
    // Read once, without a polling assertion that could conceal interpolation.
    expect(await diagram.getByRole('slider').inputValue()).toBe('5')
    await buttons.getByRole('button', { name: '入力', exact: true }).click()
    expect(await diagram.getByRole('slider').inputValue()).toBe('0')
    expect(await diagram.locator('.aw-stage-dot').first().evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s')
  })

  test('a partial seek keeps the softmax formula, stage label and visible matrix values consistent', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const diagram = await openAttention(page)
    await selectStage(diagram, 4)
    const timeline = diagram.getByRole('slider', { name: '図解の再生位置' })
    await timeline.focus()
    for (let step = 0; step < 30; step++) await page.keyboard.press('ArrowLeft')
    await expect(timeline).toHaveValue('3.7')
    await expect(timeline).toHaveAttribute('aria-valuetext', '5 / 6、重み')
    await expect(diagram).toHaveAttribute('data-stage', '4')
    await expect(diagram.locator('.aw-formula')).toHaveText('A = softmax(S + M)')
    const sceneText = await visibleSceneText(diagram)
    expect(sceneText).toContain('注意の重み A')
    expect(sceneText).toContain('重みの合計 = 1')
    expect(sceneText).toContain('1.00')
    expect(sceneText).toContain('0.00')
    expect(sceneText).not.toContain('−∞')
    expect(sceneText).not.toContain('未来のスコアを −∞ に')
  })
})

for (const theme of ['light', 'dark']) {
  test.describe(`self-attention 375px ${theme}`, () => {
    test.use({ viewport: { width: 375, height: 812 }, colorScheme: theme, reducedMotion: 'reduce' })

    test('the diagram, controls and article formulas fit the page at every stage', async ({ page }) => {
      const diagram = await openAttention(page, theme)
      const formulaCount = await page.locator('article .katex').count()
      expect(formulaCount).toBeGreaterThan(2)
      for (let index = 0; index < stages.length; index++) {
        await selectStage(diagram, index)
        await expectNoPageOverflow(page)
        await expect(page.locator('article .katex')).toHaveCount(formulaCount)
      }
      await diagram.getByRole('button', { name: '図を拡大', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '自己注意の拡大図', exact: true })
      await expect(dialog).toBeVisible()
      const bounds = await dialog.boundingBox()
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(376)
      await expectNoPageOverflow(page)
      await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click()
      await expect(dialog).not.toBeVisible()
      await expect(walkthrough(page).locator('.aw-prose .katex-display')).toHaveCount(2)
    })
  })
}

test.describe('self-attention without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })

  test('server-rendered prose and formulas remain readable and interactive controls are disabled', async ({ page }) => {
    const response = await page.goto(route('transformer-architecture'))
    expect(response.status()).toBe(200)
    await expect(walkthrough(page)).toHaveAttribute('data-ready', 'false')
    const prose = walkthrough(page).locator('.aw-prose')
    await expect(prose).toContainText('自己注意は Transformer の心臓部です。')
    await expect(prose).toContainText('softmax は行ごと(各クエリごと)に取り、重みの合計が 1 になります。')
    await expect(prose.locator('.katex-display')).toHaveCount(2)
    await expect(prose.locator('.katex-error')).toHaveCount(0)
    for (const formula of await prose.locator('.katex-display').all()) await expect(formula).toBeVisible()
    await expect(walkthrough(page).getByText('動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。', { exact: true })).toBeVisible()
    await expect(inlineDiagram(page).getByRole('button', { name: '図解を再生', exact: true })).toBeDisabled()
    await expect(page.getByRole('heading', { name: /^多頭注意/ })).toBeVisible()
  })
})
