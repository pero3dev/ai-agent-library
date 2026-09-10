import path from 'node:path'
import { splitLocalDestination } from '../../scripts/lib/md-utils.mjs'

/** remark のリンク・参照定義ノードだけを変換する。コードや本文文字列は触らない。 */
export function rewriteMarkdownRoutes(tree, repoRel, routeMap) {
  const errors = []
  const visit = node => {
    if (['link', 'image', 'definition'].includes(node.type)) {
      const target = splitLocalDestination(node.url)
      if (target.error) errors.push(`${repoRel}:${node.position?.start.line ?? 1}: ${node.url} — ${target.error}`)
      else if (!target.external && target.pathname.endsWith('.md')) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(repoRel), target.pathname))
        const route = routeMap.get(resolved)
        if (route) node.url = `${route}${target.suffix}`
        else errors.push(`${repoRel}: 未解決の .md リンク → ${node.url}(サイトに存在しないルート)`)
      }
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(tree)
  return errors
}

/** セクション収録表の実際のリンク先から順序を得る(参照形式にも対応)。 */
export function readmeArticleOrder(tree) {
  const definitions = new Map()
  const key = identifier => identifier.trim().replace(/\s+/g, ' ').toUpperCase()
  const collect = node => {
    if (node.type === 'definition' && !definitions.has(key(node.identifier))) definitions.set(key(node.identifier), node.url)
    for (const child of node.children ?? []) collect(child)
  }
  collect(tree)
  const order = []
  const visit = (node, inTable = false) => {
    inTable ||= node.type === 'table'
    const url = node.type === 'link' ? node.url : node.type === 'linkReference' ? definitions.get(key(node.identifier)) : null
    if (inTable && url) {
      const target = splitLocalDestination(url)
      if (target.pathname && /^(?:\.\/)?[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(target.pathname)) {
        const name = path.posix.basename(target.pathname, '.md')
        if (!order.includes(name)) order.push(name)
      }
    }
    for (const child of node.children ?? []) visit(child, inTable)
  }
  visit(tree)
  return order
}
