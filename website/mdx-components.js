import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { ChecklistBox } from './components/mdx/checklist-box'
import { DocMeta } from './components/mdx/doc-meta'
import { GlossaryTerm } from './components/mdx/glossary-term'
import { PracticeSection } from './components/mdx/practice-section'
import { TodoCallout } from './components/mdx/todo-callout'
import { ArticleAudio } from './components/audio/article-audio'
import { AttentionStep, AttentionWalkthrough, ReadingStep } from './components/diagrams/diagram-entry'
import { ReadingWalkthrough } from './components/diagrams/concept-walkthrough'
import { TransformerWalkthrough } from './components/diagrams/transformer-walkthrough'
import { AttentionVariantsWalkthrough } from './components/diagrams/attention-variants-walkthrough'
import { MoEWalkthrough } from './components/diagrams/moe-walkthrough'

const docsComponents = getDocsMDXComponents()
const DocsWrapper = docsComponents.wrapper

// Markdown 要素 → React コンポーネントのマッピング(project/plans/engineering/website.md §5 段階 2)。
// sync が注入する記事装飾・動的図のコンポーネントはここで解決される。
export const useMDXComponents = components => ({
  ...docsComponents,
  AttentionStep,
  AttentionWalkthrough,
  ReadingWalkthrough,
  TransformerWalkthrough,
  AttentionVariantsWalkthrough,
  MoEWalkthrough,
  ReadingStep,
  TodoCallout,
  PracticeSection,
  GlossaryTerm,
  // KaTeX のブロック数式はキーボードでも横スクロールできるようにする。
  span(props) {
    if (props.className?.split(/\s+/).includes('katex-display')) {
      return <span {...props} tabIndex={0} role="region" aria-label="数式" />
    }
    return <span {...props} />
  },
  // GFM タスクリストのチェックボックスをクリック可能にする
  input(props) {
    if (props.type === 'checkbox') {
      return <ChecklistBox defaultChecked={props.checked} />
    }
    return <input {...props} />
  },
  // 記事ヘッダーに front matter バッジ(level / tags / last_updated)を差し込む
  wrapper({ children, ...props }) {
    return (
      <DocsWrapper {...props}>
        <DocMeta metadata={props.metadata} />
        <ArticleAudio />
        {children}
      </DocsWrapper>
    )
  },
  ...components
})
