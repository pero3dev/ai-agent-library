'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatTime, normalizeArticleRoute } from '../../lib/audio-player.mjs'
import { useAudio } from './audio-provider'

export function EpisodeActions({ episodes }) {
  const { state, controller, ready } = useAudio()
  if (!episodes.length) return null
  const ids = episodes.map(item => item.id)
  const queued = ids.every(id => state.queue.includes(id))
  return <div className="audio-episode-actions">
    <button type="button" className="audio-button audio-button-primary" disabled={!ready} onClick={() => controller.start(ids.includes(state.currentId) ? state.currentId : ids[0], ids)}>音声で聴く</button>
    <button type="button" className="audio-button" disabled={!ready || queued} onClick={() => controller.enqueue(ids)}>{queued ? 'リストに追加済み' : '再生リストに追加'}</button>
    <span className="audio-duration">{episodes.length > 1 ? `${episodes.length}本 · ` : ''}{formatTime(episodes.reduce((sum, item) => sum + item.duration_seconds, 0))}</span>
  </div>
}

export function ArticleAudio() {
  const { catalog } = useAudio()
  const route = normalizeArticleRoute(usePathname(), process.env.NEXT_PUBLIC_BASE_PATH || '')
  const article = catalog.articles.find(item => item.route === route)
  if (!article) return null
  const episodes = catalog.episodes.filter(item => item.article_path === article.article_path).sort((a, b) => a.part - b.part)
  return <section className="article-audio" aria-label="この記事の音声" data-pagefind-ignore>
    {episodes.length ? <>
      <p className="audio-article-label">この記事を、二人の対話で。</p>
      <EpisodeActions episodes={episodes} />
      {episodes.some(item => item.stale) && <p className="audio-stale">記事より古い内容です。新しい音声を準備しています。</p>}
      <p className="audio-help">AI 合成音声 · {episodes[0].attribution}</p>
    </> : <p className="audio-help">この記事の音声は準備中です。</p>}
    <Link className="audio-text-link" href="/audio">音声の一覧・再生リストへ</Link>
  </section>
}
