import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// IDs resolve to code-owned bindings, never to module paths supplied by Markdown
// or the registry. Adding a diagram requires an explicit implementation change.
const BINDINGS = {
  'generation-token-loop': {
    article: 'docs/10-llm-foundations/how-llms-generate-text.md',
    route: '/docs/llm-foundations/how-llms-generate-text',
    binding: 'grouped-blocks',
    stageCount: 8,
    headings: [ '概要: たった 1 つのループ', '次トークン予測という実体', 'サンプリングと温度', '「同じ入力で違う出力」になる理由', '停止とストリーミング' ],
    sourceHeadings: [ '概要: たった 1 つのループ', '次トークン予測という実体', 'サンプリングと温度', '「同じ入力で違う出力」になる理由', '停止とストリーミング' ],
    blockGroups: [
      [ { stage: 0, count: 3 } ],
      [ { stage: 3, count: 2 } ],
      [ { stage: 4, count: 3 } ],
      [ { stage: 5, count: 3 } ],
      [ { stage: 6, count: 3 }, { stage: 7, count: 1 } ]
    ],
    blockTypes: [
      [ 'paragraph', 'code', 'paragraph' ],
      [ 'paragraph', 'list' ],
      [ 'paragraph', 'table', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph', 'paragraph' ]
    ]
  },
  'tokenization-counting': {
    article: 'docs/10-llm-foundations/tokenization.md',
    route: '/docs/llm-foundations/tokenization',
    binding: 'grouped-blocks',
    stageCount: 7,
    headings: [ '概要: トークンは LLM 世界の通貨', 'トークンとは何か: サブワード分割の直感', '言語と内容による効率差', 'モデル間の非互換: 移行時の再見積り', '見積りと計測の実務' ],
    sourceHeadings: [ '概要: トークンは LLM 世界の通貨', 'トークンとは何か: サブワード分割の直感', '言語と内容による効率差', 'モデル間の非互換: 移行時の再見積り', '見積りと計測の実務' ],
    blockGroups: [
      [ { stage: 0, count: 1 }, { stage: 1, count: 1 } ],
      [ { stage: 2, count: 3 } ],
      [ { stage: 3, count: 2 } ],
      [ { stage: 4, count: 2 } ],
      [ { stage: 5, count: 1 } ]
    ],
    blockTypes: [
      [ 'paragraph', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph' ],
      [ 'paragraph', 'list' ],
      [ 'paragraph', 'list' ],
      [ 'list' ]
    ]
  },
  'moe-routing-load': {
    article: 'docs/11-llm-internals/mixture-of-experts-internals.md',
    route: '/docs/llm-internals/mixture-of-experts-internals',
    binding: 'grouped-blocks', stageCount: 8,
    headings: ['概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか'],
    sourceHeadings: [
      '概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか',
      '専門化の実態', '総 vs アクティブパラメータの数理'
    ],
    blockGroups: [
      [{ stage: 0, count: 3 }],
      [{ stage: 1, count: 2 }, { stage: 2, count: 1 }, { stage: 3, count: 2 }, { stage: 4, count: 1 }],
      [{ stage: 5, count: 2 }, { stage: 7, count: 2 }]
    ],
    blockTypes: [
      ['paragraph', 'code', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'list', 'math', 'paragraph']
    ]
  },
  'moe-parameters-communication': {
    article: 'docs/11-llm-internals/mixture-of-experts-internals.md',
    route: '/docs/llm-internals/mixture-of-experts-internals',
    binding: 'grouped-blocks', stageCount: 6,
    headings: ['総 vs アクティブパラメータの数理', '提供・運用への含意'],
    sourceHeadings: [
      '概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか',
      '専門化の実態', '総 vs アクティブパラメータの数理', '提供・運用への含意'
    ],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 1, count: 2 }, { stage: 2, count: 1 }], [{ stage: 5, count: 1 }]],
    blockTypes: [['paragraph', 'list', 'math', 'paragraph', 'list'], ['list']]
  },
  'self-attention': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'attention-section', stageCount: 6,
    headings: ['自己注意の数式'],
    sourceHeadings: ['自己注意の数式']
  },
  'agent-loop': {
    article: 'docs/01-concepts/agent-loop.md',
    route: '/docs/concepts/agent-loop',
    binding: 'ordered-steps', stageCount: 5,
    headings: ['詳細: 1 イテレーションの分解'],
    sourceHeadings: [
      '詳細: 1 イテレーションの分解',
      '詳細: 停止条件は「正常完了」以外に必ず用意する',
      '詳細: ツールの失敗はループに返す',
      '詳細: 履歴は単調増加する'
    ]
  },
  'workflow-comparison': {
    article: 'docs/02-architecture/workflow-vs-agent.md',
    route: '/docs/architecture/workflow-vs-agent',
    binding: 'consecutive-sections', stageCount: 5,
    headings: [
      '概要: 原則は「同じ品質なら、自律性の低い方」',
      '詳細: トレードオフの全体像', '詳細: 判断フロー',
      '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
    ],
    sourceHeadings: [
      '概要: 原則は「同じ品質なら、自律性の低い方」',
      '詳細: トレードオフの全体像', '詳細: 判断フロー',
      '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
    ]
  },
  'transformer-io': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド'],
    sourceHeadings: ['概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド'],
    blockGroups: [[{ stage: 0, count: 4 }], [{ stage: 1, count: 3 }, { stage: 2, count: 2 }, { stage: 3, count: 1 }]],
    blockTypes: [
      ['paragraph', 'code', 'paragraph', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'paragraph', 'math', 'paragraph']
    ]
  },
  'transformer-position': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['位置符号化: 順序をどう入れるか'],
    sourceHeadings: ['位置符号化: 順序をどう入れるか', '自己注意の数式'],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 2, count: 1 }, { stage: 3, count: 2 }]],
    blockTypes: [['paragraph', 'list', 'paragraph', 'math', 'paragraph']]
  },
  'attention-kv-sharing': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 5,
    headings: ['概要: 2 つの圧力', 'KV キャッシュを減らす: MQA と GQA'],
    sourceHeadings: ['概要: 2 つの圧力', 'KV キャッシュを減らす: MQA と GQA'],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 1, count: 3 }], [{ stage: 4, count: 4 }]],
    blockTypes: [['paragraph', 'list', 'paragraph', 'math', 'paragraph'], ['paragraph', 'paragraph', 'math', 'paragraph']]
  },
  'attention-compute-memory': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 6,
    headings: ['注意を疎にする: 局所・スライディング窓・スパース', '線形注意という別路線', 'FlashAttention: 厳密なまま速く'],
    sourceHeadings: ['概要: 2 つの圧力', '注意を疎にする: 局所・スライディング窓・スパース', '線形注意という別路線', 'FlashAttention: 厳密なまま速く'],
    blockGroups: [[{ stage: 0, count: 3 }], [{ stage: 1, count: 1 }, { stage: 2, count: 2 }], [{ stage: 3, count: 1 }, { stage: 4, count: 1 }, { stage: 5, count: 1 }]],
    blockTypes: [['paragraph', 'list', 'paragraph'], ['paragraph', 'math', 'paragraph'], ['paragraph', 'list', 'paragraph']]
  },
  'attention-context-range': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['位置の対応範囲を伸ばす: 外挿と補間'],
    sourceHeadings: ['概要: 2 つの圧力', '位置の対応範囲を伸ばす: 外挿と補間', '「長コンテキスト対応」表記を読む'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 2, count: 2 }]],
    blockTypes: [['paragraph', 'list', 'paragraph']]
  },
  'transformer-block': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 9,
    headings: ['多頭注意', 'FFN と残差ストリーム', '正規化と学習安定性', 'パラメータの内訳'],
    sourceHeadings: [
      '概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド', '自己注意の数式',
      '多頭注意', 'FFN と残差ストリーム', '正規化と学習安定性', 'パラメータの内訳'
    ],
    blockGroups: [
      [{ stage: 0, count: 3 }, { stage: 1, count: 3 }],
      [{ stage: 2, count: 3 }, { stage: 3, count: 2 }, { stage: 4, count: 3 }],
      [{ stage: 5, count: 3 }, { stage: 6, count: 1 }],
      [{ stage: 7, count: 3 }, { stage: 8, count: 4 }]
    ],
    blockTypes: [
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph', 'math', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'list', 'paragraph', 'math', 'paragraph', 'paragraph', 'list']
    ]
  }
}
const ENTRY_KEYS = ['id', 'article', 'route', 'binding', 'stageCount', 'headings', 'sourceHeadings', 'sourceDigest', 'reviewedDigest', 'enabled', 'status', 'articleCoverage']
const digestPattern = /^sha256:[a-f0-9]{64}$/
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key))

function matchesBlockGroups(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length
    && actual.every((groups, section) => Array.isArray(groups) && groups.length === expected[section].length
      && groups.every((group, index) => exactKeys(group, ['stage', 'count'])
        && group.stage === expected[section][index].stage && group.count === expected[section][index].count))
}

export function validateDiagramRegistry(registry) {
  if (!exactKeys(registry, ['schemaVersion', 'diagrams']) || registry.schemaVersion !== 1 || !Array.isArray(registry.diagrams)) {
    throw new Error('動的図 registry: schemaVersion 1 と diagrams が必要です。')
  }
  const seen = new Set()
  for (const entry of registry.diagrams) {
    const expected = Object.hasOwn(BINDINGS, entry?.id) ? BINDINGS[entry.id] : null
    const keys = expected?.binding === 'grouped-blocks' ? [...ENTRY_KEYS, 'blockGroups'] : ENTRY_KEYS
    if (!exactKeys(entry, keys) || !expected || seen.has(entry.id)
      || ['article', 'route', 'binding', 'stageCount'].some(key => entry[key] !== expected[key])
      || JSON.stringify(entry.headings) !== JSON.stringify(expected.headings)
      || JSON.stringify(entry.sourceHeadings) !== JSON.stringify(expected.sourceHeadings)
      || (expected.blockGroups && !matchesBlockGroups(entry.blockGroups, expected.blockGroups))
      || !digestPattern.test(entry.sourceDigest)
      || !(entry.reviewedDigest === null || digestPattern.test(entry.reviewedDigest))
      || typeof entry.enabled !== 'boolean'
      || !['draft', 'registered', 'implemented', 'reviewed'].includes(entry.status)
      || entry.articleCoverage !== 'pending'
      || (entry.status === 'draft' && (entry.enabled || entry.reviewedDigest !== null))
      || (entry.status === 'reviewed' && entry.reviewedDigest !== entry.sourceDigest)) {
      throw new Error(`動的図 registry: 不正な登録または未許可の binding (${entry?.id ?? '?'})`)
    }
    seen.add(entry.id)
  }
  if (seen.size !== Object.keys(BINDINGS).length) throw new Error('動的図 registry: コードで定義されたすべての ID を登録してください。')
  return registry
}

export const diagramRegistry = validateDiagramRegistry(JSON.parse(readFileSync(new URL('../diagrams/registry.json', import.meta.url), 'utf8')))

export function getDiagramEntry(id, registry = diagramRegistry) {
  validateDiagramRegistry(registry)
  const entry = registry.diagrams.find(diagram => diagram.id === id)
  if (!entry) throw new Error(`動的図 registry: 未登録の ID (${id})`)
  return entry
}

const textContent = node => node.value ?? (node.children ?? []).map(textContent).join('')

/** Select original source nodes before glossary decoration or route rewriting. */
function selectSections(tree, entry, headings, contiguous) {
  let parentHeading = ''
  const candidates = []
  tree.children.forEach((node, index) => {
    if (node.type === 'heading' && node.depth === 2) parentHeading = textContent(node)
    if (node.type === 'heading' && node.depth === 3 && parentHeading === '本文') candidates.push({ node, index })
  })
  const sections = headings.map(title => {
    const matches = candidates.filter(({ node }) => textContent(node) === title)
    if (matches.length !== 1) throw new Error(`${entry.route}: 動的図の見出し「${title}」を一意に特定できません。`)
    const start = matches[0].index
    let end = start + 1
    while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
    return { start, end, heading: tree.children[start], body: tree.children.slice(start + 1, end) }
  })
  if (sections.some((section, index) => index > 0 && (contiguous
    ? sections[index - 1].end !== section.start
    : sections[index - 1].end > section.start))) {
    throw new Error(`${entry.route}: 動的図の見出し順序・連続性が変わりました。`)
  }
  return sections
}

/** Only these consecutive sections are wrapped in the reading layout. */
export function selectDiagramSections(tree, entry) {
  return selectSections(tree, entry, entry.headings, true)
}

// Parsing normalizes Markdown syntax and line endings. Positions are editorial
// metadata, while every other AST field (including math, URLs and code) matters.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter(key => key !== 'position').sort().map(key => [key, canonical(value[key])]))
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n') : value
}

export function diagramSourceDigest(tree, entry) {
  // Semantic dependencies may live outside the wrapped prose, with other
  // sections between them. Their original order and uniqueness still matter.
  const sections = selectSections(tree, entry, entry.sourceHeadings, false)
  const nodes = sections.flatMap(section => [section.heading, ...section.body])
  const identifiers = new Set()
  const visit = node => {
    if (['linkReference', 'imageReference'].includes(node.type)) identifiers.add(node.identifier)
    for (const child of node.children ?? []) visit(child)
  }
  nodes.forEach(visit)
  // A reference definition can live outside the section but still changes the
  // meaning of its links; include only definitions actually used by this figure.
  const definitions = tree.children.filter(node => node.type === 'definition' && identifiers.has(node.identifier))
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical({ nodes, definitions }))).digest('hex')}`
}

export function assertDiagramSource(tree, entry) {
  const actual = diagramSourceDigest(tree, entry)
  if (entry.sourceDigest !== actual || entry.reviewedDigest !== actual || entry.status !== 'reviewed') {
    throw new Error(`${entry.route}: 動的図 ${entry.id} の本文版とレビュー版が一致しません。本文・図解の対応をレビューしてください。actual=${actual}`)
  }
  const sections = selectDiagramSections(tree, entry)
  if (entry.binding === 'grouped-blocks') {
    const expected = BINDINGS[entry.id]
    for (const [index, section] of sections.entries()) {
      if (JSON.stringify(section.body.map(node => node.type)) !== JSON.stringify(expected.blockTypes[index])
        || entry.blockGroups[index].reduce((sum, group) => sum + group.count, 0) !== section.body.length) {
        throw new Error(`${entry.route}: 動的図 ${entry.id} の本文ブロック構成が変わりました。`)
      }
    }
  }
  return sections
}
