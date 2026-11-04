import type { ArticleFreshness, FreshnessReport } from './content-types.ts'

/** Keep overlapping system memberships; an article-specific check takes priority within each one. */
export function articleFreshness(doc: string, report: FreshnessReport): ArticleFreshness[] {
  return report.systems.filter(system => system.articles.some(article => article.doc === doc)).map(system => {
    const articleDate = system.articles.find(article => article.doc === doc)?.last_verified_at
    return { id: system.id, title: system.title, last_verified_at: articleDate ?? system.last_verified_at, scope: articleDate ? 'article' : 'system' }
  })
}
