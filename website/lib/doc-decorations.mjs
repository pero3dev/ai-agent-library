/**
 * doc-decorations.mjs — 記事の定型構造を UI コンポーネントへ自動変換する mdast 変換。
 * sync-content.mjs から呼ばれ、原本(docs/)には手を入れない(WEBSITE-PLAN.md §5 段階 2)。
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

const jsxAttr = (name, value) => ({ type: 'mdxJsxAttribute', name, value })

/* ---------- 1. TODO(要確認) コールアウト ---------- */

/** blockquote が TODO(要確認) 形式なら、マーカーを除いた中身を返す */
function todoChildren(node) {
  if (node.type !== 'blockquote') return null
  const [para, ...restBlocks] = node.children ?? []
  if (para?.type !== 'paragraph') return null
  const [first, ...restInline] = para.children ?? []
  if (first?.type !== 'strong') return null
  const marker = first.children?.map(c => c.value ?? '').join('') ?? ''
  if (!/^TODO[((]要確認[))]/.test(marker)) return null
  const inline = [...restInline]
  if (inline[0]?.type === 'text') {
    inline[0] = { ...inline[0], value: inline[0].value.replace(/^\s+/, '') }
  }
  return [{ type: 'paragraph', children: inline }, ...restBlocks]
}

function replaceTodos(node) {
  if (!node.children) return
  node.children = node.children.map(child => {
    const inner = todoChildren(child)
    if (inner) {
      return { type: 'mdxJsxFlowElement', name: 'TodoCallout', attributes: [], children: inner }
    }
    replaceTodos(child)
    return child
  })
}

/* ---------- 2. アンチパターン / チェックリストの装飾コンテナ ---------- */

const SECTION_KINDS = new Map([
  ['アンチパターン', 'antipattern'],
  ['チェックリスト', 'checklist']
])

const headingText = node => (node.children ?? []).map(c => c.value ?? '').join('').trim()

function wrapPracticeSections(root) {
  const out = []
  const children = root.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    const kind =
      node.type === 'heading' && node.depth === 3 ? SECTION_KINDS.get(headingText(node)) : undefined
    out.push(node)
    if (!kind) continue
    const body = []
    let j = i + 1
    while (j < children.length && !(children[j].type === 'heading' && children[j].depth <= 3)) {
      body.push(children[j])
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

/* ---------- 3. GLOSSARY 用語の自動リンク(ページ内初出のみ) ---------- */

const SKIP_TYPES = new Set(['heading', 'link', 'linkReference', 'mdxJsxTextElement'])

function linkifyText(value, seen, currentRoute, glossary) {
  for (const term of glossary) {
    if (seen.has(term.name) || term.href === currentRoute) continue
    const idx = value.indexOf(term.name)
    if (idx === -1) continue
    seen.add(term.name)
    const nodes = []
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

function autolinkGlossary(node, seen, currentRoute, skip, glossary) {
  if (!node.children) return
  const childSkip = skip || SKIP_TYPES.has(node.type)
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === 'text' && !childSkip) {
      const replaced = linkifyText(child.value, seen, currentRoute, glossary)
      if (replaced) {
        node.children.splice(i, 1, ...replaced)
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
export function applyDecorations(tree, { route, glossary = [] }) {
  replaceTodos(tree)
  wrapPracticeSections(tree)
  if (glossary.length > 0 && route !== '/docs/glossary') {
    autolinkGlossary(tree, new Set(), route, false, glossary)
  }
}
