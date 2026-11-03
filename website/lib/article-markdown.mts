import { unified } from 'unified'
import remarkStringify from 'remark-stringify'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import { publicUrl } from './page-metadata.mjs'

const writer = unified().use(remarkStringify, { bullet: '-', emphasis: '*', rule: '-' })
  .use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])

/** Copy before site-only JSX decorations or static diagram replacement. */
export function articleMarkdown(tree, route, env = process.env) {
  const copy = structuredClone(tree)
  const visit = node => {
    if (['link', 'image', 'definition'].includes(node.type) && node.url.startsWith('/') && !node.url.startsWith('//')) {
      const relative = new URL(node.url, 'https://route.invalid')
      const absolute = new URL(publicUrl(relative.pathname, env))
      absolute.search = relative.search; absolute.hash = relative.hash
      node.url = absolute.href
    } else if (['link', 'image', 'definition'].includes(node.type) && node.url.startsWith('#')) {
      node.url = new URL(node.url, publicUrl(route, env)).href
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(copy)
  return String(writer.stringify(copy))
}
