import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'
import pages from '../../../generated/pages.json'
import { pageMetadata } from '../../../lib/page-metadata.mjs'
import { readArticleMarkdown } from '../../../lib/article-copy.mjs'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  const route = `/docs/${(params.mdxPath || []).join('/')}`.replace(/\/$/, '')
  const page = pages[route] || { title: metadata.title, description: metadata.description }
  return { ...metadata, ...pageMetadata(route, page.title, page.description, page.last_updated) }
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
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
