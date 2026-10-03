import assert from 'node:assert/strict'
import test from 'node:test'
import { addTitleSearchAliases } from '../../lib/search-titles.mjs'

test('all Japanese h1 titles get explicit Intl word aliases without changing their visible text', () => {
  for (const title of ['プロンプトインジェクション', 'コンテキストエンジニアリング', 'ツール使用', '日本語と MCP']) {
    const source = `<html><h1 class="title">${title}</h1><p>本文</p></html>`
    const output = addTitleSearchAliases(source)
    assert.ok(output.includes(`>${title}</h1><p>本文</p>`))
    assert.ok(output.includes('data-pagefind-index-attrs="data-search-words"'))
    const words = [...new Intl.Segmenter('ja', { granularity: 'word' }).segment(title)]
      .filter(part => part.isWordLike).map(part => part.segment).join(' ')
    assert.ok(output.includes(`data-search-words="${words}"`))
  }
})

test('English headings stay intact and Japanese aliases retain HTML escaping', () => {
  assert.equal(addTitleSearchAliases('<h1>Agent &amp; MCP</h1>'), '<h1>Agent &amp; MCP</h1>')
  const source = '<h1><strong>日本語</strong> &amp; &#x8A00;&#35486;</h1>'
  assert.ok(addTitleSearchAliases(source).endsWith('><strong>日本語</strong> &amp; &#x8A00;&#35486;</h1>'))
  assert.ok(addTitleSearchAliases(source).includes('data-search-words="日本語 言語"'))
})
