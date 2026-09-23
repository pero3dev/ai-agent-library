import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = (section, slug) => `${basePath}/docs/${section}/${slug}`
const sourceDirectory = new URL('../../../docs/11-llm-internals/', import.meta.url)
const parser = unified().use(remarkParse).use(remarkMath)

function collectMath(node, result = []) {
  if (node.type === 'math' || node.type === 'inlineMath') {
    result.push({ display: node.type === 'math', value: node.value })
  }
  for (const child of node.children ?? []) collectMath(child, result)
  return result
}

// Compare the actual article formulas, including their order and kind, with the
// source. This catches formulas disappearing in the sync/MDX pipeline as well.
const articles = readdirSync(sourceDirectory)
  .filter(file => file.endsWith('.md') && file !== 'README.md').sort()
  .map(file => ({
    section: 'llm-internals',
    slug: file.replace(/\.md$/, ''),
    math: collectMath(parser.parse(readFileSync(new URL(file, sourceDirectory), 'utf8')))
  }))
// KaTeX styles are shared by the site; retain coverage of the existing ROI
// equation outside chapter 11 when changing their layout or font delivery.
articles.push({
  section: 'business',
  slug: 'roi-and-business-case',
  math: collectMath(parser.parse(readFileSync(new URL('../../../docs/09-business/roi-and-business-case.md', import.meta.url), 'utf8')))
})

const cases = articles.flatMap(article => [
  { ...article, width: 375, theme: 'light' },
  { ...article, width: 1440, theme: 'dark' }
])
for (const slug of ['transformer-architecture', 'alignment-theory']) {
  const article = articles.find(item => item.slug === slug)
  for (const [width, theme] of [[390, 'dark'], [430, 'light'], [768, 'light']]) {
    cases.push({ ...article, width, theme })
  }
}

async function openArticle(page, section, slug, theme) {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(route(section, slug))
  expect(response.status()).toBe(200)
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
  await page.evaluate(() => document.fonts.ready)
}

async function expectNoPageOverflow(page) {
  expect(await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.documentElement.clientWidth
  }))).toEqual({ document: 0, body: 0 })
}

for (const { section, slug, math, width, theme } of cases) {
  test.describe(`math ${slug} ${width}px ${theme}`, () => {
    test.use({ viewport: { width, height: 900 }, colorScheme: theme })

    test(`renders every formula once without clipping or widening the page${section === 'llm-internals' ? ' or exposing emphasis markers in chapter 11' : ''}`, async ({ page }) => {
      await openArticle(page, section, slug, theme)
      const formulas = page.locator('article .katex')
      await expect(formulas).toHaveCount(math.length)
      await expect(page.locator('article .katex-display')).toHaveCount(math.filter(item => item.display).length)
      await expect(page.locator('article .katex-error')).toHaveCount(0)
      expect(await formulas.evaluateAll(elements => elements.map(element => ({
        display: Boolean(element.closest('.katex-display')),
        value: element.querySelector('annotation[encoding="application/x-tex"]')?.textContent
      })))).toEqual(math)

      const rendering = await formulas.evaluateAll(elements => elements.map(element => {
        const mathml = element.querySelector('.katex-mathml')
        const html = element.querySelector('.katex-html')
        const bounds = mathml.getBoundingClientRect()
        const style = getComputedStyle(mathml)
        return {
          // MathML stays available to assistive technology, but its second
          // visual rendering must be clipped by the shipped KaTeX stylesheet.
          mathmlClipped: style.position === 'absolute'
            && style.overflow === 'hidden'
            && (style.clipPath !== 'none' || style.clip !== 'auto')
            && bounds.width <= 1 && bounds.height <= 1,
          mathmlAvailable: !mathml.closest('[aria-hidden="true"]')
            && style.display !== 'none' && style.visibility !== 'hidden',
          visualCopyHiddenFromAT: html.getAttribute('aria-hidden') === 'true',
          usesMathFont: getComputedStyle(element).fontFamily.includes('KaTeX_Main')
        }
      }))
      expect(rendering).toEqual(math.map(() => ({
        mathmlClipped: true,
        mathmlAvailable: true,
        visualCopyHiddenFromAT: true,
        usesMathFont: true
      })))
      const fontState = await page.evaluate(() => ({
        loaded: [...document.fonts].some(font => /KaTeX_Main/.test(font.family) && font.status === 'loaded'),
        failed: [...document.fonts].filter(font => /KaTeX/.test(font.family) && font.status === 'error').map(font => font.family)
      }))
      expect(fontState.loaded).toBe(true)
      expect(fontState.failed).toEqual([])
      await expectNoPageOverflow(page)

      const displays = await page.locator('article .katex-display').all()
      for (const [index, formula] of displays.entries()) {
        await test.step(`display formula ${index + 1} keeps its top, bottom, and both ends`, async () => {
          await formula.evaluate(element => { element.scrollLeft = 0 })
          await expectFormulaNotClipped(formula, 'left')
          await formula.evaluate(element => { element.scrollLeft = element.scrollWidth - element.clientWidth })
          await expectFormulaNotClipped(formula, 'right')
          await formula.evaluate(element => { element.scrollLeft = 0 })
        })
      }

      // Emphasis repairs are scoped to chapter 11. The ROI article exercises
      // shared math styles; its existing prose-formatting issues are separate.
      if (section === 'llm-internals') {
        const rawEmphasis = await page.locator('article').evaluate(element => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          const found = []
          while (walker.nextNode()) {
            const node = walker.currentNode
            if (!node.parentElement.closest('pre, code, .katex, script, style') && node.textContent.includes('**')) {
              found.push(node.textContent.trim())
            }
          }
          return found
        })
        expect(rawEmphasis).toEqual([])
      }
    })
  })
}

for (const theme of ['light', 'dark']) {
  test.describe(`long display formula keyboard access ${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 }, colorScheme: theme })

    test('reaches both ends and preserves fraction/subscript height', async ({ page }) => {
      await openArticle(page, 'llm-internals', 'alignment-theory', theme)
      const formula = page.locator('article .katex-display').filter({ hasText: '\\mathcal{L}_{\\mathrm{DPO}}' })
      await expect(formula).toHaveCount(1)
      await expect(formula).toHaveAttribute('role', 'region')
      await expect(formula).toHaveAccessibleName('数式')
      await expect(formula).toHaveAttribute('tabindex', '0')
      await formula.scrollIntoViewIfNeeded()
      const maximum = await formula.evaluate(element => element.scrollWidth - element.clientWidth)
      expect(maximum).toBeGreaterThan(50)

      // Enter keyboard modality explicitly: WebKit does not always include
      // ordinary links in the default Tab order on every host platform.
      await page.keyboard.press('Tab')
      await formula.focus()
      await expect(formula).toBeFocused()
      expect(await formula.evaluate(element => element.matches(':focus-visible'))).toBe(true)
      const outline = await formula.evaluate(element => ({
        style: getComputedStyle(element).outlineStyle,
        width: parseFloat(getComputedStyle(element).outlineWidth)
      }))
      expect(outline.style).not.toBe('none')
      expect(outline.width).toBeGreaterThan(0)

      await page.keyboard.press('ArrowRight')
      await expect.poll(() => formula.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
      for (let press = 0; press < Math.ceil(maximum / 20) + 5; press++) {
        await page.keyboard.press('ArrowRight')
      }
      await expect.poll(() => formula.evaluate(element => element.scrollWidth - element.clientWidth - element.scrollLeft)).toBeLessThanOrEqual(1)
      await expectNoPageOverflow(page)
      await expectFormulaNotClipped(formula, 'right')

      for (let press = 0; press < Math.ceil(maximum / 20) + 5; press++) {
        await page.keyboard.press('ArrowLeft')
      }
      await expect.poll(() => formula.evaluate(element => element.scrollLeft)).toBeLessThanOrEqual(1)
      await expectFormulaNotClipped(formula, 'left')
    })
  })
}

async function expectFormulaNotClipped(formula, edge) {
  const dimensions = await formula.evaluate((element, selectedEdge) => {
    const bounds = element.getBoundingClientRect()
    const visual = element.querySelector('.katex-html')
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT)
    const boxes = []
    while (walker.nextNode()) {
      // KaTeX uses zero-width characters in its alignment machinery. Only
      // measure text that paints a glyph, including fraction/subscript text.
      if (!walker.currentNode.textContent.replace(/[\s\u200b]/g, '')) continue
      const range = document.createRange()
      range.selectNodeContents(walker.currentNode)
      boxes.push(...Array.from(range.getClientRects()))
    }
    // Square roots intentionally draw a very wide SVG and clip its tail.
    // Measure that visible clip box, not the SVG's offscreen 400em canvas.
    boxes.push(...Array.from(visual.querySelectorAll('.hide-tail, .frac-line'), child => child.getBoundingClientRect()))
    return {
      count: boxes.length,
      verticalOverflow: element.scrollHeight - element.clientHeight,
      clippedVertically: boxes.filter(box => box.top < bounds.top - 1 || box.bottom > bounds.top + element.clientHeight + 1).length,
      edgeClipped: selectedEdge === 'left'
        ? Math.min(...boxes.map(box => box.left)) < bounds.left - 1
        : Math.max(...boxes.map(box => box.right)) > bounds.left + element.clientWidth + 1
    }
  }, edge)
  expect(dimensions.count).toBeGreaterThan(0)
  expect(dimensions.verticalOverflow).toBeLessThanOrEqual(1)
  expect(dimensions.clippedVertically).toBe(0)
  expect(dimensions.edgeClipped).toBe(false)
}
