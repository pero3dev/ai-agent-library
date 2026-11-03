import assert from 'node:assert/strict'
import test from 'node:test'
import { assertPagesMetadata, assertSections, assertStringArray } from '../../lib/generated-data.mts'

test('postbuild accepts the producer contracts including empty collections and nullable dates', () => {
  assertStringArray([], 'routes')
  assertStringArray(['/docs/concepts/agent-loop'], 'routes')
  assertPagesMetadata({ '/docs': { title: '記事', description: '説明', last_updated: null, source_path: 'docs/README.md' } })
  assertSections([{ slug: 'concepts', num: '01', title: '基礎', description: '説明', route: '/docs/concepts', count: 3 }])
})

test('postbuild refuses malformed generated data instead of publishing a partial route or metadata set', () => {
  for (const value of [null, {}, ['/', 3]]) assert.throws(() => assertStringArray(value, 'routes'), /Invalid generated routes/)
  for (const value of [null, [], { '/docs': { title: null } }, { '/docs': { title: '記事', description: '説明', last_updated: 1, source_path: 'docs/README.md' } }]) assert.throws(() => assertPagesMetadata(value), /Invalid generated page metadata/)
  for (const value of [null, {}, [{ route: '/docs' }], [{ slug: 'concepts', num: '01', title: '基礎', description: '説明', route: '/docs/concepts', count: -1 }]]) assert.throws(() => assertSections(value), /Invalid generated section metadata/)
})
