import Link from 'next/link'
import tags from '../../generated/tags.json'

export const metadata = {
  title: 'タグ別一覧',
  description: 'front matter のタグから記事を横断的に探せます。'
}

const LEVEL_LABELS = { basic: '初級', intermediate: '中級', advanced: '上級' }

export default function TagsPage() {
  return (
    <main className="page-shell">
      <p className="home-section-kicker">TAGS</p>
      <h1 className="page-title">タグ別一覧</h1>
      <p className="page-lead">
        全 {tags.length} タグ。各記事の front matter に付いたタグから横断的に探せます。記事冒頭のタグバッジからもこのページに飛べます。
      </p>
      <nav className="tag-cloud" aria-label="タグ一覧">
        {tags.map(t => (
          <a key={t.tag} className="tag-chip" href={`#tag-${t.tag}`}>
            {t.tag} <span className="tag-chip-count">{t.count}</span>
          </a>
        ))}
      </nav>
      {tags.map(t => (
        <section key={t.tag} id={`tag-${t.tag}`} className="tag-section">
          <h2 className="tag-title">
            {t.tag} <span className="tag-title-count">{t.count} 本</span>
          </h2>
          <ul className="tag-articles">
            {t.articles.map(article => (
              <li key={article.route}>
                <Link href={article.route}>{article.title}</Link>
                {article.level && (
                  <span className={`doc-meta-level doc-meta-level-${article.level}`}>
                    {LEVEL_LABELS[article.level] ?? article.level}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
