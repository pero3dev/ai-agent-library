import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addLibraryDiscoveryLinks, llmsRoute, markdownRoute } from '../../lib/library-links.mjs'

const availableLlmsRoutes = new Set(['/llms.txt', '/docs/concepts/llms.txt'])

test('Markdown and llms discovery routes match the flat static export and chapter scope', () => {
  assert.equal(markdownRoute('/docs/concepts/tool-use'), '/docs/concepts/tool-use.md')
  assert.equal(markdownRoute('/glossary/'), '/glossary.md')
  assert.equal(markdownRoute('/'), '/index.md')
  assert.equal(llmsRoute('/docs/concepts/tool-use', availableLlmsRoutes), '/docs/concepts/llms.txt')
  assert.equal(llmsRoute('/docs/concepts', availableLlmsRoutes), '/docs/concepts/llms.txt')
  assert.equal(llmsRoute('/docs'), '/llms.txt')
  assert.equal(llmsRoute('/glossary'), '/llms.txt')
})

test('discovery links are in head, absolute, basePath aware, and do not change the page body', () => {
  const html = '<html><head><title>ツール使用</title></head><body>本文</body></html>'
  const env = { STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_URL: 'https://example.org/library', NEXT_PUBLIC_BASE_PATH: '/library' }
  const result = addLibraryDiscoveryLinks(html, '/docs/concepts/tool-use', true, env, availableLlmsRoutes)
  assert.match(result, /<head>[\s\S]*<link rel="describedby" href="https:\/\/example.org\/library\/docs\/concepts\/llms.txt"\/>[\s\S]*<link rel="alternate" type="text\/markdown" href="https:\/\/example.org\/library\/docs\/concepts\/tool-use.md"\/>[\s\S]*<\/head>/)
  assert.ok(result.endsWith('<body>本文</body></html>'))
  assert.equal(addLibraryDiscoveryLinks(result, '/docs/concepts/tool-use', true, env, availableLlmsRoutes), result)
})

test('pages without exported Markdown only describe their covering llms.txt', () => {
  for (const route of ['/', '/docs', '/tags', '/about', '/docs/concepts']) {
    const result = addLibraryDiscoveryLinks('<html><head></head><body></body></html>', route, false, { NEXT_PUBLIC_SITE_URL: 'https://example.org', NEXT_PUBLIC_BASE_PATH: '/library' }, availableLlmsRoutes)
    assert.match(result, new RegExp(`href="https://example.org/library${llmsRoute(route, availableLlmsRoutes)}"`))
    assert.doesNotMatch(result, /text\/markdown/)
  }
  assert.match(addLibraryDiscoveryLinks('<head></head>', '/glossary', true, { NEXT_PUBLIC_SITE_URL: 'https://example.org' }), /href="https:\/\/example.org\/glossary.md"/)
})

test('examples and other docs paths without a generated chapter index fall back to the root', () => {
  for (const route of ['/docs/examples/python-tool-use', '/docs/unknown/article', '/docs/concepts/tool-use']) {
    const available = route.includes('/concepts/') ? new Set<string>() : availableLlmsRoutes
    assert.equal(llmsRoute(route, available), '/llms.txt')
    const html = addLibraryDiscoveryLinks('<head></head>', route, false, { NEXT_PUBLIC_SITE_URL: 'https://example.org' }, available)
    assert.match(html, /rel="describedby" href="https:\/\/example.org\/llms.txt"/)
    assert.doesNotMatch(html, /\/docs\/[^/]+\/llms.txt/)
  }
})

test('discovery links require a head and escape URL attributes without weakening the existing policy', () => {
  assert.throws(() => addLibraryDiscoveryLinks('<body></body>', '/about'), /head missing/)
  const result = addLibraryDiscoveryLinks('<head><meta http-equiv="Content-Security-Policy" content="default-src &#39;self&#39;"/></head>', '/', false, { NEXT_PUBLIC_SITE_URL: 'https://example.org/a&b' })
  assert.match(result, /href="https:\/\/example.org\/a&amp;b\/llms.txt"/)
  assert.match(result, /Content-Security-Policy" content="default-src &#39;self&#39;"/)
  assert.doesNotMatch(result, /<script/)
})
