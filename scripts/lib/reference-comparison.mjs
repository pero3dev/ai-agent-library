/** URL 風文字列をコードから消さず、実際の参考資料・リンク先だけを比較対象から除く。 */
import MarkdownIt from 'markdown-it'
import { parseMarkdownLinks } from './markdown-links.mjs'

const markdown = new MarkdownIt({ html: true, linkify: false, typographer: false })

export function referenceComparable(text) {
  const headings = parseMarkdownLinks(text).headings.filter(heading => heading.level === 2)
  const reference = headings.findIndex(heading => heading.text === '参考資料')
  const lines = text.split('\n')
  if (reference >= 0) lines.splice(headings[reference].line, (headings[reference + 1]?.line ?? lines.length + 1) - headings[reference].line - 1)
  const tokenValue = token => ({
    type: token.type, tag: token.tag, nesting: token.nesting, markup: token.markup, info: token.info,
    content: token.children?.length ? undefined : token.content,
    attrs: token.attrs?.map(([key, value]) => [key, ['href', 'src'].includes(key) ? 'URL' : value]) ?? null,
    children: token.children?.map(tokenValue) ?? null,
  })
  return JSON.stringify(markdown.parse(lines.join('\n'), {}).map(tokenValue))
}
