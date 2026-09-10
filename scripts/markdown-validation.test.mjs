import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkLinks, collectLinkTargets } from './check-links.mjs'
import { collectDocs, forEachLine, parseFrontMatter, REPO_ROOT, splitLocalDestination, toLines } from './lib/md-utils.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'
import { validateDoc } from './lib/validate-core.mjs'

const file = 'docs/01-concepts/agent-loop.md'
const valid = readFileSync(path.join(REPO_ROOT, file), 'utf8').replace(/\r\n/g, '\n')
const messages = text => validateDoc(file, text).map(issue => issue.message).join('\n')

test('existing article and BOM/CRLF remain valid; template comments do not alter values', () => {
  assert.deepEqual(validateDoc(file, valid), [])
  assert.deepEqual(validateDoc(file, '\uFEFF' + valid.replace(/\n/g, '\r\n')), [])
  const commented = valid.replace('status: "published"', 'status: "published" # state')
    .replace('title: "Agent ループ"', 'title: \'Agent ループ\'')
  assert.deepEqual(validateDoc(file, commented), [])
  const fm = parseFrontMatter(toLines('---\ntitle: "# value" # comment\n---'))
  assert.equal(fm.fields[0].value, '"# value"')
  assert.deepEqual(validateDoc(file, valid.replace(/^# Agent ループ$/m, ' # Agent ループ #')), [])
})

test('front matter rejects ignored lines, nested structures, and missing key/value spacing', () => {
  for (const invalid of ['not yaml', '  nested: value', 'status:"published"', '- orphan', 'title: |\n  body']) {
    assert.match(messages(valid.replace('\n---\n', `\n${invalid}\n---\n`)), /front matter|重複|1 行/)
  }
  assert.match(messages(valid.replace('\n---\n', '\nstatus: "draft"\n---\n')), /重複/)
})

test('front matter rejects malformed scalar quotes and array values without rejecting valid tags', () => {
  for (const title of ['"Agent ループ', '"Agent ループ" trailing', '[Agent, ループ]', 'null', '&alias value']) {
    assert.match(messages(valid.replace('title: "Agent ループ"', `title: ${title}`)), /1 行の文字列/)
  }
  for (const tags of ['["agent-loop]', '["agent-loop", ]', '["agent-loop" "tool-use"]', 'agent-loop', '[null]', '[123]']) {
    assert.match(messages(valid.replace(/^tags:.*$/m, `tags: ${tags}`)), /tags|tag /)
  }
  assert.deepEqual(validateDoc(file, valid.replace(/^tags:.*$/m, "tags: ['agent-loop', tool-use] # valid")), [])
})

test('code fence only closes with matching marker, sufficient length, and whitespace tail', () => {
  const input = ['````markdown', '```python', '# fake title', '```', '~~~~', '```` trailing', '`````', '# real title']
  const outside = []
  const result = forEachLine(input, (line, _number, inFence) => { if (!inFence) outside.push(line) })
  assert.deepEqual(outside, ['# real title'])
  assert.equal(result.unclosedFence, null)
  assert.match(messages(valid + '\n```python\nprint(1)\n'), /閉じられていません/)
  assert.match(messages(valid + '\n```\nprint(1)\n```\n'), /言語/)
})

test('fences inside blockquotes and false fence info do not expose example headings', () => {
  const outside = []
  forEachLine(['> ~~~markdown', '> # sample', '> ~~~ lang', '> ~~~', '# real'], (line, _number, inside) => {
    if (!inside) outside.push(line)
  })
  assert.deepEqual(outside, ['# real'])
  const fence = forEachLine(['```info`invalid', 'text'], () => {})
  assert.equal(fence.unclosedFence, null)
})

test('fixed sections and mandatory notes cannot contain only comments or headings', () => {
  assert.match(messages(valid.replace(/(## 本文\n)[\s\S]*?(?=## 実務での注意点)/, '$1\n<!-- guide -->\n### 未記入\n\n')), /本文.*空/)
  assert.match(messages(valid.replace(/(### アンチパターン\n)[\s\S]*?(?=### チェックリスト)/, '$1\n<!-- guide -->\n\n')), /アンチパターン.*空/)
  assert.deepEqual(validateDoc(file, valid.replace(/(## 本文\n)[\s\S]*?(?=## 実務での注意点)/, '$1\n```python\nprint(1)\n```\n\n')), [])
})

test('article paths enforce lowercase kebab case and the section layout', () => {
  for (const bad of ['docs/01-concepts/Agent_Loop.md', 'docs/01-concepts/agent--loop.md', 'docs/concepts/agent-loop.md', 'docs/01-concepts/nested/README.md']) {
    assert.ok(validateDoc(bad, valid).some(issue => issue.check === 'filename'))
  }
  assert.deepEqual(validateDoc('docs/01-concepts/README.md', '# 目次\n'), [])
})

test('Markdown links cover reference forms, multiline destinations, escaped punctuation and Unicode', () => {
  const text = '[inline](guide(one).md "title")\n[full][REF]\n[ref][]\n[ref]\n![picture][image]\n[multi](\n  <a b.md#見出し>\n  "title"\n)\n\n[ref]: target.md#目的\n[image]: image.svg\n'
  const { links } = parseMarkdownLinks(text)
  assert.deepEqual(links.map(link => decodeURI(link.target)), ['guide(one).md', 'target.md#目的', 'target.md#目的', 'target.md#目的', 'image.svg', 'a b.md#見出し'])
  assert.equal(parseMarkdownLinks('[x](a\\(b\\).md)').links[0].target, 'a(b).md')
})

test('Markdown parser excludes code, comments and front matter from link/heading extraction', () => {
  const text = '---\ntitle: "[fake](missing.md)"\n---\n\n`[inline code](missing.md)`\n\n<!-- [comment](missing.md) -->\n\n    [indented](missing.md)\n\n````markdown\n```python\n[example](missing.md)\n# Example\n````\n\n[real](target.md)\n'
  assert.deepEqual(parseMarkdownLinks(text).links.map(link => link.target), ['target.md'])
  assert.deepEqual([...parseMarkdownLinks(text).anchors], [])
})

test('heading anchors match rendered inline text, setext headings and duplicate suffixes', () => {
  const { anchors } = parseMarkdownLinks('# **日本語** `Code` [link](target.md)\n\n## 重複\n\n## 重複\n\nSetext heading\n-----\n\n<a id="custom-anchor"></a>\n')
  assert.deepEqual([...anchors], ['日本語-code-link', '重複', '重複-1', 'setext-heading', 'custom-anchor'])
})

test('destination decoding preserves query/fragment and rejects encoded absolute paths', () => {
  assert.deepEqual(splitLocalDestination('a%20b.md?plain=1#%E7%9B%AE%E7%9A%84'), { pathname: 'a b.md', fragment: '目的', suffix: '?plain=1#%E7%9B%AE%E7%9A%84' })
  for (const raw of ['/root.md', 'C:/root.md', 'a\\b.md', '%2froot.md', '%43%3a/root.md', '%00.md', '%E0%A4%A']) assert.ok(splitLocalDestination(raw).error)
  assert.equal(splitLocalDestination('https://example.test/path#x').external, true)
  assert.equal(splitLocalDestination('//example.test/path').external, true)
})

function fixture(t) {
  const base = path.resolve(os.tmpdir())
  const dir = mkdtempSync(path.join(base, 'ai-agent-library-links-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), base)
    assert.ok(path.basename(dir).startsWith('ai-agent-library-links-'))
    rmSync(dir, { recursive: true, force: true })
  })
  const write = (file, content) => {
    const abs = path.join(dir, file)
    mkdirSync(path.dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
  return { dir, write }
}

test('link check covers root operations and product instructions, including anchors and case on Windows', t => {
  const { dir, write } = fixture(t)
  write('README.md', '# Root\n\n[OK](guide.md#section)\n[broken](guide.md#missing)\n[case](Guide.md)\n[outside](../missing.md)\n')
  write('guide.md', '# Section\n')
  write('harness/operations.md', '[broken](missing.md)\n')
  write('.agents/skills/fixture/SKILL.md', '[broken](missing.md)\n')
  write('.claude/skills/fixture/SKILL.md', '[broken](missing.md)\n')
  write('templates/doc-template.md', '[placeholder](nonexistent.md)\n')
  const { problems, checkedFiles } = checkLinks(dir)
  assert.equal(checkedFiles, 5)
  assert.equal(problems.length, 6, problems.join('\n'))
  assert.match(problems.join('\n'), /見出しアンカー/)
  assert.match(problems.join('\n'), /大文字小文字/)
  assert.match(problems.join('\n'), /リポジトリの外/)
})

test('section index validates actual destinations and accepts reference links in tables', t => {
  const { dir, write } = fixture(t)
  write('docs/01-concepts/a.md', '# A\n')
  write('docs/01-concepts/b.md', '# B\n')
  write('docs/01-concepts/README.md', '# Index\n\n| File | Note |\n| --- | --- |\n| [a.md](b.md) | wrong |\n| [b.md][b] | OK |\n\n[b]: b.md\n')
  assert.match(checkLinks(dir).problems.join('\n'), /a\.md の正しいリンク/)
  write('docs/01-concepts/README.md', '# Index\n\n| File | Note |\n| --- | --- |\n| [a.md][a] | OK |\n| [b.md][] | OK |\n\n[a]: a.md\n[b.md]: b.md\n')
  assert.deepEqual(checkLinks(dir).problems, [])
})

test('moving a root operations document into project keeps its links and anchors under verification', t => {
  const { dir, write } = fixture(t)
  write('plan.md', '# Plan\n\n[guide](harness/guide.md#section)\n')
  write('harness/guide.md', '# Section\n')
  assert.deepEqual(checkLinks(dir), { problems: [], checkedLinks: 1, checkedFiles: 2 })
  mkdirSync(path.join(dir, 'project/plans/engineering'), { recursive: true })
  renameSync(path.join(dir, 'plan.md'), path.join(dir, 'project/plans/engineering/plan.md'))
  assert.equal(checkLinks(dir).checkedFiles, 2)
  assert.match(checkLinks(dir).problems.join('\n'), /project\/plans\/engineering\/plan.md.*リンク切れ/)
  write('project/plans/engineering/plan.md', '# Plan\n\n[guide](../../../harness/guide.md#section)\n')
  assert.deepEqual(checkLinks(dir), { problems: [], checkedLinks: 1, checkedFiles: 2 })
  write('project/records/2026-09-10/record.md', '# Record\n\n[guide](../../../harness/guide.md#missing)\n')
  assert.match(checkLinks(dir).problems.join('\n'), /project\/records\/2026-09-10\/record.md.*見出しアンカー/)
})

test('research index is checked by default and changed research files can be selected explicitly', t => {
  const { dir, write } = fixture(t)
  write('research/README.md', '# Research\n\n[note](topic/note.md#note)\n')
  write('research/topic/note.md', '# Note\n\n[broken](missing.md)\n')
  write('research/untouched.md', '# Untouched\n\n[historical](removed.md)\n')
  assert.deepEqual(checkLinks(dir), { problems: [], checkedLinks: 1, checkedFiles: 1 })
  const selected = { additionalFiles: ['research/README.md', 'research/topic/note.md', 'research/topic/note.md'] }
  assert.equal(collectLinkTargets(dir, selected).length, 2, 'default and explicit paths are deduplicated')
  assert.equal(checkLinks(dir, selected).problems.length, 1)
  assert.match(checkLinks(dir, selected).problems[0], /research\/topic\/note.md.*リンク切れ/)
  write('research/topic/note.md', '# Note\n\n[index](../README.md#research)\n')
  assert.deepEqual(checkLinks(dir, selected), { problems: [], checkedLinks: 2, checkedFiles: 2 })
  write('research/README.md', '# Research\n\n[missing](missing.md)\n')
  assert.match(checkLinks(dir).problems.join('\n'), /research\/README.md.*リンク切れ/)
})

test('explicit link targets reject missing, escaping, wrong-case, directory and linked paths', t => {
  const { dir, write } = fixture(t)
  write('research/note.md', '# Note\n')
  mkdirSync(path.join(dir, 'research/directory.md'))
  for (const file of ['research/missing.md', 'research/Note.md', '../outside.md', '/absolute.md', 'C:/absolute.md', './research/note.md', 'research\\note.md', 'research/directory.md', 'research/note.json']) {
    assert.throws(() => checkLinks(dir, { additionalFiles: [file] }), /追加対象/, file)
  }
  symlinkSync(path.join(dir, 'research'), path.join(dir, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => checkLinks(dir, { additionalFiles: ['linked/note.md'] }), /symlink/)
})

test('link CLI rejects unknown arguments and missing explicit inputs instead of reporting success', () => {
  for (const args of [['--unknown'], ['--include'], ['--include', 'research/nonexistent-cli-fixture.md']]) {
    const result = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts/check-links.mjs'), ...args], { encoding: 'utf8', windowsHide: true })
    assert.equal(result.status, 1, result.stderr)
    assert.match(result.stderr, /check-links:/)
    assert.doesNotMatch(result.stdout, /OK:/)
  }
})

test('repeated checking does not retain stale directory entries after a correction', t => {
  const { dir, write } = fixture(t)
  write('README.md', '[guide](guide.md#日本語-1)\n')
  assert.equal(checkLinks(dir).problems.length, 1)
  write('guide.md', '# 日本語\n\n# 日本語\n')
  assert.deepEqual(checkLinks(dir).problems, [])
})

test('invalid article placement is still collected so --all cannot silently miss it', t => {
  const { dir, write } = fixture(t)
  write('docs/orphan.md', valid)
  write('docs/01-concepts/nested/README.md', valid)
  write('docs/01-concepts/uppercase.MD', valid)
  const docs = collectDocs(dir)
  assert.equal(docs.length, 3)
  assert.ok(docs.every(doc => validateDoc(doc.repoRel, valid).some(issue => issue.check === 'filename')))
})
