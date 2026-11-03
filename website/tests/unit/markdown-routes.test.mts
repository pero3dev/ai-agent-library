import assert from 'node:assert/strict'
import test from 'node:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { readmeArticleOrder, rewriteMarkdownRoutes } from '../../lib/markdown-routes.mjs'

const parser = unified().use(remarkParse).use(remarkGfm)

test('site route rewriting handles inline and reference definitions without touching fenced examples', () => {
  const tree = parser.parse('[inline](target.md#目的 "title")\n[reference][ref]\n\n[ref]: <target.md?plain=1#目的> "reference title"\n\n````markdown\n```python\n[example](missing.md)\n````\n')
  const code = tree.children.find(node => node.type === 'code')
  assert(code)
  const beforeCode = code.value
  const errors = rewriteMarkdownRoutes(tree, 'docs/01-concepts/source.md', new Map([['docs/01-concepts/target.md', '/docs/concepts/target']]))
  assert.deepEqual(errors, [])
  const paragraph = tree.children[0]
  assert(paragraph.type === 'paragraph')
  const link = paragraph.children[0]
  assert(link.type === 'link')
  assert.equal(link.url, '/docs/concepts/target#目的')
  assert.equal(link.title, 'title')
  const definition = tree.children.find(node => node.type === 'definition')
  assert(definition)
  assert.equal(definition.url, '/docs/concepts/target?plain=1#目的')
  assert.equal(code.value, beforeCode)
})

test('site route rewriting preserves external links and reports missing local routes', () => {
  const tree = parser.parse('[missing][ref]\n[web](https://example.test/target.md)\n\n[ref]: target.md\n')
  const errors = rewriteMarkdownRoutes(tree, 'docs/01-concepts/source.md', new Map())
  assert.equal(errors.length, 1)
  assert.match(errors[0], /未解決/)
  const paragraph = tree.children[0]
  assert(paragraph.type === 'paragraph')
  const link = paragraph.children[2]
  assert(link.type === 'link')
  assert.equal(link.url, 'https://example.test/target.md')
})

test('site table order uses resolved reference targets and ignores misleading labels', () => {
  const tree = parser.parse('| File | Purpose |\n| --- | --- |\n| [wrong.md](right.md) | article |\n| [second][REF] | article |\n\n[ref]: second.md\n\n[outside table](third.md)\n')
  assert.deepEqual(readmeArticleOrder(tree), ['right', 'second'])
})
