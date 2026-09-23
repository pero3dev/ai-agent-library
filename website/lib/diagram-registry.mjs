import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// IDs resolve to code-owned bindings, never to module paths supplied by Markdown
// or the registry. Adding a diagram requires an explicit implementation change.
const BINDINGS = {
  'self-attention': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'attention-section', stageCount: 6, sectionCount: 1,
    sourceHeadings: ['自己注意の数式']
  },
  'agent-loop': {
    article: 'docs/01-concepts/agent-loop.md',
    route: '/docs/concepts/agent-loop',
    binding: 'ordered-steps', stageCount: 5, sectionCount: 1,
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
    binding: 'consecutive-sections', stageCount: 5, sectionCount: 5,
    sourceHeadings: [
      '概要: 原則は「同じ品質なら、自律性の低い方」',
      '詳細: トレードオフの全体像', '詳細: 判断フロー',
      '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
    ]
  }
}
const ENTRY_KEYS = ['id', 'article', 'route', 'binding', 'stageCount', 'headings', 'sourceHeadings', 'sourceDigest', 'reviewedDigest', 'enabled', 'status', 'articleCoverage']
const digestPattern = /^sha256:[a-f0-9]{64}$/
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key))

export function validateDiagramRegistry(registry) {
  if (!exactKeys(registry, ['schemaVersion', 'diagrams']) || registry.schemaVersion !== 1 || !Array.isArray(registry.diagrams)) {
    throw new Error('動的図 registry: schemaVersion 1 と diagrams が必要です。')
  }
  const seen = new Set()
  for (const entry of registry.diagrams) {
    const expected = BINDINGS[entry?.id]
    if (!exactKeys(entry, ENTRY_KEYS) || !expected || seen.has(entry.id)
      || ['article', 'route', 'binding', 'stageCount'].some(key => entry[key] !== expected[key])
      || !Array.isArray(entry.headings) || entry.headings.length !== expected.sectionCount
      || entry.headings.some(heading => typeof heading !== 'string' || !heading.trim())
      || new Set(entry.headings).size !== entry.headings.length
      || JSON.stringify(entry.sourceHeadings) !== JSON.stringify(expected.sourceHeadings)
      || JSON.stringify(entry.headings) !== JSON.stringify(expected.sourceHeadings.slice(0, expected.sectionCount))
      || !digestPattern.test(entry.sourceDigest)
      || !(entry.reviewedDigest === null || digestPattern.test(entry.reviewedDigest))
      || typeof entry.enabled !== 'boolean'
      || !['registered', 'implemented', 'reviewed'].includes(entry.status)
      || entry.articleCoverage !== 'pending'
      || (entry.status === 'reviewed' && entry.reviewedDigest !== entry.sourceDigest)) {
      throw new Error(`動的図 registry: 不正な登録または未許可の binding (${entry?.id ?? '?'})`)
    }
    seen.add(entry.id)
  }
  if (seen.size !== Object.keys(BINDINGS).length) throw new Error('動的図 registry: P0 の3件を登録してください。')
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
  return selectDiagramSections(tree, entry)
}
