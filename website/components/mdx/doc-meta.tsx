import Link from 'next/link'
import type { ArticleFreshness } from '../../lib/content-types'

const LEVEL_LABELS: Record<string, string> = {
  basic: '初級',
  intermediate: '中級',
  advanced: '上級'
}

/** front matter(level / tags / last_updated)を記事ヘッダーのバッジとして表示する。タグはタグ別一覧へリンク */
export interface DocMetadata {
  level?: string
  tags?: string[]
  last_updated?: string | null
  source_path?: string
  freshness_systems?: ArticleFreshness[]
  todo_count?: number
  first_todo_id?: string | null
}

export function DocMeta({ metadata = {} }: { metadata?: DocMetadata }) {
  const { level, tags, last_updated: lastUpdated, source_path: sourcePath, freshness_systems: systems = [], todo_count: todoCount = 0, first_todo_id: firstTodo } = metadata
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
      {systems.map(system => <span key={system.id} className="doc-meta-freshness">一次情報の確認記録: <Link prefetch={false} href={`/freshness#system-${system.id}`}>{system.title}</Link> {system.last_verified_at ? `${system.last_verified_at} (${system.scope === 'article' ? 'この記事' : '系統の宣言範囲'})` : '記録なし'}</span>)}
      {todoCount > 0 && firstTodo && <a className="doc-meta-todos" href={`#${firstTodo}`}>未確認事項: {todoCount}件</a>}
      {sourcePath && lastUpdated && <a className="article-report-link" href={`https://github.com/pero3dev/ai-agent-library/issues/new?${new URLSearchParams({ template: 'article-correction.yml', article: sourcePath, updated: lastUpdated })}`}>この記事の誤りを報告</a>}
    </div>
  )
}
