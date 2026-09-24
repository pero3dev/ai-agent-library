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
export const ATTENTION_VARIANTS_ARTICLE = 'docs/11-llm-internals/attention-variants-and-long-context.md'
export const ATTENTION_VARIANTS_EVIDENCE_PATH = 'project/records/2026-09-24/attention-variants-article-acceptance.json'
export const MOE_ARTICLE = 'docs/11-llm-internals/mixture-of-experts-internals.md'
export const MOE_EVIDENCE_PATH = 'project/records/2026-09-24/moe-article-acceptance.json'
export const GENERATION_ARTICLE = 'docs/10-llm-foundations/how-llms-generate-text.md'
export const GENERATION_EVIDENCE_PATH = 'project/records/2026-09-24/generation-article-acceptance.json'
export const TOKENIZATION_ARTICLE = 'docs/10-llm-foundations/tokenization.md'
export const TOKENIZATION_EVIDENCE_PATH = 'project/records/2026-09-24/tokenization-article-acceptance.json'
export const TRACKED_ARTICLES = Object.freeze([TRANSFORMER_ARTICLE, ATTENTION_VARIANTS_ARTICLE, MOE_ARTICLE, GENERATION_ARTICLE, TOKENIZATION_ARTICLE])
const MANIFEST = 'website/diagrams/articles.json'
const TRANSFORMER_TOPICS = {
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
const VARIANTS_TOPICS = {
  '概要: 2 つの圧力': ['length-pressure', 'kv-factors', 'three-directions'],
  'KV キャッシュを減らす: MQA と GQA': ['mha-heads', 'gqa-sharing', 'mqa-sharing', 'sharing-tradeoff', 'latent-attention'],
  '注意を疎にする: 局所・スライディング窓・スパース': ['local-reach', 'sparse-links', 'attention-sinks', 'sparse-limits'],
  '線形注意という別路線': ['feature-map', 'associative-order', 'linear-tradeoff'],
  'FlashAttention: 厳密なまま速く': ['exact-tiling', 'online-softmax', 'memory-io'],
  '位置の対応範囲を伸ばす: 外挿と補間': ['trained-range', 'extrapolation', 'interpolation', 'frequency-adjustment', 'effective-quality'],
  'Transformer を離れる: 状態空間モデル': ['fixed-state', 'random-access-limit', 'hybrid-attention'],
  '「長コンテキスト対応」表記を読む': ['length-origin', 'quality-range', 'practical-cost', 'task-evaluation'],
  'この理解が効く場面': ['practical-uses'],
  'アンチパターン': ['pitfalls'],
  'チェックリスト': ['understanding-check']
}

const MOE_TOPICS = {
  '概要: 総パラメータと計算量を切り離す': ['dense-ffn', 'sparse-experts', 'capacity-compute-separation'],
  '疎な活性化とルーティング': ['router-softmax', 'top-k', 'weighted-sum', 'router-learning', 'choice-directions'],
  '負荷分散: 崩壊をどう防ぐか': ['routing-collapse', 'auxiliary-objective', 'capacity-drop', 'router-techniques'],
  '専門化の実態': ['nonhuman-specialization', 'fine-grained-experts', 'shared-experts'],
  '総 vs アクティブパラメータの数理': ['total-capacity', 'active-compute', 'shared-part-count', 'resident-weights', 'expert-parallel-communication'],
  '提供・運用への含意': ['vram-planning', 'throughput-overhead', 'batch-imbalance', 'model-card-two-counts'],
  'この理解が効く場面': ['model-selection-use', 'vram-design-use', 'explaining-cost-speed'],
  'アンチパターン': ['active-memory-pitfall', 'anthropomorphic-expert-pitfall', 'ignored-load-pitfall', 'ignored-communication-pitfall', 'total-intelligence-pitfall'],
  'チェックリスト': ['understanding-check']
}

const GENERATION_TOPICS = {
  '概要: たった 1 つのループ': [ 'autoregressive-cycle', 'stop-boundary', 'text-code-reasoning-unit' ],
  '次トークン予測という実体': [ 'prefix-conditioned-function', 'generated-output-conditioning', 'append-only-correction', 'caller-context-rebuild' ],
  'サンプリングと温度': [ 'greedy-selection', 'temperature-distribution', 'nucleus-prefix', 'task-parameter-intent', 'provider-parameter-constraints' ],
  '「同じ入力で違う出力」になる理由': [ 'sampling-randomness', 'implementation-variation', 'repeated-evaluation' ],
  '停止とストリーミング': [
    'natural-eos',
    'stop-sequence',
    'output-limit',
    'finish-output-validation',
    'provider-stop-reasons',
    'streaming-order',
    'output-length-cost'
  ],
  'この理解が効く場面': [ 'structured-output-use', 'evaluation-use', 'latency-cost-use', 'parameter-intent-use' ],
  'アンチパターン': [
    'deterministic-free-text-pitfall',
    'single-demo-pitfall',
    'unchecked-finish-pitfall',
    'high-temperature-classification-pitfall'
  ],
  'チェックリスト': [ 'understanding-check' ]
}

const TOKENIZATION_TOPICS = {
  '概要: トークンは LLM 世界の通貨': [ 'token-units', 'text-id-conversion', 'tokenizer-dependencies' ],
  'トークンとは何か: サブワード分割の直感': [ 'subword-boundaries', 'nonword-content', 'rare-content-fragmentation', 'tokenization-method-scope' ],
  '言語と内容による効率差': [ 'language-content-dependence', 'language-workload-cost', 'context-budget', 'prompt-language-tradeoff' ],
  'モデル間の非互換: 移行時の再見積り': [ 'model-vocabulary-change', 'migration-count-rate', 'same-capacity-different-content', 'generation-recount' ],
  '見積りと計測の実務': [ 'official-estimation', 'usage-tracing', 'history-resend', 'history-budget-options' ],
  'この理解が効く場面': [ 'cost-estimation-use', 'context-selection-use', 'migration-use' ],
  'アンチパターン': [
    'constant-character-ratio-pitfall',
    'migration-without-recount-pitfall',
    'missing-usage-pitfall',
    'cross-language-estimate-pitfall'
  ],
  'チェックリスト': [ 'understanding-check' ]
}

// Explicit, code-owned paths. Shared rendering/generation changes conservatively
// invalidate acceptance. Evidence, project records, generated output and commit
// IDs are excluded; recording a later deployment cannot change its input digest.
const SHARED_INPUT_FILES = [
  'components/diagrams/diagram-entry.jsx', 'components/diagrams/diagram-boundary.jsx',
  'components/diagrams/reading-figure.jsx', 'components/diagrams/reading-figure.css',
  'components/diagrams/reading-step.jsx', 'components/diagrams/reading-article-navigation.jsx', 'lib/reading-clock.mjs',
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
].map(file => `website/${file}`).concat('scripts/lib/md-utils.mjs')
// Article-specific scenes never enter the other article's input digest.
export const ARTICLE_INPUT_FILES = Object.freeze([...SHARED_INPUT_FILES, ...[
  'components/attention/attention-walkthrough.jsx', 'components/attention/attention.css', 'lib/attention-model.mjs',
  'components/diagrams/transformer-walkthrough.jsx', 'components/diagrams/transformer-scenes.css',
  'components/diagrams/transformer-io-walkthrough.jsx', 'components/diagrams/transformer-io.css', 'lib/transformer-io-model.mjs',
  'components/diagrams/transformer-position-walkthrough.jsx', 'components/diagrams/transformer-position.css', 'lib/transformer-position-model.mjs',
  'components/diagrams/transformer-block-walkthrough.jsx', 'lib/transformer-block-model.mjs'
].map(file => `website/${file}`)])
export const ATTENTION_VARIANTS_INPUT_FILES = Object.freeze([...SHARED_INPUT_FILES, ...[
  'components/diagrams/attention-variants-walkthrough.jsx', 'components/diagrams/attention-variants.css',
  'components/diagrams/attention-kv-walkthrough.jsx', 'components/diagrams/attention-kv.css', 'lib/attention-kv-model.mjs',
  'components/diagrams/attention-compute-walkthrough.jsx', 'lib/attention-compute-model.mjs',
  'components/diagrams/attention-context-walkthrough.jsx', 'components/diagrams/attention-context.css', 'lib/attention-context-model.mjs'
].map(file => `website/${file}`)])
export const MOE_INPUT_FILES = Object.freeze([...SHARED_INPUT_FILES, ...[
  'components/diagrams/moe-walkthrough.jsx', 'components/diagrams/moe-scenes.css',
  'components/diagrams/moe-routing-walkthrough.jsx', 'lib/moe-routing-model.mjs',
  'components/diagrams/moe-parameters-walkthrough.jsx', 'components/diagrams/moe-parameters.css', 'lib/moe-parameters-model.mjs'
].map(file => `website/${file}`)])
// The shared dispatcher statically imports both stylesheets, so both articles
// must invalidate on either CSS change. Scene/model code stays article-specific.
const FOUNDATIONS_INPUT_FILES = [...SHARED_INPUT_FILES, ...[
  'components/diagrams/foundations-walkthrough.jsx', 'components/diagrams/generation.css', 'components/diagrams/tokenization.css'
].map(file => `website/${file}`)]
export const GENERATION_INPUT_FILES = Object.freeze([...FOUNDATIONS_INPUT_FILES,
  'website/components/diagrams/generation-walkthrough.jsx', 'website/lib/generation-model.mjs'
])
export const TOKENIZATION_INPUT_FILES = Object.freeze([...FOUNDATIONS_INPUT_FILES,
  'website/components/diagrams/tokenization-walkthrough.jsx', 'website/lib/tokenization-model.mjs'
])
const configs = {
  [GENERATION_ARTICLE]: {
    primaryDiagramIds: ['generation-token-loop'], topics: GENERATION_TOPICS,
    inputFiles: GENERATION_INPUT_FILES, evidencePath: GENERATION_EVIDENCE_PATH
  },
  [TOKENIZATION_ARTICLE]: {
    primaryDiagramIds: ['tokenization-counting'], topics: TOKENIZATION_TOPICS,
    inputFiles: TOKENIZATION_INPUT_FILES, evidencePath: TOKENIZATION_EVIDENCE_PATH
  },
  [TRANSFORMER_ARTICLE]: {
    primaryDiagramIds: ['transformer-io', 'transformer-position', 'self-attention', 'transformer-block'],
    topics: TRANSFORMER_TOPICS, inputFiles: ARTICLE_INPUT_FILES, evidencePath: ARTICLE_EVIDENCE_PATH
  },
  [ATTENTION_VARIANTS_ARTICLE]: {
    primaryDiagramIds: ['attention-kv-sharing', 'attention-compute-memory', 'attention-context-range'],
    topics: VARIANTS_TOPICS, inputFiles: ATTENTION_VARIANTS_INPUT_FILES, evidencePath: ATTENTION_VARIANTS_EVIDENCE_PATH
  },
  [MOE_ARTICLE]: {
    primaryDiagramIds: ['moe-routing-load', 'moe-parameters-communication'],
    topics: MOE_TOPICS, inputFiles: MOE_INPUT_FILES, evidencePath: MOE_EVIDENCE_PATH
  }
}
const overrideDirectories = {
  [TRANSFORMER_ARTICLE]: 'llm-internals', [ATTENTION_VARIANTS_ARTICLE]: 'llm-internals', [MOE_ARTICLE]: 'llm-internals',
  [GENERATION_ARTICLE]: 'llm-foundations', [TOKENIZATION_ARTICLE]: 'llm-foundations'
}
for (const [article, config] of Object.entries(configs)) {
  config.optionalInputs = ['md', 'mdx'].map(extension => `website/content-src/${overrideDirectories[article]}/${path.basename(article, '.md')}.${extension}`)
}
/** Fixed code-owned paths only; callers cannot mutate the acceptance policy. */
export const getDiagramArticleConfig = article => Object.hasOwn(configs, article) ? structuredClone(configs[article]) : null
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

function validateAssignment(assignment, tree, selected, article, config) {
  if (!exact(assignment, ['article', 'primaryDiagramIds', 'sections']) || assignment.article !== article
    || !same(assignment.primaryDiagramIds, config.primaryDiagramIds) || !Array.isArray(assignment.sections)
    || !same(assignment.sections.map(section => section.heading), Object.keys(config.topics))
    || !same(tree.children.filter(node => node.type === 'heading' && node.depth === 3).map(text), Object.keys(config.topics))) throw new Error('記事のH3と必須図の対応が不正です。')
  const used = new Set()
  for (const section of assignment.sections) {
    if (!exact(section, ['heading', 'topics']) || !Array.isArray(section.topics)
      || !same(section.topics.map(topic => topic.id), config.topics[section.heading])) throw new Error('主要論点の割当が不足・重複しています。')
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
  if (config.primaryDiagramIds.some(id => !used.has(id))) throw new Error('必須の主図が本文の論点に対応していません。')
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
  const config = getDiagramArticleConfig(article)
  const result = { tracked: Boolean(config), inputDigest: null, assignmentCurrent: false, diagramsCurrent: false,
    reviewRecorded: false, localRecorded: false, publicRecorded: false, complete: false, reasons: [], verification: 'recorded-evidence-only' }
  if (!result.tracked) return result
  try {
    validateDiagramRegistry(registry)
    const tree = parser.parse(read(repoRoot, article)), manifest = JSON.parse(read(repoRoot, MANIFEST))
    const matches = Array.isArray(manifest.articles) ? manifest.articles.filter(entry => entry?.article === article) : []
    if (!exact(manifest, ['schemaVersion', 'articles']) || manifest.schemaVersion !== 1 || matches?.length !== 1) throw new Error('記事割当manifestが不正です。')
    const assignment = matches[0], selected = config.primaryDiagramIds.map(id => registry.diagrams.find(entry => entry.id === id))
    const files = Object.fromEntries(config.inputFiles.map(file => [file, hash(normalize(read(repoRoot, file)))]))
    for (const file of config.optionalInputs) {
      try { files[file] = hash(normalize(read(repoRoot, file))) } catch (error) { if (error.code !== 'ENOENT') throw error; files[file] = null }
    }
    result.inputDigest = hash(JSON.stringify(normalize({ article: tree, assignment, registry: selected, files })))
    try { validateAssignment(assignment, tree, selected, article, config); result.assignmentCurrent = true } catch (error) { result.reasons.push(error.message) }
    result.diagramsCurrent = selected.every(entry => {
      try { if (!entry.enabled) return false; assertDiagramSource(tree, entry); return true } catch { return false }
    })
    if (!result.diagramsCurrent) result.reasons.push('必須図の有効状態・本文版・レビュー版が揃っていません。')
    let evidence = null
    try { evidence = JSON.parse(read(repoRoot, config.evidencePath)) } catch (error) { if (error.code !== 'ENOENT') result.reasons.push('受入記録を読み取れません。') }
    if (!exact(evidence, ['schemaVersion', 'article', 'review', 'local', 'public']) || evidence.schemaVersion !== 1 || evidence.article !== article) evidence = null
    for (const kind of ['review', 'local', 'public']) {
      result[`${kind}Recorded`] = Boolean(evidence && acceptedGate(evidence[kind], kind, result.inputDigest, repoRoot))
      if (!result[`${kind}Recorded`]) result.reasons.push(`${kind}: 現在の入力版に一致する受入記録がありません。`)
    }
    result.complete = result.assignmentCurrent && result.diagramsCurrent && result.reviewRecorded && result.localRecorded && result.publicRecorded
  } catch (error) { result.reasons.push(error.message) }
  return result
}
