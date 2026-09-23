import { wrapAttentionSection } from './attention-decoration.mjs'
import { assertDiagramSource, diagramRegistry, validateDiagramRegistry } from './diagram-registry.mjs'

const element = (name, children, attributes = []) => ({ type: 'mdxJsxFlowElement', name, attributes, children })
const attribute = (name, value) => ({ type: 'mdxJsxAttribute', name, value: String(value) })
const step = (index, children) => element('ReadingStep', children, [attribute('step', index)])
const figure = (entry, children) => element('ReadingWalkthrough', children, [attribute('diagramId', entry.id)])

/** Preserve original nodes, list numbering, headings, and anchors. */
export function wrapRegisteredDiagrams(tree, route, registry = diagramRegistry) {
  validateDiagramRegistry(registry)
  const entries = registry.diagrams.filter(entry => entry.route === route && entry.enabled)
  for (const entry of entries) {
    if (entry.id === 'self-attention') {
      wrapAttentionSection(tree, route, registry)
      continue
    }
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
      tree.children.splice(start + 1, end - start - 1, figure(entry, [intro, trackedList]))
    } else if (entry.binding === 'consecutive-sections') {
      const start = sections[0].start, end = sections.at(-1).end
      tree.children.splice(start, end - start, figure(entry, sections.map((section, index) => step(index, [section.heading, ...section.body]))))
    }
  }
}
