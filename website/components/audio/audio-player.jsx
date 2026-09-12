'use client'

import Link from 'next/link'
import { useState } from 'react'
import { audioProblemReportUrl, formatTime, PLAYBACK_RATES } from '../../lib/audio-player.mjs'
import { useAudio } from './audio-provider'
import { QueueList } from './queue-list'

export function AudioPlayer() {
  const { state, controller } = useAudio()
  const [expanded, setExpanded] = useState(false)
  const current = state.current
  if (!current || !controller) return null
  const chapter = [...current.chapters].reverse().find(item => item.start_seconds <= state.position)
  return (
    <aside className="audio-player" aria-label="音声プレイヤー" data-pagefind-ignore>
      <div className="audio-player-main">
        <div className="audio-player-heading">
          <div className="audio-player-title"><span className="audio-eyebrow">音声で学ぶ</span><Link href={current.route}>{current.title}</Link></div>
          <button className="audio-button audio-button-small" type="button" aria-expanded={expanded} aria-controls="audio-player-details" onClick={() => setExpanded(!expanded)}>{expanded ? '閉じる' : '章・再生リスト'}</button>
        </div>
        <div className="audio-transport">
          <button type="button" className="audio-button" aria-label="15秒戻る" onClick={() => controller.seek(state.position - 15)}>−15秒</button>
          <button type="button" className="audio-button audio-button-primary" onClick={() => state.playing || state.loading ? controller.pause() : controller.play()} aria-label={state.playing || state.loading ? '一時停止' : '再生'}>{state.playing || state.loading ? '一時停止' : '再生'}</button>
          <button type="button" className="audio-button" aria-label="15秒進む" onClick={() => controller.seek(state.position + 15)}>＋15秒</button>
          <label className="audio-speed">速度<select aria-label="再生速度" value={state.rate} onChange={event => controller.setRate(Number(event.target.value))}>{PLAYBACK_RATES.map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
        </div>
        <div className="audio-progress">
          <span>{formatTime(state.position)}</span>
          <input type="range" aria-label="再生位置" aria-valuetext={`${formatTime(state.position)} / ${formatTime(state.duration)}`} min={0} max={state.duration || 1} step={1} value={Math.min(state.position, state.duration || 1)} onChange={event => controller.seek(Number(event.target.value))} />
          <span>{formatTime(state.duration)}</span>
        </div>
        {state.loading && <p className="audio-status" role="status">音声を読み込み中…</p>}
        {state.error && <p className="audio-error" role="alert">{state.error} <button type="button" className="audio-text-button" onClick={() => controller.play()}>再試行</button></p>}
        {current.stale && <p className="audio-stale">記事より古い内容です。新しい音声を準備しています。</p>}
      </div>
      {expanded && <div id="audio-player-details" className="audio-player-details">
        {!state.storageAvailable && <p className="audio-status" role="status">このブラウザーでは再生位置を保存できません。開いている間は続けて聴けます。</p>}
        {state.notice && <p className="audio-status">{state.notice}</p>}
        <section aria-labelledby="audio-chapters-title">
          <h2 id="audio-chapters-title">章から聴く</h2>
          <ol className="audio-chapters">{current.chapters.map(item => <li key={item.id}><button className="audio-chapter-button" type="button" aria-current={chapter?.id === item.id ? 'true' : undefined} onClick={() => controller.seek(item.start_seconds)}><span>{formatTime(item.start_seconds)}</span>{item.title}</button></li>)}</ol>
        </section>
        <section aria-labelledby="audio-queue-title">
          <h2 id="audio-queue-title">再生リスト <span>{state.queue.length}本</span></h2>
          <p className="audio-help">この順に続けて再生します。端末・ブラウザー内に保存されます。</p>
          <QueueList />
        </section>
        <p className="audio-credit">音声: {current.attribution} · AI 合成音声</p>
        <div className="audio-player-links">
          <Link href="/audio" className="audio-text-link">音声の一覧へ</Link>
          <a className="audio-text-link" href={audioProblemReportUrl(current, state.position)} target="_blank" rel="noreferrer" title="GitHub を新しいタブで開く">内容の問題を報告</a>
        </div>
      </div>}
    </aside>
  )
}
