import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
  .use(remarkFrontmatter, ['yaml']).use(remarkMdx)

// sync が装飾として挿入する props だけを許可する。コンポーネント名だけでは、
// 属性式や {...spread} を経由したビルド時の JavaScript 実行を防げない。
const attributes = {
  TodoCallout: {},
  PracticeSection: { kind: value => ['antipattern', 'checklist'].includes(value) },
  GlossaryTerm: {
    href: value => /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020\u007f]/.test(value),
    summary: () => true
  }
}

/** 実行せずに生成 MDX を再パースし、許可外の構造・属性を返す。 */
export function findUnsafeMdx(mdx) {
  let tree
  try {
    tree = parser.parse(mdx)
  } catch (error) {
    return [`生成 MDX の再パースに失敗(${error.message})`]
  }
  const bad = new Set()
  const walk = node => {
    switch (node.type) {
      case 'html': bad.add('生 HTML'); break
      case 'mdxjsEsm': bad.add('import/export (ESM)'); break
      case 'mdxFlowExpression':
      case 'mdxTextExpression': bad.add('{式}'); break
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const allowed = Object.hasOwn(attributes, node.name) ? attributes[node.name] : null
        if (!allowed) bad.add(`JSX <${node.name ?? '?'}>`)
        const seen = new Set()
        for (const attribute of node.attributes ?? []) {
          if (attribute.type !== 'mdxJsxAttribute') {
            bad.add('JSX 属性スプレッド')
            continue
          }
          if (typeof attribute.value !== 'string') {
            bad.add(`JSX 属性式・非文字列値 (${attribute.name})`)
          } else if (!allowed || !Object.hasOwn(allowed, attribute.name) || !allowed[attribute.name](attribute.value)) {
            bad.add(`許可外の JSX 属性・値 (${node.name}.${attribute.name})`)
          }
          if (seen.has(attribute.name)) bad.add(`重複した JSX 属性 (${attribute.name})`)
          seen.add(attribute.name)
        }
        break
      }
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk(tree)
  return [...bad]
}
