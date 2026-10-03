import path from 'node:path'
import { parseFrontMatter, toLines, unquote, splitLocalDestination } from './md-utils.mjs'
import { parseMarkdownLinks } from './markdown-links.mjs'

export const LEVEL_ORDER = Object.freeze({ basic: 0, intermediate: 1, advanced: 2 })

/** 前提知識節のリンクだけを必須前提とする。任意の参考は関連トピックへ置く。 */
export function prerequisiteGraph(documents) {
  const articles = new Map()
  for (const { file, text } of documents) {
    const frontMatter = parseFrontMatter(toLines(text))
    const value = frontMatter?.fields.find(field => field.key === 'level')?.value
    if (!value) continue // README は記事ではない。必須 metadata の検査は validate-docs が担う。
    articles.set(file, { file, level: unquote(value), parsed: parseMarkdownLinks(text) })
  }
  const edges = []
  for (const article of articles.values()) {
    for (const heading of article.parsed.headings.filter(item => item.level === 2 && item.text === '前提知識')) {
      const end = article.parsed.headings.find(item => item.line > heading.line && item.level <= 2)?.line ?? Infinity
      for (const link of article.parsed.links.filter(item => item.line > heading.line && item.line < end)) {
        const destination = splitLocalDestination(link.target)
        if (destination.external || destination.error || !destination.pathname) continue
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(article.file), destination.pathname))
        if (!articles.has(target)) continue // 切れたリンクは check-links の担当。
        const prerequisite = articles.get(target)
        edges.push({ file: article.file, line: link.line, level: article.level, target, targetLevel: prerequisite.level })
      }
    }
  }
  return { articles, edges }
}

export function checkPrerequisiteLevels(documents) {
  const { articles, edges } = prerequisiteGraph(documents)
  const inversions = edges.filter(edge => LEVEL_ORDER[edge.targetLevel] > LEVEL_ORDER[edge.level])
  const problems = inversions.map(edge => `${edge.file}:${edge.line}: 前提 ${edge.target} (${edge.targetLevel}) が記事 (${edge.level}) より難しい。level を再判定するか、任意の参考を関連トピックへ移してください`)
  return { problems, inversions, checkedArticles: articles.size, checkedPrerequisites: edges.length }
}
