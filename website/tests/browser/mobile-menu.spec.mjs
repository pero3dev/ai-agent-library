import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = value => `${basePath}${value}`

async function expectOpaqueThemeBackground(menu) {
  const background = await menu.evaluate(element => ({
    menu: getComputedStyle(element).backgroundColor,
    page: getComputedStyle(document.documentElement).backgroundColor,
    opacity: getComputedStyle(element).opacity
  }))
  // An absent theme background used to make both colors transparent. Checking
  // equality alone would miss the article showing through the opened menu.
  expect(background.page).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  expect(background.menu).toBe(background.page)
  expect(background.opacity).toBe('1')
}

async function expectOpenMenu(page, menu) {
  await expect(menu).toBeInViewport({ ratio: 0.99 })
  const viewport = page.viewportSize()
  const bounds = await menu.boundingBox()
  expect(bounds.x).toBeCloseTo(0, 0)
  expect(bounds.y).toBeCloseTo(0, 0)
  expect(bounds.width).toBeCloseTo(viewport.width, 0)
  expect(bounds.height).toBeCloseTo(viewport.height, 0)
  await expectOpaqueThemeBackground(menu)
  await expect(menu.getByRole('combobox')).toBeVisible()
  await expect(menu.getByRole('combobox')).toBeInViewport()
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    menu: document.querySelector('.nextra-mobile-nav').scrollWidth - innerWidth
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.menu).toBeLessThanOrEqual(1)
}

const mobileCases = [
  { width: 375, height: 812, theme: 'light', pathname: '/' },
  { width: 375, height: 812, theme: 'dark', pathname: '/docs/concepts/tool-use' },
  { width: 390, height: 844, theme: 'light', pathname: '/docs/concepts/tool-use' },
  { width: 390, height: 844, theme: 'dark', pathname: '/' },
  { width: 430, height: 932, theme: 'light', pathname: '/' },
  { width: 430, height: 932, theme: 'dark', pathname: '/docs/concepts/tool-use' }
]

for (const { width, height, theme, pathname } of mobileCases) {
  test.describe(`mobile menu ${width}px ${theme} ${pathname}`, () => {
    test.use({ viewport: { width, height }, isMobile: true, hasTouch: true, colorScheme: theme })

    test('covers the page, reopens, and navigates after scrolling', async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem('theme', value), theme)
      await page.goto(route(pathname))
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
      const toggle = page.getByRole('button', { name: 'Menu', exact: true })
      const menu = page.locator('.nextra-mobile-nav')
      await expect(menu).not.toBeInViewport()
      if (pathname.startsWith('/docs/')) {
        const tooltips = page.locator('article .glossary-term-popover')
        expect(await tooltips.count()).toBeGreaterThan(0)
        // Invisible, absolutely positioned tooltips must not widen the page.
        expect(await tooltips.evaluateAll(elements => elements.every(element => element.getClientRects().length === 0))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }

      await toggle.tap()
      await expectOpenMenu(page, menu)
      await toggle.tap()
      await expect(menu).not.toBeInViewport()
      await toggle.click()
      await expectOpenMenu(page, menu)

      const tags = menu.locator(`a[href="${route('/tags')}"]`).first()
      await tags.scrollIntoViewIfNeeded()
      await expect(tags).toBeInViewport()
      await expect.poll(() => menu.locator('.nextra-scrollbar').evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      await tags.tap()
      await expect(page).toHaveURL(new RegExp(`${route('/tags')}(?:\\.html)?/?$`))
      await expect(menu).not.toBeInViewport()
      await expect(page.locator('main h1')).toBeVisible()
    })
  })
}

test('desktop theme, glossary tooltips, and navigation remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto(route('/docs/concepts/tool-use'))
  const html = page.locator('html')
  await expect(html).toHaveClass(/\blight\b/)
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeHidden()
  const initialBackground = await html.evaluate(element => getComputedStyle(element).backgroundColor)
  expect(initialBackground).toMatch(/^rgb\(\d+, \d+, \d+\)$/)

  await page.getByTitle('Change theme').filter({ visible: true }).click()
  await page.getByRole('option', { name: 'Dark', exact: true }).click()
  await expect(html).toHaveClass(/\bdark\b/)
  await expect.poll(() => html.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground)
  const darkBackground = await html.evaluate(element => getComputedStyle(element).backgroundColor)
  expect(darkBackground).toMatch(/^rgb\(\d+, \d+, \d+\)$/)

  const term = page.locator('article .glossary-term').first()
  const tooltip = term.getByRole('tooltip', { includeHidden: true })
  await expect(tooltip).toBeHidden()
  await term.hover()
  await expect(tooltip).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(tooltip).toBeHidden()
  // Enter keyboard modality before focusing: WebKit may skip ordinary links
  // in its default Tab order, so do not assume Shift+Tab returns to this link.
  await page.keyboard.press('Tab')
  await term.focus()
  await expect(term).toBeFocused()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(tooltip).toBeHidden()

  await page.locator(`header a.nav-extra-link[href="${route('/tags')}"]`).click()
  await expect(page).toHaveURL(new RegExp(`${route('/tags')}(?:\\.html)?/?$`))
  await expect(html).toHaveClass(/\bdark\b/)
  await expect(html).toHaveCSS('background-color', darkBackground)
})
