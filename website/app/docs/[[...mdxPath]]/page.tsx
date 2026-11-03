import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'
import pagesData from '../../../generated/pages.json'
import type { PagesMetadata } from '../../../lib/content-types'
import { pageMetadata } from '../../../lib/page-metadata.mjs'
import { readArticleMarkdown } from '../../../lib/article-copy.mjs'

export const generateStaticParams = generateStaticParamsFor('mdxPath')
const pages: PagesMetadata = pagesData
interface ArticlePageProps { params: Promise<{ mdxPath?: string[] }> }

export async function generateMetadata(props: ArticlePageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  const route = `/docs/${(params.mdxPath || []).join('/')}`.replace(/\/$/, '')
  const page = pages[route] || { title: metadata.title, description: metadata.description, last_updated: null }
  return { ...metadata, ...pageMetadata(route, page.title, page.description, page.last_updated) }
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props: ArticlePageProps) {
  const params = await props.params
  const { default: MDXContent, toc, metadata } = await importPage(params.mdxPath)
  const route = `/docs/${(params.mdxPath || []).join('/')}`.replace(/\/$/, '')
  const copyMarkdown = await readArticleMarkdown(route)
  return (
    <Wrapper toc={toc} metadata={{ ...metadata, ...pages[route] }} copyMarkdown={copyMarkdown}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
