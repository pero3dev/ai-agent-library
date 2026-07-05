const LEVEL_LABELS = {
  basic: '初級',
  intermediate: '中級',
  advanced: '上級'
}

/** front matter(level / tags / last_updated)を記事ヘッダーのバッジとして表示する。タグはタグ別一覧へリンク */
export function DocMeta({ metadata = {} }) {
  const { level, tags, last_updated: lastUpdated } = metadata
  const hasTags = Array.isArray(tags) && tags.length > 0
  if (!level && !hasTags && !lastUpdated) return null
  return (
    <div className="doc-meta">
      {level && <span className={`doc-meta-level doc-meta-level-${level}`}>{LEVEL_LABELS[level] ?? level}</span>}
      {hasTags && tags.map(tag => (
        <a key={tag} className="doc-meta-tag" href={`/tags#tag-${tag}`}>
          {tag}
        </a>
      ))}
      {lastUpdated && <span className="doc-meta-updated">更新: {lastUpdated}</span>}
    </div>
  )
}
