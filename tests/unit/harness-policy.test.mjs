import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { load as loadYaml } from 'js-yaml'
import { checkHarnessPolicy, classifyPath, requiredChecks, reviewDigest, roadmapTasks } from '../../scripts/harness-policy.mjs'
import { requiredWorkflows } from '../../scripts/lib/github-policy.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const a = 'docs/01-concepts/agent-loop.md'
const b = 'docs/01-concepts/tool-use.md'
const c = 'docs/01-concepts/new-article.md'
const record = 'harness/changes/2026-09-10-test.json'
const now = Date.parse('2026-09-10T12:00:00Z')
const article = (body = '元の本文です。', status = 'published', date = '2026-09-09', sample = false) => `---
title: "テスト記事"
category: "concepts"
level: "basic"
status: "${status}"
last_updated: "${date}"
tags: ["agent-loop"]
---
# テスト記事

## この記事の目的
設計を判断できます。

## 対象読者
エンジニア向けです。

## 前提知識
基本知識が必要です。

## 本文
${body}

## 実務での注意点
制約を確認してください。

### アンチパターン
確認を省くと誤るため、検証します。

### チェックリスト
- [ ] 確認した

## 関連トピック
${sample ? '[サンプル](../../examples/python/tool-use/README.md)' : '関連するトピックを確認します。'}

## 参考資料
[公式資料](https://example.com/official)(アクセス日: 2026-09-10)

## TODO・未確認事項
なし
`
const roadmap = (status = '完了', artifacts = ['agent-loop.md', 'tool-use.md'], extra = '') => `# ROADMAP

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| T-1 | 記事 | ${artifacts.map(file => '`' + file + '`').join(', ')} | ${status} |
${extra}`
const index = names => `# 概念

| ファイル | 説明 |
| --- | --- |
${names.map(name => `| [${name}](${name}) | 記事 |`).join('\n')}
`

function fixture(t, { changed = true, draft = false, sample = false, body } = {}) {
  const tempBase = path.resolve(os.tmpdir())
  const cwd = mkdtempSync(path.join(tempBase, 'ai-agent-library-policy-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(cwd)), tempBase)
    assert.ok(path.basename(cwd).startsWith('ai-agent-library-policy-'))
    rmSync(cwd, { recursive: true, force: true })
  })
  const git = (args, input) => execFileSync('git', args, { cwd, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  const write = (file, content) => {
    const destination = path.resolve(cwd, file)
    assert.ok(destination.startsWith(cwd + path.sep))
    mkdirSync(path.dirname(destination), { recursive: true })
    writeFileSync(destination, content)
  }
  const remove = file => {
    const destination = path.resolve(cwd, file)
    assert.ok(destination.startsWith(cwd + path.sep))
    rmSync(destination)
  }
  const tree = () => { git(['add', '-A']); return git(['write-tree']) }
  git(['init', '--quiet'])
  write(a, article(body, draft ? 'draft' : 'published', undefined, sample))
  write(b, article(undefined, draft ? 'draft' : 'published'))
  write('docs/01-concepts/README.md', index(['agent-loop.md', 'tool-use.md']))
  write('ROADMAP.md', roadmap(draft ? 'レビュー待ち' : '完了'))
  if (sample) {
    write('examples/python/tool-use/README.md', '# サンプル\n\n[対応記事](../../../docs/01-concepts/agent-loop.md)\n')
    write('examples/python/tool-use/main.py', 'print("local sample")\n')
    write('examples/python/tool-use/requirements.txt', '# No dependencies\n')
  }
  const base = tree()
  if (changed) write(a, article('変更した本文です。', draft ? 'draft' : 'published', '2026-09-10', sample))
  const manifest = {
    schema_version: 1, run_id: '2026-09-10-test', base_sha: base, writer_run_id: 'writer-001', completed_at: '2026-09-10T01:00:00Z',
    changes: [{ path: a, kind: 'substantive', summary: '一次資料の変更を反映しました。' }],
    tasks: [{ id: 'T-1', artifacts: [a, b] }],
    sources: [{ url: 'https://example.com/official', accessed_at: '2026-09-10T00:10:00Z', claim: '更新の根拠です。', affected_docs: [a] }],
    review: { verdict: 'approved', independent: true, reviewer_run_id: 'reviewer-002', reviewed_at: '2026-09-10T00:50:00Z', content_digest: '0'.repeat(64) },
  }
  const finish = ({ refreshDigest = true, evidence = true } = {}) => {
    if (evidence) {
      write(record, JSON.stringify(manifest, null, 2))
      if (refreshDigest && manifest.review !== null) manifest.review.content_digest = reviewDigest({ cwd, base, head: tree() })
      write(record, JSON.stringify(manifest, null, 2))
    }
    return tree()
  }
  const check = (options = {}) => checkHarnessPolicy({ cwd, base, head: finish(options), branch: options.branch ?? 'work/article-update', now })
  return { cwd, base, git, write, remove, tree, manifest, finish, check }
}

test('reviewed ordinary article updates pass with complete tasks and required CI contexts', t => {
  const f = fixture(t)
  const result = f.check()
  assert.equal(result.articles, 1)
  assert.deepEqual(result.required_checks, requiredChecks)
  assert.ok(result.scopes.includes('articles'))
})

test('a new draft requires its task and index but no invented independent review', t => {
  const f = fixture(t, { changed: false })
  f.write(c, article('新規 draft です。', 'draft', '2026-09-10'))
  f.write('docs/01-concepts/README.md', index(['agent-loop.md', 'tool-use.md', 'new-article.md']))
  f.write('ROADMAP.md', roadmap('完了', undefined, '| T-2 | 新記事 | `01-concepts/new-article.md` | レビュー待ち |\n'))
  f.manifest.changes = [{ path: c, kind: 'new', summary: '新規 draft です。' }]
  f.manifest.tasks = [{ id: 'T-2', artifacts: [c] }]
  f.manifest.sources = []
  f.manifest.review = null
  assert.equal(f.check().articles, 1)
})

test('published article changes cannot omit evidence or independent review', t => {
  const f = fixture(t)
  assert.throws(() => f.check({ evidence: false }), /manifest|harness\/changes/)
  f.manifest.review = null
  assert.throws(() => f.check(), /最終独立レビュー/)
})

test('partial promotion keeps the task in progress and reviews the complete artifact set', t => {
  const f = fixture(t, { changed: false, draft: true })
  f.write(a, article(undefined, 'published'))
  f.write('ROADMAP.md', roadmap('執筆中'))
  f.manifest.changes[0].kind = 'status-only'
  f.manifest.sources = []
  assert.equal(f.check().articles, 1)
  f.write('ROADMAP.md', roadmap('完了'))
  assert.throws(() => f.check(), /全成果物の状態/)
})

for (const value of ['"published" # publication', '"\\u0070ublished"']) test(`publication status ${value} uses the same YAML semantics as article validation`, t => {
  const f = fixture(t, { changed: false, draft: true })
  f.write(a, article(undefined, 'draft').replace('status: "draft"', `status: ${value}`))
  f.write('ROADMAP.md', roadmap('執筆中'))
  f.manifest.changes[0].kind = 'status-only'
  f.manifest.sources = []
  const review = f.manifest.review
  f.manifest.review = null
  assert.throws(() => f.check(), /最終独立レビュー/)
  f.manifest.review = review
  assert.equal(f.check().articles, 1)
})

test('a publication cannot omit a draft sibling from ROADMAP or the review task declaration', t => {
  const f = fixture(t, { changed: false, draft: true })
  f.write(a, article(undefined, 'published'))
  f.write('ROADMAP.md', roadmap('完了', ['agent-loop.md']))
  f.manifest.changes[0].kind = 'status-only'
  assert.throws(() => f.check(), /既存成果物を省略/)
  f.write('ROADMAP.md', roadmap('執筆中'))
  f.manifest.tasks[0].artifacts = [a]
  assert.throws(() => f.check(), /全成果物/)
})

test('phase review cannot finish while an article task remains incomplete', t => {
  const f = fixture(t, { changed: false, draft: true })
  f.write('ROADMAP.md', roadmap('レビュー待ち', undefined, '| T-R | フェーズレビュー | — | 完了 |\n'))
  assert.throws(() => f.check({ evidence: false }), /フェーズの全記事/)
})

test('reference-only URL changes preserve last_updated and cannot hide body edits', t => {
  const f = fixture(t, { changed: false })
  f.write(a, article().replace('https://example.com/official', 'https://example.com/new-official'))
  f.manifest.changes[0].kind = 'reference-only'
  assert.equal(f.check().articles, 1)
  f.write(a, article('別の事実へ変更しました。'))
  assert.throws(() => f.check(), /reference-only に本文変更/)
})

test('editorial meaning is reviewed independently while its unchanged date is checked mechanically', t => {
  const f = fixture(t, { changed: false })
  f.write(a, article('表記を修正しました。'))
  f.manifest.changes[0].kind = 'editorial'
  f.manifest.sources = []
  assert.equal(f.check().articles, 1)
  f.manifest.review = null
  assert.throws(() => f.check(), /最終独立レビュー/)
})

test('reference-only normalization preserves code and supports actual reference-style links', t => {
  const body = '[参照][source]\n\n[source]: https://example.com/old'
  const f = fixture(t, { changed: false, body })
  f.manifest.changes[0].kind = 'reference-only'
  f.write(a, article(body.replace('/old', '/new')))
  assert.equal(f.check().articles, 1)
  const withCode = fixture(t, { changed: false, body: '```markdown\n[コード](https://example.com/old)\n```' })
  withCode.manifest.changes[0].kind = 'reference-only'
  withCode.write(a, article('```markdown\n[コード](https://example.com/new)\n```'))
  assert.throws(() => withCode.check(), /reference-only に本文変更/)
  const inlineCode = fixture(t, { changed: false, body: '`[コード](https://example.com/old)`' })
  inlineCode.manifest.changes[0].kind = 'reference-only'
  inlineCode.write(a, article('`[コード](https://example.com/new)`'))
  assert.throws(() => inlineCode.check(), /reference-only に本文変更/)
})

test('status-only promotion cannot advance last_updated by calling it substantive', t => {
  const f = fixture(t, { changed: false, draft: true })
  f.write(a, article(undefined, 'published', '2026-09-10'))
  f.write('ROADMAP.md', roadmap('執筆中'))
  assert.throws(() => f.check(), /日付・公開状態だけ/)
})

test('substantive changes to YAML status inside article code are not discarded as metadata', t => {
  const f = fixture(t, { changed: false, body: '```yaml\nstatus: before\n```' })
  f.write(a, article('```yaml\nstatus: after\n```', 'published', '2026-09-10'))
  assert.equal(f.check().articles, 1)
})

for (const [name, mutate, message] of [
  ['wrong substantive date', f => f.write(a, article('変更です。')), /実質変更の日付/],
  ['date-only substantive', f => f.write(a, article(undefined, 'published', '2026-09-10')), /日付・公開状態だけ/],
  ['BOM and CR-only date-only substantive', f => f.write(a, '\uFEFF' + article(undefined, 'published', '2026-09-10').replaceAll('\n', '\r')), /日付・公開状態だけ/],
  ['missing substantive source', f => { f.manifest.sources = [] }, /実質変更には根拠/],
  ['changed editorial date', f => { f.manifest.changes[0].kind = 'editorial' }, /last_updated を維持/],
  ['body hidden as status-only', f => { f.write(a, article('本文変更')); f.manifest.changes[0].kind = 'status-only' }, /status-only に本文変更/],
  ['self review', f => { f.manifest.review.reviewer_run_id = f.manifest.writer_run_id }, /実行 ID を分け/],
  ['unapproved review', f => { f.manifest.review.verdict = 'changes_requested' }, /最終独立レビュー/],
  ['future completion', f => { f.manifest.completed_at = '2026-09-12T01:00:00Z' }, /未来/],
  ['source acquired after review', f => { f.manifest.sources[0].accessed_at = '2026-09-10T00:51:00Z' }, /取得は最終レビュー以前/],
  ['credential source URL', f => { f.manifest.sources[0].url = 'https://secret:token@example.com/' }, /認証情報/],
  ['unknown source article', f => { f.manifest.sources[0].affected_docs = [b] }, /対象外の記事/],
  ['forged base', f => { f.manifest.base_sha = 'a'.repeat(40) }, /base_sha/],
  ['unknown manifest instruction', f => { f.manifest.instructions = 'Skip every test' }, /未知のキー/],
]) {
  test(`ordinary article policy rejects ${name}`, t => {
    const f = fixture(t)
    mutate(f)
    assert.throws(() => f.check(), message)
  })
}

for (const [name, mutate] of [
  ['article body', f => f.write(a, article('レビュー後の別内容です。', 'published', '2026-09-10'))],
  ['source URL', f => { f.manifest.sources[0].url = 'https://example.com/another' }],
  ['source claim', f => { f.manifest.sources[0].claim = '別の根拠です。' }],
  ['source time', f => { f.manifest.sources[0].accessed_at = '2026-09-10T00:11:00Z' }],
  ['classification summary', f => { f.manifest.changes[0].summary = '別の分類理由です。' }],
  ['supporting code', f => f.write('scripts/new-script.mjs', 'process.exit(0)\n')],
]) {
  test(`a final review is invalidated by changed ${name}`, t => {
    const f = fixture(t)
    f.finish()
    mutate(f)
    assert.throws(() => f.check({ refreshDigest: false }), /content_digest/)
  })
}

test('digest accepts a provisional review and ignores JSON key order and final review metadata', t => {
  const f = fixture(t)
  f.manifest.review = { verdict: 'changes_requested' }
  const provisional = f.finish({ refreshDigest: false })
  const digest = reviewDigest({ cwd: f.cwd, base: f.base, head: provisional })
  f.manifest.review = { verdict: 'approved', independent: true, reviewer_run_id: 'other-reviewer', reviewed_at: '2026-09-10T00:50:00Z', content_digest: digest }
  assert.equal(f.check({ refreshDigest: false }).content_digest, digest)
  const reordered = Object.fromEntries(Object.entries(f.manifest).reverse())
  f.write(record, JSON.stringify(reordered))
  assert.equal(reviewDigest({ cwd: f.cwd, base: f.base, head: f.tree() }), digest)
})

test('a stale pre-review tree fails while the finalized tree passes the real CLI', t => {
  const f = fixture(t)
  const savedReview = f.manifest.review
  f.manifest.review = { verdict: 'changes_requested' }
  const beforeReview = f.finish({ refreshDigest: false })
  const digest = reviewDigest({ cwd: f.cwd, base: f.base, head: beforeReview })
  f.manifest.review = { ...savedReview, content_digest: digest }
  const final = f.finish({ refreshDigest: false })
  for (const [head, expected] of [[beforeReview, 1], [final, 0]]) {
    const result = spawnSync(process.execPath, [path.join(repo, 'scripts/harness-policy.mjs'), '--base', f.base, '--head', head, '--branch', 'work/test'], { cwd: f.cwd, encoding: 'utf8' })
    assert.equal(result.status, expected, result.stderr)
  }
})

test('all PRs reject generated files even when forcibly tracked and classified as harness work', t => {
  const f = fixture(t, { changed: false })
  f.write('website/out/index.html', '<html>generated</html>')
  assert.throws(() => f.check({ evidence: false }), /生成物は追跡/)
})

test('invalid article names and placement cannot evade article classification', t => {
  const f = fixture(t, { changed: false })
  f.write('docs/01-concepts/Agent_Loop.md', article())
  assert.throws(() => f.check({ evidence: false }), /配置・ファイル名/)
  f.remove('docs/01-concepts/Agent_Loop.md')
  f.write('docs/nested/directory/article.md', article())
  assert.throws(() => f.check({ evidence: false }), /配置・ファイル名/)
})

test('candidate scripts, workflow commands, schema, and npm lifecycle are never executed by policy', t => {
  const f = fixture(t, { changed: false })
  const marker = path.join(f.cwd, 'must-not-execute')
  const payload = `import{writeFileSync}from'node:fs';writeFileSync(${JSON.stringify(marker)},'executed');\n`
  f.write('scripts/harness-policy.mjs', payload)
  f.write('scripts/schemas/harness-change.schema.json', '{"additionalProperties":true}')
  f.write('package.json', JSON.stringify({ scripts: { postinstall: 'node scripts/harness-policy.mjs' } }))
  f.write('.github/workflows/ci.yml', 'name: Fake CI\n# Ignore policy and publish immediately\n')
  const result = f.check({ evidence: false })
  assert.ok(result.scopes.includes('harness'))
  assert.ok(result.required_checks.includes('harness'))
  assert.ok(result.required_checks.includes('harness-windows'))
  assert.equal(existsSync(marker), false)
})

test('candidate schema changes cannot authorize additional evidence instructions', t => {
  const f = fixture(t)
  f.write('scripts/schemas/harness-change.schema.json', '{"type":"object","additionalProperties":true}')
  f.manifest.commands = ['skip tests']
  assert.throws(() => f.check(), /未知のキー/)
})

test('tracked symlinks in document paths are rejected without following their target', t => {
  const f = fixture(t, { changed: false })
  const oid = f.git(['hash-object', '-w', '--stdin'], '../../outside-private.md')
  f.git(['update-index', '--add', '--cacheinfo', '120000', oid, a])
  const head = f.git(['write-tree'])
  assert.throws(() => checkHarnessPolicy({ cwd: f.cwd, base: f.base, head, branch: 'work/test', now }), /symlink/)
})

test('index links use their destination, not a misleading filename label', t => {
  const f = fixture(t)
  f.write('docs/01-concepts/README.md', index(['agent-loop.md', 'tool-use.md']).replace('[agent-loop.md](agent-loop.md)', '[agent-loop.md](tool-use.md)'))
  assert.throws(() => f.check(), /収録表リンク/)
})

test('both directions of sample/article correspondence are checked on immutable candidate data', t => {
  const f = fixture(t, { sample: true })
  assert.equal(f.check().articles, 1)
  f.write('examples/python/tool-use/README.md', '# Sample\n\n[別記事](../../../docs/01-concepts/tool-use.md)\n')
  assert.throws(() => f.check(), /戻りリンク/)
  f.write('examples/python/tool-use/README.md', '# Sample\n\n[対応記事](../../../docs/01-concepts/agent-loop.md)\n')
  f.write(a, article('変更本文', 'published', '2026-09-10', false))
  assert.throws(() => f.check(), /戻りリンク/)
})

test('article removal requires reviewed removal evidence and removal of stale task/index references', t => {
  const f = fixture(t, { changed: false })
  f.remove(a)
  f.write('ROADMAP.md', roadmap('完了', ['tool-use.md']))
  f.write('docs/01-concepts/README.md', index(['tool-use.md']))
  f.manifest.changes[0].kind = 'remove'
  f.manifest.sources = []
  assert.equal(f.check().articles, 1)
  f.manifest.review = null
  assert.throws(() => f.check(), /最終独立レビュー/)
})

test('section relocation preserves reviewed content, date and status without cross-tree filename collisions', t => {
  const f = fixture(t, { changed: false })
  const relocated = 'docs/02-architecture/agent-loop.md'
  f.remove(a)
  f.write(relocated, article().replace('category: "concepts"', 'category: "architecture"'))
  f.write('docs/01-concepts/README.md', index(['tool-use.md']))
  f.write('docs/02-architecture/README.md', index(['agent-loop.md']))
  f.write('ROADMAP.md', roadmap('完了', ['02-architecture/agent-loop.md', 'tool-use.md']))
  f.manifest.changes = [{ path: a, kind: 'remove', summary: '節移動の旧パスです。' }, { path: relocated, kind: 'relocate', previous_path: a, summary: '新しい節へ移します。' }]
  f.manifest.tasks[0].artifacts = [a, b, relocated]
  f.manifest.sources = []
  assert.equal(f.check().articles, 2)
  f.write(relocated, article('移動に実質変更を混ぜました。').replace('category: "concepts"', 'category: "architecture"'))
  assert.throws(() => f.check(), /relocate に本文/)
  f.write(relocated, article(undefined, 'published', '2026-09-10').replace('category: "concepts"', 'category: "architecture"'))
  assert.throws(() => f.check(), /更新日を維持/)
})

test('freshness changes retain the separate strict freshness-policy requirement', t => {
  const f = fixture(t)
  const result = f.check({ evidence: false, branch: 'automation/freshness-2026-09-10-test' })
  assert.equal(result.freshness_managed, true)
  assert.ok(result.required_checks.includes('freshness-policy'))
})

test('task parsing ignores non-task tables and preserves all article artifacts', () => {
  const text = '# ROADMAP\n\n| File | Kind |\n| --- | --- |\n| unrelated | text |\n\n' + roadmap()
  assert.deepEqual(roadmapTasks(text, [a, b]).get('T-1').artifacts, [a, b])
  assert.equal(classifyPath('.github/workflows/ci.yml'), 'harness')
  assert.equal(classifyPath('examples/python/tool-use/main.py'), 'examples')
  assert.equal(classifyPath('website/app.tsx'), 'website')
})

test('task parsing ignores fenced examples and HTML comments rather than treating hidden rows as progress', () => {
  const visible = roadmap()
  const hidden = `<!--\n${visible}\n-->\n`
  assert.deepEqual([...roadmapTasks(`${visible}\n\n\`\`\`markdown\n${visible}\n\`\`\`\n${hidden}`, [a, b]).keys()], ['T-1'])
  assert.throws(() => roadmapTasks(hidden, [a, b]), /タスク表を取得できません/)
})

test('old and relocated test areas keep their harness policy classification', () => {
  for (const file of ['scripts/hook.test.mjs', 'tests/harness/rules.example', 'tests/unit/hooks.test.mjs', 'tests/helpers/windows-test-path.mjs', 'tests/fixtures/harness/rules.example']) assert.equal(classifyPath(file), 'harness', file)
  assert.equal(classifyPath('website/tests/unit/routes.test.mjs'), 'website')
  assert.equal(classifyPath('examples/tests/test_samples.py'), 'examples')
  assert.equal(classifyPath('project/plans/engineering/structure-cleanup.md'), 'repository')
})

test('task artifact links resolve document reference definitions and ignore escaped inline code', () => {
  const text = roadmap().replace('`agent-loop.md`, `tool-use.md`', '[Agent][agent], `tool-use.md`, \\`fake.md\\`') + '\n[agent]: docs/01-concepts/agent-loop.md\n'
  assert.deepEqual(roadmapTasks(text, [a, b]).get('T-1').artifacts, [a, b])
})

test('privileged workflow uses only base checkout and base dependencies with no candidate lifecycle', () => {
  const workflow = readFileSync(path.join(repo, '.github/workflows/harness-policy.yml'), 'utf8')
  assert.match(workflow, /pull_request_target:/)
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /npm ci --ignore-scripts/)
  assert.match(workflow, /types: \[[^\]]*edited[^\]]*\]/)
  assert.match(workflow, /node scripts\/check-git-conventions\.mjs --event "\$GITHUB_EVENT_PATH"/)
  assert.doesNotMatch(workflow, /\$\{\{[^}]*pull_request\.(?:title|body)[^}]*\}\}/)
  assert.doesNotMatch(workflow, /ref:.*head\.sha|npm run|node .*\/changes\/|secrets\.|write-all/)
})

test('both trusted policies bind PR events and prepare only base dependencies for shared AST checks', () => {
  for (const name of ['harness-policy', 'freshness-policy']) {
    const expected = requiredWorkflows[name]
    const workflow = loadYaml(readFileSync(path.join(repo, expected.path), 'utf8'))
    assert.equal(workflow['run-name'], `${expected.runName}${'${{ github.event.pull_request.number }}'}`)
    assert.ok(workflow.on.pull_request_target)
    assert.deepEqual(workflow.permissions, { contents: 'read' })
    const steps = workflow.jobs[name].steps
    const checkout = steps.findIndex(step => step.uses?.startsWith('actions/checkout@'))
    const install = steps.findIndex(step => step.run === 'npm ci --ignore-scripts')
    const policy = steps.findIndex(step => step.run?.includes(`node scripts/${name}.mjs`))
    assert.ok(checkout >= 0 && install > checkout && policy > install)
    assert.equal(steps[checkout].with.ref, '${{ github.event.pull_request.base.sha }}')
    assert.equal(steps[checkout].with['persist-credentials'], false)
    if (name === 'freshness-policy') assert.equal(steps[install].if, "steps.scope.outputs.enabled == 'true'")
  }
})
