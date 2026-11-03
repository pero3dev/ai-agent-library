import { test, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { requireValue } from './test-values'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = (pathname: string) => `${basePath}${pathname}`

function object(value: unknown): Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function objects(value: unknown): Record<string, unknown>[] {
  assert(Array.isArray(value))
  return value.map(object)
}

function string(value: unknown) {
  assert.equal(typeof value, 'string')
  assert(typeof value === 'string')
  return value
}

/** Keep requests local even when the generated metadata uses the production origin. */
function localPath(publicUrl: string, origin: string) {
  const url = new URL(publicUrl)
  expect(url.origin).toBe(origin)
  expect(url.pathname.startsWith(`${basePath}/`)).toBe(true)
  expect(url.search).toBe('')
  expect(url.hash).toBe('')
  return url.pathname
}

function markdownLinks(markdown: string) {
  return [...markdown.matchAll(/^- \[(?:\\.|[^\]])*\]\((https?:\/\/[^)\s]+)\):/gm)].map(match => match[1])
}

function publishedSources() {
  const docs = new URL('../../../docs/', import.meta.url)
  return readdirSync(docs, { withFileTypes: true }).filter(entry => entry.isDirectory() && /^\d\d-/.test(entry.name))
    .flatMap(chapter => readdirSync(new URL(`${chapter.name}/`, docs))
      .filter(name => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
      .filter(name => {
        const text = readFileSync(new URL(`${chapter.name}/${name}`, docs), 'utf8')
        const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
        return frontmatter !== undefined && /^status:\s*['"]?published['"]?\s*(?:#.*)?$/m.test(frontmatter)
      })
      .map(name => `docs/${chapter.name}/${name}`))
    .sort()
}

for (const [pathname, describedBy, markdown] of [
  ['/', '/llms.txt', null],
  ['/docs/concepts', '/docs/concepts/llms.txt', null],
  ['/docs/examples/python-evaluation-harness', '/llms.txt', null],
  ['/docs/concepts/tool-use', '/docs/concepts/llms.txt', '/docs/concepts/tool-use.md'],
  ['/glossary', '/llms.txt', '/glossary.md']
] as const) test(`exported HTML head discovers the covering AI resources: ${pathname}`, async ({ page, request }) => {
  const response = await page.goto(route(pathname))
  expect(response?.status()).toBe(200)
  const described = page.locator('head link[rel="describedby"]')
  await expect(described).toHaveCount(1)
  const describedUrl = new URL(requireValue(await described.getAttribute('href'), 'llms discovery URL'))
  expect(describedUrl.pathname).toBe(route(describedBy))
  expect((await request.get(localPath(describedUrl.href, describedUrl.origin))).status()).toBe(200)

  const alternate = page.locator('head link[rel="alternate"][type="text/markdown"]')
  await expect(alternate).toHaveCount(markdown ? 1 : 0)
  if (markdown) {
    const href = requireValue(await alternate.getAttribute('href'), 'Markdown discovery URL')
    expect(localPath(href, describedUrl.origin)).toBe(route(markdown))
    const markdownResponse = await request.get(localPath(href, describedUrl.origin))
    expect(markdownResponse.status()).toBe(200)
    expect(markdownResponse.headers()['content-type']).toMatch(/^text\/markdown\b/)
    expect(await markdownResponse.text()).toMatch(/^# /m)
  }
})

test('root llms index follows real chapter indexes and article Markdown over HTTP', async ({ request }) => {
  const rootResponse = await request.get(route('/llms.txt'))
  expect(rootResponse.status()).toBe(200)
  expect(rootResponse.headers()['content-type']).toMatch(/^text\/plain\b/)
  const root = await rootResponse.text()
  expect(root.match(/^# /gm)).toHaveLength(1)
  expect(root).toContain('本文はCC BY 4.0、コードはMIT')
  const links = markdownLinks(root)
  expect(links.length).toBeGreaterThan(0)
  const publicOrigin = new URL(requireValue(links[0], 'first root llms link')).origin
  const chapters: string[] = []
  for (const href of links) {
    const pathname = localPath(href, publicOrigin)
    const response = await request.get(pathname)
    expect(response.status(), href).toBe(200)
    if (pathname.endsWith('/llms.txt')) chapters.push(await response.text())
    if (pathname.endsWith('.md')) expect(response.headers()['content-type']).toMatch(/^text\/markdown\b/)
  }
  expect(chapters.length).toBeGreaterThan(0)
  for (const chapter of chapters) {
    expect(chapter.match(/^# /gm)).toHaveLength(1)
    const articles = markdownLinks(chapter)
    expect(articles.length).toBeGreaterThan(0)
    for (const href of articles) expect(localPath(href, publicOrigin)).toMatch(/\/docs\/[^/]+\/[^/]+\.md$/)
    const response = await request.get(localPath(requireValue(articles[0], 'first chapter article'), publicOrigin))
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/^text\/markdown\b/)
    expect(await response.text()).toContain('チェックリスト')
  }
})

test('published JSON contract covers the published source set and uses the same public base path', async ({ request }) => {
  const response = await request.get(route('/library-index.json'))
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^application\/json\b/)
  const index = object(JSON.parse(await response.text()) as unknown)
  expect(index.schema_version).toBe(1)
  const license = object(index.license)
  expect(license.text).toBe('CC-BY-4.0')
  expect(license.code).toBe('MIT')
  const articles = objects(index.articles)
  expect(articles.length).toBeGreaterThan(0)
  expect(articles.map(article => string(article.source_path)).sort()).toEqual(publishedSources())
  const publicOrigin = new URL(string(requireValue(articles[0], 'first indexed article').url)).origin
  for (const article of articles) {
    expect(article.status).toBe('published')
    expect(string(article.title).length).toBeGreaterThan(0)
    const pathname = localPath(string(article.url), publicOrigin)
    expect(localPath(string(article.md_url), publicOrigin)).toBe(`${pathname}.md`)
    expect(pathname).toBe(route(`/docs/${string(article.slug)}`))
    expect(objects(article.headings).length).toBeGreaterThan(0)
    expect(objects(article.checklist).length).toBeGreaterThan(0)
  }
  const glossary = objects(index.glossary)
  expect(glossary.length).toBeGreaterThan(0)
  for (const entry of glossary) {
    expect(string(entry.term).length).toBeGreaterThan(0)
    expect(string(entry.definition).length).toBeGreaterThan(0)
    localPath(string(entry.url), publicOrigin)
  }
  const schema = await request.get(route('/library-index.schema.json'))
  expect(schema.status()).toBe(200)
  expect(object(JSON.parse(await schema.text()) as unknown).type).toBe('object')
})
