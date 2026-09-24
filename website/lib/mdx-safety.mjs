import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
  .use(remarkFrontmatter, ['yaml']).use(remarkMdx)

const readingStages = {
  'training-stages': 6, 'training-runtime-boundary': 4,
  'inference-sampling': 7, 'inference-cache-batching': 6, 'inference-speculative': 6, 'inference-quantization': 4,
  'generation-token-loop': 8, 'tokenization-counting': 7,
  'moe-routing-load': 8, 'moe-parameters-communication': 6,
  'agent-loop': 5, 'workflow-comparison': 5,
  'transformer-io': 4, 'transformer-position': 4, 'transformer-block': 9,
  'attention-kv-sharing': 5, 'attention-compute-memory': 6, 'attention-context-range': 4
}
const walkthroughs = new Set(['AttentionWalkthrough', 'ReadingWalkthrough', 'TransformerWalkthrough', 'AttentionVariantsWalkthrough', 'MoEWalkthrough', 'FoundationsWalkthrough', 'InferenceWalkthrough', 'TrainingWalkthrough'])

// sync が装飾として挿入する props だけを許可する。コンポーネント名だけでは、
// 属性式や {...spread} を経由したビルド時の JavaScript 実行を防げない。
const attributes = {
  TrainingWalkthrough: { diagramId: value => ['training-stages', 'training-runtime-boundary'].includes(value) },
  InferenceWalkthrough: { diagramId: value => ['inference-sampling', 'inference-cache-batching', 'inference-speculative', 'inference-quantization'].includes(value) },
  AttentionWalkthrough: {},
  AttentionStep: { step: value => ['0', '1', '2', '3', '4', '5'].includes(value) },
  ReadingWalkthrough: { diagramId: value => ['agent-loop', 'workflow-comparison'].includes(value) },
  TransformerWalkthrough: { diagramId: value => ['transformer-io', 'transformer-position', 'transformer-block'].includes(value) },
  AttentionVariantsWalkthrough: { diagramId: value => ['attention-kv-sharing', 'attention-compute-memory', 'attention-context-range'].includes(value) },
  FoundationsWalkthrough: { diagramId: value => ['generation-token-loop', 'tokenization-counting'].includes(value) },
  MoEWalkthrough: { diagramId: value => ['moe-routing-load', 'moe-parameters-communication'].includes(value) },
  ReadingStep: { step: value => /^[0-8]$/.test(value) },
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
  const walk = (node, parentFigure = null) => {
    let figure = parentFigure
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
        const required = { ReadingWalkthrough: 'diagramId', TransformerWalkthrough: 'diagramId', AttentionVariantsWalkthrough: 'diagramId', MoEWalkthrough: 'diagramId', FoundationsWalkthrough: 'diagramId', InferenceWalkthrough: 'diagramId', TrainingWalkthrough: 'diagramId', ReadingStep: 'step', AttentionStep: 'step' }[node.name]
        if (required && !seen.has(required)) bad.add(`必須の JSX 属性がありません (${node.name}.${required})`)
        if (walkthroughs.has(node.name)) {
          if (parentFigure) bad.add('図解コンポーネントの入れ子')
          const id = node.attributes?.find(attribute => attribute.name === 'diagramId')?.value
          figure = { name: node.name, stageCount: node.name === 'AttentionWalkthrough' ? 6 : readingStages[id] }
        }
        if (['ReadingStep', 'AttentionStep'].includes(node.name)) {
          const value = node.attributes?.find(attribute => attribute.name === 'step')?.value
          const expectedStep = parentFigure?.name === 'AttentionWalkthrough' ? 'AttentionStep' : 'ReadingStep'
          if (!parentFigure || node.name !== expectedStep || !(Number(value) < parentFigure.stageCount)) {
            bad.add(`図解と段階の対応が不正です (${node.name}.step)`)
          }
        }
        break
      }
    }
    for (const child of node.children ?? []) walk(child, figure)
  }
  walk(tree)
  return [...bad]
}
