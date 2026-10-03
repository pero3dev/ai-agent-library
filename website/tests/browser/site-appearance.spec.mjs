import { test, expect } from '@playwright/test'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pageTypes = ['/', '/docs', '/docs/concepts', '/docs/concepts/agent-loop', '/glossary', '/tags', '/roadmap', '/audio', '/about', '/freshness', '/appearance-missing-page']
const article = '/docs/architecture/workflow-vs-agent'
const palettes = {
  light: { todo: '#fffbeb', todoBorder: '#fcd34d', todoLeft: '#fcd34d', label: '#92400e', antipattern: '#fef7f7', antipatternBorder: '#fecaca', cross: '#dc2626', checklist: '#f6fef9', checklistBorder: '#bbf7d0', check: '#16a34a' },
  dark: { todo: '#121211', todoBorder: '#403b33', todoLeft: '#6c582a', label: '#eed58b', antipattern: '#121111', antipatternBorder: '#402e30', cross: '#f09896', checklist: '#111111', checklistBorder: '#2c3632', check: '#70b67f' }
}
const rgb = hex => `rgb(${[1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`
// Nextra inherits lab()/oklch() text in some engines. Convert rendered colors
// to sRGB before applying the WCAG luminance formula.
const renderedTextColor = locator => locator.evaluate(element => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d')
  context.fillStyle = getComputedStyle(element).color
  context.fillRect(0, 0, 1, 1)
  return `rgb(${[...context.getImageData(0, 0, 1, 1).data].slice(0, 3).join(', ')})`
})
const contrast = (foreground, background) => {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1440]) {
    test(`edge fog stays behind every page type without widening the page: ${theme} ${width}px`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.addInitScript(value => localStorage.setItem('theme', value), theme)
      for (const pathname of pageTypes) {
        const response = await page.goto(`${base}${pathname}`)
        expect(response.status()).toBe(pathname === '/appearance-missing-page' ? 404 : 200)
        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
        const fog = await page.evaluate(() => {
          const body = getComputedStyle(document.body)
          const pseudo = getComputedStyle(document.body, '::before')
          const html = getComputedStyle(document.documentElement)
          return {
            isolation: body.isolation, position: pseudo.position, inset: pseudo.inset,
            zIndex: pseudo.zIndex, pointerEvents: pseudo.pointerEvents, background: pseudo.backgroundImage,
            accentAmount: html.getPropertyValue('--site-fog-accent-amount').trim(),
            violetAmount: html.getPropertyValue('--site-fog-violet-amount').trim(),
            pageBackground: html.backgroundColor,
            overflow: document.documentElement.scrollWidth - innerWidth,
            homeAccent: document.querySelector('.home') ? getComputedStyle(document.querySelector('.home')).getPropertyValue('--home-accent').trim() : null,
            siteAccent: html.getPropertyValue('--site-accent').trim()
          }
        })
        expect(fog.isolation, pathname).toBe('isolate')
        expect(fog.position, pathname).toBe('fixed')
        expect(fog.inset, pathname).toBe('0px')
        expect(fog.zIndex, pathname).toBe('-1')
        expect(fog.pointerEvents, pathname).toBe('none')
        expect(fog.pageBackground, pathname).toBe(theme === 'light' ? 'rgb(250, 250, 250)' : 'rgb(17, 17, 17)')
        expect(fog.accentAmount, pathname).toBe(theme === 'light' ? '18%' : '5.76%')
        expect(fog.violetAmount, pathname).toBe(theme === 'light' ? '12%' : '3.84%')
        expect(fog.background.match(/radial-gradient\(/g), pathname).toHaveLength(2)
        expect(fog.background, pathname).toContain('75% 70% at 50% 42%')
        expect(fog.background, pathname).toMatch(/(?:rgba\(0, 0, 0, 0\)|transparent) 55%/)
        expect(fog.background, pathname).toContain('at 0% 100%')
        // Check the rendered color-mix result, not only the authoring tokens.
        const alphas = [...fog.background.matchAll(/\/\s*([\d.]+)(%)?/g)].map(match => Number(match[1]) / (match[2] ? 100 : 1))
        for (const expected of theme === 'light' ? [0.18, 0.12] : [0.0576, 0.0384]) {
          expect(alphas.some(value => Math.abs(value - expected) < 0.00001), `${pathname}: ${fog.background}`).toBe(true)
        }
        expect(fog.overflow, pathname).toBeLessThanOrEqual(1)
        if (fog.homeAccent) expect(fog.homeAccent).toBe(fog.siteAccent)
      }
    })

    test(`TODO and practice boxes preserve layout, contrast and checkbox input: ${theme} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.addInitScript(value => localStorage.setItem('theme', value), theme)
      const colors = palettes[theme]
      await page.goto(`${base}/docs/concepts/agent-loop`)
      const todo = page.locator('.todo-callout').first()
      await expect(todo).toHaveCSS('background-color', rgb(colors.todo))
      await expect(todo).toHaveCSS('border-top-color', rgb(colors.todoBorder))
      await expect(todo).toHaveCSS('border-left-color', rgb(colors.todoLeft))
      await expect(todo).toHaveCSS('border-left-width', '4px')
      const label = todo.locator('.todo-callout-label')
      await expect(label).toHaveCSS('color', rgb(colors.label))
      const labelColor = await label.evaluate(element => getComputedStyle(element).color)
      expect(contrast(labelColor, rgb(colors.todo))).toBeGreaterThanOrEqual(4.5)
      const textColor = await renderedTextColor(todo.locator('.todo-callout-body'))
      expect(contrast(textColor, rgb(colors.todo))).toBeGreaterThanOrEqual(4.5)

      await page.goto(`${base}${article}`)
      const anti = page.locator('.practice-antipattern').first()
      const checklist = page.locator('.practice-checklist').first()
      await expect(anti).toHaveCSS('background-color', rgb(colors.antipattern))
      await expect(anti).toHaveCSS('border-top-color', rgb(colors.antipatternBorder))
      await expect(anti.locator(':scope > ul > li').nth(1)).toHaveCSS('border-top-color', rgb(colors.antipatternBorder))
      const cross = await anti.locator(':scope > ul > li').first().evaluate(element => getComputedStyle(element, '::before').color)
      expect(cross).toBe(rgb(colors.cross))
      expect(contrast(cross, rgb(colors.antipattern))).toBeGreaterThanOrEqual(4.5)
      for (const box of [anti, checklist]) {
        const bodyColor = await renderedTextColor(box)
        const background = await box.evaluate(element => getComputedStyle(element).backgroundColor)
        expect(contrast(bodyColor, background)).toBeGreaterThanOrEqual(4.5)
        await expect(box).toHaveCSS('border-radius', '12.8px')
        const bounds = await box.boundingBox()
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
      }
      await expect(checklist).toHaveCSS('background-color', rgb(colors.checklist))
      await expect(checklist).toHaveCSS('border-top-color', rgb(colors.checklistBorder))
      const checkbox = checklist.locator('.checklist-box').first()
      await expect(checkbox).toHaveCSS('accent-color', rgb(colors.check))
      await checkbox.check()
      await expect(checkbox).toBeChecked()
      await test.info().attach(`checked-${theme}-${width}`, { body: await checkbox.screenshot(), contentType: 'image/png' })
      await checkbox.focus()
      await page.keyboard.press('Space')
      await expect(checkbox).not.toBeChecked()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }

  test(`fog is disabled for print: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme)
    await page.goto(`${base}${article}`)
    await page.emulateMedia({ media: 'print' })
    expect(await page.evaluate(() => getComputedStyle(document.body, '::before').display)).toBe('none')
    await page.emulateMedia({ media: 'screen' })
    expect(await page.evaluate(() => getComputedStyle(document.body, '::before').display)).not.toBe('none')
  })
}

for (const width of [390, 1440]) test(`fog leaves theme and navigation controls usable: ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto(`${base}/`)
  const theme = page.getByRole('combobox', { name: '表示テーマ', exact: true })
  await theme.selectOption('dark')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  if (width === 390) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const menu = page.locator('.nextra-mobile-nav')
    await expect(menu).toBeInViewport()
    await menu.locator(`a[href="${base}/tags"]`).first().click()
  } else {
    await page.locator(`header a.nav-extra-link[href="${base}/tags"]`).click()
  }
  await expect(page).toHaveURL(/\/tags(?:\.html)?\/?$/)
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
})
