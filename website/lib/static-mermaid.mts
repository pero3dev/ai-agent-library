import { createHash } from 'node:crypto'

export const diagramKey = chart => createHash('sha256').update(`mermaid-11.16.1-strict-xml-v3\n${chart}`).digest('hex').slice(0, 24)

export function replaceMermaid(tree, title, charts) {
  let heading = title
  const visit = node => {
    if (!node.children) return
    node.children = node.children.map(child => {
      if (child.type === 'heading') heading = child.children.map(item => item.value || '').join('') || title
      if (child.type === 'code' && child.lang === 'mermaid') {
        const key = diagramKey(child.value)
        charts.set(key, child.value)
        return { type: 'mdxJsxFlowElement', name: 'StaticMermaid', attributes: [
          { type: 'mdxJsxAttribute', name: 'diagram', value: key },
          { type: 'mdxJsxAttribute', name: 'label', value: `${title}: ${heading}の図` }
        ], children: [] }
      }
      visit(child)
      return child
    })
  }
  visit(tree)
}
