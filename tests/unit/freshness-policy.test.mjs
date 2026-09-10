import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkFreshnessPolicy, contentDigest, legacyContentDigest, validateResultShape, validateArchivedResultShape } from '../../scripts/freshness-policy.mjs'

const articlePath = 'docs/01-concepts/agent-loop.md'
const runId = '2026-09-10-test'
const manifestPath = `research/freshness-runs/${runId}.json`
const article = text => `---\ntitle: "Agent ループ"\ncategory: "concepts"\nlevel: "basic"\nstatus: "published"\nlast_updated: "2026-09-09"\ntags: ["agent-loop"]\n---\n\n# Agent ループ\n\n## 本文\n\n${text}\n\n## 参考資料\n\n- [公式](https://example.com/original)(アクセス日: 2026-09-09)\n\n## TODO・未確認事項\n\nなし\n`
const roadmap = `# ROADMAP\n\n<!-- freshness-registry:start -->\n| ID | 系統 | 記事対象 | 調査起点 | 周期(日) |\n| --- | --- | --- | --- | --- |\n| concepts | 概念 | \`docs/01-concepts/*.md\` | \`research/concepts/guide.md\` | 42 |\n<!-- freshness-registry:end -->\n\n<!-- freshness-watchlist:start -->\n- 次の確認: 停止条件\n<!-- freshness-watchlist:end -->\n`

function fixture(t) {
  const temp = path.resolve(os.tmpdir())
  const cwd = mkdtempSync(path.join(temp, 'ai-agent-freshness-policy-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(cwd)), temp)
    assert.ok(path.basename(cwd).startsWith('ai-agent-freshness-policy-'))
    rmSync(cwd, { force: true, recursive: true })
  })
  const git = args => execFileSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const write = (file, text) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })
    writeFileSync(path.join(cwd, file), text, 'utf8')
  }
  const tree = () => { git(['add', '--all']); return git(['write-tree']) }
  git(['init', '--quiet'])
  write('ROADMAP.md', roadmap)
  write('GLOSSARY.md', '# 用語集\n')
  write('research/concepts/guide.md', '# 調査メモ\n')
  write(articlePath, article('元の主張です。'))
  write('docs/01-concepts/README.md', '# 概念\n')
  const base = tree()
  write(articlePath, article('一次資料で確認した主張です。').replace('last_updated: "2026-09-09"', 'last_updated: "2026-09-10"'))
  const manifest = {
    schema_version: 2, run_id: runId, base_sha: base, writer_run_id: 'writer-001',
    started_at: '2026-09-10T00:00:00Z', completed_at: '2026-09-10T01:00:00Z', systems: ['concepts'],
    observations: [{ system_id: 'concepts', status: 'changed', summary: '一次情報を確認しました。',
      sources: [{ url: 'https://example.com/official', accessed_at: '2026-09-10T00:10:00Z', published_at: '2026-09-09' }], affected_docs: [articlePath] }],
    changes: [{ path: articlePath, kind: 'substantive', observation_indices: [0], summary: '本文の主張を更新しました。' }],
    review: { verdict: 'approved', risk: 'low', independent: true, reviewer_run_id: 'reviewer-002', reviewed_at: '2026-09-10T00:50:00Z', content_digest: '0'.repeat(64) }
  }
  const finish = ({ refreshDigest = true } = {}) => {
    write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    if (refreshDigest) manifest.review.content_digest = contentDigest({ cwd, base, head: tree() })
    write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    return tree()
  }
  const check = options => checkFreshnessPolicy({ cwd, base, head: finish(options), branch: `automation/freshness-${runId}`, now: Date.parse('2026-09-10T02:00:00Z') })
  return { cwd, base, git, write, tree, manifest, finish, check }
}

test('a reviewed existing published article passes using immutable Git trees', t => {
  const f = fixture(t)
  assert.equal(f.check().articles, 1)
  assert.equal(f.check().files, 2)
})

for (const [status, date] of [
  ['"published" # publication', '"2026-09-10" # verified'],
  ['"\\u0070ublished"', '"\\u0032026-09-10"'],
  ["'published'", "'2026-09-10'"]
]) test(`freshness front matter shares article YAML semantics for ${status}`, t => {
  const f = fixture(t)
  f.write(articlePath, article('一次資料で確認した主張です。').replace('status: "published"', `status: ${status}`).replace('last_updated: "2026-09-09"', `last_updated: ${date}`))
  assert.equal(f.check().articles, 1)
})

for (const status of ['"draft" # publication', '"\\u0064raft"']) test(`freshness cannot retain publication using ${status}`, t => {
  const f = fixture(t)
  f.write(articlePath, article('一次資料で確認した主張です。').replace('status: "published"', `status: ${status}`).replace('2026-09-09', '2026-09-10'))
  assert.throws(() => f.check(), /published/)
})

test('freshness normalizes BOM and CR-only lines before checking a date-only update', t => {
  const f = fixture(t)
  f.write(articlePath, '\uFEFF' + article('元の主張です。').replace('last_updated: "2026-09-09"', 'last_updated: "2026-09-10"').replaceAll('\n', '\r'))
  assert.throws(() => f.check(), /日付だけ/)
})

test('freshness rejects malformed front matter instead of silently ignoring extra YAML rows', t => {
  const f = fixture(t)
  f.write(articlePath, article('一次資料で確認した主張です。').replace('status: "published"', 'status: "published"\n invalid nesting').replace('last_updated: "2026-09-09"', 'last_updated: "2026-09-10"'))
  assert.throws(() => f.check(), /正しい front matter/)
})

test('regular branches do not require a freshness manifest', () => {
  assert.equal(checkFreshnessPolicy({ branch: 'fix/ordinary-work' }).skipped, true)
  assert.throws(() => checkFreshnessPolicy({}), /branch が必要/)
})

test('a content change after review invalidates the digest, while the manifest has no circular digest', t => {
  const f = fixture(t)
  const head = f.finish()
  assert.equal(contentDigest({ cwd: f.cwd, base: f.base, head }), f.manifest.review.content_digest)
  f.write(articlePath, article('レビュー後の変更です。').replace('last_updated: "2026-09-09"', 'last_updated: "2026-09-10"'))
  assert.throws(() => f.check({ refreshDigest: false }), /content_digest/)
})

for (const [name, mutate] of [
  ['URL', f => { f.manifest.observations[0].sources[0].url = 'https://example.com/replaced' }],
  ['source time', f => { f.manifest.observations[0].sources[0].accessed_at = '2026-09-10T00:11:00Z' }],
  ['claim', f => { f.manifest.observations[0].summary = '別の主張です。' }],
  ['classification', f => { f.manifest.changes[0].summary = '異なる更新理由です。' }]
]) {
  test(`evidence-only ${name} changes invalidate the final review`, t => {
    const f = fixture(t)
    f.finish()
    mutate(f)
    assert.throws(() => f.check({ refreshDigest: false }), /content_digest/)
    assert.equal(f.check().articles, 1)
  })
}

test('JSON formatting and key order do not change the reviewed meaning', t => {
  const f = fixture(t)
  const before = f.finish()
  const digest = contentDigest({ cwd: f.cwd, base: f.base, head: before })
  const reordered = Object.fromEntries(Object.entries(f.manifest).reverse())
  f.write(manifestPath, JSON.stringify(reordered))
  assert.equal(contentDigest({ cwd: f.cwd, base: f.base, head: f.tree() }), digest)
  f.manifest.completed_at = '2026-09-10T01:01:00Z'
  f.manifest.review.reviewed_at = '2026-09-10T00:51:00Z'
  assert.equal(f.check({ refreshDigest: false }).articles, 1)
})

test('legacy records remain readable but cannot bypass new-PR requirements', t => {
  const f = fixture(t)
  f.manifest.schema_version = 1
  f.manifest.review.content_digest = legacyContentDigest({ cwd: f.cwd, base: f.base, head: f.tree() })
  validateArchivedResultShape(f.manifest)
  assert.throws(() => f.check({ refreshDigest: false }), /const/)
  f.manifest.schema_version = 2
  assert.throws(() => f.check({ refreshDigest: false }), /content_digest/)
  assert.equal(f.check().articles, 1)
})

test('sources fetched after the asserted review require a later review', t => {
  const f = fixture(t)
  f.manifest.observations[0].sources[0].accessed_at = '2026-09-10T00:55:00Z'
  assert.throws(() => f.check(), /レビュー以前/)
})

test('digest preparation requires staged source evidence', t => {
  const f = fixture(t)
  assert.throws(() => contentDigest({ cwd: f.cwd, base: f.base, head: f.tree() }), /manifest を 1 件 stage/)
})

for (const [name, mutate, error] of [
  ['writer cannot self-declare as independent reviewer', f => { f.manifest.review.reviewer_run_id = f.manifest.writer_run_id }, /run ID/],
  ['human-review risk cannot use the automatic branch', f => { f.manifest.review.risk = 'requires-human' }, /approved かつ low/],
  ['requested changes cannot merge automatically', f => { f.manifest.review.verdict = 'changes_requested' }, /approved かつ low/],
  ['unknown system IDs fail closed', f => { f.manifest.systems = ['unknown'] }, /未知の系統/],
  ['base drift requires new evidence', f => { f.manifest.base_sha = '0'.repeat(40) }, /base_sha/],
  ['unverified observations cannot authorize article changes', f => { f.manifest.observations[0].status = 'unverifiable' }, /未確認・失敗/],
  ['unchanged observations cannot authorize substantive claims', f => { f.manifest.observations[0].status = 'unchanged' }, /changed の観測/],
  ['missing official-source records are not successful verification', f => { f.manifest.observations[0].sources = [] }, /根拠 URL/],
  ['source observations from another run are rejected', f => { f.manifest.observations[0].sources[0].accessed_at = '2026-09-09T00:00:00Z' }, /accessed_at/],
  ['invalid effective dates cannot be silently normalized', f => { f.manifest.observations[0].sources[0].effective_at = '2026-02-30' }, /日時が不正/],
  ['secret-bearing source URLs are rejected', f => { f.manifest.observations[0].sources[0].url = 'https://name:secret@example.com/' }, /認証情報/],
  ['metadata must retain published', f => { f.write(articlePath, article('変更').replace('"published"', '"draft"')) }, /published/],
  ['substantive changes require the completed JST date', f => { f.write(articlePath, article('変更')) }, /last_updated/],
  ['date-only updates do not count as article maintenance', f => { f.write(articlePath, article('元の主張です。').replace('last_updated: "2026-09-09"', 'last_updated: "2026-09-10"')) }, /日付だけ/],
  ['the manifest cannot introduce unrecognized instruction fields', f => { f.manifest.command = 'arbitrary instruction' }, /未知のキー/],
  ['observation indices must point to actual records', f => { f.manifest.changes[0].observation_indices = [4] }, /範囲外/]
]) {
  test(name, t => {
    const f = fixture(t)
    mutate(f)
    assert.throws(() => f.check(), error)
  })
}

test('reference-only updates preserve last_updated and cannot hide body changes', t => {
  const f = fixture(t)
  f.manifest.changes[0].kind = 'reference-only'
  f.manifest.observations[0].status = 'unchanged'
  f.write(articlePath, article('元の主張です。').replace('https://example.com/original', 'https://example.com/moved'))
  assert.equal(f.check().articles, 1)
  f.write(articlePath, article('本文を変更します。'))
  assert.throws(() => f.check(), /reference-only/)
})

test('ROADMAP permits only the watchlist, with the base registry remaining authoritative', t => {
  const f = fixture(t)
  f.manifest.changes.push({ path: 'ROADMAP.md', kind: 'supporting', observation_indices: [0], summary: '確認項目を更新しました。' })
  f.write('ROADMAP.md', roadmap.replace('次の確認: 停止条件', '次の確認: 新しい停止条件'))
  assert.equal(f.check().files, 3)
  f.write('ROADMAP.md', roadmap.replace('| 42 |', '| 7 |'))
  assert.throws(() => f.check(), /観測欄以外/)
})

for (const file of ['.github/workflows/ci.yml', '.codex/config.toml', 'AGENTS.md', 'scripts/tool.mjs', 'examples/python/tool.py', 'website/generated/routes.json', 'research/unrelated/new-note.md']) {
  test(`automatic maintenance cannot modify ${file}`, t => {
    const f = fixture(t)
    f.write(file, 'forbidden\n')
    f.manifest.changes.push({ path: file, kind: 'supporting', observation_indices: [0], summary: '許可外変更です。' })
    assert.throws(() => f.check(), /許可範囲外|対象外の調査メモ/)
  })
}

test('new research notes can accompany existing article corrections', t => {
  const f = fixture(t)
  const file = 'research/concepts/update-2026-09-10.md'
  f.write(file, '# 根拠\n')
  f.manifest.changes.push({ path: file, kind: 'supporting', observation_indices: [0], summary: '根拠を保存します。' })
  assert.equal(f.check().files, 3)
})

test('new articles are outside the initial automatic scope', t => {
  const f = fixture(t)
  const file = 'docs/01-concepts/new-topic.md'
  f.write(file, article('新記事'))
  f.manifest.changes.push({ path: file, kind: 'substantive', observation_indices: [0], summary: '新記事です。' })
  assert.throws(() => f.check(), /新記事または対象外/)
})

test('executable file modes are rejected even when content is otherwise approved', t => {
  const f = fixture(t)
  f.finish()
  f.git(['update-index', '--chmod=+x', articlePath])
  let head = f.git(['write-tree'])
  f.manifest.review.content_digest = contentDigest({ cwd: f.cwd, base: f.base, head })
  f.write(manifestPath, JSON.stringify(f.manifest))
  f.git(['add', '--', manifestPath])
  head = f.git(['write-tree'])
  assert.throws(() => checkFreshnessPolicy({ cwd: f.cwd, base: f.base, head, branch: `automation/freshness-${runId}` }), /mode 変更/)
})

test('deleting files cannot be disguised by changes metadata', t => {
  const f = fixture(t)
  f.finish()
  f.git(['rm', '--cached', '--', 'GLOSSARY.md'])
  let head = f.git(['write-tree'])
  f.manifest.changes.push({ path: 'GLOSSARY.md', kind: 'supporting', observation_indices: [0], summary: '削除です。' })
  f.write(manifestPath, JSON.stringify(f.manifest))
  f.git(['add', '--', manifestPath])
  head = f.git(['write-tree'])
  f.manifest.review.content_digest = contentDigest({ cwd: f.cwd, base: f.base, head })
  f.write(manifestPath, JSON.stringify(f.manifest))
  f.git(['add', '--', manifestPath])
  head = f.git(['write-tree'])
  assert.throws(() => checkFreshnessPolicy({ cwd: f.cwd, base: f.base, head, branch: `automation/freshness-${runId}` }), /削除・改名/)
})

test('schema itself remains strict about bounded systems and independent review', () => {
  const schema = JSON.parse(readFileSync(new URL('../../scripts/schemas/freshness-result.schema.json', import.meta.url), 'utf8'))
  assert.equal(schema.properties.systems.maxItems, 3)
  assert.equal(schema.properties.review.properties.independent.const, true)
  assert.throws(() => validateResultShape({}), /必須/)
})
