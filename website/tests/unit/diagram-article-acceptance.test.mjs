import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  ARTICLE_EVIDENCE_PATH, ARTICLE_INPUT_FILES, ATTENTION_VARIANTS_ARTICLE, ATTENTION_VARIANTS_EVIDENCE_PATH,
  ATTENTION_VARIANTS_INPUT_FILES, getDiagramArticleAcceptance, getDiagramArticleConfig, TRACKED_ARTICLES, TRANSFORMER_ARTICLE
} from '../../lib/diagram-article-acceptance.mjs'
import { getDiagramCoverage } from '../../lib/diagram-coverage.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const manifestPath = 'website/diagrams/articles.json'
const recordPath = 'project/records/2026-09-24/acceptance-fixture.md'
const originals = new Map([...ARTICLE_INPUT_FILES, TRANSFORMER_ARTICLE, manifestPath].map(file => [file, readFileSync(path.join(repo, file), 'utf8')]))
function fixture(t) {
  const prefix = path.join(tmpdir(), 'diagram-article-acceptance-')
  const root = mkdtempSync(prefix)
  t.after(() => {
    const resolved = path.resolve(root)
    assert.ok(resolved.startsWith(path.resolve(prefix)) && path.dirname(resolved) === path.resolve(tmpdir()))
    rmSync(resolved, { recursive: true, force: true })
  })
  const write = (file, value) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), value) }
  const json = (file, value) => write(file, JSON.stringify(value))
  for (const [file, value] of originals) write(file, value)
  write(recordPath, '# Fixture only\n\nThis is not actual review or deployment evidence.\n')
  const registry = structuredClone(diagramRegistry)
  for (const entry of registry.diagrams) Object.assign(entry, { enabled: true, status: 'reviewed', reviewedDigest: entry.sourceDigest })
  const report = (article = TRANSFORMER_ARTICLE) => getDiagramArticleAcceptance({ repoRoot: root, registry, article })
  const evidence = (article = TRANSFORMER_ARTICLE) => {
    const gate = { inputDigest: report(article).inputDigest, status: 'passed', checkedAt: '2026-09-24T12:00:00Z' }
    return { schemaVersion: 1, article,
      review: { ...gate, status: 'approved', independent: true, record: recordPath + '#review' },
      local: { ...gate, record: recordPath },
      public: { ...gate, commit: 'a'.repeat(40), ci: 'https://github.com/pero3dev/ai-agent-library/actions/runs/123',
        pages: 'https://github.com/pero3dev/ai-agent-library/actions/runs/456/attempts/1', browserRecord: recordPath }
    }
  }
  return { root, write, json, registry, report, evidence, manifest: () => JSON.parse(originals.get(manifestPath)) }
}
function twoArticlesFixture(t) {
  const f = fixture(t)
  f.write(ATTENTION_VARIANTS_ARTICLE, readFileSync(path.join(repo, ATTENTION_VARIANTS_ARTICLE), 'utf8'))
  // Explicit test-only scene inputs: production must have every real file. This
  // exercises evidence separation while another worker implements the scenes.
  for (const file of ATTENTION_VARIANTS_INPUT_FILES.filter(file => !originals.has(file))) f.write(file, `// Fixture-only input for ${file}\n`)
  return f
}

test('tracked article requires all three recorded gates; untracked articles remain pending without filesystem reads', t => {
  const f = fixture(t), pending = f.report()
  assert.equal(pending.assignmentCurrent, true)
  assert.equal(pending.diagramsCurrent, true)
  assert.equal(pending.complete, false)
  assert.match(pending.inputDigest, /^sha256:[a-f0-9]{64}$/)
  assert.equal(pending.reasons.length, 3)
  const evidence = f.evidence()
  f.json(ARTICLE_EVIDENCE_PATH, { ...evidence, local: null, public: null })
  assert.equal(f.report().reviewRecorded, true)
  assert.equal(f.report().complete, false)
  f.json(ARTICLE_EVIDENCE_PATH, evidence)
  const result = f.report()
  assert.equal(result.complete, true)
  assert.deepEqual(result.reasons, [])
  assert.equal(result.verification, 'recorded-evidence-only')
  const untracked = getDiagramArticleAcceptance({ repoRoot: 'does-not-exist', article: 'docs/01-concepts/agent-loop.md' })
  assert.equal(untracked.tracked, false)
  assert.equal(untracked.complete, false)
  assert.equal(untracked.inputDigest, null)
})

test('digest covers every fixed runtime/generation input and a same-shape article change', t => {
  const f = fixture(t), before = f.report().inputDigest
  f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
  for (const file of ARTICLE_INPUT_FILES) {
    f.write(file, originals.get(file) + '\n/* changed acceptance input */\n')
    const changed = f.report()
    assert.notEqual(changed.inputDigest, before, file)
    assert.equal(changed.complete, false, file)
    assert.equal(changed.reviewRecorded, false, file)
    f.write(file, originals.get(file))
  }
  const source = originals.get(TRANSFORMER_ARTICLE)
  assert.ok(source.includes('重みの合計が 1'))
  f.write(TRANSFORMER_ARTICLE, source.replace('重みの合計が 1', '重みの合計が 2'))
  assert.notEqual(f.report().inputDigest, before)
  assert.equal(f.report().diagramsCurrent, false)
  assert.equal(f.report().complete, false)
})

test('whole article and assignment changes invalidate old gates, including static-only sections', t => {
  const f = fixture(t), before = f.report().inputDigest
  f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
  f.write(TRANSFORMER_ARTICLE, originals.get(TRANSFORMER_ARTICLE) + '\n\n参考情報の更新。\n')
  assert.notEqual(f.report().inputDigest, before)
  assert.equal(f.report().diagramsCurrent, true)
  assert.equal(f.report().complete, false)
  f.write(TRANSFORMER_ARTICLE, originals.get(TRANSFORMER_ARTICLE))
  const manifest = f.manifest()
  manifest.articles[0].sections.at(-1).topics[0].staticReason += ' 更新。'
  f.json(manifestPath, manifest)
  assert.notEqual(f.report().inputDigest, before)
  assert.equal(f.report().assignmentCurrent, true)
  assert.equal(f.report().complete, false)
})

test('selected registry entries and optional content overrides are inputs; unrelated entries and generated files are not', t => {
  const f = fixture(t), before = f.report().inputDigest
  const unrelated = f.registry.diagrams.find(entry => entry.id === 'agent-loop')
  unrelated.enabled = false
  f.write('website/generated/diagram-pages.json', '{"unrelated":"generated"}')
  assert.equal(f.report().inputDigest, before)
  const selected = f.registry.diagrams.find(entry => entry.id === 'transformer-io')
  selected.enabled = false
  assert.notEqual(f.report().inputDigest, before)
  assert.equal(f.report().diagramsCurrent, false)
  selected.enabled = true
  f.write('website/content-src/llm-internals/transformer-architecture.mdx', '# Override\n')
  assert.notEqual(f.report().inputDigest, before)
})

test('recording gates or a later deployment commit does not change the input digest; CRLF normalizes', t => {
  const f = fixture(t), before = f.report().inputDigest, evidence = f.evidence()
  f.json(ARTICLE_EVIDENCE_PATH, evidence)
  f.write(recordPath, '# Updated evidence record\n')
  evidence.public.commit = 'b'.repeat(40)
  evidence.public.checkedAt = '2026-09-25T08:15:00+09:00'
  f.json(ARTICLE_EVIDENCE_PATH, evidence)
  for (const [file, value] of originals) f.write(file, value.replace(/\r?\n/g, '\r\n'))
  assert.equal(f.report().inputDigest, before)
  assert.equal(f.report().complete, true)
})

test('all 11 headings and major subtopics must be assigned once, with valid primary diagrams and stages', t => {
  const f = fixture(t)
  const mutations = [
    m => m.articles[0].sections.pop(),
    m => m.articles[0].sections.push(m.articles[0].sections[0]),
    m => m.articles[0].sections[0].topics.pop(),
    m => m.articles[0].sections[0].topics.push(m.articles[0].sections[0].topics[0]),
    m => m.articles[0].sections[0].topics[0].stages = [4],
    m => m.articles[0].sections[0].topics[0].stages = [-1],
    m => m.articles[0].sections[0].topics[0].stages = [0, 0],
    m => m.articles[0].sections[0].topics[0].stages = ['0'],
    m => m.articles[0].sections[0].topics[0].diagramId = 'agent-loop',
    m => m.articles[0].sections[0].topics[1].staticReason = '',
    m => m.articles[0].sections[0].topics[0].label = '',
    m => m.articles[0].primaryDiagramIds.pop(),
    m => m.articles[0].complete = true,
    m => m.articles[0].sections.forEach(section => section.topics.forEach(topic => {
      if (topic.diagramId === 'transformer-io') { delete topic.diagramId; delete topic.stages; topic.staticReason = 'Only prose.' }
    }))
  ]
  for (const mutate of mutations) {
    const manifest = f.manifest()
    mutate(manifest)
    f.json(manifestPath, manifest)
    // Even newly matched gate digests cannot turn an incomplete assignment complete.
    f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
    assert.equal(f.report().assignmentCurrent, false, String(mutate))
    assert.equal(f.report().complete, false, String(mutate))
  }
  f.json(manifestPath, f.manifest())
  for (const changed of ['### チェックリストを変更', '### チェックリスト\n\n### チェックリスト']) {
    f.write(TRANSFORMER_ARTICLE, originals.get(TRANSFORMER_ARTICLE).replace('### チェックリスト', changed))
    f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
    assert.equal(f.report().assignmentCurrent, false)
    assert.equal(f.report().complete, false)
  }
})

test('disabled, unreviewed or stale primary diagram cannot pass even with matching article gate records', t => {
  const f = fixture(t), entry = f.registry.diagrams.find(entry => entry.id === 'transformer-io'), original = structuredClone(entry)
  for (const state of [
    { enabled: false }, { reviewedDigest: null, status: 'implemented' },
    { reviewedDigest: 'sha256:' + '0'.repeat(64), sourceDigest: 'sha256:' + '0'.repeat(64) }
  ]) {
    Object.assign(entry, original, state)
    f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
    assert.equal(f.report().diagramsCurrent, false)
    assert.equal(f.report().complete, false)
  }
})

test('evidence schema rejects missing, mismatched, non-independent, invalid-date, wrong-URL and traversal records', t => {
  const f = fixture(t), original = f.evidence()
  const mutations = [
    e => e.schemaVersion = 2, e => e.article = 'docs/other.md', e => e.complete = true,
    e => e.review = null, e => delete e.local, e => e.public = null,
    e => e.review.independent = false, e => e.review.status = 'pending',
    e => e.local.inputDigest = 'sha256:' + '0'.repeat(64),
    e => e.review.checkedAt = '2026-02-30T12:00:00Z', e => e.local.checkedAt = 'yesterday',
    e => e.public.commit = '1234567', e => e.public.commit = 'g'.repeat(40),
    e => e.public.ci = 'https://github.com/another/repo/actions/runs/123',
    e => e.public.pages = 'https://github.com/pero3dev/ai-agent-library/actions/runs/0',
    e => e.public.pages += '?success=true',
    e => e.review.record = 'project/records/../records/2026-09-24/acceptance-fixture.md',
    e => e.local.record = recordPath.replaceAll('/', '\\'),
    e => e.local.record = recordPath.replace('2026', '%32%30%32%36'),
    e => e.public.browserRecord = 'project/records/missing.md',
    e => e.review.record = path.join(f.root, recordPath)
  ]
  for (const mutate of mutations) {
    const evidence = structuredClone(original)
    mutate(evidence)
    f.json(ARTICLE_EVIDENCE_PATH, evidence)
    const result = f.report()
    assert.equal(result.complete, false, String(mutate))
    assert.ok(result.reasons.length > 0, String(mutate))
  }
  f.write(ARTICLE_EVIDENCE_PATH, '{ broken JSON')
  assert.equal(f.report().complete, false)
  assert.ok(f.report().reasons.some(reason => reason.includes('読み取れません')))
})

test('malformed input or missing fixed dependency reports pending instead of throwing', t => {
  const f = fixture(t)
  for (const manifest of [{ schemaVersion: 1, articles: {} }, { schemaVersion: 1, articles: [null] }, null]) {
    f.json(manifestPath, manifest)
    assert.equal(f.report().complete, false)
    assert.ok(f.report().reasons.length > 0)
  }
  f.json(manifestPath, f.manifest())
  rmSync(path.join(f.root, ARTICLE_INPUT_FILES[0]))
  assert.equal(f.report().inputDigest, null)
  assert.equal(f.report().complete, false)
})

test('coverage computes complete article count from acceptance and keeps publication verification separate', t => {
  const f = fixture(t)
  const report = () => getDiagramCoverage({ repoRoot: f.root, registry: f.registry })
  assert.equal(report().summary.completeArticles, 0)
  f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
  assert.equal(report().summary.completeArticles, 1)
  assert.equal(report().summary.publication, 'not-verified-by-this-report')
  assert.equal(report().articles[0].acceptance.verification, 'recorded-evidence-only')
  f.registry.diagrams.find(entry => entry.id === 'self-attention').enabled = false
  assert.equal(report().summary.completeArticles, 0)
})

test('two article configurations are code-owned and returned copies cannot alter the policy', () => {
  assert.deepEqual(TRACKED_ARTICLES, [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE])
  const config = getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE)
  assert.equal(Object.keys(config.topics).length, 11)
  assert.equal(config.evidencePath, ATTENTION_VARIANTS_EVIDENCE_PATH)
  config.primaryDiagramIds.length = 0
  config.inputFiles.push('../../untrusted-file')
  assert.equal(getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE).primaryDiagramIds.length, 3)
  assert.equal(getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE).inputFiles.includes('../../untrusted-file'), false)
  assert.equal(getDiagramArticleConfig('__proto__'), null)
  assert.equal(getDiagramArticleAcceptance({ article: '__proto__' }).tracked, false)
})

test('two articles require their own matching evidence and aggregate completion independently', t => {
  const f = twoArticlesFixture(t)
  for (const article of TRACKED_ARTICLES) {
    assert.equal(f.report(article).assignmentCurrent, true)
    assert.equal(f.report(article).diagramsCurrent, true)
    assert.equal(f.report(article).complete, false)
  }
  const transformerEvidence = f.evidence()
  f.json(ARTICLE_EVIDENCE_PATH, transformerEvidence)
  assert.equal(f.report().complete, true)
  assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).complete, false)
  f.json(ATTENTION_VARIANTS_EVIDENCE_PATH, transformerEvidence)
  assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).complete, false)
  f.json(ATTENTION_VARIANTS_EVIDENCE_PATH, f.evidence(ATTENTION_VARIANTS_ARTICLE))
  assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).complete, true)
  assert.equal(getDiagramCoverage({ repoRoot: f.root, registry: f.registry }).summary.completeArticles, 2)
  f.write('website/lib/mdx-safety.mjs', originals.get('website/lib/mdx-safety.mjs') + '\n// Shared safety update\n')
  for (const article of TRACKED_ARTICLES) assert.equal(f.report(article).complete, false)
  assert.equal(getDiagramCoverage({ repoRoot: f.root, registry: f.registry }).summary.completeArticles, 0)
})

test('article-specific scene, assignment and registry changes leave the other article digest current', t => {
  const f = twoArticlesFixture(t)
  const before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  for (const [article, scene, id] of [
    [TRANSFORMER_ARTICLE, 'website/components/diagrams/transformer-io-walkthrough.jsx', 'transformer-io'],
    [ATTENTION_VARIANTS_ARTICLE, 'website/components/diagrams/attention-kv-walkthrough.jsx', 'attention-kv-sharing']
  ]) {
    const other = TRACKED_ARTICLES.find(value => value !== article)
    const sceneSource = readFileSync(path.join(f.root, scene), 'utf8')
    f.write(scene, sceneSource + '\n// Changed scene\n')
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    assert.equal(f.report(other).inputDigest, before.get(other))
    f.write(scene, sceneSource)
    const manifest = f.manifest()
    manifest.articles.find(entry => entry.article === article).sections[0].topics[0].label += ' 更新'
    f.json(manifestPath, manifest)
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    assert.equal(f.report(other).inputDigest, before.get(other))
    f.json(manifestPath, f.manifest())
    const entry = f.registry.diagrams.find(entry => entry.id === id)
    entry.enabled = false
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    assert.equal(f.report(other).inputDigest, before.get(other))
    entry.enabled = true
  }
  f.write('website/content-src/llm-internals/attention-variants-and-long-context.mdx', '# Override\n')
  assert.notEqual(f.report(ATTENTION_VARIANTS_ARTICLE).inputDigest, before.get(ATTENTION_VARIANTS_ARTICLE))
  assert.equal(f.report().inputDigest, before.get(TRANSFORMER_ARTICLE))
})

test('attention variants whole-article acceptance includes unwrapped SSM and all major topics', t => {
  const f = twoArticlesFixture(t), before = f.report(ATTENTION_VARIANTS_ARTICLE)
  f.json(ATTENTION_VARIANTS_EVIDENCE_PATH, f.evidence(ATTENTION_VARIANTS_ARTICLE))
  const source = readFileSync(path.join(f.root, ATTENTION_VARIANTS_ARTICLE), 'utf8')
  f.write(ATTENTION_VARIANTS_ARTICLE, source.replace('状態に畳み込みながら処理し', '状態にまとめながら処理し'))
  const changed = f.report(ATTENTION_VARIANTS_ARTICLE)
  assert.notEqual(changed.inputDigest, before.inputDigest)
  assert.equal(changed.diagramsCurrent, true)
  assert.equal(changed.complete, false)
  f.write(ATTENTION_VARIANTS_ARTICLE, source)
  for (const mutate of [
    assignment => assignment.sections[6].topics.pop(),
    assignment => assignment.sections[5].topics[0].stages = [4],
    assignment => assignment.sections[7].heading = '未確認の見出し',
    assignment => assignment.sections[6].topics[0].staticReason = ''
  ]) {
    const manifest = f.manifest()
    mutate(manifest.articles.find(entry => entry.article === ATTENTION_VARIANTS_ARTICLE))
    f.json(manifestPath, manifest)
    f.json(ATTENTION_VARIANTS_EVIDENCE_PATH, f.evidence(ATTENTION_VARIANTS_ARTICLE))
    assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).assignmentCurrent, false)
    assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).complete, false)
    assert.equal(f.report().assignmentCurrent, true)
  }
})

test('missing attention variant implementation fails closed without disturbing Transformer inputs or old evidence snapshots', t => {
  const f = twoArticlesFixture(t), transformerDigest = f.report().inputDigest
  f.json(ARTICLE_EVIDENCE_PATH, f.evidence())
  f.json('project/records/2026-09-24/transformer-article-acceptance-pr53.json', f.evidence())
  rmSync(path.join(f.root, 'website/components/diagrams/attention-kv-walkthrough.jsx'))
  assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).inputDigest, null)
  assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).complete, false)
  assert.equal(f.report().inputDigest, transformerDigest)
  assert.equal(f.report().complete, true)
  // A historical snapshot is never a fallback approval for newer shared code.
  f.write('website/lib/diagram-decoration.mjs', originals.get('website/lib/diagram-decoration.mjs') + '\n// Shared update\n')
  assert.equal(f.report().reviewRecorded, false)
  assert.equal(f.report().complete, false)
})
