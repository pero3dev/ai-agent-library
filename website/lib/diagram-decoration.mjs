import { planAttentionSection } from './attention-decoration.mjs'
import { assertDiagramSource, diagramRegistry, validateDiagramRegistry } from './diagram-registry.mjs'

const element = (name, children, attributes = []) => ({ type: 'mdxJsxFlowElement', name, attributes, children })
const attribute = (name, value) => ({ type: 'mdxJsxAttribute', name, value: String(value) })
const step = (index, children) => element('ReadingStep', children, [attribute('step', index)])
const components = {
  'agent-loop': 'ReadingWalkthrough', 'workflow-comparison': 'ReadingWalkthrough',
  'transformer-io': 'TransformerWalkthrough', 'transformer-position': 'TransformerWalkthrough', 'transformer-block': 'TransformerWalkthrough',
  'attention-kv-sharing': 'AttentionVariantsWalkthrough', 'attention-compute-memory': 'AttentionVariantsWalkthrough', 'attention-context-range': 'AttentionVariantsWalkthrough'
}
const figure = (entry, children) => element(components[entry.id], children, [attribute('diagramId', entry.id)])

/** Validate every source binding against the same original, unmodified AST. */
export function planRegisteredDiagrams(tree, route, registry = diagramRegistry) {
  validateDiagramRegistry(registry)
  const entries = registry.diagrams.filter(entry => entry.route === route && entry.enabled)
  const plans = entries.map(entry => {
    if (entry.id === 'self-attention') return planAttentionSection(tree, entry)
    const sections = assertDiagramSource(tree, entry)
    if (entry.binding === 'ordered-steps') {
      const [{ start, end, body }] = sections
      const [intro, list] = body
      if (body.length !== 2 || intro.type !== 'paragraph' || list?.type !== 'list' || !list.ordered
        || list.start !== 1 || list.children.length !== entry.stageCount || list.children.some(item => item.type !== 'listItem')) {
        throw new Error(`${route}: 動的図の5段階リストの構成が変わりました。`)
      }
      // Wrap INSIDE each original list item: keep a single ol and its numbering.
      const trackedList = { ...list, children: list.children.map((item, index) => ({ ...item, children: [step(index, item.children)] })) }
      return { id: entry.id, start: start + 1, end, replacement: figure(entry, [intro, trackedList]) }
    } else if (entry.binding === 'consecutive-sections') {
      const start = sections[0].start, end = sections.at(-1).end
      return { id: entry.id, start, end, replacement: figure(entry, sections.map((section, index) => step(index, [section.heading, ...section.body]))) }
    } else if (entry.binding === 'grouped-blocks') {
      const children = sections.flatMap((section, sectionIndex) => {
        let offset = 0
        return entry.blockGroups[sectionIndex].map(({ stage, count }, groupIndex) => {
          const nodes = section.body.slice(offset, offset + count)
          offset += count
          // A heading belongs to its first group, but is not a counted body
          // block. Lists, formulas and paragraphs retain their original nodes.
          return step(stage, groupIndex === 0 ? [section.heading, ...nodes] : nodes)
        })
      })
      return { id: entry.id, start: sections[0].start, end: sections.at(-1).end, replacement: figure(entry, children) }
    }
    throw new Error(`${route}: 動的図 ${entry.id} の未対応 binding です。`)
  }).sort((a, b) => a.start - b.start)
  assertNonoverlappingDiagramPlans(plans)
  return plans
}

/** Source dependencies may overlap; the ranges replaced in the article may not. */
export function assertNonoverlappingDiagramPlans(plans) {
  for (const [index, plan] of plans.entries()) {
    if (!Number.isInteger(plan.start) || !Number.isInteger(plan.end) || plan.start < 0 || plan.end <= plan.start
      || (index > 0 && plans[index - 1].end > plan.start)) {
      throw new Error(`動的図 ${plan.id}: 本文の包装範囲が重複しているか不正です。`)
    }
  }
}

/** Apply only after every plan succeeds, from the last original range backward. */
export function wrapRegisteredDiagrams(tree, route, registry = diagramRegistry) {
  const plans = planRegisteredDiagrams(tree, route, registry)
  for (const plan of [...plans].reverse()) tree.children.splice(plan.start, plan.end - plan.start, plan.replacement)
  return { firstDiagramId: plans[0]?.id ?? null, diagramIds: plans.map(plan => plan.id) }
}

/** Read the final MDX, including content-src overrides, before emitting SSR data. */
export function assertDiagramPageMetadata(tree, expected) {
  const diagramIds = []
  const walk = node => {
    if (node.name === 'AttentionWalkthrough') diagramIds.push('self-attention')
    if (['ReadingWalkthrough', 'TransformerWalkthrough', 'AttentionVariantsWalkthrough'].includes(node.name)) {
      diagramIds.push(node.attributes?.find(attribute => attribute.name === 'diagramId')?.value)
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk(tree)
  if (JSON.stringify(diagramIds) !== JSON.stringify(expected.diagramIds)
    || expected.firstDiagramId !== (diagramIds[0] ?? null)) {
    throw new Error('動的図: 最終 MDX の順序・有効状態と記事目次の対応が一致しません。')
  }
  return expected
}
