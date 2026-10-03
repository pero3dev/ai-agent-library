import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plainSummary, publicSectionIndex, publicUrl } from '../../lib/page-metadata.mjs'
import { addSecurityMeta } from '../../lib/export-policy.mjs'
import { replaceMermaid } from '../../lib/static-mermaid.mjs'

test('public URL preserves basePath exactly once and rejects mismatched or absent configuration', () => {
  assert.equal(publicUrl('/docs/concepts/tool-use', { STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_URL: 'https://example.org/library', NEXT_PUBLIC_BASE_PATH: '/library' }), 'https://example.org/library/docs/concepts/tool-use')
  assert.equal(publicUrl('/about', { NEXT_PUBLIC_SITE_URL: 'https://example.org', NEXT_PUBLIC_BASE_PATH: '/library' }), 'https://example.org/library/about')
  assert.throws(() => publicUrl('/', { STATIC_EXPORT: '1' }), /SITE_URL/)
  assert.throws(() => publicUrl('/', { NEXT_PUBLIC_SITE_URL: 'https://example.org/other', NEXT_PUBLIC_BASE_PATH: '/library' }), /一致/)
})
test('summary follows the purpose paragraph and section index displays real article titles', () => {
  assert.equal(plainSummary('# 題名\n\n## この記事の目的\n\n**ツール**の実行主体を理解します。\n\n## 対象読者\n秘密', '題名'), 'ツールの実行主体を理解します。')
  assert.equal(publicSectionIndex('## 収録予定ドキュメント\nファイル名がリンクになっているものは執筆済みです(計画段階)。\n| ファイル |\n| [tool.md](tool.md) |', 'docs/01-concepts/README.md', new Map([['docs/01-concepts/tool.md', 'source']]), () => 'ツール使用'), '## この章の記事\n| 記事 |\n| [ツール使用](tool.md) |')
})
test('policy hashes exact inline scripts, forbids objects and forms without allowing inline JavaScript', () => {
  const html = addSecurityMeta('<html><head><script>window.x=1</script><script src="/a.js"></script></head></html>')
  assert.match(html, /script-src 'self' 'wasm-unsafe-eval' 'sha256-/)
  assert.match(html, /object-src 'none'; base-uri 'self'; form-action 'none'/)
  assert.match(html, /strict-origin-when-cross-origin/)
  assert.doesNotMatch(html, /script-src[^;]*unsafe-inline/)
})
test('Mermaid replaces only code nodes with named generated image references', () => {
  const tree = { children: [{ type: 'heading', children: [{ value: '設計' }] }, { type: 'code', lang: 'mermaid', value: 'graph LR\n A-->B' }, { type: 'code', lang: 'js', value: 'kept' }] }
  const charts = new Map(); replaceMermaid(tree, '記事', charts)
  assert.equal(charts.size, 1); assert.equal(tree.children[1].name, 'StaticMermaid')
  assert.equal(tree.children[1].attributes[1].value, '記事: 設計の図'); assert.equal(tree.children[2].value, 'kept')
})
