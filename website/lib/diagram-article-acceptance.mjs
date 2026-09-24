import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { assertDiagramSource, diagramRegistry, validateDiagramRegistry } from './diagram-registry.mjs'

export const TRANSFORMER_ARTICLE = 'docs/11-llm-internals/transformer-architecture.md'
export const ARTICLE_EVIDENCE_PATH = 'project/records/2026-09-24/transformer-article-acceptance.json'
const MANIFEST = 'website/diagrams/articles.json'
const PRIMARY = ['transformer-io', 'transformer-position', 'self-attention', 'transformer-block']
const TOPICS = {
  '概要: デコーダ専用 Transformer の全体像': ['decoder-flow', 'overview-and-notation'],
  '埋め込みと出力ヘッド': ['embedding-lookup', 'output-projection', 'weight-tying', 'learning-and-softmax'],
  '位置符号化: 順序をどう入れるか': ['absolute-position', 'relative-position', 'rope-rotation', 'relative-offset', 'extrapolation-limits'],
  '自己注意の数式': ['qkv-projection', 'scaled-scores', 'causal-mask', 'row-softmax', 'weighted-values', 'quadratic-shape'],
  '多頭注意': ['head-projections', 'concatenation-projection', 'head-roles-and-variants'],
  'FFN と残差ストリーム': ['positionwise-ffn', 'swiglu', 'residual-addition', 'gradient-path'],
  '正規化と学習安定性': ['rmsnorm', 'pre-post', 'norm-stability'],
  'パラメータの内訳': ['layer-count', 'model-count', 'estimate-limits'],
  'この理解が効く場面': ['practical-uses'],
  'アンチパターン': ['pitfalls'],
  'チェックリスト': ['understanding-check']
}

// Explicit, code-owned paths. Shared rendering/generation changes conservatively
// invalidate acceptance. Evidence, project records, generated output and commit
// IDs are excluded; recording a later deployment cannot change its input digest.
export const ARTICLE_INPUT_FILES = Object.freeze([
  'components/attention/attention-walkthrough.jsx', 'components/attention/attention.css', 'lib/attention-model.mjs',
  'components/diagrams/diagram-entry.jsx', 'components/diagrams/diagram-boundary.jsx',
  'components/diagrams/reading-figure.jsx', 'components/diagrams/reading-figure.css',
  'components/diagrams/reading-step.jsx', 'components/diagrams/reading-article-navigation.jsx', 'lib/reading-clock.mjs',
  'components/diagrams/transformer-walkthrough.jsx', 'components/diagrams/transformer-scenes.css',
  'components/diagrams/transformer-io-walkthrough.jsx', 'components/diagrams/transformer-io.css', 'lib/transformer-io-model.mjs',
  'components/diagrams/transformer-position-walkthrough.jsx', 'components/diagrams/transformer-position.css', 'lib/transformer-position-model.mjs',
  'components/diagrams/transformer-block-walkthrough.jsx', 'lib/transformer-block-model.mjs',
  'components/diagrams/concept-scene-primitives.jsx', 'components/diagrams/concept-scenes.css',
  'components/mdx/mermaid.jsx', 'lib/mermaid-render.mjs',
  'components/mdx/checklist-box.jsx', 'components/mdx/doc-meta.jsx', 'components/mdx/glossary-term.jsx',
  'components/mdx/practice-section.jsx', 'components/mdx/todo-callout.jsx',
  'components/audio/article-audio.jsx', 'components/audio/audio-provider.jsx', 'components/audio/audio-player.jsx',
  'components/audio/queue-list.jsx', 'components/audio/audio.css', 'lib/audio-player.mjs', 'lib/audio-catalog.mjs',
  'lib/diagram-registry.mjs', 'lib/diagram-decoration.mjs', 'lib/attention-decoration.mjs',
  'lib/doc-decorations.mjs', 'lib/mdx-safety.mjs', 'lib/markdown-routes.mjs', 'scripts/sync-content.mjs',
  'lib/diagram-article-acceptance.mjs', 'mdx-components.js', 'app/docs/[[...mdxPath]]/page.jsx',
  'app/layout.jsx', 'app/docs.css', 'next.config.mjs', 'package.json', 'package-lock.json'
].map(file => `website/${file}`).concat('scripts/lib/md-utils.mjs'))
const OPTIONAL_INPUTS = ['md', 'mdx'].map(extension => `website/content-src/llm-internals/transformer-architecture.${extension}`)
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))
const exact = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key))
const nonempty = value => typeof value === 'string' && value.trim().length > 0
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const text = node => node.value ?? (node.children ?? []).map(text).join('')
const normalize = value => typeof value === 'string' ? value.replace(/\r\n?/g, '\n') : Array.isArray(value) ? value.map(normalize)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).filter(key => key !== 'position').sort().map(key => [key, normalize(value[key])])) : value
const hash = value => `sha256:${createHash('sha256').update(value).digest('hex')}`
const read = (root, file) => readFileSync(path.join(root, file), 'utf8')

function validateAssignment(assignment, tree, selected) {
  if (!exact(assignment, ['article', 'primaryDiagramIds', 'sections']) || assignment.article !== TRANSFORMER_ARTICLE
    || !same(assignment.primaryDiagramIds, PRIMARY) || !Array.isArray(assignment.sections)
    || !same(assignment.sections.map(section => section.heading), Object.keys(TOPICS))
    || !same(tree.children.filter(node => node.type === 'heading' && node.depth === 3).map(text), Object.keys(TOPICS))) throw new Error('11 H3と必須図の対応が不正です。')
  const used = new Set()
  for (const section of assignment.sections) {
    if (!exact(section, ['heading', 'topics']) || !Array.isArray(section.topics)
      || !same(section.topics.map(topic => topic.id), TOPICS[section.heading])) throw new Error('主要論点の割当が不足・重複しています。')
    for (const topic of section.topics) {
      if (!nonempty(topic.label)) throw new Error('論点の説明が必要です。')
      if (Object.hasOwn(topic, 'staticReason')) {
        if (!exact(topic, ['id', 'label', 'staticReason']) || !nonempty(topic.staticReason)) throw new Error('本文のみで扱う理由が必要です。')
      } else {
        const entry = selected.find(entry => entry.id === topic.diagramId)
        if (!exact(topic, ['id', 'label', 'diagramId', 'stages']) || !entry || !Array.isArray(topic.stages) || !topic.stages.length
          || new Set(topic.stages).size !== topic.stages.length || topic.stages.some(stage => !Number.isInteger(stage) || stage < 0 || stage >= entry.stageCount)) throw new Error('論点の図・段階の対応が不正です。')
        used.add(entry.id)
      }
    }
  }
  if (PRIMARY.some(id => !used.has(id))) throw new Error('必須の主図が本文の論点に対応していません。')
}

function recordExists(root, value) {
  if (typeof value !== 'string' || /[\\%?\u0000-\u001f]/.test(value)) return false
  const file = value.split('#')[0]
  if (!file.startsWith('project/records/') || !/\.(md|json)$/.test(file) || file.split('/').some(part => !part || part === '.' || part === '..')) return false
  try {
    const base = realpathSync(path.join(root, 'project/records')) + path.sep
    const actual = realpathSync(path.join(root, file))
    return actual.startsWith(base) && statSync(actual).isFile()
  } catch { return false }
}
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false
  return new Date(value.slice(0, 10) + 'T00:00:00Z').toISOString().slice(0, 10) === value.slice(0, 10)
}
const runUrl = value => typeof value === 'string' && /^https:\/\/github\.com\/pero3dev\/ai-agent-library\/actions\/runs\/[1-9]\d*(?:\/(?:attempts|job)\/[1-9]\d*)?$/.test(value)
function acceptedGate(gate, kind, inputDigest, root) {
  const extra = kind === 'review' ? ['independent', 'record'] : kind === 'local' ? ['record'] : ['commit', 'ci', 'pages', 'browserRecord']
  return exact(gate, ['inputDigest', 'status', 'checkedAt', ...extra]) && gate.inputDigest === inputDigest
    && gate.status === (kind === 'review' ? 'approved' : 'passed') && validDate(gate.checkedAt)
    && (kind === 'review' ? gate.independent === true && recordExists(root, gate.record)
      : kind === 'local' ? recordExists(root, gate.record)
        : typeof gate.commit === 'string' && /^[a-f0-9]{40}$/.test(gate.commit) && runUrl(gate.ci) && runUrl(gate.pages) && recordExists(root, gate.browserRecord))
}

/** Offline consistency only: records do not authenticate reviewers or live CI. */
export function getDiagramArticleAcceptance({ repoRoot = defaultRoot, article = TRANSFORMER_ARTICLE, registry = diagramRegistry } = {}) {
  const result = { tracked: article === TRANSFORMER_ARTICLE, inputDigest: null, assignmentCurrent: false, diagramsCurrent: false,
    reviewRecorded: false, localRecorded: false, publicRecorded: false, complete: false, reasons: [], verification: 'recorded-evidence-only' }
  if (!result.tracked) return result
  try {
    validateDiagramRegistry(registry)
    const tree = parser.parse(read(repoRoot, article)), manifest = JSON.parse(read(repoRoot, MANIFEST))
    const matches = Array.isArray(manifest.articles) ? manifest.articles.filter(entry => entry?.article === article) : []
    if (!exact(manifest, ['schemaVersion', 'articles']) || manifest.schemaVersion !== 1 || matches?.length !== 1) throw new Error('記事割当manifestが不正です。')
    const assignment = matches[0], selected = PRIMARY.map(id => registry.diagrams.find(entry => entry.id === id))
    const files = Object.fromEntries(ARTICLE_INPUT_FILES.map(file => [file, hash(normalize(read(repoRoot, file)))]))
    for (const file of OPTIONAL_INPUTS) {
      try { files[file] = hash(normalize(read(repoRoot, file))) } catch (error) { if (error.code !== 'ENOENT') throw error; files[file] = null }
    }
    result.inputDigest = hash(JSON.stringify(normalize({ article: tree, assignment, registry: selected, files })))
    try { validateAssignment(assignment, tree, selected); result.assignmentCurrent = true } catch (error) { result.reasons.push(error.message) }
    result.diagramsCurrent = selected.every(entry => {
      try { if (!entry.enabled) return false; assertDiagramSource(tree, entry); return true } catch { return false }
    })
    if (!result.diagramsCurrent) result.reasons.push('必須図の有効状態・本文版・レビュー版が揃っていません。')
    let evidence = null
    try { evidence = JSON.parse(read(repoRoot, ARTICLE_EVIDENCE_PATH)) } catch (error) { if (error.code !== 'ENOENT') result.reasons.push('受入記録を読み取れません。') }
    if (!exact(evidence, ['schemaVersion', 'article', 'review', 'local', 'public']) || evidence.schemaVersion !== 1 || evidence.article !== article) evidence = null
    for (const kind of ['review', 'local', 'public']) {
      result[`${kind}Recorded`] = Boolean(evidence && acceptedGate(evidence[kind], kind, result.inputDigest, repoRoot))
      if (!result[`${kind}Recorded`]) result.reasons.push(`${kind}: 現在の入力版に一致する受入記録がありません。`)
    }
    result.complete = result.assignmentCurrent && result.diagramsCurrent && result.reviewRecorded && result.localRecorded && result.publicRecorded
  } catch (error) { result.reasons.push(error.message) }
  return result
}
