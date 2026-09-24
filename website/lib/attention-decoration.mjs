import { assertDiagramSource, diagramRegistry, getDiagramEntry } from './diagram-registry.mjs'

const ARTICLE_ROUTE = '/docs/llm-internals/transformer-architecture'
const textContent = node => node.value ?? (node.children ?? []).map(textContent).join('')
const element = (name, children, attributes = []) => ({
  type: 'mdxJsxFlowElement', name, attributes, children
})
const step = (value, children) => element('AttentionStep', children, [
  { type: 'mdxJsxAttribute', name: 'step', value: String(value) }
])

/**
 * The article remains the only source for prose and formulas. Wrap its existing
 * self-attention nodes for scroll tracking; never copy the section into JSX.
 * If its structure changes, fail sync rather than attach diagrams to wrong text.
 */
export function planAttentionSection(tree, entry) {
  const [{ start, end, body }] = assertDiagramSource(tree, entry)
  const expectedTypes = ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'list', 'paragraph']
  const list = body[5]
  if (body.length !== expectedTypes.length
    || body.some((node, index) => node.type !== expectedTypes[index])
    || list.ordered || list.children.length !== 3
    || !textContent(list.children[2]).includes('因果マスク')
    || !textContent(body[6]).startsWith('softmax')) {
    throw new Error(`${ARTICLE_ROUTE}: 「自己注意の数式」の構成が変わりました。本文・数式と動的図の対応を更新してください。`)
  }

  return { id: entry.id, start: start + 1, end, replacement: element('AttentionWalkthrough', [
    step(0, [body[0]]),
    step(1, [body[1], body[2]]),
    step(2, [body[3], body[4], { ...list, children: list.children.slice(0, 2) }]),
    step(3, [{ ...list, children: list.children.slice(2) }]),
    step(4, [body[6]])
    // Weighted V (stage 5) is available in the diagram controls. It does not
    // create another prose block or duplicate the article's attention formula.
  ]) }
}

/** Compatibility entry point for the standalone attention decoration. */
export function wrapAttentionSection(tree, route, registry = diagramRegistry) {
  if (route !== ARTICLE_ROUTE) return
  const entry = getDiagramEntry('self-attention', registry)
  if (!entry.enabled) return
  const plan = planAttentionSection(tree, entry)
  tree.children.splice(plan.start, plan.end - plan.start, plan.replacement)
}
