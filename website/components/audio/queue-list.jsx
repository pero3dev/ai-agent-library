'use client'

import { useAudio } from './audio-provider'

export function QueueList() {
  const { catalog, state, controller } = useAudio()
  if (!controller) return null
  return <ol className="audio-queue">{state.queue.map((id, index) => {
    const episode = catalog.episodes.find(item => item.id === id)
    return <li key={id} aria-current={id === state.currentId ? 'true' : undefined}>
      <button className="audio-queue-title" type="button" onClick={() => controller.start(id)}>{id === state.currentId && <span>選択中 · </span>}{episode.title}</button>
      <div className="audio-queue-actions">
        <button className="audio-button audio-button-small" type="button" disabled={index === 0} aria-label={`${episode.title}を上へ`} onClick={() => controller.move(id, -1)}>↑</button>
        <button className="audio-button audio-button-small" type="button" disabled={index === state.queue.length - 1} aria-label={`${episode.title}を下へ`} onClick={() => controller.move(id, 1)}>↓</button>
        <button className="audio-button audio-button-small" type="button" aria-label={`${episode.title}をリストから外す`} onClick={() => controller.remove(id)}>外す</button>
      </div>
    </li>
  })}</ol>
}
