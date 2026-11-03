import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { ChecklistBox } from './components/mdx/checklist-box'
import { DocMeta } from './components/mdx/doc-meta'
import { GlossaryTerm } from './components/mdx/glossary-term'
import { PracticeSection } from './components/mdx/practice-section'
import { TodoCallout } from './components/mdx/todo-callout'
import { ArticleAudio } from './components/audio/article-audio'
import { removeLinks } from 'nextra/remove-links'
import { ArticleTocProvider } from './components/mdx/article-toc'
import { ArticleActions } from './components/mdx/article-actions'
import { StaticMermaid } from './components/mdx/static-mermaid'
import type { ComponentProps, HTMLAttributes } from 'react'
import type { MDXComponents } from 'nextra/mdx-components'
import type { DocMetadata } from './components/mdx/doc-meta'

const docsComponents = getDocsMDXComponents()
const DocsWrapper = docsComponents.wrapper
type ArticleWrapperProps = Omit<ComponentProps<typeof DocsWrapper>, 'sourceCode' | 'metadata'> & {
  sourceCode?: string
  copyMarkdown?: string | null
  className?: string
  metadata: ComponentProps<typeof DocsWrapper>['metadata'] & DocMetadata
}

// Markdown 要素 → React コンポーネントのマッピング(project/plans/engineering/website.md §5 段階 2)。
// sync が注入する記事装飾のコンポーネントはここで解決される。
export const useMDXComponents = (components: MDXComponents = {}) => ({
  ...docsComponents,
  TodoCallout,
  PracticeSection,
  GlossaryTerm,
  ChecklistBox,
  StaticMermaid,
  // KaTeX のブロック数式はキーボードでも横スクロールできるようにする。
  span(props: HTMLAttributes<HTMLSpanElement>) {
    if (props.className?.split(/\s+/).includes('katex-display')) {
      return <span {...props} tabIndex={0} role="region" aria-label="数式" />
    }
    return <span {...props} />
  },
  // 記事ヘッダーに front matter バッジ(level / tags / last_updated)を差し込む
  wrapper({ children, copyMarkdown, sourceCode = '', ...props }: ArticleWrapperProps) {
    const wrapperProps = { ...props, sourceCode, className: `article-reading-layout x:mx-auto x:flex x:max-w-(--nextra-content-width) ${props.className || ''}` }
    const article = (
      <DocsWrapper {...wrapperProps}>
        <ArticleActions markdown={copyMarkdown} />
        <DocMeta metadata={props.metadata} />
        <ArticleAudio />
        {children}
      </DocsWrapper>
    )
    const headings = (props.toc || []).map(heading => ({ ...heading, value: removeLinks(heading.value) }))
    return <ArticleTocProvider headings={headings}>{article}</ArticleTocProvider>
  },
  ...components
})
