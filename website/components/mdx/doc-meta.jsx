import Link from 'next/link'

const LEVEL_LABELS = {
  basic: '初級',
  intermediate: '中級',
  advanced: '上級'
}

/** front matter(level / tags / last_updated)を記事ヘッダーのバッジとして表示する。タグはタグ別一覧へリンク */
export function DocMeta({ metadata = {} }) {
  const { level, tags, last_updated: lastUpdated, source_path: sourcePath } = metadata
  const hasTags = Array.isArray(tags) && tags.length > 0
  if (!level && !hasTags && !lastUpdated) return null
  return (
    <div className="doc-meta">
      {level && <span className={`doc-meta-level doc-meta-level-${level}`}>{LEVEL_LABELS[level] ?? level}</span>}
      {hasTags && tags.map(tag => (
        <Link prefetch={false} key={tag} className="doc-meta-tag" href={`/tags#tag-${tag}`}>
          {tag}
        </Link>
      ))}
      {lastUpdated && <span className="doc-meta-updated">更新: {lastUpdated}</span>}
      {sourcePath && lastUpdated && <a className="article-report-link" href={`https://github.com/pero3dev/ai-agent-library/issues/new?${new URLSearchParams({ template: 'article-correction.yml', article: sourcePath, updated: lastUpdated })}`}>この記事の誤りを報告</a>}
    </div>
  )
}
