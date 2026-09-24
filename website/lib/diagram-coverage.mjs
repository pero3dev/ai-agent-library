import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { collectDocs, parseFrontMatter, toLines, unquote } from '../../scripts/lib/md-utils.mjs'
import { diagramRegistry, diagramSourceDigest, validateDiagramRegistry } from './diagram-registry.mjs'
import { getDiagramArticleAcceptance } from './diagram-article-acceptance.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])

/** Read-only inventory. A reviewed section never implies a completed article. */
export function getDiagramCoverage({ repoRoot = fileURLToPath(new URL('../../', import.meta.url)), registry = diagramRegistry } = {}) {
  validateDiagramRegistry(registry)
  const docs = collectDocs(repoRoot)
  const articles = docs.filter(file => !file.isReadme).map(file => {
    const source = readFileSync(file.abs, 'utf8')
    const fields = Object.fromEntries((parseFrontMatter(toLines(source))?.fields ?? []).map(field => [field.key, unquote(field.value)]))
    const diagrams = registry.diagrams.filter(entry => entry.article === file.repoRel).map(entry => {
      let currentDigest = null, sourceError = null
      try { currentDigest = diagramSourceDigest(parser.parse(source), entry) } catch (error) { sourceError = error.message }
      return {
        id: entry.id, enabled: entry.enabled, status: entry.status,
        sourceCurrent: currentDigest === entry.sourceDigest,
        reviewCurrent: currentDigest !== null && entry.reviewedDigest === currentDigest && entry.status === 'reviewed',
        articleCoverage: entry.articleCoverage, sourceError
      }
    })
    const acceptance = getDiagramArticleAcceptance({ repoRoot, article: file.repoRel, registry })
    return { article: file.repoRel, title: fields.title, status: fields.status, diagrams, complete: acceptance.complete, acceptance }
  })
  const published = articles.filter(article => article.status === 'published')
  const registered = published.filter(article => article.diagrams.length > 0)
  const entries = registered.flatMap(article => article.diagrams)
  return {
    schemaVersion: 1,
    summary: {
      learningArticles: articles.length, publishedArticles: published.length,
      supportReadmes: docs.filter(file => file.isReadme).length,
      registeredArticles: registered.length, unregisteredArticles: published.length - registered.length,
      enabledDiagrams: entries.filter(entry => entry.enabled).length,
      reviewedBindings: entries.filter(entry => entry.enabled && entry.reviewCurrent && entry.sourceCurrent).length,
      completeArticles: published.filter(article => article.complete).length,
      publication: 'not-verified-by-this-report'
    },
    articles
  }
}
