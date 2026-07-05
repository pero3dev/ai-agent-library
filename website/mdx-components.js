import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { ChecklistBox } from './components/mdx/checklist-box'
import { DocMeta } from './components/mdx/doc-meta'
import { GlossaryTerm } from './components/mdx/glossary-term'
import { PracticeSection } from './components/mdx/practice-section'
import { TodoCallout } from './components/mdx/todo-callout'

const docsComponents = getDocsMDXComponents()
const DocsWrapper = docsComponents.wrapper

// Markdown 要素 → React コンポーネントのマッピング(WEBSITE-PLAN.md §5 段階 2)。
// remark-doc-decorations(lib/)が注入する TodoCallout / PracticeSection / GlossaryTerm はここで解決される。
export const useMDXComponents = components => ({
  ...docsComponents,
  TodoCallout,
  PracticeSection,
  GlossaryTerm,
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
        {children}
      </DocsWrapper>
    )
  },
  ...components
})
