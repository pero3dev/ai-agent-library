'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAudio } from './audio-provider'
import { EpisodeActions } from './article-audio'
import { QueueList } from './queue-list'
import { latestAudioPublication } from '../../lib/audio-player.mjs'

export function AudioLibrary() {
  const { catalog, state, controller, ready } = useAudio()
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const sections = [...new Map(catalog.articles.map(article => [article.section, article.section_title])).entries()]
  const available = new Set(catalog.episodes.map(episode => episode.article_path))
  const articles = catalog.articles.filter(article => (!section || section === article.section)
    && (!availableOnly || available.has(article.article_path))
    && article.title.toLocaleLowerCase('ja').includes(search.toLocaleLowerCase('ja')))
  return <>
    {catalog.test_only && <p className="audio-stale">再生試験用の合成音です。学習コンテンツではありません。</p>}
    <div className="audio-library-summary">
      <strong>{available.size}<span> / {catalog.articles.length} 記事を公開中</span></strong>
      <p>二人の対話で、仕組みと設計の理由まで。章ごとに音声を順次追加します。</p>
      {catalog.episodes.length === 0 && <p className="audio-empty" role="status">音声は現在準備中です。公開すると、ここから再生・リストへの追加ができます。</p>}
      {state.notice && <p className="audio-status" role="status">{state.notice}</p>}
      {!state.storageAvailable && <p className="audio-status">このブラウザーでは再生情報を保存できません。</p>}
      {state.queue.length > 0 && <div className="audio-queue-summary"><span>再生リスト: {state.queue.length}本</span><button type="button" className="audio-button" disabled={!ready} onClick={() => controller.start(state.currentId || state.queue[0])}>リストを再生</button></div>}
    </div>
    {state.queue.length > 0 && <section className="audio-library-queue" aria-label="保存した再生リスト"><h2>再生リスト</h2><QueueList /></section>}
    <div className="audio-filters">
      <label>記事を探す<input type="search" value={search} placeholder="記事名で検索" onChange={event => setSearch(event.target.value)} /></label>
      <label>章<select value={section} onChange={event => setSection(event.target.value)}><option value="">すべての章</option>{sections.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label className="audio-checkbox"><input type="checkbox" checked={availableOnly} onChange={event => setAvailableOnly(event.target.checked)} />公開済みだけ表示</label>
    </div>
    <p className="audio-help" role="status">{articles.length} 記事</p>
    <ul className="audio-library-list">{articles.map(article => {
      const episodes = catalog.episodes.filter(item => item.article_path === article.article_path).sort((a, b) => a.part - b.part)
      const publication = latestAudioPublication(episodes)
      return <li key={article.article_path}>
        <p className="audio-eyebrow">{article.section_title}</p>
        <h2><Link href={article.route}>{article.title}</Link></h2>
        {episodes.length ? <>
          <EpisodeActions episodes={episodes} />
          {publication && <p className="audio-help">音声公開日: <time dateTime={publication.iso}>{publication.label}</time></p>}
          {episodes.some(item => item.stale) && <p className="audio-stale">記事より古い内容です。新しい音声を準備しています。</p>}
          <p className="audio-help">AI 合成音声 · {episodes[0].attribution}</p>
        </> : <span className="audio-pending">音声を準備中</span>}
      </li>
    })}</ul>
    {articles.length === 0 && <p className="audio-empty">条件に合う記事はありません。</p>}
    <p className="audio-help audio-library-note">再生位置・速度・再生リストは同じブラウザーに保存します。ブラウザーのデータ消去などでリセットされます。音声を聴くには通信が必要です。</p>
    {catalog.episodes.length > 0 && <p className="audio-help">音声合成: VOICEVOX Nemo · <a className="audio-text-link" href="https://voicevox.hiroshiba.jp/nemo/term/" target="_blank" rel="noreferrer">音声の利用規約</a></p>}
  </>
}
