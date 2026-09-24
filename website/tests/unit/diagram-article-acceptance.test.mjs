import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  ARTICLE_EVIDENCE_PATH, ARTICLE_INPUT_FILES, ATTENTION_VARIANTS_ARTICLE, ATTENTION_VARIANTS_EVIDENCE_PATH,
  ATTENTION_VARIANTS_INPUT_FILES, getDiagramArticleAcceptance, getDiagramArticleConfig, TRACKED_ARTICLES, TRANSFORMER_ARTICLE,
  MOE_ARTICLE, MOE_EVIDENCE_PATH, MOE_INPUT_FILES,
  GENERATION_ARTICLE, GENERATION_EVIDENCE_PATH, GENERATION_INPUT_FILES,
  TOKENIZATION_ARTICLE, TOKENIZATION_EVIDENCE_PATH, TOKENIZATION_INPUT_FILES,
  INFERENCE_ARTICLE, INFERENCE_EVIDENCE_PATH, INFERENCE_INPUT_FILES,
  TRAINING_ARTICLE, TRAINING_EVIDENCE_PATH, TRAINING_INPUT_FILES
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
function trackedArticlesFixture(t) {
  const f = fixture(t)
  // Explicit test-only scene inputs: production must have every real file. This
  // exercises evidence separation while another worker implements the scenes.
  for (const article of TRACKED_ARTICLES.filter(article => article !== TRANSFORMER_ARTICLE)) {
    f.write(article, readFileSync(path.join(repo, article), 'utf8'))
    for (const file of getDiagramArticleConfig(article).inputFiles.filter(file => !originals.has(file))) f.write(file, `// Fixture-only input for ${file}\n`)
  }
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

test('seven article configurations are code-owned and returned copies cannot alter the policy', () => {
  assert.deepEqual(TRACKED_ARTICLES, [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE, GENERATION_ARTICLE, TOKENIZATION_ARTICLE, INFERENCE_ARTICLE, TRAINING_ARTICLE])
  const config = getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE)
  assert.equal(Object.keys(config.topics).length, 11)
  assert.equal(config.evidencePath, ATTENTION_VARIANTS_EVIDENCE_PATH)
  config.primaryDiagramIds.length = 0
  config.inputFiles.push('../../untrusted-file')
  assert.equal(getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE).primaryDiagramIds.length, 3)
  assert.equal(getDiagramArticleConfig(ATTENTION_VARIANTS_ARTICLE).inputFiles.includes('../../untrusted-file'), false)
  assert.equal(getDiagramArticleConfig('__proto__'), null)
  assert.equal(getDiagramArticleAcceptance({ article: '__proto__' }).tracked, false)
  const moe = getDiagramArticleConfig(MOE_ARTICLE)
  assert.equal(Object.keys(moe.topics).length, 9)
  assert.equal(Object.values(moe.topics).flat().length, 33)
  assert.equal(moe.evidencePath, MOE_EVIDENCE_PATH)
  assert.deepEqual(moe.primaryDiagramIds, ['moe-routing-load', 'moe-parameters-communication'])
  assert.deepEqual(moe.inputFiles, MOE_INPUT_FILES)
  assert.ok(MOE_INPUT_FILES.includes('website/lib/moe-routing-model.mjs'))
  assert.ok(MOE_INPUT_FILES.includes('website/components/diagrams/moe-parameters.css'))
  assert.equal(ARTICLE_INPUT_FILES.some(file => file.includes('/moe-')), false)
  assert.equal(ATTENTION_VARIANTS_INPUT_FILES.some(file => file.includes('/moe-')), false)
})

test('seven articles require their own matching evidence and aggregate completion independently', t => {
  const f = trackedArticlesFixture(t)
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
  assert.equal(f.report(MOE_ARTICLE).complete, false)
  f.json(MOE_EVIDENCE_PATH, f.evidence(ATTENTION_VARIANTS_ARTICLE))
  assert.equal(f.report(MOE_ARTICLE).complete, false)
  f.json(MOE_EVIDENCE_PATH, f.evidence(MOE_ARTICLE))
  assert.equal(f.report(MOE_ARTICLE).complete, true)
  assert.equal(getDiagramCoverage({ repoRoot: f.root, registry: f.registry }).summary.completeArticles, 3)
  for (const [article, evidencePath, count] of [
    [GENERATION_ARTICLE, GENERATION_EVIDENCE_PATH, 4], [TOKENIZATION_ARTICLE, TOKENIZATION_EVIDENCE_PATH, 5],
    [INFERENCE_ARTICLE, INFERENCE_EVIDENCE_PATH, 6], [TRAINING_ARTICLE, TRAINING_EVIDENCE_PATH, 7]
  ]) {
    assert.equal(f.report(article).complete, false)
    f.json(evidencePath, f.evidence(MOE_ARTICLE))
    assert.equal(f.report(article).complete, false)
    f.json(evidencePath, f.evidence(article))
    assert.equal(f.report(article).complete, true)
    assert.equal(getDiagramCoverage({ repoRoot: f.root, registry: f.registry }).summary.completeArticles, count)
  }
  f.write('website/lib/mdx-safety.mjs', originals.get('website/lib/mdx-safety.mjs') + '\n// Shared safety update\n')
  for (const article of TRACKED_ARTICLES) assert.equal(f.report(article).complete, false)
  assert.equal(getDiagramCoverage({ repoRoot: f.root, registry: f.registry }).summary.completeArticles, 0)
})

test('article-specific scene, assignment and registry changes leave every other article digest current', t => {
  const f = trackedArticlesFixture(t)
  const before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  for (const [article, scene, id] of [
    [TRANSFORMER_ARTICLE, 'website/components/diagrams/transformer-io-walkthrough.jsx', 'transformer-io'],
    [ATTENTION_VARIANTS_ARTICLE, 'website/components/diagrams/attention-kv-walkthrough.jsx', 'attention-kv-sharing'],
    [MOE_ARTICLE, 'website/components/diagrams/moe-routing-walkthrough.jsx', 'moe-routing-load'],
    [GENERATION_ARTICLE, 'website/components/diagrams/generation-walkthrough.jsx', 'generation-token-loop'],
    [TOKENIZATION_ARTICLE, 'website/components/diagrams/tokenization-walkthrough.jsx', 'tokenization-counting'],
    [INFERENCE_ARTICLE, 'website/components/diagrams/inference-sampling-walkthrough.jsx', 'inference-sampling'],
    [TRAINING_ARTICLE, 'website/components/diagrams/training-stages-walkthrough.jsx', 'training-stages']
  ]) {
    const others = TRACKED_ARTICLES.filter(value => value !== article)
    const sceneSource = readFileSync(path.join(f.root, scene), 'utf8')
    f.write(scene, sceneSource + '\n// Changed scene\n')
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    for (const other of others) assert.equal(f.report(other).inputDigest, before.get(other))
    f.write(scene, sceneSource)
    const manifest = f.manifest()
    manifest.articles.find(entry => entry.article === article).sections[0].topics[0].label += ' 更新'
    f.json(manifestPath, manifest)
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    for (const other of others) assert.equal(f.report(other).inputDigest, before.get(other))
    f.json(manifestPath, f.manifest())
    const entry = f.registry.diagrams.find(entry => entry.id === id)
    entry.enabled = false
    assert.notEqual(f.report(article).inputDigest, before.get(article))
    for (const other of others) assert.equal(f.report(other).inputDigest, before.get(other))
    entry.enabled = true
  }
  f.write('website/content-src/llm-internals/attention-variants-and-long-context.mdx', '# Override\n')
  assert.notEqual(f.report(ATTENTION_VARIANTS_ARTICLE).inputDigest, before.get(ATTENTION_VARIANTS_ARTICLE))
  assert.equal(f.report().inputDigest, before.get(TRANSFORMER_ARTICLE))
  assert.equal(f.report(MOE_ARTICLE).inputDigest, before.get(MOE_ARTICLE))
})

test('attention variants whole-article acceptance includes unwrapped SSM and all major topics', t => {
  const f = trackedArticlesFixture(t), before = f.report(ATTENTION_VARIANTS_ARTICLE)
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
  const f = trackedArticlesFixture(t), transformerDigest = f.report().inputDigest
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

test('MoE assigns all nine headings and 33 topics; static-only changes also invalidate recorded gates', t => {
  const f = trackedArticlesFixture(t), before = f.report(MOE_ARTICLE)
  const assignment = f.manifest().articles.find(entry => entry.article === MOE_ARTICLE)
  assert.equal(assignment.sections.length, 9)
  const topics = assignment.sections.flatMap(section => section.topics)
  assert.equal(topics.length, 33)
  assert.equal(new Set(topics.map(topic => topic.id)).size, 33)
  assert.equal(topics.filter(topic => topic.diagramId).length, 19)
  assert.equal(topics.filter(topic => topic.staticReason).length, 14)
  assert.equal(before.assignmentCurrent, true)
  f.json(MOE_EVIDENCE_PATH, f.evidence(MOE_ARTICLE))
  const source = readFileSync(path.join(f.root, MOE_ARTICLE), 'utf8')
  assert.ok(source.includes('### この理解が効く場面'))
  f.write(MOE_ARTICLE, source.replace('### この理解が効く場面', '### この理解が効く場面\n\n利用上の説明を更新。'))
  const changed = f.report(MOE_ARTICLE)
  assert.notEqual(changed.inputDigest, before.inputDigest)
  assert.equal(changed.diagramsCurrent, true)
  assert.equal(changed.complete, false)
  f.write(MOE_ARTICLE, source)
  for (const mutate of [
    entry => entry.sections.pop(),
    entry => entry.sections[3].topics.pop(),
    entry => entry.sections[3].topics[0].staticReason = '',
    entry => entry.sections[1].topics[0].stages = [8],
    entry => entry.sections[4].topics[0].stages = [6],
    entry => entry.sections[4].topics[0].diagramId = 'transformer-io',
    entry => entry.sections[0].topics.push(entry.sections[0].topics[0])
  ]) {
    const manifest = f.manifest()
    mutate(manifest.articles.find(entry => entry.article === MOE_ARTICLE))
    f.json(manifestPath, manifest)
    f.json(MOE_EVIDENCE_PATH, f.evidence(MOE_ARTICLE))
    assert.equal(f.report(MOE_ARTICLE).assignmentCurrent, false)
    assert.equal(f.report(MOE_ARTICLE).complete, false)
    assert.equal(f.report().assignmentCurrent, true)
    assert.equal(f.report(ATTENTION_VARIANTS_ARTICLE).assignmentCurrent, true)
  }
})

test('every MoE-specific runtime input is required and isolated from the two earlier articles', t => {
  const f = trackedArticlesFixture(t), before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  f.json(MOE_EVIDENCE_PATH, f.evidence(MOE_ARTICLE))
  const specific = MOE_INPUT_FILES.filter(file => !ARTICLE_INPUT_FILES.includes(file) && !ATTENTION_VARIANTS_INPUT_FILES.includes(file))
  assert.equal(specific.length, 7)
  for (const file of specific) {
    const source = readFileSync(path.join(f.root, file), 'utf8')
    f.write(file, source + '\n// Changed MoE runtime input\n')
    assert.notEqual(f.report(MOE_ARTICLE).inputDigest, before.get(MOE_ARTICLE), file)
    assert.equal(f.report(MOE_ARTICLE).complete, false, file)
    for (const other of [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE]) assert.equal(f.report(other).inputDigest, before.get(other), file)
    f.write(file, source)
  }
  rmSync(path.join(f.root, 'website/components/diagrams/moe-parameters.css'))
  assert.equal(f.report(MOE_ARTICLE).inputDigest, null)
  assert.equal(f.report(MOE_ARTICLE).complete, false)
  for (const other of [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE]) assert.equal(f.report(other).inputDigest, before.get(other))
})

test('both PR54 historical article snapshots remain records and cannot approve changed shared inputs', t => {
  const f = trackedArticlesFixture(t)
  const snapshots = new Map()
  for (const article of [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE]) {
    const config = getDiagramArticleConfig(article), evidence = f.evidence(article)
    f.json(config.evidencePath, evidence)
    const snapshot = config.evidencePath.replace('.json', '-pr54.json')
    f.json(snapshot, evidence)
    snapshots.set(snapshot, readFileSync(path.join(f.root, snapshot), 'utf8'))
    assert.equal(f.report(article).complete, true)
  }
  f.write('website/lib/diagram-decoration.mjs', originals.get('website/lib/diagram-decoration.mjs') + '\n// New shared MoE integration\n')
  for (const article of [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE]) {
    assert.equal(f.report(article).reviewRecorded, false)
    assert.equal(f.report(article).localRecorded, false)
    assert.equal(f.report(article).publicRecorded, false)
    assert.equal(f.report(article).complete, false)
  }
  for (const [snapshot, content] of snapshots) assert.equal(readFileSync(path.join(f.root, snapshot), 'utf8'), content)
})

const foundationsCases = [
  { article: GENERATION_ARTICLE, evidencePath: GENERATION_EVIDENCE_PATH, files: GENERATION_INPUT_FILES,
    id: 'generation-token-loop', count: 31, dynamic: 16, stageCount: 8, slug: 'how-llms-generate-text' },
  { article: TOKENIZATION_ARTICLE, evidencePath: TOKENIZATION_EVIDENCE_PATH, files: TOKENIZATION_INPUT_FILES,
    id: 'tokenization-counting', count: 27, dynamic: 15, stageCount: 7, slug: 'tokenization' }
]

test('foundations assign all sixteen headings and 58 topics without inferring completed gates', t => {
  const f = trackedArticlesFixture(t)
  for (const item of foundationsCases) {
    const config = getDiagramArticleConfig(item.article)
    assert.equal(Object.keys(config.topics).length, 8)
    assert.equal(Object.values(config.topics).flat().length, item.count)
    assert.deepEqual(config.primaryDiagramIds, [item.id])
    assert.deepEqual(config.inputFiles, item.files)
    assert.equal(config.evidencePath, item.evidencePath)
    const assignment = f.manifest().articles.find(entry => entry.article === item.article)
    const topics = assignment.sections.flatMap(section => section.topics)
    assert.equal(topics.length, item.count)
    assert.equal(new Set(topics.map(topic => topic.id)).size, item.count)
    assert.equal(topics.filter(topic => topic.diagramId).length, item.dynamic)
    assert.equal(topics.filter(topic => topic.staticReason).length, item.count - item.dynamic)
    assert.equal(f.report(item.article).assignmentCurrent, true)
    f.json(item.evidencePath, { schemaVersion: 1, article: item.article, review: null, local: null, public: null })
    assert.equal(f.report(item.article).reviewRecorded, false)
    assert.equal(f.report(item.article).localRecorded, false)
    assert.equal(f.report(item.article).publicRecorded, false)
    assert.equal(f.report(item.article).complete, false)
    for (const mutate of [
      entry => entry.sections.pop(),
      entry => entry.sections.reverse(),
      entry => entry.sections[0].topics.pop(),
      entry => entry.sections[0].topics.reverse(),
      entry => entry.sections[0].topics.push(entry.sections[0].topics[0]),
      entry => entry.sections[0].topics[0].stages = [item.stageCount],
      entry => entry.sections[0].topics[0].diagramId = 'transformer-io',
      entry => entry.sections.at(-1).topics[0].staticReason = ''
    ]) {
      const manifest = f.manifest()
      mutate(manifest.articles.find(entry => entry.article === item.article))
      f.json(manifestPath, manifest)
      f.json(item.evidencePath, f.evidence(item.article))
      assert.equal(f.report(item.article).assignmentCurrent, false)
      assert.equal(f.report(item.article).complete, false)
      for (const other of TRACKED_ARTICLES.filter(article => article !== item.article)) assert.equal(f.report(other).assignmentCurrent, true)
    }
    f.json(manifestPath, f.manifest())
    f.json(item.evidencePath, f.evidence(item.article))
    assert.equal(f.report(item.article).complete, true)
    const entry = f.registry.diagrams.find(entry => entry.id === item.id)
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.equal(f.report(item.article).diagramsCurrent, false)
    assert.equal(f.report(item.article).complete, false)
  }
})

test('foundations overrides follow their llm-foundations category and detect creation, updates and removal', t => {
  const f = trackedArticlesFixture(t)
  const before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  for (const item of foundationsCases) {
    const expected = ['md', 'mdx'].map(extension => `website/content-src/llm-foundations/${item.slug}.${extension}`)
    assert.deepEqual(getDiagramArticleConfig(item.article).optionalInputs, expected)
    for (const file of expected) {
      f.json(item.evidencePath, f.evidence(item.article))
      assert.equal(f.report(item.article).complete, true)
      f.write(file, '# Content override\n')
      const created = f.report(item.article).inputDigest
      assert.notEqual(created, before.get(item.article))
      assert.equal(f.report(item.article).complete, false)
      for (const other of TRACKED_ARTICLES.filter(article => article !== item.article)) assert.equal(f.report(other).inputDigest, before.get(other))
      f.write(file, '# Changed override\n')
      const updated = f.report(item.article).inputDigest
      assert.notEqual(updated, created)
      f.json(item.evidencePath, f.evidence(item.article))
      rmSync(path.join(f.root, file))
      assert.equal(f.report(item.article).inputDigest, before.get(item.article))
      assert.equal(f.report(item.article).complete, false) // removal invalidates the updated override's evidence
    }
    f.write(`website/content-src/llm-internals/${item.slug}.mdx`, '# Wrong category, not an override\n')
    assert.equal(f.report(item.article).inputDigest, before.get(item.article))
  }
  for (const article of [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE]) {
    assert.deepEqual(getDiagramArticleConfig(article).optionalInputs,
      ['md', 'mdx'].map(extension => `website/content-src/llm-internals/${path.basename(article, '.md')}.${extension}`))
  }
})

test('foundations runtime dependencies isolate models and scenes but include both statically imported stylesheets', t => {
  const f = trackedArticlesFixture(t), before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  const specific = [...new Set([...GENERATION_INPUT_FILES, ...TOKENIZATION_INPUT_FILES])].filter(file => !ARTICLE_INPUT_FILES.includes(file))
  assert.equal(specific.length, 7)
  for (const item of foundationsCases) f.json(item.evidencePath, f.evidence(item.article))
  for (const file of specific) {
    const source = readFileSync(path.join(f.root, file), 'utf8')
    f.write(file, source + '\n// Changed runtime input\n')
    for (const article of TRACKED_ARTICLES) {
      const consumes = getDiagramArticleConfig(article).inputFiles.includes(file)
      if (consumes) {
        assert.notEqual(f.report(article).inputDigest, before.get(article), file)
        assert.equal(f.report(article).complete, false)
      } else assert.equal(f.report(article).inputDigest, before.get(article), file)
    }
    rmSync(path.join(f.root, file))
    for (const item of foundationsCases) {
      if (item.files.includes(file)) {
        assert.equal(f.report(item.article).inputDigest, null, file)
        assert.equal(f.report(item.article).complete, false)
      } else assert.equal(f.report(item.article).inputDigest, before.get(item.article), file)
    }
    f.write(file, source)
  }
  for (const item of foundationsCases) {
    assert.ok(item.files.includes('website/components/diagrams/generation.css'))
    assert.ok(item.files.includes('website/components/diagrams/tokenization.css'))
  }
  assert.equal(GENERATION_INPUT_FILES.includes('website/lib/tokenization-model.mjs'), false)
  assert.equal(TOKENIZATION_INPUT_FILES.includes('website/lib/generation-model.mjs'), false)
})

test('unwrapped foundations prose remains in article acceptance even when the figure source is current', t => {
  const f = trackedArticlesFixture(t)
  for (const item of foundationsCases) {
    const source = readFileSync(path.join(f.root, item.article), 'utf8'), before = f.report(item.article)
    f.json(item.evidencePath, f.evidence(item.article))
    const changed = source.replace('### この理解が効く場面', '### この理解が効く場面\n\n利用上の説明を更新。')
    assert.notEqual(changed, source)
    f.write(item.article, changed)
    assert.notEqual(f.report(item.article).inputDigest, before.inputDigest)
    assert.equal(f.report(item.article).diagramsCurrent, true)
    assert.equal(f.report(item.article).complete, false)
    f.write(item.article, source)
  }
})

test('PR55 snapshots for the three earlier articles never approve a later shared integration', t => {
  const f = trackedArticlesFixture(t), snapshots = new Map()
  const earlier = [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE]
  for (const article of earlier) {
    const config = getDiagramArticleConfig(article), evidence = f.evidence(article)
    f.json(config.evidencePath, evidence)
    const snapshot = config.evidencePath.replace('.json', '-pr55.json')
    f.json(snapshot, evidence)
    snapshots.set(snapshot, readFileSync(path.join(f.root, snapshot), 'utf8'))
    assert.equal(f.report(article).complete, true)
  }
  f.write('website/lib/mdx-safety.mjs', originals.get('website/lib/mdx-safety.mjs') + '\n// New shared foundations integration\n')
  for (const article of earlier) {
    assert.equal(f.report(article).reviewRecorded, false)
    assert.equal(f.report(article).localRecorded, false)
    assert.equal(f.report(article).publicRecorded, false)
    assert.equal(f.report(article).complete, false)
  }
  for (const [snapshot, content] of snapshots) assert.equal(readFileSync(path.join(f.root, snapshot), 'utf8'), content)
})

test('inference assigns all 9 H3 and 49 topics, with a reading-reachable stage for every dynamic conclusion', t => {
  const f = trackedArticlesFixture(t), config = getDiagramArticleConfig(INFERENCE_ARTICLE)
  const ids = ['inference-sampling', 'inference-cache-batching', 'inference-speculative', 'inference-quantization']
  assert.deepEqual(config.primaryDiagramIds, ids)
  assert.equal(Object.keys(config.topics).length, 9)
  assert.equal(Object.values(config.topics).flat().length, 49)
  assert.equal(config.evidencePath, INFERENCE_EVIDENCE_PATH)
  assert.deepEqual(config.inputFiles, INFERENCE_INPUT_FILES)
  assert.equal(new Set(INFERENCE_INPUT_FILES).size, 54)
  const assignment = f.manifest().articles.find(entry => entry.article === INFERENCE_ARTICLE)
  const topics = assignment.sections.flatMap(section => section.topics)
  assert.equal(topics.length, 49)
  assert.equal(topics.filter(topic => topic.diagramId).length, 36)
  assert.equal(topics.filter(topic => topic.staticReason).length, 13)
  for (const topic of topics.filter(topic => topic.diagramId)) {
    const diagram = f.registry.diagrams.find(entry => entry.id === topic.diagramId)
    const readingStages = diagram.blockGroups.flat().map(group => group.stage)
    assert.ok(topic.stages.some(stage => readingStages.includes(stage)), topic.id)
  }
  assert.equal(f.report(INFERENCE_ARTICLE).assignmentCurrent, true)
  f.json(INFERENCE_EVIDENCE_PATH, { schemaVersion: 1, article: INFERENCE_ARTICLE, review: null, local: null, public: null })
  assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
  for (const mutate of [
    a => a.sections.pop(), a => a.sections.reverse(), a => a.sections[0].topics.pop(),
    a => a.sections[0].topics.push(a.sections[0].topics[0]), a => a.primaryDiagramIds.pop(),
    a => a.sections[0].topics[0].stages = [6], a => a.sections[0].topics[0].diagramId = 'generation-token-loop',
    a => a.sections.at(-1).topics[0].staticReason = ''
  ]) {
    const manifest = f.manifest()
    mutate(manifest.articles.find(entry => entry.article === INFERENCE_ARTICLE))
    f.json(manifestPath, manifest)
    f.json(INFERENCE_EVIDENCE_PATH, f.evidence(INFERENCE_ARTICLE))
    assert.equal(f.report(INFERENCE_ARTICLE).assignmentCurrent, false, String(mutate))
    assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
  }
  f.json(manifestPath, f.manifest())
  for (const id of ids) {
    const entry = f.registry.diagrams.find(entry => entry.id === id), saved = structuredClone(entry)
    for (const changes of [
      { enabled: false, status: 'draft', reviewedDigest: null },
      { status: 'implemented', reviewedDigest: null },
      { sourceDigest: 'sha256:' + '0'.repeat(64), reviewedDigest: 'sha256:' + '0'.repeat(64) }
    ]) {
      Object.assign(entry, saved, changes)
      f.json(INFERENCE_EVIDENCE_PATH, f.evidence(INFERENCE_ARTICLE))
      assert.equal(f.report(INFERENCE_ARTICLE).diagramsCurrent, false, id)
      assert.equal(f.report(INFERENCE_ARTICLE).complete, false, id)
    }
    Object.assign(entry, saved)
  }
})

test('all inference runtime files fail closed when missing; generation-model is shared with generation only', t => {
  const f = trackedArticlesFixture(t), before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  const specific = INFERENCE_INPUT_FILES.filter(file => !ARTICLE_INPUT_FILES.includes(file))
  assert.equal(specific.length, 14)
  for (const article of TRACKED_ARTICLES) f.json(getDiagramArticleConfig(article).evidencePath, f.evidence(article))
  for (const file of specific) {
    const source = readFileSync(path.join(f.root, file), 'utf8')
    f.write(file, source + '\n// Changed inference input\n')
    for (const article of TRACKED_ARTICLES) {
      const consumes = getDiagramArticleConfig(article).inputFiles.includes(file)
      assert.equal(f.report(article).inputDigest !== before.get(article), consumes, file + ': ' + article)
      assert.equal(f.report(article).complete, !consumes, file + ': ' + article)
    }
    rmSync(path.join(f.root, file))
    assert.equal(f.report(INFERENCE_ARTICLE).inputDigest, null, file)
    assert.equal(f.report(INFERENCE_ARTICLE).complete, false, file)
    f.write(file, source)
  }
  assert.ok(GENERATION_INPUT_FILES.includes('website/lib/generation-model.mjs'))
  assert.equal(TOKENIZATION_INPUT_FILES.includes('website/lib/generation-model.mjs'), false)
  for (const file of ['website/public/favicon.svg', 'website/app/layout.jsx']) {
    for (const article of TRACKED_ARTICLES) assert.ok(getDiagramArticleConfig(article).inputFiles.includes(file))
    const source = readFileSync(path.join(f.root, file), 'utf8')
    f.write(file, source + '\n<!-- Changed shared icon input -->\n')
    for (const article of TRACKED_ARTICLES) {
      assert.notEqual(f.report(article).inputDigest, before.get(article))
      assert.equal(f.report(article).complete, false)
    }
    f.write(file, source)
  }
})

test('inference whole-source and optional overrides invalidate evidence beyond the wrapped sections', t => {
  const f = trackedArticlesFixture(t), before = f.report(INFERENCE_ARTICLE).inputDigest
  const optional = ['md', 'mdx'].map(extension => `website/content-src/llm-internals/inference-internals.${extension}`)
  assert.deepEqual(getDiagramArticleConfig(INFERENCE_ARTICLE).optionalInputs, optional)
  for (const file of optional) {
    f.json(INFERENCE_EVIDENCE_PATH, f.evidence(INFERENCE_ARTICLE))
    f.write(file, '# Content override\n')
    assert.notEqual(f.report(INFERENCE_ARTICLE).inputDigest, before)
    assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
    f.json(INFERENCE_EVIDENCE_PATH, f.evidence(INFERENCE_ARTICLE))
    rmSync(path.join(f.root, file))
    assert.equal(f.report(INFERENCE_ARTICLE).inputDigest, before)
    assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
  }
  f.json(INFERENCE_EVIDENCE_PATH, f.evidence(INFERENCE_ARTICLE))
  const source = readFileSync(path.join(f.root, INFERENCE_ARTICLE), 'utf8')
  f.write(INFERENCE_ARTICLE, source.replace('### この理解が効く場面', '### この理解が効く場面\n\n用途の説明を更新。'))
  assert.notEqual(f.report(INFERENCE_ARTICLE).inputDigest, before)
  assert.equal(f.report(INFERENCE_ARTICLE).diagramsCurrent, true)
  assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
})

test('five historical PR56 snapshots cannot approve changed shared code or be reused as inference evidence', t => {
  const f = trackedArticlesFixture(t), snapshots = new Map()
  const earlier = [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE, GENERATION_ARTICLE, TOKENIZATION_ARTICLE]
  assert.equal(earlier.length, 5)
  for (const article of earlier) {
    const config = getDiagramArticleConfig(article), evidence = f.evidence(article)
    f.json(config.evidencePath, evidence)
    const snapshot = config.evidencePath.replace('.json', '-pr56.json')
    f.json(snapshot, evidence)
    snapshots.set(snapshot, readFileSync(path.join(f.root, snapshot), 'utf8'))
    assert.equal(f.report(article).complete, true)
    f.json(INFERENCE_EVIDENCE_PATH, evidence)
    assert.equal(f.report(INFERENCE_ARTICLE).complete, false)
  }
  f.write('website/lib/diagram-decoration.mjs', originals.get('website/lib/diagram-decoration.mjs') + '\n// New inference integration\n')
  for (const article of earlier) {
    const result = f.report(article)
    assert.equal(result.reviewRecorded, false)
    assert.equal(result.localRecorded, false)
    assert.equal(result.publicRecorded, false)
    assert.equal(result.complete, false)
  }
  for (const [snapshot, content] of snapshots) assert.equal(readFileSync(path.join(f.root, snapshot), 'utf8'), content)
})

test('training assigns all eight H3 and 34 topics while all three article gates remain independently required', t => {
  const f = trackedArticlesFixture(t), config = getDiagramArticleConfig(TRAINING_ARTICLE)
  const ids = ['training-stages', 'training-runtime-boundary']
  assert.deepEqual(config.primaryDiagramIds, ids)
  assert.equal(Object.keys(config.topics).length, 8)
  assert.equal(Object.values(config.topics).flat().length, 34)
  assert.equal(config.evidencePath, TRAINING_EVIDENCE_PATH)
  assert.deepEqual(config.inputFiles, TRAINING_INPUT_FILES)
  assert.equal(TRAINING_INPUT_FILES.length, 47)
  assert.equal(new Set(TRAINING_INPUT_FILES).size, 47)
  const assignment = f.manifest().articles.find(entry => entry.article === TRAINING_ARTICLE)
  const topics = assignment.sections.flatMap(section => section.topics)
  assert.equal(topics.length, 34)
  assert.equal(topics.filter(topic => topic.diagramId).length, 21)
  assert.equal(topics.filter(topic => topic.staticReason).length, 13)
  for (const topic of topics.filter(topic => topic.diagramId)) {
    const diagram = f.registry.diagrams.find(entry => entry.id === topic.diagramId)
    const readingStages = diagram.blockGroups.flat().map(group => group.stage)
    assert.ok(topic.stages.some(stage => readingStages.includes(stage)), topic.id)
  }
  assert.equal(f.report(TRAINING_ARTICLE).assignmentCurrent, true)
  f.json(TRAINING_EVIDENCE_PATH, { schemaVersion: 1, article: TRAINING_ARTICLE, review: null, local: null, public: null })
  for (const kind of ['review', 'local', 'public']) {
    const evidence = f.evidence(TRAINING_ARTICLE)
    evidence[kind] = null
    f.json(TRAINING_EVIDENCE_PATH, evidence)
    assert.equal(f.report(TRAINING_ARTICLE)[`${kind}Recorded`], false)
    assert.equal(f.report(TRAINING_ARTICLE).complete, false)
  }
  for (const mutate of [
    a => a.sections.pop(), a => a.sections.reverse(), a => a.sections[0].topics.pop(),
    a => a.sections[0].topics.push(a.sections[0].topics[0]), a => a.primaryDiagramIds.pop(),
    a => a.sections[0].topics[0].stages = [6], a => a.sections[0].topics[0].diagramId = 'generation-token-loop',
    a => a.sections.at(-1).topics[0].staticReason = '',
    a => a.sections.at(-1).topics[0].relatedRead = [{ diagramId: 'training-stages', stage: 2 }]
  ]) {
    const manifest = f.manifest()
    mutate(manifest.articles.find(entry => entry.article === TRAINING_ARTICLE))
    f.json(manifestPath, manifest)
    f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
    assert.equal(f.report(TRAINING_ARTICLE).assignmentCurrent, false, String(mutate))
    assert.equal(f.report(TRAINING_ARTICLE).complete, false)
  }
  f.json(manifestPath, f.manifest())
  for (const id of ids) {
    const entry = f.registry.diagrams.find(entry => entry.id === id), saved = structuredClone(entry)
    for (const changes of [
      { enabled: false, status: 'draft', reviewedDigest: null },
      { status: 'implemented', reviewedDigest: null },
      { sourceDigest: 'sha256:' + '0'.repeat(64), reviewedDigest: 'sha256:' + '0'.repeat(64) }
    ]) {
      Object.assign(entry, saved, changes)
      f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
      assert.equal(f.report(TRAINING_ARTICLE).diagramsCurrent, false, id)
      assert.equal(f.report(TRAINING_ARTICLE).complete, false, id)
    }
    Object.assign(entry, saved)
  }
})

test('training topics cannot rely only on a manual-only stage', t => {
  const f = trackedArticlesFixture(t)
  assert.equal(getDiagramArticleConfig(TRAINING_ARTICLE).requireReadingStage, true)
  for (const [stages, accepted] of [[[1], false], [[1, 2], true], [[0], true]]) {
    const manifest = f.manifest()
    const topic = manifest.articles.find(entry => entry.article === TRAINING_ARTICLE).sections
      .flatMap(section => section.topics).find(topic => topic.id === 'training-association-not-cause')
    topic.diagramId = 'training-runtime-boundary'
    topic.stages = stages
    f.json(manifestPath, manifest)
    f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
    const report = f.report(TRAINING_ARTICLE)
    assert.equal(report.assignmentCurrent, accepted, JSON.stringify(stages))
    assert.equal(report.complete, accepted, JSON.stringify(stages))
    if (!accepted) assert.ok(report.reasons.some(reason => reason.includes('本文連動')))
  }
})

test('all seven training runtime inputs fail closed and stay isolated from the six previous articles', t => {
  const f = trackedArticlesFixture(t), before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  const specific = TRAINING_INPUT_FILES.filter(file => !ARTICLE_INPUT_FILES.includes(file))
  assert.equal(specific.length, 7)
  assert.ok(specific.includes('website/components/diagrams/training-walkthrough.jsx'))
  for (const id of ['training-stages', 'training-runtime-boundary']) {
    for (const file of [`website/components/diagrams/${id}-walkthrough.jsx`, `website/components/diagrams/${id}.css`, `website/lib/${id}-model.mjs`]) {
      assert.ok(specific.includes(file), file)
    }
  }
  for (const article of TRACKED_ARTICLES) f.json(getDiagramArticleConfig(article).evidencePath, f.evidence(article))
  for (const file of specific) {
    const source = readFileSync(path.join(f.root, file), 'utf8')
    f.write(file, source + '\n// Changed training input\n')
    for (const article of TRACKED_ARTICLES) {
      assert.equal(f.report(article).inputDigest !== before.get(article), article === TRAINING_ARTICLE, file + ': ' + article)
      assert.equal(f.report(article).complete, article !== TRAINING_ARTICLE, file + ': ' + article)
    }
    rmSync(path.join(f.root, file))
    assert.equal(f.report(TRAINING_ARTICLE).inputDigest, null, file)
    assert.equal(f.report(TRAINING_ARTICLE).complete, false, file)
    f.write(file, source)
  }
})

test('training optional overrides and unwrapped checklist invalidate whole-article evidence', t => {
  const f = trackedArticlesFixture(t), before = new Map(TRACKED_ARTICLES.map(article => [article, f.report(article).inputDigest]))
  const optional = ['md', 'mdx'].map(extension => `website/content-src/llm-foundations/llm-training-pipeline.${extension}`)
  assert.deepEqual(getDiagramArticleConfig(TRAINING_ARTICLE).optionalInputs, optional)
  for (const file of optional) {
    f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
    f.write(file, '# Content override\n')
    assert.notEqual(f.report(TRAINING_ARTICLE).inputDigest, before.get(TRAINING_ARTICLE))
    assert.equal(f.report(TRAINING_ARTICLE).complete, false)
    for (const article of TRACKED_ARTICLES.filter(value => value !== TRAINING_ARTICLE)) assert.equal(f.report(article).inputDigest, before.get(article))
    f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
    rmSync(path.join(f.root, file))
    assert.equal(f.report(TRAINING_ARTICLE).inputDigest, before.get(TRAINING_ARTICLE))
    assert.equal(f.report(TRAINING_ARTICLE).complete, false)
  }
  f.json(TRAINING_EVIDENCE_PATH, f.evidence(TRAINING_ARTICLE))
  const source = readFileSync(path.join(f.root, TRAINING_ARTICLE), 'utf8')
  f.write(TRAINING_ARTICLE, source.replace('### チェックリスト', '### チェックリスト\n\n確認事項を更新。'))
  assert.notEqual(f.report(TRAINING_ARTICLE).inputDigest, before.get(TRAINING_ARTICLE))
  assert.equal(f.report(TRAINING_ARTICLE).diagramsCurrent, true)
  assert.equal(f.report(TRAINING_ARTICLE).complete, false)
})

test('the six PR58 historical article snapshots cannot approve a later shared training integration', t => {
  const f = trackedArticlesFixture(t), snapshots = new Map()
  const earlier = [TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE, GENERATION_ARTICLE, TOKENIZATION_ARTICLE, INFERENCE_ARTICLE]
  for (const article of earlier) {
    const config = getDiagramArticleConfig(article), evidence = f.evidence(article)
    f.json(config.evidencePath, evidence)
    const snapshot = config.evidencePath.replace('.json', '-pr58.json')
    f.json(snapshot, evidence)
    snapshots.set(snapshot, readFileSync(path.join(f.root, snapshot), 'utf8'))
    assert.equal(f.report(article).complete, true)
    f.json(TRAINING_EVIDENCE_PATH, evidence)
    assert.equal(f.report(TRAINING_ARTICLE).complete, false)
  }
  f.write('website/lib/diagram-decoration.mjs', originals.get('website/lib/diagram-decoration.mjs') + '\n// New training integration\n')
  for (const article of earlier) {
    const result = f.report(article)
    assert.equal(result.reviewRecorded, false)
    assert.equal(result.localRecorded, false)
    assert.equal(result.publicRecorded, false)
    assert.equal(result.complete, false)
  }
  for (const [snapshot, content] of snapshots) assert.equal(readFileSync(path.join(f.root, snapshot), 'utf8'), content)
})
