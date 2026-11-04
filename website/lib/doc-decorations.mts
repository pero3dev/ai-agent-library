/**
 * doc-decorations.mjs — 記事の定型構造を UI コンポーネントへ自動変換する mdast 変換。
 * sync-content.mjs から呼ばれ、原本(docs/)には手を入れない(project/plans/engineering/website.md §5 段階 2)。
 *
 * 注: 当初は next.config の remarkPlugins として実装したが、Turbopack はローダーオプションの
 * 直列化を要求し関数プラグインを渡せないため、sync 時の変換(バンドラー非依存)に移した。
 *
 * 変換内容:
 * 1. 「> **TODO(要確認):** …」の blockquote → <TodoCallout>
 * 2. 「### アンチパターン」「### チェックリスト」直後のブロック群 → <PracticeSection kind="...">
 *    (見出し自体は外に残し、TOC とアンカーを維持する)
 * 3. GLOSSARY 登録語のページ内初出 → <GlossaryTerm href summary>(ホバーで要約)
 */

import type { Nodes, Root, RootContent, PhrasingContent, Paragraph, BlockContent, DefinitionContent } from 'mdast'
import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import type { LinkedGlossaryEntry } from './content-types.ts'

const jsxAttr = (name: string, value: string): MdxJsxAttribute => ({ type: 'mdxJsxAttribute', name, value })
const textValue = (node: Nodes) => 'value' in node && typeof node.value === 'string' ? node.value : ''

/* ---------- 1. TODO(要確認) コールアウト ---------- */

/** blockquote が TODO(要確認) 形式なら、マーカーを除いた中身を返す */
function todoChildren(node: Nodes) {
  if (node.type !== 'blockquote') return null
  const [para, ...restBlocks] = node.children ?? []
  if (para?.type !== 'paragraph') return null
  const [first, ...restInline] = para.children ?? []
  if (first?.type !== 'strong') return null
  const marker = first.children?.map(textValue).join('') ?? ''
  if (!/^TODO[((]要確認[))]/.test(marker)) return null
  const inline = [...restInline]
  if (inline[0]?.type === 'text') {
    inline[0] = { ...inline[0], value: inline[0].value.replace(/^\s+/, '') }
  }
  const paragraph: Paragraph = { type: 'paragraph', children: inline }
  return [paragraph, ...restBlocks]
}

function replaceTodos(node: Nodes, state = { count: 0 }) {
  if (!('children' in node)) return state
  const children: Nodes[] = node.children
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    const inner = todoChildren(child)
    if (inner) {
      state.count++
      children[index] = { type: 'mdxJsxFlowElement', name: 'TodoCallout', attributes: [jsxAttr('id', `article-todo-${state.count}`)], children: inner }
    } else replaceTodos(child, state)
  }
  return state
}

/* ---------- 2. アンチパターン / チェックリストの装飾コンテナ ---------- */

const SECTION_KINDS = new Map([
  ['アンチパターン', 'antipattern'],
  ['チェックリスト', 'checklist']
])

const headingText = (node: Nodes) => 'children' in node ? node.children.map(textValue).join('').trim() : ''

function wrapPracticeSections(root: Root) {
  const out: RootContent[] = []
  const children = root.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    const kind =
      node.type === 'heading' && node.depth === 3 ? SECTION_KINDS.get(headingText(node)) : undefined
    out.push(node)
    if (!kind) continue
    const body: Array<BlockContent | DefinitionContent> = []
    let j = i + 1
    while (j < children.length) {
      const child = children[j]
      if (child.type === 'heading' && child.depth <= 3) break
      if (child.type === 'yaml' || child.type === 'mdxjsEsm') break
      // A practice section contains block content; preserve root-only nodes outside it.
      if (child.type === 'tableCell' || child.type === 'tableRow' || child.type === 'listItem' || child.type === 'text' || child.type === 'inlineCode' || child.type === 'break' || child.type === 'emphasis' || child.type === 'strong' || child.type === 'delete' || child.type === 'link' || child.type === 'linkReference' || child.type === 'image' || child.type === 'imageReference' || child.type === 'footnoteReference' || child.type === 'mdxJsxTextElement' || child.type === 'mdxTextExpression' || child.type === 'inlineMath') break
      body.push(child)
      j++
    }
    if (body.length) {
      out.push({
        type: 'mdxJsxFlowElement',
        name: 'PracticeSection',
        attributes: [jsxAttr('kind', kind)],
        children: body
      })
      i = j - 1
    }
  }
  root.children = out
}

// GFM の匿名 input を、同じ項目本文と結び付くサイト所有コンポーネントへ変換する。
function labelChecklistItems(node: Nodes) {
  if (node.type === 'listItem' && typeof node.checked === 'boolean') {
    const paragraph = node.children?.find(child => child.type === 'paragraph')
    if (paragraph) {
      paragraph.children = [{
        type: 'mdxJsxTextElement',
        name: 'ChecklistBox',
        attributes: [jsxAttr('defaultChecked', String(node.checked))],
        children: paragraph.children
      }]
      node.checked = null
    }
  }
  if ('children' in node) for (const child of node.children) labelChecklistItems(child)
}

/* ---------- 3. GLOSSARY 用語の自動リンク(ページ内初出のみ) ---------- */

const SKIP_TYPES = new Set(['heading', 'link', 'linkReference', 'mdxJsxTextElement'])

function linkifyText(value: string, seen: Set<string>, currentRoute: string, glossary: readonly LinkedGlossaryEntry[]): PhrasingContent[] | null {
  for (const term of glossary) {
    if (seen.has(term.name) || term.href === currentRoute) continue
    const idx = value.indexOf(term.name)
    if (idx === -1) continue
    seen.add(term.name)
    const nodes: PhrasingContent[] = []
    if (idx > 0) nodes.push({ type: 'text', value: value.slice(0, idx) })
    nodes.push({
      type: 'mdxJsxTextElement',
      name: 'GlossaryTerm',
      attributes: [jsxAttr('href', term.href), jsxAttr('summary', term.summary)],
      children: [{ type: 'text', value: term.name }]
    })
    const after = value.slice(idx + term.name.length)
    if (after) {
      const rest = linkifyText(after, seen, currentRoute, glossary)
      nodes.push(...(rest ?? [{ type: 'text', value: after }]))
    }
    return nodes
  }
  return null
}

function autolinkGlossary(node: Nodes, seen: Set<string>, currentRoute: string, skip: boolean, glossary: readonly LinkedGlossaryEntry[]) {
  if (!('children' in node)) return
  const children: Nodes[] = node.children
  const childSkip = skip || SKIP_TYPES.has(node.type)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === 'text' && !childSkip) {
      const replaced = linkifyText(child.value, seen, currentRoute, glossary)
      if (replaced) {
        children.splice(i, 1, ...replaced)
        i += replaced.length - 1
      }
    } else {
      autolinkGlossary(child, seen, currentRoute, childSkip, glossary)
    }
  }
}

/* ---------- エントリポイント ---------- */

/**
 * @param tree mdast ルート(remark-parse + remark-gfm + remark-frontmatter でパースしたもの)
 * @param options.route このページのサイト上のルート(例: '/docs/concepts/agent-loop')
 * @param options.glossary generated/glossary.json 相当の配列(名前の長い順にソート済みであること)
 */
export function applyDecorations(tree: Root, { route, glossary = [] }: { route: string; glossary?: readonly LinkedGlossaryEntry[] }) {
  const todos = replaceTodos(tree)
  wrapPracticeSections(tree)
  if (glossary.length > 0 && route !== '/docs/glossary') {
    autolinkGlossary(tree, new Set(), route, false, glossary)
  }
  labelChecklistItems(tree)
  return { todo_count: todos.count, first_todo_id: todos.count ? 'article-todo-1' : null }
}
