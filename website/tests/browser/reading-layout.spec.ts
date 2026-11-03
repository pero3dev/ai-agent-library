import { test, expect } from '@playwright/test'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const article = `${base}/docs/architecture/workflow-vs-agent`
const toc = page => page.locator('.article-section-toc')

test('current-section TOC keeps every H2 and changes only its H3 children', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(article)
  const headings = await page.locator('article h2').allTextContents()
  await expect(toc(page).locator(':scope > ul > li > a')).toHaveCount(headings.length)
  for (const [index, heading] of headings.entries()) {
    await expect(toc(page).locator(':scope > ul > li > a').nth(index)).toHaveText(heading.replace(/#$/, ''))
  }
  await expect(toc(page).locator('.article-toc-children a')).toHaveCount(0)
  await toc(page).getByRole('link', { name: '本文', exact: true }).click()
  await expect(toc(page).locator('.article-toc-children a')).toHaveCount(5)
  await toc(page).getByRole('link', { name: '実務での注意点', exact: true }).click()
  await expect(toc(page).locator('.article-toc-children a')).toHaveText(['アンチパターン', 'チェックリスト'])
  await expect(toc(page).locator('[aria-current="location"]')).toHaveText('実務での注意点')
  await toc(page).getByRole('link', { name: 'チェックリスト', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(encodeURIComponent('チェックリスト')))
  await expect(toc(page).locator('[aria-current="location"]')).toHaveText('チェックリスト')
  await expect(page.locator('.r1-preview-toolbar, [data-layout-preview]')).toHaveCount(0)
})

test('direct heading links and client navigation update the current section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${article}#${encodeURIComponent('チェックリスト')}`)
  await expect(toc(page).locator('[aria-current="location"]')).toHaveText('チェックリスト')
  await page.reload()
  await expect(toc(page).locator('[aria-current="location"]')).toHaveText('チェックリスト')
  await page.locator('article').getByRole('link', { name: 'AI Agent とは何か', exact: true }).last().click()
  await expect(page.locator('article h1')).toHaveText('AI Agent とは何か')
  await expect(toc(page).locator(':scope > ul > li > a')).toHaveCount(await page.locator('article h2').count())
  await expect(toc(page).getByRole('link', { name: 'チェックリスト', exact: true })).toHaveCount(0)
})

test('complete native TOC remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
  try {
    const page = await context.newPage()
    await page.goto(article)
    await expect(toc(page)).toHaveCount(0)
    await expect(page.locator('.nextra-toc').getByRole('link', { name: 'チェックリスト', exact: true })).toBeVisible()
    await page.locator('.nextra-toc').getByRole('link', { name: 'チェックリスト', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(encodeURIComponent('チェックリスト')))
  } finally {
    await context.close()
  }
})
