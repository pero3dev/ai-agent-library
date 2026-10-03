import test from 'node:test'
import assert from 'node:assert/strict'
import { checkPrerequisiteLevels } from '../../scripts/lib/prerequisite-levels.mjs'

const doc = (file, level, body) => ({ file, text: `---\nlevel: "${level}"\n---\n${body}` })
test('難しい必須前提はエラー。同級・下級と関連参考は許可', () => {
  const result = checkPrerequisiteLevels([
    doc('docs/a/basic.md', 'basic', '## 前提知識\n- [必須](../b/advanced.md#section)\n## 関連トピック\n- [任意](../b/advanced.md)'),
    doc('docs/b/advanced.md', 'advanced', '## 前提知識\n- [下級](../a/basic.md)'),
  ])
  assert.equal(result.inversions.length, 1)
  assert.equal(result.inversions[0].line, 5)
  assert.equal(result.checkedPrerequisites, 2)
  assert.match(result.problems[0], /advanced.*basic/)
})
test('コード・コメント内の偽見出しと偽リンクを前提と誤認しない', () => {
  const result = checkPrerequisiteLevels([
    doc('docs/a.md', 'basic', '```md\n## 前提知識\n[x](b.md)\n```\n<!-- ## 前提知識\n[x](b.md) -->\n## 前提知識\n`[inline](b.md)`\n```md\n[x](b.md)\n```\n- [外部](https://example.com/b.md)'),
    doc('docs/b.md', 'advanced', ''),
  ])
  assert.equal(result.checkedPrerequisites, 0)
  assert.deepEqual(result.problems, [])
})
test('参照形式・日本語リンク・子見出しを扱い、次のH2で終了する', () => {
  const result = checkPrerequisiteLevels([
    doc('docs/a.md', 'intermediate', '## 前提知識\n### 必須\n- [数式][math]\n\n[math]: %E6%95%B0%E5%BC%8F.md\n\n## 本文\n[x](数式.md)'),
    doc('docs/数式.md', 'advanced', ''),
  ])
  assert.equal(result.checkedPrerequisites, 1)
  assert.equal(result.inversions[0].target, 'docs/数式.md')
})
test('README・リンク切れ・同一記事アンカーは対象外', () => {
  const result = checkPrerequisiteLevels([
    doc('docs/a.md', 'basic', '## 前提知識\n[x](missing.md)\n[x](#anchor)\n[x](README.md)'),
    { file: 'docs/README.md', text: '# 索引\n' },
  ])
  assert.equal(result.checkedArticles, 1)
  assert.equal(result.checkedPrerequisites, 0)
})
