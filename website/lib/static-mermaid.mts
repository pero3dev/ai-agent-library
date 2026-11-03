import { createHash } from 'node:crypto'
import type { Nodes, Root } from 'mdast'

export const diagramKey = (chart: string) => createHash('sha256').update(`mermaid-11.16.1-strict-xml-v3\n${chart}`).digest('hex').slice(0, 24)

export function replaceMermaid(tree: Root, title: string, charts: Map<string, string>) {
  let heading = title
  const visit = (node: Nodes) => {
    if (!('children' in node)) return
    const children: Nodes[] = node.children
    for (let index = 0; index < children.length; index++) {
      const child = children[index]
      if (child.type === 'heading') heading = child.children.map(item => 'value' in item ? item.value : '').join('') || title
      if (child.type === 'code' && child.lang === 'mermaid') {
        const key = diagramKey(child.value)
        charts.set(key, child.value)
        children[index] = { type: 'mdxJsxFlowElement', name: 'StaticMermaid', attributes: [
          { type: 'mdxJsxAttribute', name: 'diagram', value: key },
          { type: 'mdxJsxAttribute', name: 'label', value: `${title}: ${heading}の図` }
        ], children: [] }
      } else visit(child)
    }
  }
  visit(tree)
}
