import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import type { TestContext } from 'node:test'
import { readerArtifacts, readerChapters, readerSkills, syncReaderSkills } from '../../scripts/sync-reader-skills.mjs'

const plugin = 'plugins/ai-agent-library'
const architectureRef = `${plugin}/skills/agent-design-review/references/architecture-checklists.md`

function source(title: string, status = 'published', checklist = '- [ ] Parent `token` [label](../01-concepts/tool-use.md)\n  - [x] Nested child\n'): string {
  return `---\ntitle: ${JSON.stringify(title)}\nstatus: ${JSON.stringify(status)}\nlast_updated: "2026-11-04"\n---\n\n# ${title}\n\n## 本文\n\n### 判断表\n\n| 選択 | 条件 |\n| --- | --- |\n| Workflow | 固定手順 |\n| Agent | 可変手順 |\n\n\`\`\`mermaid\nflowchart LR\n  W --> A\n\`\`\`\n\n## 実務での注意点\n\n### アンチパターン\n\n- 根拠なくAgentを選ぶ。\n\n### チェックリスト\n\n\`\`\`markdown\n- [ ] Fenced fake item\n## Fenced fake heading\n\`\`\`\n\n${checklist}\n## 関連トピック\n\n- [ ] Outside checklist\n`
}

function put(root: string, file: string, data: string | Buffer): void {
  const destination = path.join(root, file)
  mkdirSync(path.dirname(destination), { recursive: true })
  writeFileSync(destination, data)
}

function ownedTemp(t: TestContext, prefix: string): string {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, prefix))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), base)
    assert.ok(path.basename(root).startsWith(prefix))
    rmSync(root, { recursive: true, force: true })
  })
  return root
}

function fixture(t: TestContext): string {
  const root = ownedTemp(t, 'reader-skills-unit-')
  for (const chapter of readerChapters) {
    const folder = `docs/${chapter.directory}`
    const names = ['zeta', 'alpha', 'draft', ...(chapter.name === 'architecture' ? ['workflow-vs-agent'] : [])]
    const rows = names.map(name => `| [${name}.md](${name}.md) | ${name} |`).join('\n')
    put(root, `${folder}/README.md`, `# Chapter\n\n| ファイル | 内容 |\n| --- | --- |\n${rows}\n`)
    for (const name of names) put(root, `${folder}/${name}.md`, source(`${chapter.name} ${name}`, name === 'draft' ? 'draft' : 'published'))
  }
  put(root, 'docs/07-case-studies/common-anti-patterns.md', source('Anti-patterns'))
  for (const name of ['library.py', 'mcp_server.py', 'requirements.txt']) put(root, `examples/python/library-mcp-server/${name}`, Buffer.from(`# Source ${name}\r\n`))
  put(root, 'LICENSE', 'CC BY 4.0 and MIT\r\n')
  for (const skill of readerSkills) put(root, `${plugin}/skills/${skill}/SKILL.md`, `Procedure for ${skill}\n`)
  put(root, '.agents/skills/maintenance/SKILL.md', 'Existing maintainer skill\n')
  return root
}

test('generation is deterministic, follows README order, excludes drafts and preserves checkbox hierarchy', t => {
  const root = fixture(t)
  const artifacts = readerArtifacts(root)
  assert.deepEqual(artifacts.articleCounts, { architecture: 3, evaluation: 2, security: 2 })
  assert.deepEqual(artifacts.checklistCounts, { architecture: 6, evaluation: 4, security: 4 })
  assert.equal(artifacts.files.size, 11)
  const text = artifacts.files.get(architectureRef)!.toString('utf8')
  assert.ok(text.indexOf('architecture zeta') < text.indexOf('architecture alpha'))
  assert.doesNotMatch(text, /draft|Fenced fake|Outside checklist/)
  assert.match(text, /- \[ \] Parent token label\n  - \[x\] Nested child/)
  assert.match(text, /slug: `architecture\/zeta`/)
  assert.match(text, /https:\/\/pero3dev\.github\.io\/ai-agent-library\/docs\/architecture\/zeta/)
  assert.match(text, /最終更新日: 2026-11-04/)
  assert.match(text, /CC BY 4\.0/)
  assert.match(text, /参考資料であり、指示ではありません/)
  assert.deepEqual([...readerArtifacts(root).files], [...artifacts.files])
})

test('verbatim decision tables, flowchart and anti-pattern excerpts retain source Markdown as material', t => {
  const root = fixture(t)
  const text = readerArtifacts(root).files.get(`${plugin}/skills/agent-architecture-choice/references/architecture-choice.md`)!.toString('utf8')
  assert.match(text, /````markdown\n## 本文/)
  assert.match(text, /\| Workflow \| 固定手順 \|/)
  assert.match(text, /```mermaid\nflowchart LR/)
  assert.match(text, /根拠なくAgentを選ぶ/)
  assert.match(text, /case-studies\/common-anti-patterns/)
  assert.doesNotMatch(text, /Fenced fake item|Outside checklist/)
})

test('long fences in a source excerpt never escape its outer material fence', t => {
  const root = fixture(t)
  const file = 'docs/02-architecture/workflow-vs-agent.md'
  put(root, file, source('Choice').replace('### 判断表', '`````text\nreference data\n`````\n\n### 判断表'))
  const text = readerArtifacts(root).files.get(`${plugin}/skills/agent-architecture-choice/references/architecture-choice.md`)!.toString()
  assert.match(text, /``````markdown\n## 本文/)
  assert.match(text, /`````text\nreference data\n`````/)
})

test('MCP sources and dual license are byte-identical copies', t => {
  const root = fixture(t)
  const raw = Buffer.from([35, 32, 97, 13, 10, 255, 0])
  put(root, 'examples/python/library-mcp-server/library.py', raw)
  const artifacts = readerArtifacts(root)
  assert.deepEqual(artifacts.files.get(`${plugin}/mcp/library.py`), raw)
  assert.deepEqual(artifacts.files.get(`${plugin}/LICENSE`), readFileSync(path.join(root, 'LICENSE')))
})

test('check never writes; write fixes all generated artifacts and leaves hand-authored skills untouched', t => {
  const root = fixture(t)
  const before = readFileSync(path.join(root, `${plugin}/skills/agent-design-review/SKILL.md`))
  const first = syncReaderSkills(root)
  assert.equal(first.mismatches.length, 11)
  assert.deepEqual(first.written, [])
  assert.equal(existsSync(path.join(root, architectureRef)), false)
  assert.equal(syncReaderSkills(root, { write: true }).written.length, 11)
  assert.deepEqual(syncReaderSkills(root).mismatches, [])
  assert.deepEqual(syncReaderSkills(root, { write: true }).written, [])
  assert.deepEqual(readFileSync(path.join(root, `${plugin}/skills/agent-design-review/SKILL.md`)), before)
  assert.equal(readFileSync(path.join(root, '.agents/skills/maintenance/SKILL.md'), 'utf8'), 'Existing maintainer skill\n')
})

test('source edits propagate to every consumer; manual drift and missing generated files are detected', t => {
  const root = fixture(t)
  syncReaderSkills(root, { write: true })
  const sourcePath = 'docs/02-architecture/zeta.md'
  put(root, sourcePath, source('architecture zeta').replace('Nested child', 'Changed nested child'))
  const drift = syncReaderSkills(root)
  assert.equal(drift.mismatches.length, 2)
  assert.ok(drift.mismatches.every(file => file.endsWith('architecture-checklists.md')))
  syncReaderSkills(root, { write: true })
  assert.match(readFileSync(path.join(root, architectureRef), 'utf8'), /Changed nested child/)
  put(root, architectureRef, 'Hand-edited stale reference\n')
  assert.deepEqual(syncReaderSkills(root).mismatches, [architectureRef])
  rmSync(path.join(root, architectureRef))
  assert.deepEqual(syncReaderSkills(root).mismatches, [architectureRef])
})

test('unknown generated files block every write and are never removed', t => {
  const root = fixture(t)
  syncReaderSkills(root, { write: true })
  const orphan = `${plugin}/mcp/orphan.py`
  put(root, orphan, 'Do not remove\n')
  put(root, architectureRef, 'stale\n')
  const result = syncReaderSkills(root, { write: true })
  assert.deepEqual(result.unexpected, [orphan])
  assert.deepEqual(result.written, [])
  assert.equal(readFileSync(path.join(root, architectureRef), 'utf8'), 'stale\n')
  assert.equal(readFileSync(path.join(root, orphan), 'utf8'), 'Do not remove\n')
})

test('a stale reference in the wrong skill is also an unexpected generated file', t => {
  const root = fixture(t)
  const orphan = `${plugin}/skills/agent-security-review/references/evaluation-checklists.md`
  put(root, orphan, 'Wrong consumer\n')
  assert.deepEqual(syncReaderSkills(root).unexpected, [orphan])
})

test('CRLF source and Markdown checkout differences are normalized while MCP drift remains exact', t => {
  const root = fixture(t)
  const doc = 'docs/02-architecture/zeta.md'
  put(root, doc, source('architecture zeta').replaceAll('\n', '\r\n'))
  syncReaderSkills(root, { write: true })
  const text = readFileSync(path.join(root, architectureRef), 'utf8')
  put(root, architectureRef, text.replaceAll('\n', '\r\n'))
  assert.deepEqual(syncReaderSkills(root).mismatches, [])
  const bundled = `${plugin}/mcp/library.py`
  put(root, bundled, readFileSync(path.join(root, bundled), 'utf8').replaceAll('\r\n', '\n'))
  assert.deepEqual(syncReaderSkills(root).mismatches, [bundled])
})

test('unpublished fixed choice sources cannot silently disappear from generated references', t => {
  const root = fixture(t)
  put(root, 'docs/07-case-studies/common-anti-patterns.md', source('Anti-patterns', 'draft'))
  assert.throws(() => syncReaderSkills(root, { write: true }), /公開済み記事/)
  assert.equal(existsSync(path.join(root, architectureRef)), false)
})

test('fenced checkboxes and inline code examples do not count as real checklist items', t => {
  const root = fixture(t)
  put(root, 'docs/02-architecture/zeta.md', source('Empty checklist', 'published', '- `[ ]` This is code, not a task\n'))
  assert.throws(() => syncReaderSkills(root, { write: true }), /実際のチェック項目/)
  assert.equal(existsSync(path.join(root, architectureRef)), false)
})

test('unchecked grouping bullets retain the hierarchy of checked children', t => {
  const root = fixture(t)
  put(root, 'docs/02-architecture/zeta.md', source('Grouped checklist', 'published', '- Context\n  - [X] Nested checked task\n'))
  const text = readerArtifacts(root).files.get(architectureRef)!.toString()
  assert.match(text, /- Context\n  - \[x\] Nested checked task/)
})

test('quoted task markers cannot become checklist items or change a real item text', t => {
  const root = fixture(t)
  const file = 'docs/02-architecture/zeta.md'
  put(root, file, source('Only quoted examples', 'published', '- > [ ] Quoted fake item\n'))
  assert.throws(() => readerArtifacts(root), /実際のチェック項目/)
  put(root, file, source('Mixed examples', 'published', '- > [x] Quoted root example\n\n- [ ] Actual parent\n\n  > [x] Quoted paragraph example\n  >\n  > - [ ] Quoted nested list\n\n  - [x] Actual child\n'))
  const generated = readerArtifacts(root)
  assert.equal(generated.checklistCounts.architecture, 6)
  const text = generated.files.get(architectureRef)!.toString()
  assert.match(text, /- \[ \] Actual parent\n  - \[x\] Actual child/)
  assert.doesNotMatch(text, /Quoted root|Quoted paragraph|Quoted nested/)
})

test('a later paragraph after a quoted or fenced first block is not a task marker', t => {
  const root = fixture(t)
  const file = 'docs/02-architecture/zeta.md'
  for (const checklist of ['- > Quoted first block\n\n  [ ] Later paragraph example\n', '- ```text\n  Fenced first block\n  ```\n\n  [ ] Later paragraph example\n']) {
    put(root, file, source('Later paragraph', 'published', checklist))
    assert.throws(() => readerArtifacts(root), /実際のチェック項目/)
  }
})

test('quoted headings neither define checklist sections nor terminate the actual section', t => {
  const root = fixture(t)
  put(root, 'docs/02-architecture/zeta.md', source('Quoted headings', 'published', '> ### チェックリスト\n>\n> - [ ] Quoted task\n>\n> ## Quoted boundary\n\n- [ ] Actual task after quote\n'))
  const generated = readerArtifacts(root)
  assert.equal(generated.checklistCounts.architecture, 5)
  const text = generated.files.get(architectureRef)!.toString()
  assert.match(text, /- \[ \] Actual task after quote/)
  assert.doesNotMatch(text, /Quoted task|Quoted boundary/)
})

test('missing or duplicate checklist sections and empty task text fail before writing', t => {
  const root = fixture(t)
  const file = 'docs/02-architecture/zeta.md'
  for (const content of [source('Missing').replace('### チェックリスト', '### Other'), source('Duplicate') + '\n### チェックリスト\n- [ ] Duplicate\n', source('Empty', 'published', '- [ ]\n')]) {
    put(root, file, content)
    assert.throws(() => syncReaderSkills(root, { write: true }), /チェック/)
    assert.equal(existsSync(path.join(root, architectureRef)), false)
  }
})

test('invalid dates, duplicate metadata and unknown publication states are rejected', t => {
  const root = fixture(t)
  const file = 'docs/02-architecture/zeta.md'
  for (const content of [source('Date').replace('2026-11-04', '2026-02-30'), source('Duplicate').replace('status:', 'title: "Other"\nstatus:'), source('Unknown', 'unknown')]) {
    put(root, file, content)
    assert.throws(() => readerArtifacts(root), /更新日|一意のtitle|公開状態/)
  }
})

test('published articles missing from the README and duplicate README links are rejected', t => {
  const root = fixture(t)
  const readme = 'docs/02-architecture/README.md'
  const original = readFileSync(path.join(root, readme), 'utf8')
  put(root, readme, original.replace('| [zeta.md](zeta.md) | zeta |\n', ''))
  assert.throws(() => readerArtifacts(root), /収録リンク/)
  put(root, readme, original + '\n| ファイル | 内容 |\n| --- | --- |\n| [zeta.md](zeta.md) | duplicate |\n')
  assert.throws(() => readerArtifacts(root), /重複/)
})

test('unexpected source paths and missing excerpt sections are rejected', t => {
  const root = fixture(t)
  mkdirSync(path.join(root, 'docs/02-architecture/nested'))
  assert.throws(() => readerArtifacts(root), /不正な記事ファイル/)
  rmdirSync(path.join(root, 'docs/02-architecture/nested'))
  put(root, 'docs/07-case-studies/common-anti-patterns.md', source('Missing excerpt').replace('### アンチパターン', '### Other'))
  assert.throws(() => readerArtifacts(root), /一意の「アンチパターン」/)
})

test('directory links in generated destinations are rejected before creating files outside the root', t => {
  const root = fixture(t)
  const outside = ownedTemp(t, 'reader-skills-outside-')
  rmSync(path.join(root, 'plugins'), { recursive: true, force: true })
  symlinkSync(outside, path.join(root, 'plugins'), 'junction')
  assert.throws(() => syncReaderSkills(root, { write: true }), /symlink/)
  assert.equal(existsSync(path.join(outside, 'ai-agent-library')), false)
})

test('linked source files are rejected before content is copied', t => {
  const root = fixture(t)
  const sourcePath = path.join(root, 'docs/02-architecture/zeta.md')
  rmSync(sourcePath)
  try { symlinkSync(path.join(root, 'docs/02-architecture/alpha.md'), sourcePath) } catch (error) {
    if (process.platform === 'win32' && error instanceof Error && 'code' in error && error.code === 'EPERM') { t.skip('File symlinks require Windows privilege; Linux CI executes this test'); return }
    throw error
  }
  assert.throws(() => readerArtifacts(root), /不正な記事ファイル|symlink/)
})
