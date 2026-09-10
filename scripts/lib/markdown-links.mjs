/**
 * Markdown の構文解析は固定した markdown-it に任せ、パスとアンカーを検査する。
 * フックの起動経路とは分離する。本文中のコード・コメントをリンクと誤認しない。
 */
import MarkdownIt from 'markdown-it'
import GithubSlugger from 'github-slugger'
import { parseFrontMatter, toLines } from './md-utils.mjs'

const parser = new MarkdownIt({ html: true, linkify: false, typographer: false })

function inlineText(tokens = []) {
  return tokens.map(token => {
    if (token.type === 'image') return inlineText(token.children)
    if (token.type === 'softbreak' || token.type === 'hardbreak') return '\n'
    return token.type === 'text' || token.type === 'code_inline' ? token.content : ''
  }).join('')
}

/** GitHub/Nextra が使う github-slugger による見出し ID とパーサが解決したリンク。 */
export function parseMarkdownLinks(text) {
  const lines = toLines(text)
  const fm = parseFrontMatter(lines)
  // 行番号を保ったまま YAML の見出し・リンクらしい文字を除外する。
  if (fm && !fm.unclosed) lines.fill('', 0, fm.endLine)
  const tokens = parser.parse(lines.join('\n'), {})
  const slugger = new GithubSlugger()
  const anchors = new Set()
  const links = []
  const headings = []
  let inTable = false
  let blockLine = 1
  const htmlAnchors = content => {
    for (const tag of content.replace(/<!--[\s\S]*?(?:-->|$)/g, '').matchAll(/<[A-Za-z][^>]*>/g)) {
      for (const match of tag[0].matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)) {
        anchors.add(parser.utils.unescapeAll(match[1] ?? match[2] ?? match[3]))
      }
    }
  }
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.map) blockLine = token.map[0] + 1
    if (token.type === 'table_open') inTable = true
    if (token.type === 'table_close') inTable = false
    if (token.type === 'html_block') htmlAnchors(token.content)
    if (token.type === 'heading_open') {
      const headingText = inlineText(tokens[index + 1]?.children)
      const id = slugger.slug(headingText)
      anchors.add(id)
      headings.push({ text: headingText, id, level: Number(token.tag.slice(1)), line: token.map[0] + 1 })
    }
    if (token.type !== 'inline') continue
    let line = blockLine
    const children = token.children ?? []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.type === 'html_inline') htmlAnchors(child.content)
      if (child.type === 'link_open' || child.type === 'image') {
        const close = children.findIndex((candidate, next) => next > i && candidate.type === 'link_close')
        links.push({
          target: child.attrGet(child.type === 'image' ? 'src' : 'href'), line, inTable,
          label: child.type === 'image' ? inlineText(child.children) : inlineText(children.slice(i + 1, close)),
        })
      }
      if (child.type === 'softbreak' || child.type === 'hardbreak') line++
      else line += (child.content?.match(/\n/g) ?? []).length
    }
  }
  return { links, anchors, headings }
}
