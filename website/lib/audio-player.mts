import type { AudioCatalog, AudioEpisode } from './content-types.ts'
export type { AudioCatalog, AudioEpisode } from './content-types.ts'

export interface PlaybackEpisode {
  id: string
  title: string
  duration_seconds: number
  audio_url: string
  section_title?: string
}
export interface SavedPlayerState {
  queue: string[]
  currentId: string | null
  positions: Record<string, number>
  rate: number
  notice: string
}
export interface PlayerSnapshot<E extends PlaybackEpisode = AudioEpisode> {
  queue: string[]
  currentId: string | null
  current: E | null
  position: number
  duration: number
  rate: number
  playing: boolean
  loading: boolean
  error: string
  notice: string
  storageAvailable: boolean
}
type MediaErrorLike = { code?: number } | null
type SourceLike = Pick<HTMLSourceElement, 'type' | 'src' | 'addEventListener' | 'removeEventListener' | 'remove'>
export interface AudioLike extends Pick<HTMLAudioElement, 'currentTime' | 'duration' | 'readyState' | 'playbackRate' | 'ended' | 'pause' | 'load' | 'play' | 'removeAttribute' | 'addEventListener' | 'removeEventListener'> {
  error: MediaErrorLike
  ownerDocument: { createElement(name: 'source'): SourceLike }
  appendChild(node: SourceLike): unknown
}
interface StorageLike { getItem(key: string): string | null | undefined; setItem(key: string, value: string): unknown }
interface MediaSessionLike {
  playbackState: MediaSessionPlaybackState
  metadata: unknown
  setPositionState?(state: MediaPositionState): void
  setActionHandler(action: MediaSessionAction, handler: ((details: MediaSessionActionDetails) => void) | null): void
}
export interface AudioController<E extends PlaybackEpisode = AudioEpisode> {
  getSnapshot(): PlayerSnapshot<E>
  subscribe(listener: (snapshot: PlayerSnapshot<E>) => void): () => void
  play(): void
  pause(): void
  start(id: string, relatedIds?: string[]): false | void
  enqueue(ids: string[]): void
  remove(id: string): void
  move(id: string, offset: number): void
  setRate(rate: number): void
  seek(value: number): void
  next(): void
  save(): void
  destroy(): void
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export const AUDIO_STORAGE_KEY = 'ai-agent-library.audio.v1'
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]
const MAX_QUEUE_LENGTH = 1000
const QUEUE_LIMIT_NOTICE = `再生リストは ${MAX_QUEUE_LENGTH} 本までです。不要な音声を外してから追加してください。`

export function formatTime(value: unknown) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0))
  const hours = Math.floor(seconds / 3600)
  return `${hours ? `${hours}:` : ''}${String(Math.floor(seconds / 60) % 60).padStart(hours ? 2 : 1, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function normalizeArticleRoute(pathname: string | null | undefined, basePath = '') {
  let path = String(pathname || '').split(/[?#]/)[0]
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) path = path.slice(basePath.length)
  return path.replace(/\.html$/, '').replace(/\/$/, '') || '/'
}

export function latestAudioPublication(episodes: ReadonlyArray<{ published_at: string }>) {
  const timestamps = episodes.map(episode => Date.parse(episode.published_at)).filter(Number.isFinite)
  if (!timestamps.length) return null
  const date = new Date(Math.max(...timestamps))
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

export function audioProblemReportUrl(episode: Pick<AudioEpisode, 'title' | 'id' | 'route' | 'source_digest'>, position = 0) {
  const url = new URL('https://github.com/pero3dev/ai-agent-library/issues/new')
  url.searchParams.set('title', `[音声] ${episode.title} の内容について`)
  url.searchParams.set('body', [
    `音声 ID: ${episode.id}`,
    `記事: https://pero3dev.github.io/ai-agent-library${episode.route}`,
    `元記事の版: ${episode.source_digest}`,
    `再生時刻: ${formatTime(position)}`,
    '', '気になった内容と、期待する説明を記入してください。', ''
  ].join('\n'))
  return url.toString()
}

export function readSavedState(raw: string | null | undefined, episodes: readonly PlaybackEpisode[]): SavedPlayerState {
  const initial: SavedPlayerState = { queue: [], currentId: null, positions: {}, rate: 1, notice: '' }
  if (!raw) return initial
  try {
    const saved: unknown = JSON.parse(raw)
    if (!record(saved) || saved.schema_version !== 1) return initial
    const known = new Map(episodes.map(episode => [episode.id, episode]))
    const ids = Array.isArray(saved.queue) ? saved.queue.filter((id): id is string => typeof id === 'string') : []
    const availableIds = [...new Set(ids)].filter(id => known.has(id))
    const queue = availableIds.slice(0, MAX_QUEUE_LENGTH)
    const positions: Record<string, number> = {}
    for (const [id, value] of Object.entries(record(saved.positions) ? saved.positions : {})) {
      const episode = known.get(id)
      if (!episode || typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue
      positions[id] = Math.min(value, episode.duration_seconds || value)
    }
    return {
      queue,
      currentId: typeof saved.currentId === 'string' && queue.includes(saved.currentId) ? saved.currentId : null,
      positions,
      rate: typeof saved.rate === 'number' && PLAYBACK_RATES.includes(saved.rate) ? saved.rate : 1,
      notice: [
        ids.some(id => !known.has(id)) ? '更新・公開終了した音声を再生リストから外しました。新しい版は記事から追加できます。' : '',
        availableIds.length > MAX_QUEUE_LENGTH ? QUEUE_LIMIT_NOTICE : ''
      ].filter(Boolean).join(' ')
    }
  } catch {
    return { ...initial, notice: '保存された再生情報を読み込めなかったため、初期状態で開きました。' }
  }
}

export const initialPlayerSnapshot: PlayerSnapshot = {
  queue: [], currentId: null, current: null, position: 0, duration: 0,
  rate: 1, playing: false, loading: false, error: '', notice: '', storageAvailable: true
}

function mediaErrorMessage(error: MediaErrorLike) {
  switch (error?.code) {
    case 1: return '音声の読み込みが中断されました。再試行してください。'
    case 2: return '音声の通信が途中で止まりました。通信を確認して再試行してください。'
    case 3: return '音声を正しく読み取れませんでした。再試行しても解決しない場合は、問題を報告してください。'
    case 4: return '音声の形式または配信方法をこのブラウザーで読み込めませんでした。再試行しても解決しない場合は、問題を報告してください。'
    default: return '音声を読み込めませんでした。再試行しても解決しない場合は、問題を報告してください。'
  }
}

/** A single media element survives route changes. No network request or playback on restore. */
export function createAudioController<E extends PlaybackEpisode>({ audio, episodes, storage, mediaSession, MediaMetadataClass }: {
  audio: AudioLike
  episodes: readonly E[]
  storage?: StorageLike | null
  mediaSession?: MediaSessionLike | null
  MediaMetadataClass?: new (init: MediaMetadataInit) => unknown
}): AudioController<E> {
  const known = new Map(episodes.map(episode => [episode.id, episode]))
  let saved
  let storageAvailable = true
  try { saved = readSavedState(storage?.getItem(AUDIO_STORAGE_KEY), episodes) } catch {
    saved = readSavedState(null, episodes)
    storageAvailable = false
  }
  if (!storage) storageAvailable = false
  let state: PlayerSnapshot<E> = {
    ...initialPlayerSnapshot, ...saved, storageAvailable,
    current: saved.currentId ? known.get(saved.currentId) || null : null,
    position: saved.currentId ? saved.positions[saved.currentId] || 0 : 0,
    duration: saved.currentId ? known.get(saved.currentId)?.duration_seconds || 0 : 0
  }
  const positions = saved.positions
  const listeners = new Set<(snapshot: PlayerSnapshot<E>) => void>()
  const events: Array<[string, EventListener]> = []
  let loadedId: string | null = null
  let pendingSeek: number | null = null
  let lastSave = 0
  let requestVersion = 0
  let destroyed = false
  let metadataId: string | null = null
  let source: { node: SourceLike; onError: EventListener } | null = null

  function emit(patch: Partial<PlayerSnapshot<E>> = {}) {
    state = { ...state, ...patch }
    for (const listener of listeners) listener(state)
  }
  function persist() {
    if (!storageAvailable) return
    try {
      storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        schema_version: 1, queue: state.queue, currentId: state.currentId, positions, rate: state.rate
      }))
    } catch { emit({ storageAvailable: false }) }
  }
  function currentPosition() {
    // UI timeupdate events can lag the native clock, especially while another app is in front.
    // A pending seek or selected-but-unloaded episode must keep its intended position instead.
    if (loadedId === state.currentId && pendingSeek === null && audio.readyState > 0 && Number.isFinite(audio.currentTime)) {
      return Math.max(0, Math.min(audio.currentTime, state.duration || Infinity))
    }
    return state.position
  }
  function savePosition() {
    const position = currentPosition()
    if (position !== state.position) emit({ position })
    if (state.currentId) positions[state.currentId] = position
    persist()
  }
  function updateSession() {
    if (!mediaSession) return
    try {
      mediaSession.playbackState = state.playing ? 'playing' : state.current ? 'paused' : 'none'
      if (state.current && MediaMetadataClass && metadataId !== state.currentId) {
        mediaSession.metadata = new MediaMetadataClass({
          title: state.current.title, artist: 'AI Agent Library', album: state.current.section_title || '音声で学ぶ'
        })
        metadataId = state.currentId
      } else if (!state.current) { mediaSession.metadata = null; metadataId = null }
      if (state.duration > 0 && Number.isFinite(state.duration)) mediaSession.setPositionState?.({
        duration: state.duration, playbackRate: state.rate, position: Math.min(state.position, state.duration)
      })
    } catch { /* OS integration is optional; browser playback remains usable. */ }
  }
  function seek(value: number) {
    if (!state.current) return
    const position = Math.max(0, Math.min(Number(value) || 0, state.duration || Infinity))
    if (loadedId === state.currentId && audio.readyState > 0) {
      try { audio.currentTime = position; pendingSeek = null } catch { pendingSeek = position }
    } else pendingSeek = position
    emit({ position })
    savePosition()
    updateSession()
  }
  function retryPendingSeek() {
    if (pendingSeek !== null && loadedId === state.currentId && audio.readyState > 0) seek(pendingSeek)
  }
  function failPlayback(error: MediaErrorLike = audio.error) {
    if (destroyed || !loadedId) return
    savePosition()
    requestVersion += 1
    loadedId = null
    emit({ playing: false, loading: false, error: mediaErrorMessage(error) })
    updateSession()
  }
  function clearSource() {
    if (source) {
      source.node.removeEventListener('error', source.onError)
      source.node.remove()
      source = null
    }
    // A media-level src attribute would take precedence over the typed source.
    audio.removeAttribute('src')
  }
  function setSource(url: string) {
    clearSource()
    const node = audio.ownerDocument.createElement('source')
    node.type = 'audio/mpeg'
    node.src = url
    const entry = { node, onError: () => { if (source === entry) failPlayback() } }
    source = entry
    // Source errors do not bubble to the media element. Retire this listener with its request.
    node.addEventListener('error', entry.onError)
    audio.appendChild(node)
  }
  function setCurrent(id: string) {
    const episode = known.get(id)
    if (!episode) return false
    savePosition()
    if (id !== state.currentId) {
      requestVersion += 1
      audio.pause()
      loadedId = null
      pendingSeek = positions[id] || 0
      emit({ currentId: id, current: episode, position: pendingSeek, duration: episode.duration_seconds, playing: false, loading: false, error: '' })
      persist()
    }
    return true
  }
  function play() {
    if (!state.current || destroyed) return
    const version = ++requestVersion
    if (loadedId !== state.currentId) {
      loadedId = state.currentId
      pendingSeek = state.position >= state.duration - 0.5 ? 0 : state.position
      // Safari passes an explicit MIME type to AVFoundation, even after a redirect
      // to an extensionless release asset served as application/octet-stream.
      setSource(state.current.audio_url)
      audio.load()
    } else if (audio.ended || state.position >= state.duration - 0.5) {
      seek(0)
    }
    audio.playbackRate = state.rate
    emit({ error: '', loading: true })
    const onPlayError = (error: unknown) => {
      const name = record(error) ? error.name : error instanceof Error ? error.name : undefined
      if (destroyed || version !== requestVersion || name === 'AbortError') return
      if (name === 'NotAllowedError') {
        emit({ playing: false, loading: false, error: '再生ボタンを押すと続きから聴けます。' })
      } else failPlayback(audio.error || (name === 'NotSupportedError' ? { code: 4 } : null))
    }
    // Call directly in the click/ended handler to preserve the browser's playback permission.
    try {
      const promise = audio.play()
      promise?.catch(onPlayError)
    } catch (error) { onPlayError(error) }
    updateSession()
  }
  function pause() {
    requestVersion += 1
    audio.pause()
    emit({ playing: false, loading: false })
    savePosition()
    updateSession()
  }
  function enqueue(ids: string[]) {
    const requested = [...new Set([...state.queue, ...ids.filter(id => known.has(id))])]
    const queue = requested.slice(0, MAX_QUEUE_LENGTH)
    emit({ queue, notice: requested.length > MAX_QUEUE_LENGTH ? QUEUE_LIMIT_NOTICE : state.notice === QUEUE_LIMIT_NOTICE ? '' : state.notice })
    persist()
  }
  function start(id: string, relatedIds = [id]) {
    enqueue(relatedIds)
    if (!state.queue.includes(id)) enqueue([id])
    if (!state.queue.includes(id)) return false
    if (setCurrent(id)) play()
  }
  function next() {
    const index = state.currentId ? state.queue.indexOf(state.currentId) : -1
    if (index < 0) return
    const id = state.queue[index + 1]
    if (id) { setCurrent(id); play() } else pause()
  }
  function remove(id: string) {
    const index = state.queue.indexOf(id)
    if (index < 0) return
    const queue = state.queue.filter(value => value !== id)
    if (id === state.currentId) {
      pause()
      const replacement = queue[Math.min(index, queue.length - 1)]
      if (replacement) setCurrent(replacement)
      else {
        loadedId = null
        pendingSeek = null
        clearSource()
        audio.load()
        emit({ currentId: null, current: null, position: 0, duration: 0, error: '' })
      }
    }
    emit({ queue })
    persist()
    updateSession()
  }
  function move(id: string, offset: number) {
    const queue = [...state.queue]
    const index = queue.indexOf(id)
    const destination = index + offset
    if (index < 0 || destination < 0 || destination >= queue.length) return
    queue.splice(index, 1)
    queue.splice(destination, 0, id)
    emit({ queue })
    persist()
  }
  function setRate(rate: number) {
    if (!PLAYBACK_RATES.includes(rate)) return
    audio.playbackRate = rate
    emit({ rate })
    persist()
    updateSession()
  }
  function on(name: string, callback: EventListener) {
    audio.addEventListener(name, callback)
    events.push([name, callback])
  }
  on('loadedmetadata', () => {
    if (!loadedId) return
    if (Number.isFinite(audio.duration) && audio.duration > 0) emit({ duration: audio.duration })
    retryPendingSeek()
    updateSession()
  })
  on('timeupdate', () => {
    if (loadedId !== state.currentId || pendingSeek !== null) return
    emit({ position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0 })
    if (Date.now() - lastSave > 5000) { savePosition(); lastSave = Date.now() }
    updateSession()
  })
  on('playing', () => { emit({ playing: true, loading: false, error: '' }); updateSession() })
  on('pause', () => { emit({ playing: false, loading: false }); savePosition(); updateSession() })
  on('waiting', () => emit({ loading: true }))
  on('canplay', () => { retryPendingSeek(); emit({ loading: false }) })
  on('progress', retryPendingSeek)
  on('durationchange', () => {
    if (loadedId && Number.isFinite(audio.duration) && audio.duration > 0) emit({ duration: audio.duration })
    retryPendingSeek()
  })
  on('error', () => failPlayback())
  on('ended', () => {
    if (!state.currentId || loadedId !== state.currentId || pendingSeek !== null || !audio.ended) return
    // The completed position is zero. Do not sample the old file's ending clock during next().
    loadedId = null
    positions[state.currentId] = 0
    emit({ position: 0, playing: false })
    persist()
    next()
  })
  const handlers: Partial<Record<MediaSessionAction, (details: MediaSessionActionDetails) => void>> = {
    play, pause, nexttrack: next,
    previoustrack: () => seek(0),
    seekbackward: details => seek(currentPosition() - (details.seekOffset || 15)),
    seekforward: details => seek(currentPosition() + (details.seekOffset || 15)),
    seekto: details => seek(details.seekTime ?? 0),
    stop: pause
  }
  for (const action of Object.keys(handlers) as MediaSessionAction[]) {
    const handler = handlers[action] ?? null
    try { mediaSession?.setActionHandler(action, handler) } catch { /* Not every Safari version supports every action. */ }
  }
  updateSession()
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    play, pause, start, enqueue, remove, move, setRate, seek, next, save: savePosition,
    destroy() {
      destroyed = true
      requestVersion += 1
      savePosition()
      for (const [name, callback] of events) audio.removeEventListener(name, callback)
      audio.pause()
      loadedId = null
      clearSource()
      audio.load()
      for (const action of Object.keys(handlers) as MediaSessionAction[]) {
        try { mediaSession?.setActionHandler(action, null) } catch { /* optional */ }
      }
      listeners.clear()
    }
  }
}
