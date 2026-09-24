import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'
import { ReadingArticleNavigationProvider } from '../../../components/diagrams/reading-article-navigation'
// Derived from validated, enabled wrappers in original article order by sync.
import diagramPages from '../../../generated/diagram-pages.json'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

const Wrapper = getMDXComponents().wrapper

const headingText = value => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(headingText).join('')
  return value?.props ? headingText(value.props.children) : ''
}

export default async function Page(props) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath)
  const route = `/docs/${(params.mdxPath ?? []).join('/')}`
  const firstDiagramId = diagramPages[route]?.firstDiagramId
  const content = <MDXContent {...props} params={params} />
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      {firstDiagramId ? <ReadingArticleNavigationProvider firstDiagramId={firstDiagramId} items={toc
        .filter(item => item.depth === 2 || item.depth === 3)
        .map(item => ({ id: item.id, label: headingText(item.value), depth: item.depth }))}>
        {content}
      </ReadingArticleNavigationProvider> : content}
    </Wrapper>
  )
}
